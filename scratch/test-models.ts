import fs from 'fs';
import path from 'path';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

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

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

async function testModels() {
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-001"
  ];

  for (const modelName of candidateModels) {
    console.log(`Testing model: ${modelName}...`);
    try {
      const llm = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: apiKey,
        temperature: 0.7,
      });
      const res = await llm.invoke("Hi");
      console.log(`✅ SUCCESS with ${modelName}! Response:`, res.content);
      break;
    } catch (err: any) {
      console.error(`❌ FAILED with ${modelName}:`, err.message || err);
    }
  }
}

testModels();
