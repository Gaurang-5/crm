import dotenv from 'dotenv';
import path from 'path';
import { generateBodyAnalysisSummary } from '../api/src/ai/gemini.service';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testFemale() {
  const sampleData = {
    name: 'Sarita Sharma',
    age: 48,
    gender: 'F',
    height_cm: 152,
    weight_kg: 68,
    bmi: 29.4,
    body_fat_pct: 39.2,
    sub_fat_pct: 34.0,
    visceral_fat: 10,
    skeletal_muscle_pct: 22.8,
    body_age: 56,
    bmr: 1240,
    ideal_weight_kg: 52,
    mobile: '919876543211',
  };

  console.log('Testing generateBodyAnalysisSummary for Sarita Sharma...');
  const result = await generateBodyAnalysisSummary(sampleData, false);
  console.log('\n--- GEMINI OUTPUT ---');
  console.log(result);
  console.log('---------------------\n');
}

testFemale();
