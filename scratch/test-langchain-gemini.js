const fs = require('fs');
const path = require('path');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : '';

process.env.GOOGLE_API_KEY = apiKey;

async function testLangchain(modelName) {
  console.log(`\nTesting model: ${modelName}...`);
  try {
    const llm = new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey: apiKey,
    });
    const res = await llm.invoke("Hello, respond with 1 word.");
    console.log(`SUCCESS for ${modelName}:`, res.content);
  } catch (err) {
    console.error(`FAILED for ${modelName}:`, err.message);
  }
}

async function run() {
  await testLangchain("gemini-2.0-flash");
  await testLangchain("gemini-2.5-flash");
  await testLangchain("gemini-flash-latest");
}

run();
