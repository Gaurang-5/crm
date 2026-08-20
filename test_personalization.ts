import { generateHealthAnalysis } from './gemini';

async function testProfiles() {
  console.log('=== TEST 1: Sarika Ji (47 yrs, Female, 153cm, 67kg - Overweight, High Fat) ===');
  const r1 = await generateHealthAnalysis({
    name: 'सारिका',
    age: 47,
    gender: 'F',
    heightCm: 153,
    weightKg: 67,
    subFatPct: 35.2,
    visceralFat: 11.5,
    skeletalMusclePct: 21.0,
    bodyFatPct: 40.2,
    bodyAge: 62,
    bmr: 1326,
  });
  console.log(r1.hindiReport);
  console.log('');
  console.log('==================================================');
  console.log('');
  console.log('=== TEST 2: Rohit Ji (28 yrs, Male, 178cm, 56kg - Underweight, Low Muscle) ===');
  const r2 = await generateHealthAnalysis({
    name: 'रोहित',
    age: 28,
    gender: 'M',
    heightCm: 178,
    weightKg: 56,
    subFatPct: 10.0,
    visceralFat: 4.0,
    skeletalMusclePct: 29.0,
    bodyFatPct: 12.0,
    bodyAge: 24,
    bmr: 1450,
  });
  console.log(r2.hindiReport);
  console.log('');
  console.log('==================================================');
  console.log('');
  console.log('=== TEST 3: Priya Ji (32 yrs, Female, 160cm, 54kg - Ideal Weight, Fitness & Toning) ===');
  const r3 = await generateHealthAnalysis({
    name: 'प्रिया',
    age: 32,
    gender: 'F',
    heightCm: 160,
    weightKg: 54,
    subFatPct: 18.0,
    visceralFat: 5.0,
    skeletalMusclePct: 31.0,
    bodyFatPct: 23.0,
    bodyAge: 29,
    bmr: 1380,
  });
  console.log(r3.hindiReport);
}

testProfiles().catch(console.error);