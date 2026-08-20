import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { getIdealWeight } from './constants';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

let aiClient: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

export interface BodyMetrics {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'male' | 'female' | string;
  heightCm: number;
  weightKg: number;
  bmi?: number;
  subFatPct?: number;
  visceralFat?: number;
  skeletalMusclePct?: number;
  bodyFatPct?: number;
  bodyAge?: number;
  bmr?: number;
}

export interface HealthAnalysisResult {
  hindiReport: string;
  englishReport: string;
  combinedWhatsAppMessage: string;
  metrics: {
    bmi: number;
    bmiCategory: string;
    bodyFatPct: number;
    bodyFatCategory: string;
    visceralFat: number;
    visceralFatCategory: string;
    subFatPct: number;
    skeletalMusclePct: number;
    bodyAge: number;
    bmr: number;
    idealWeightKg: number;
    weightDiffKg: number;
    waterLitres: number;
  };
}

export function calculateStandardMetrics(metrics: BodyMetrics) {
  const heightM = metrics.heightCm / 100;
  const bmi = metrics.bmi || Number((metrics.weightKg / (heightM * heightM)).toFixed(1));
  
  let bmiCategory = 'सामान्य (Normal)';
  if (bmi < 18.5) bmiCategory = 'अंडरवेट श्रेणी (Underweight)';
  else if (bmi < 23) bmiCategory = 'सामान्य श्रेणी (Normal)';
  else if (bmi < 25) bmiCategory = 'ओवरवेट श्रेणी (Overweight)';
  else bmiCategory = 'ओबीस श्रेणी (Obese)';

  const isFemale = String(metrics.gender).toLowerCase().startsWith('f') || String(metrics.gender).toLowerCase().includes('woman');
  
  const bodyFat = metrics.bodyFatPct !== undefined ? metrics.bodyFatPct : (isFemale ? 32 : 24);
  let bodyFatCategory = 'सामान्य (Normal)';
  if (isFemale) {
    if (bodyFat < 20) bodyFatCategory = 'कम (Low)';
    else if (bodyFat <= 30) bodyFatCategory = 'सामान्य (Normal)';
    else if (bodyFat <= 35) bodyFatCategory = 'अधिक (High)';
    else bodyFatCategory = 'सामान्य से काफी अधिक (Very High)';
  } else {
    if (bodyFat < 10) bodyFatCategory = 'कम (Low)';
    else if (bodyFat <= 20) bodyFatCategory = 'सामान्य (Normal)';
    else if (bodyFat <= 25) bodyFatCategory = 'अधिक (High)';
    else bodyFatCategory = 'सामान्य से काफी अधिक (Very High)';
  }

  const vFat = metrics.visceralFat !== undefined ? metrics.visceralFat : 9;
  let visceralFatCategory = 'सामान्य (Normal)';
  if (vFat <= 8) visceralFatCategory = 'सामान्य सीमा (Normal 2-8)';
  else if (vFat <= 14) visceralFatCategory = 'सामान्य सीमा (2–8) से ऊपर (High)';
  else visceralFatCategory = 'काफी अधिक (Very High 15+)';

  const idealWeight = getIdealWeight(metrics.heightCm, metrics.gender);
  const weightDiff = Number((metrics.weightKg - idealWeight).toFixed(1));
  const waterLitres = Number((metrics.weightKg / 20).toFixed(1));

  const subFat = metrics.subFatPct !== undefined ? metrics.subFatPct : (isFemale ? 30 : 20);
  const muscle = metrics.skeletalMusclePct !== undefined ? metrics.skeletalMusclePct : (isFemale ? 25 : 32);
  const bodyAge = metrics.bodyAge !== undefined ? metrics.bodyAge : metrics.age + 5;
  const bmr = metrics.bmr !== undefined ? metrics.bmr : (isFemale ? 1350 : 1650);

  return {
    bmi,
    bmiCategory,
    bodyFatPct: bodyFat,
    bodyFatCategory,
    visceralFat: vFat,
    visceralFatCategory,
    subFatPct: subFat,
    skeletalMusclePct: muscle,
    bodyAge,
    bmr,
    idealWeightKg: idealWeight,
    weightDiffKg: weightDiff,
    waterLitres,
  };
}

