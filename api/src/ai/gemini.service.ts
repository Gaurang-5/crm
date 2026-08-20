import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

export function getFallbackBodyAnalysisReport(data: any): string {
  const bmiVal = Number(data.bmi || 0);
  let bmiCategory = 'सामान्य';
  if (bmiVal < 18.5) bmiCategory = 'अंडरवेट';
  else if (bmiVal <= 22.9) bmiCategory = 'सामान्य';
  else if (bmiVal <= 24.9) bmiCategory = 'ओवरवेट';
  else bmiCategory = 'मोटापा (Obese)';

  const bodyFat = Number(data.body_fat_pct || 0);
  const isFemale = data.gender === 'F' || String(data.gender).toLowerCase().startsWith('f');
  let bodyFatComment = 'सामान्य सीमा में है।';
  if (isFemale) {
    if (bodyFat >= 35) bodyFatComment = 'सामान्य से काफी अधिक है, इसे कम करने की आवश्यकता है।';
    else if (bodyFat >= 30) bodyFatComment = 'अधिक है, इसे कम करने पर ध्यान दें।';
    else if (bodyFat < 20) bodyFatComment = 'सामान्य से कम है।';
  } else {
    if (bodyFat >= 25) bodyFatComment = 'सामान्य से काफी अधिक है, इसे कम करने की आवश्यकता है।';
    else if (bodyFat >= 20) bodyFatComment = 'अधिक है, इसे कम करने पर ध्यान दें।';
    else if (bodyFat < 10) bodyFatComment = 'सामान्य से कम है।';
  }

  const subFat = Number(data.sub_fat_pct || 0);
  const subFatComment = subFat > 22 ? 'अधिक है, इसे कम करने की आवश्यकता है।' : 'संतुलित सीमा में है।';

  const visc = Number(data.visceral_fat || 0);
  let viscComment = 'सामान्य सीमा (2–8) में है।';
  if (visc >= 15) viscComment = 'सामान्य सीमा (2–8) से काफी अधिक है, इसे तुरंत कम करना आवश्यक है।';
  else if (visc >= 9) viscComment = 'सामान्य सीमा (2–8) से ऊपर है, इसे कम करना आवश्यक है।';

  const muscle = Number(data.skeletal_muscle_pct || 0);
  const muscleTarget = isFemale ? 30 : 33;
  const muscleComment = muscle < muscleTarget ? 'कम है, इसे बढ़ाने पर ध्यान देना होगा।' : 'अच्छा है, इसे बनाए रखें।';

  const realAge = Number(data.age || 0);
  const bodyAge = Number(data.body_age || 0);
  let bodyAgeComment = `वास्तविक उम्र (${realAge} वर्ष) के करीब है।`;
  if (bodyAge > realAge) {
    bodyAgeComment = `वास्तविक उम्र (${realAge} वर्ष) से अधिक है, जो मेटाबॉलिक हेल्थ में सुधार की आवश्यकता दर्शाती है।`;
  } else if (bodyAge < realAge) {
    bodyAgeComment = `वास्तविक उम्र (${realAge} वर्ष) से कम है, जो अच्छी फिटनेस दर्शाता है।`;
  }

  const phoneParam = encodeURIComponent(data.phone_number || data.mobile || '');

  return `नाम: ${data.name} जी
उम्र: ${data.age} वर्ष
लंबाई: ${data.height_cm} सेमी
वजन: ${data.weight_kg} किग्रा
BMI: ${data.bmi} (${bmiCategory} श्रेणी)

रिपोर्ट का सारांश

* बॉडी फैट: ${data.body_fat_pct}% – ${bodyFatComment}
* सबक्यूटेनियस फैट: ${data.sub_fat_pct}% – ${subFatComment}
* विसरल फैट: ${data.visceral_fat} – ${viscComment}
* स्केलेटल मसल: ${data.skeletal_muscle_pct}% – ${muscleComment}
* बॉडी एज: ${data.body_age} वर्ष – ${bodyAgeComment}
* BMR: ${data.bmr} kcal – शरीर को आराम की अवस्था में प्रतिदिन लगभग इतनी ऊर्जा की आवश्यकता होती है।

सुझाव

✅ प्रोटीन और फाइबर से भरपूर संतुलित पोषण और हर्बल न्यूट्रिशन प्लान अपनाएँ।
✅ प्रतिदिन 30–45 मिनट वॉक करें तथा सप्ताह में 3–4 दिन एक्टिव वर्कआउट व स्ट्रेंथ ट्रेनिंग करें।
✅ पर्याप्त पानी (प्रति 20 किलो वजन पर 1 लीटर) पिएँ और 7–8 घंटे की गहरी नींद लें।
✅ नियमित फॉलो-अप के साथ वजन, बॉडी फैट और विसरल फैट की निरंतर निगरानी करें।

लक्ष्य

* स्वस्थ और सुरक्षित तरीके से आदर्श वजन (${data.ideal_weight_kg ? data.ideal_weight_kg + ' किग्रा' : 'संतुलित वजन'}) प्राप्त करना।
* बॉडी फैट ${data.body_fat_pct}% से घटाकर स्वस्थ सीमा में लाना।
* विसरल फैट ${data.visceral_fat} से घटाकर 8 या उससे कम करना।
* मसल मास बढ़ाकर मेटाबॉलिज्म और बॉडी एज में सुधार करना।

🔗 विस्तृत रिपोर्ट लिंक: http://localhost:5173/report?phone=${phoneParam}`;
}

