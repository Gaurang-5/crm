// Constants, Medical Charts, Flavors, Instructions, and Pricing Configuration

export const FORMULA1_FLAVORS = [
  { id: 'F1_CHOCOLATE', name: 'Chocolate', emoji: '🍫' },
  { id: 'F1_STRAWBERRY', name: 'Strawberry', emoji: '🍓' },
  { id: 'F1_VANILLA', name: 'Vanilla', emoji: '🍦' },
  { id: 'F1_KULFI', name: 'Kulfi', emoji: '🍨' },
  { id: 'F1_ROSE_KHEER', name: 'Rose Kheer', emoji: '🌹' },
  { id: 'F1_BANANA_CARAMEL', name: 'Banana Caramel', emoji: '🍌🍯' },
  { id: 'F1_MANGO', name: 'Mango', emoji: '🥭' },
  { id: 'F1_ORANGE_CREAM', name: 'Orange Cream', emoji: '🍊' },
  { id: 'F1_PAAN', name: 'Paan', emoji: '🌿' },
];

export const AFRESH_FLAVORS = [
  { id: 'AFRESH_GINGER', name: 'Ginger', emoji: '🫚' },
  { id: 'AFRESH_LEMON', name: 'Lemon', emoji: '🍋' },
  { id: 'AFRESH_KASHMIRI_KAHWA', name: 'Kashmiri Kahwa', emoji: '🌸' },
  { id: 'AFRESH_CINNAMON', name: 'Cinnamon', emoji: '🌰' },
  { id: 'AFRESH_TULSI', name: 'Tulsi', emoji: '🌿' },
  { id: 'AFRESH_ELAICHI', name: 'Elaichi', emoji: '🌱' },
  { id: 'AFRESH_PEACH', name: 'Peach', emoji: '🍑' },
];

// Medical Weight Chart (from PDF Page 1)
export const MEDICAL_WEIGHT_CHART = {
  women: [
    { heightCm: 142, inch: '4.8', avgWeightKg: 46 },
    { heightCm: 145, inch: '4.9', avgWeightKg: 47 },
    { heightCm: 147, inch: '4.10', avgWeightKg: 49 },
    { heightCm: 150, inch: '4.11', avgWeightKg: 50 },
    { heightCm: 152, inch: '5.0', avgWeightKg: 51 },
    { heightCm: 155, inch: '5.1', avgWeightKg: 53 },
    { heightCm: 158, inch: '5.2', avgWeightKg: 54 },
    { heightCm: 160, inch: '5.3', avgWeightKg: 56 },
    { heightCm: 163, inch: '5.4', avgWeightKg: 58 },
    { heightCm: 165, inch: '5.5', avgWeightKg: 60 },
    { heightCm: 168, inch: '5.6', avgWeightKg: 62 },
    { heightCm: 170, inch: '5.7', avgWeightKg: 64 },
  ],
  men: [
    { heightCm: 155, inch: '5.1', avgWeightKg: 56 },
    { heightCm: 158, inch: '5.2', avgWeightKg: 58 },
    { heightCm: 160, inch: '5.3', avgWeightKg: 59 },
    { heightCm: 163, inch: '5.4', avgWeightKg: 60 },
    { heightCm: 165, inch: '5.5', avgWeightKg: 62 },
    { heightCm: 168, inch: '5.6', avgWeightKg: 64 },
    { heightCm: 170, inch: '5.7', avgWeightKg: 66 },
    { heightCm: 173, inch: '5.8', avgWeightKg: 68 },
    { heightCm: 175, inch: '5.9', avgWeightKg: 69 },
    { heightCm: 178, inch: '5.10', avgWeightKg: 72 },
    { heightCm: 180, inch: '5.11', avgWeightKg: 74 },
    { heightCm: 183, inch: '6.0', avgWeightKg: 76 },
  ],
};

