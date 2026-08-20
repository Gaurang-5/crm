import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testGeminiApi() {
  console.log('\n========================================');
  console.log('       GOOGLE GEMINI API TEST           ');
  console.log('========================================\n');

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY is not found in .env');
    process.exit(1);
  }

  const maskedKey = apiKey.slice(0, 6) + '...' + apiKey.slice(-4);
  console.log(`🔑 Testing API Key: ${maskedKey}`);

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3.6-flash';

  try {
    console.log(`📡 Trying model: ${modelName}...`);
    const start = Date.now();

    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Respond with: "Gemini 3.6 Flash is active and operational for Wellness Coach CRM."',
    });

    const elapsed = Date.now() - start;
    console.log(`\n✅ Model '${modelName}' responded in ${elapsed}ms:`);
    console.log(`"${response.text?.trim()}"\n`);
    console.log(`🎉 Google Gemini AI is 100% LIVE and verified!\n`);
  } catch (err: any) {
    console.log(`   ⚠️ Model '${modelName}' error: ${err.message}`);
  }
}

testGeminiApi();