export async function generateBodyAnalysisSummary(data: any, isNewLead: boolean): Promise<string> {
  const fallback = getFallbackBodyAnalysisReport(data);

  if (process.env.APP_RUNTIME_MODE === 'test' || process.env.NODE_ENV === 'test' || !process.env.GEMINI_API_KEY) {
    return fallback;
  }

  try {
    if (!ai) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    const prompt = `
You are Coach Deepa, a compassionate, certified Senior Wellness and Nutrition Coach at Healthy Living Club.
Analyze the following client's body composition test data and create a 100% personalized, insightful health evaluation in natural, respectful Hindi (Devanagari script).

Client Data:
- Name: ${data.name}
- Age: ${data.age} years
- Gender: ${data.gender === 'F' ? 'Female' : 'Male'}
- Height: ${data.height_cm} cm
- Weight: ${data.weight_kg} kg
- BMI: ${data.bmi}
- Body Fat %: ${data.body_fat_pct}%
- Subcutaneous Fat %: ${data.sub_fat_pct}%
- Visceral Fat (Internal Organ Fat): ${data.visceral_fat}
- Skeletal Muscle %: ${data.skeletal_muscle_pct}%
- Body Age: ${data.body_age} years
- BMR (Basal Metabolic Rate): ${data.bmr} kcal
- Ideal Weight Target: ${data.ideal_weight_kg || '55-65'} kg

Your Task:
Generate a WhatsApp-formatted report customized specifically to this individual person.
Analyze what their body age vs actual age means, assess their visceral fat risks, identify muscle deficit or fat excess, and give 4 highly practical, specific lifestyle/nutrition tips for this person.

Format Structure (Strictly follow this layout, use plain text with emojis suitable for WhatsApp, DO NOT use ** markdown bold):

नाम: ${data.name} जी
उम्र: ${data.age} वर्ष
लंबाई: ${data.height_cm} सेमी
वजन: ${data.weight_kg} किग्रा
BMI: ${data.bmi} ([Accurate BMI Category in Hindi] श्रेणी)

रिपोर्ट का सारांश

* बॉडी फैट: ${data.body_fat_pct}% – [Personalized 1-sentence analysis for ${data.name}]
* सबक्यूटेनियस फैट: ${data.sub_fat_pct}% – [Personalized 1-sentence analysis]
* विसरल फैट: ${data.visceral_fat} – [Personalized 1-sentence analysis comparing with normal healthy range 2-8]
* स्केलेटल मसल: ${data.skeletal_muscle_pct}% – [Personalized 1-sentence analysis]
* बॉडी एज: ${data.body_age} वर्ष – [Personalized comparison with real age ${data.age} years]
* BMR: ${data.bmr} kcal – शरीर को आराम की अवस्था में प्रतिदिन लगभग इतनी ऊर्जा (कैलोरी) की आवश्यकता होती है।

सुझाव

✅ [Specific nutrition/diet recommendation customized to their weight and fat levels]
✅ [Specific exercise/strength training advice to improve muscle and reduce visceral fat]
✅ [Hydration and metabolic recovery advice tailored to their weight]
✅ [Consistent tracking and guidance recommendation from Coach Deepa]

लक्ष्य

* स्वस्थ तरीके से आदर्श वजन (${data.ideal_weight_kg ? data.ideal_weight_kg + ' किग्रा' : 'संतुलित वजन'}) प्राप्त करना।
* बॉडी फैट ${data.body_fat_pct}% से घटाकर स्वस्थ सीमा में लाना।
* विसरल फैट ${data.visceral_fat} से घटाकर सुरक्षित सीमा (8 या उससे कम) में लाना।
* मसल मास बढ़ाकर मेटाबॉलिज्म और बॉडी एज में सुधार करना।

🔗 विस्तृत रिपोर्ट लिंक: http://localhost:5173/report?phone=${encodeURIComponent(data.phone_number || data.mobile || '')}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const result = response.text?.trim();
    return result || fallback;
  } catch (err) {
    console.error('Error generating AI summary with Gemini:', err);
    return fallback;
  }
}
