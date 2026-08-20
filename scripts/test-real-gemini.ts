import dotenv from 'dotenv';
import path from 'path';
import { generateBodyAnalysisSummary } from '../api/src/ai/gemini.service';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testReal() {
  const sampleData = {
    name: 'Rahul Sharma',
    age: 34,
    gender: 'M',
    height_cm: 175,
    weight_kg: 84,
    bmi: 27.4,
    body_fat_pct: 26.5,
    sub_fat_pct: 22.0,
    visceral_fat: 11,
    skeletal_muscle_pct: 31.2,
    body_age: 41,
    bmr: 1680,
    ideal_weight_kg: 68,
    mobile: '919876543210',
  };

  console.log('Testing generateBodyAnalysisSummary for Rahul Sharma...');
  const result = await generateBodyAnalysisSummary(sampleData, false);
  console.log('\n--- GEMINI OUTPUT ---');
  console.log(result);
  console.log('---------------------\n');
}

testReal();
