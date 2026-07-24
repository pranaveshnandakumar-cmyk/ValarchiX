import fs from 'fs';
import path from 'path';
import { ChatGroq } from '@langchain/groq';

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

const apiKey = process.env.GROQ_API_KEY;

async function testGroqModels() {
  const candidateModels = [
    "mixtral-8x7b-32768",
    "qwen-2.5-32b",
    "gemma2-9b-it",
    "llama-3.3-70b-specdec"
  ];

  for (const m of candidateModels) {
    console.log(`Testing Groq model "${m}"...`);
    try {
      const llm = new ChatGroq({
        model: m,
        apiKey: apiKey,
        temperature: 0.7,
      });
      const res = await llm.invoke("Hello, respond in 5 words.");
      console.log(`✅ SUCCESS WITH "${m}":`, res.content);
    } catch (err: any) {
      console.log(`❌ "${m}" failed:`, err.message?.slice(0, 150));
    }
  }
}

testGroqModels();
