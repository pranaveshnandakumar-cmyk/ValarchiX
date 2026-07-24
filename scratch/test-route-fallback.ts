import fs from 'fs';
import path from 'path';
import { createVaathiAgent, formatMessages } from '../src/lib/vaathi/agent';

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

async function invokeWithModelFallback(formattedMessages: any[]) {
  const modelList = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "gemini-flash-latest"
  ];

  for (const modelName of modelList) {
    try {
      console.log(`Attempting execution with model: "${modelName}"...`);
      const agent = createVaathiAgent(modelName);
      const result = await agent.invoke({ messages: formattedMessages });
      console.log(`✅ SUCCESS WITH MODEL "${modelName}"!`);
      return result;
    } catch (err: any) {
      const is429 = err.status === 429 || String(err).includes("429") || String(err).includes("Rate limit");
      if (is429) {
        console.warn(`⚠️ Rate limit on model "${modelName}". Falling back to next model...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All AI models are currently busy. Please retry in a few seconds.");
}

async function testRouteFallback() {
  console.log("=== TESTING DYNAMIC ROUTE-LEVEL MULTI-MODEL FALLBACK ===");
  const query = "teach me personal finance";
  const messages = formatMessages([{ role: "user", content: query }]);

  try {
    const startTime = Date.now();
    const result = await invokeWithModelFallback(messages);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const aiMessages = result.messages.filter((m: any) => m._getType?.() === "ai" && m.content);
    const finalMsg = aiMessages[aiMessages.length - 1];

    console.log(`\n🎉 TOTAL SUCCESS! (${elapsed}s)`);
    let content = typeof finalMsg?.content === "string" ? finalMsg.content : String(finalMsg?.content || "");
    console.log(`Output:\n`, content);
  } catch (err: any) {
    console.error("❌ Route Fallback Failed:", err.message || err);
  }
}

testRouteFallback();