export function buildPersonalizedSuggestionsAndGoals(metrics: BodyMetrics, calculated: ReturnType<typeof calculateStandardMetrics>) {
  const isFemale = String(metrics.gender).toLowerCase().startsWith('f') || String(metrics.gender).toLowerCase().includes('woman');
  const suggestions: string[] = [];
  const goals: string[] = [];

  // 1. Personalized Nutrition Suggestion based on Goal & BMR
  if (calculated.weightDiffKg > 1.5) {
    suggestions.push('✅ दैनिक BMR (' + calculated.bmr + ' kcal) को ध्यान में रखते हुए कैलोरी डेफिसिट और प्रोटीन-युक्त संतुलित शेक डाइट लें ताकि फैट घटे।');
  } else if (calculated.weightDiffKg < -1.5) {
    suggestions.push('✅ BMR (' + calculated.bmr + ' kcal) से अधिक पोषक कैलोरी और उच्च प्रोटीन आहार लें ताकि स्वस्थ वजन बढ़ सके।');
  } else {
    suggestions.push('✅ BMR (' + calculated.bmr + ' kcal) के अनुकूल संतुलित प्रोटीन और फाइबर आहार से वर्तमान वजन व फिटनेस बनाए रखें।');
  }

  // 2. Personalized Exercise Suggestion based on BMI, Visceral Fat & Muscle
  if (calculated.bmi >= 28 || calculated.visceralFat >= 11) {
    suggestions.push('✅ प्रतिदिन 30–45 मिनट नियमित वॉक करें (जोड़ों पर बिना ज्यादा दबाव डाले) और हल्का योगाभ्यास करें।');
  } else if (calculated.skeletalMusclePct < (isFemale ? 28 : 33)) {
    suggestions.push('✅ प्रतिदिन 30–40 मिनट वॉक के साथ सप्ताह में 3–4 दिन स्ट्रेंथ/रेजिस्टेंस ट्रेनिंग करें ताकि मसल मास बढ़े।');
  } else {
    suggestions.push('✅ प्रतिदिन 30–45 मिनट एक्टिव वर्कआउट, ब्रिस्क वॉक या कार्डियो करें।');
  }

  // 3. Personalized Hydration based on exact body weight (1L per 20kg rule)
  suggestions.push('✅ आपके ' + metrics.weightKg + ' किग्रा वजन के अनुसार प्रतिदिन लगभग ' + calculated.waterLitres + ' लीटर पानी अवश्य पिएँ और 7–8 घंटे की गहरी नींद लें।');

  // 4. Personalized Follow-up Suggestion
  suggestions.push('✅ कोच के साथ साप्ताहिक फॉलो-अप में वजन, बॉडी फैट और विसरल फैट के बदलाव की लाइव निगरानी करें।');

  // --- PERSONALIZED GOALS (लक्ष्य) ---
  // Goal 1: Weight Goal
  if (calculated.weightDiffKg > 1.5) {
    goals.push('• स्वस्थ और ऊर्जावान तरीके से ' + calculated.weightDiffKg + ' किग्रा अतिरिक्त वजन कम करके ' + calculated.idealWeightKg + ' किग्रा के आदर्श लक्ष्य पर पहुँचना।');
  } else if (calculated.weightDiffKg < -1.5) {
    goals.push('• स्वस्थ और सुरक्षित तरीके से ' + Math.abs(calculated.weightDiffKg) + ' किग्रा वजन व लीन मसल बढ़ाकर ' + calculated.idealWeightKg + ' किग्रा तक पहुँचना।');
  } else {
    goals.push('• वर्तमान ' + metrics.weightKg + ' किग्रा स्वस्थ वजन को बनाए रखते हुए बॉडी टोनिंग व स्टैमिना में सुधार करना।');
  }

  // Goal 2: Body Fat Goal
  const idealFatRange = isFemale ? '20–25%' : '12–18%';
  if (calculated.bodyFatPct > (isFemale ? 28 : 20)) {
    goals.push('• बॉडी फैट ' + calculated.bodyFatPct + '% से घटाकर स्वस्थ सीमा (' + idealFatRange + ') में लाना।');
  } else {
    goals.push('• बॉडी फैट ' + calculated.bodyFatPct + '% को आदर्श सीमा (' + idealFatRange + ') में स्थिर रखना।');
  }

  // Goal 3: Visceral Fat Goal
  if (calculated.visceralFat > 8) {
    goals.push('• आंतरिक पेट की चर्बी (विसरल फैट ' + calculated.visceralFat + ') को घटाकर सुरक्षित स्तर (8 या उससे कम) पर लाना।');
  } else {
    goals.push('• विसरल फैट (' + calculated.visceralFat + ') को सुरक्षित सीमा (2–8) में बनाए रखना।');
  }

  // Goal 4: Muscle & Body Age Goal
  const targetMuscle = isFemale ? '30-33%' : '34-36%';
  if (calculated.bodyAge > metrics.age) {
    goals.push('• स्केलेटल मसल बढ़ाकर ' + targetMuscle + ' करना तथा बॉडी एज (' + calculated.bodyAge + ' वर्ष) को घटाकर वास्तविक उम्र (' + metrics.age + ' वर्ष) या उससे कम पर लाना।');
  } else {
    goals.push('• स्केलेटल मसल (' + calculated.skeletalMusclePct + '%) को सुदृढ़ रखते हुए मेटाबॉलिक फिटनेस को युवा बनाए रखना।');
  }

  return { suggestions, goals };
}

