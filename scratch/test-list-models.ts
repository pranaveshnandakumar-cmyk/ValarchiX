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

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // test list models or call API directly
    const testNames = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-2.5-pro",
      "gemini-flash-latest",
      "gemini-pro"
    ];
    
    for (const name of testNames) {
      try {
        const model = genAI.getGenerativeModel({ model: name });
        const res = await model.generateContent("hello");
        console.log(`✅ WORKING MODEL FOUND: "${name}" ->`, res.response.text());
        break;
      } catch (err: any) {
        console.log(`❌ Model "${name}" failed:`, err.message?.slice(0, 150));
      }
    }
  } catch (e: any) {
    console.error("List failed:", e.message);
  }
}

listModels();
