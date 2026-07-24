import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';

async function test8b() {
  const models = [
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash-8b-latest",
    "gemini-1.5-pro-latest"
  ];

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const m of models) {
    try {
      console.log(`Testing model "${m}"...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("hello");
      console.log(`✅ SUCCESS WITH "${m}":`, res.response.text());
      break;
    } catch (err: any) {
      console.log(`❌ "${m}" failed:`, err.message?.slice(0, 150));
    }
  }
}

test8b();