export function getIdealWeight(heightCm: number, gender: any): number {
  const isFemale = gender === 'F' || String(gender).toLowerCase().startsWith('f') || String(gender).toLowerCase().includes('woman') || String(gender).toLowerCase().includes('women') || String(gender).toLowerCase().includes('female');
  const list = isFemale ? MEDICAL_WEIGHT_CHART.women : MEDICAL_WEIGHT_CHART.men;

  let closest = list[0];
  let minDiff = Math.abs(heightCm - closest.heightCm);

  for (const item of list) {
    const diff = Math.abs(heightCm - item.heightCm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }
  return closest.avgWeightKg;
}

// Pricing Configuration (matching the senior coach profit sheet app)
export const PRICING_CONFIG = {
  Basic: {
    name: 'Basic Membership',
    amountReceived: 8400,
    coachAmount: 5320,
    costOfKitNew: 3006,
    costOfKitRenewal: 3497,
    f1RequiredCount: 2,
    afreshRequiredCount: 1,
    mealsReplaced: 1,
    description: '1 Meal Replacement daily + Morning Club + 1 Afresh routine',
  },
  Elite: {
    name: 'Elite / Pro Membership',
    amountReceived: 12070,
    coachAmount: 8990,
    costOfKitNew: 5660,
    costOfKitRenewal: 6157,
    f1RequiredCount: 3,
    afreshRequiredCount: 2,
    mealsReplaced: 2,
    description: '2 Meal Replacements daily + Morning & Evening Club + 2 Afresh routine',
  },
};

// 18 Golden Rules & Instructions (PDF Page 4)
export const GOLDEN_INSTRUCTIONS_HI = [
  '1. मैदा, चीनी और फ्राइड फूड से पूरी तरह दूर रहना है।',
  '2. शुरुआत में चारों तरफ की फोटो भेजनी है (Front, Back और Both Sides)।',
  '3. Daily सुबह वजन चेक करना है (कम हो तो अति-उत्साहित नहीं होना, बढ़ जाए तो उदास नहीं होना)।',
  '4. 30 दिन लगातार बिना किसी नागा के ब्रेकफास्ट (Shake) लेना है।',
  '5. जो भी खाएं, उसकी फोटो Timestamp App के साथ कोच को भेजनी है।',
  '6. शेक पीने के बाद पर्याप्त पानी पीना है।',
  '7. शेक को कभी भी गर्म पानी में नहीं बनाना है।',
  '8. दिनभर में 4–5 बार फ्रेश (Afresh) लेना है।',
  '9. डिटॉक्सिफिकेशन प्रक्रिया का पूरा पालन करना है।',
  '10. 3–4 घंटे तक नमक और चीनी का सेवन नियंत्रित रखना है।',
  '11. 4 स्तंभों पर ध्यान दें (Shake से वजन कम नहीं होता; क्लब, कोच, न्यूट्रिशन और माइंडसेट से होता है)।',
  '12. कोच के साथ नियमित कॉल्स और फॉलो-अप में रहना है।',
  '13. महत्वपूर्ण मीटिंग्स: 1st Visit (Day 1), शनिवार Gift Meeting, Day 5 वीडियो कॉल, Day 15 वीडियो कॉल, Day 25 क्लब ऑपरेटर मीट।',
  '14. शुरुआती 5 दिन तक सख्ती से यही रूटीन फॉलो करना है।',
  '15. तीनों समय का भोजन हमेशा समय पर लेना है।',
  '16. हमेशा सकारात्मक सोचें और अच्छा महसूस करें।',
  '17. ऑफिशियल रजिस्ट्रेशन हेतु आधार कार्ड और ईमेल आईडी शेयर करना है।',
  '18. क्लब में एंट्री हमेशा क्लब कोड (Club Code) के साथ करनी है।',
];

// Routines for Memberships (PDF Pages 2 & 3)
export const ROUTINE_BASIC_HI = [
  '⏰ 6:00 AM: Wake up & Weight check (starting 5 days)',
  '💧 6:00 to 7:00 AM: 2 glass warm water (350ml each) + 1 glass Hot Afresh',
  '🥤 7:30 AM - 8:30 AM: Club Shake + 1 litre water (till 8:30 AM)',
  '📸 8:30 AM: Send attendance screenshot to Coach',
  '☕ 11:00 AM: 1 hot Afresh (350ml) + 1 handful roasted chana (भुना चना)',
  '🥗 1:30 PM - 2:00 PM LUNCH: 1 fruit + full plate salad + 2 stuffed chapati / 1 small bowl seasonal veggies + 1 small bowl dal',
  '☕ After 40 mins: HOT AFRESH (2 spoons in 350ml water)',
  '🥜 5:30 PM: 1 cup hot Afresh + 1 handful makhana / sprouts / 2 walnuts / 5 almonds (Any one)',
  '🍲 7:00 PM DINNER: 1 plate salad + 2 small bowls sabji + 1 or 2 chapati / 1 small bowl rice',
  '☕ After dinner: Small cup hot Afresh',
  '💧 Water Intake: 1 glass water every 30 mins (Total as per body weight)',
];

export const ROUTINE_ELITE_HI = [
  '⏰ 6:00 AM: Wake up & Weight check (starting 5 days)',
  '💧 6:00 to 7:00 AM: 2 glass warm water (350ml each) + 1 glass Hot Afresh',
  '🥤 7:30 AM - 8:30 AM: Club Shake + 1 litre water (till 8:30 AM)',
  '📸 8:30 AM: Send attendance screenshot to Coach',
  '☕ 11:00 AM: 1 hot Afresh (350ml) + 1 handful roasted chana (भुना चना)',
  '🥗 1:30 PM - 2:00 PM LUNCH: 1 fruit + full plate salad + 2 stuffed chapati / 1 small bowl seasonal veggies + 1 small bowl dal',
  '☕ After 40 mins: HOT AFRESH (2 spoons in 350ml water)',
  '🥜 5:30 PM: 1 cup hot Afresh + 1 handful makhana / sprouts / 2 walnuts / 5 almonds (Any one)',
  '🥤 7:00 PM DINNER: Evening Club Formula 1 Shake (Meal Replacement)',
  '☕ After dinner: Small cup hot Afresh',
  '💧 Water Intake: 1 glass water every 30 mins (Total as per body weight)',
];