export async function generateHealthAnalysis(metrics: BodyMetrics): Promise<HealthAnalysisResult> {
  const calculated = calculateStandardMetrics(metrics);
  const idealWeight = calculated.idealWeightKg;
  const { suggestions, goals } = buildPersonalizedSuggestionsAndGoals(metrics, calculated);

  const fallbackHindiLines = [
    'नाम: ' + metrics.name + ' जी',
    'उम्र: ' + metrics.age + ' वर्ष',
    'लंबाई: ' + metrics.heightCm + ' सेमी',
    'वजन: ' + metrics.weightKg + ' किग्रा (आदर्श वजन: ' + idealWeight + ' किग्रा)',
    'BMI: ' + calculated.bmi + ' (' + calculated.bmiCategory + ')',
    '',
    '📊 *रिपोर्ट का सारांश*',
    '',
    '• बॉडी फैट: ' + calculated.bodyFatPct + '% – ' + calculated.bodyFatCategory + ' है।',
    '• सबक्यूटेनियस फैट: ' + calculated.subFatPct + '% – ' + (calculated.subFatPct > 15 ? 'अधिक है, इसे कम करने की आवश्यकता है।' : 'संतुलित सीमा में है।'),
    '• विसरल फैट: ' + calculated.visceralFat + ' – ' + (calculated.visceralFat > 8 ? 'सामान्य सीमा (2–8) से ऊपर है, इसे कम करना आवश्यक है।' : 'स्वस्थ सीमा में है।'),
    '• स्केलेटल मसल: ' + calculated.skeletalMusclePct + '% – ' + (calculated.skeletalMusclePct < 28 ? 'कम है, इसे बढ़ाने पर ध्यान देना होगा।' : 'संतोषजनक है।'),
    '• बॉडी एज: ' + calculated.bodyAge + ' वर्ष – ' + (calculated.bodyAge > metrics.age ? ('वास्तविक उम्र (' + metrics.age + ' वर्ष) से अधिक है, जो मेटाबॉलिक हेल्थ में सुधार की आवश्यकता दर्शाती है।') : 'वास्तविक उम्र के अनुकूल है।'),
    '• BMR: ' + calculated.bmr + ' kcal – शरीर को आराम की अवस्था में प्रतिदिन लगभग इतनी ऊर्जा की आवश्यकता होती है।',
    '',
    '💡 *सुझाव*',
    '',
    ...suggestions,
    '',
    '🎯 *लक्ष्य*',
    '',
    ...goals,
  ];
  let hindiReport = fallbackHindiLines.join(String.fromCharCode(10));

  if (aiClient) {
    try {
      const promptLines = [
        'You are an empathetic, expert wellness nutrition coach analyzing an in-person body composition scan.',
        'Generate a 100% personalized health analysis report in natural, encouraging Hindi.',
        'CRITICAL INSTRUCTION: DO NOT use generic or preset text for Suggestions and Goals. Everything MUST be tailored to this specific individual using their exact numbers:',
        '',
        'CLIENT METRICS:',
        '- Name: ' + metrics.name + ' जी',
        '- Age: ' + metrics.age + ' years',
        '- Gender: ' + metrics.gender,
        '- Height: ' + metrics.heightCm + ' cm',
        '- Current Weight: ' + metrics.weightKg + ' kg',
        '- Ideal Target Weight: ' + idealWeight + ' kg (Delta: ' + (calculated.weightDiffKg > 0 ? ('Lose ' + calculated.weightDiffKg + ' kg') : ('Gain ' + Math.abs(calculated.weightDiffKg) + ' kg')) + ')',
        '- BMI: ' + calculated.bmi + ' (' + calculated.bmiCategory + ')',
        '- Body Fat: ' + calculated.bodyFatPct + '% (' + calculated.bodyFatCategory + ')',
        '- Subcutaneous Fat: ' + calculated.subFatPct + '%',
        '- Visceral Fat: ' + calculated.visceralFat + ' (' + calculated.visceralFatCategory + ')',
        '- Skeletal Muscle: ' + calculated.skeletalMusclePct + '%',
        '- Body Age: ' + calculated.bodyAge + ' years (Actual: ' + metrics.age + ' years)',
        '- BMR: ' + calculated.bmr + ' kcal/day',
        '- Daily Water Requirement: ' + calculated.waterLitres + ' Litres (computed as 1L per 20kg weight)',
        '',
        'FORMAT YOUR OUTPUT EXACTLY AS FOLLOWS (in Hindi):',
        'नाम: ' + metrics.name + ' जी',
        'उम्र: ' + metrics.age + ' वर्ष',
        'लंबाई: ' + metrics.heightCm + ' सेमी',
        'वजन: ' + metrics.weightKg + ' किग्रा',
        'BMI: ' + calculated.bmi + ' (' + calculated.bmiCategory + ')',
        'आदर्श वजन: ' + idealWeight + ' किग्रा',
        '',
        'रिपोर्ट का सारांश',
        '* बॉडी फैट: ' + calculated.bodyFatPct + '% – [brief Hindi classification]',
        '* सबक्यूटेनियस फैट: ' + calculated.subFatPct + '% – [brief status]',
        '* विसरल फैट: ' + calculated.visceralFat + ' – [status relative to 2-8 normal]',
        '* स्केलेटल मसल: ' + calculated.skeletalMusclePct + '% – [status]',
        '* बॉडी एज: ' + calculated.bodyAge + ' वर्ष – [comparison with actual age ' + metrics.age + ']',
        '* BMR: ' + calculated.bmr + ' kcal – शरीर को आराम की अवस्था में प्रतिदिन इतनी ऊर्जा चाहिए।',
        '',
        'सुझाव',
        '✅ [Personalized nutrition & BMR advice referencing their specific ' + calculated.bmr + ' kcal and goal]',
        '✅ [Personalized workout advice tailored to their BMI ' + calculated.bmi + ' and visceral fat ' + calculated.visceralFat + ']',
        '✅ [Personalized hydration mentioning their exact ' + calculated.waterLitres + ' Litres based on their ' + metrics.weightKg + ' kg weight and 7-8 hrs sleep]',
        '✅ [Coach follow-up guidance for monitoring fat and muscle progression]',
        '',
        'लक्ष्य',
        '• [Exact weight goal: ' + (calculated.weightDiffKg > 0 ? ('कम करना ' + calculated.weightDiffKg + ' kg') : ('बढ़ाना ' + Math.abs(calculated.weightDiffKg) + ' kg')) + ' to reach ' + idealWeight + ' kg]',
        '• [Exact body fat goal to bring ' + calculated.bodyFatPct + '% to healthy range]',
        '• [Exact visceral fat goal to reduce ' + calculated.visceralFat + ' to 8 or less]',
        '• [Exact muscle mass and body age target to improve metabolic health from ' + calculated.bodyAge + ' yrs]',
        '',
        'Tone: Warm, encouraging, respectful. Never mention commercial brand names, focus on balanced nutrition, club, and personal coach guidance.',
      ];
      const prompt = promptLines.join(String.fromCharCode(10));

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response && response.text) {
        hindiReport = response.text.trim();
      }
    } catch (apiErr) {
      console.warn('Gemini API call fallback to personalized dynamic calculations:', apiErr);
    }
  }

  const englishLines = [
    'Name: ' + metrics.name,
    'Age: ' + metrics.age + ' yrs | Height: ' + metrics.heightCm + ' cm | Weight: ' + metrics.weightKg + ' kg (Ideal: ' + idealWeight + ' kg)',
    'BMI: ' + calculated.bmi + ' | Body Fat: ' + calculated.bodyFatPct + '% | Visceral Fat: ' + calculated.visceralFat + ' | Body Age: ' + calculated.bodyAge + ' yrs',
  ];
  const englishReport = englishLines.join(String.fromCharCode(10));

  const combinedLines = [
    '✨ *बॉडी एनालिसिस और हेल्थ रिपोर्ट* ✨',
    '',
    hindiReport,
    '',
    '---',
    '🌟 *अगला कदम (Next Step):*',
    'क्या आप हमारे मॉर्निंग वेलनेस सेशन (Zoom) से जुड़कर अपना वजन और फिटनेस लक्ष्य हासिल करना चाहते हैं?',
    '',
    '(Reply *YES* या *हाँ* to get your Zoom session invite!)',
  ];
  const combinedWhatsAppMessage = combinedLines.join(String.fromCharCode(10));

  return {
    hindiReport,
    englishReport,
    combinedWhatsAppMessage,
    metrics: calculated,
  };
}