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

async function testRetirement() {
  console.log("=== VERIFYING RETIREMENT CALCULATOR ===");
  const agent = createVaathiAgent();

  const query = "I am 30 years old, want to retire at 50 with monthly expense of ₹50,000. How much corpus do I need?";
  console.log(`Query: "${query}"`);

  try {
    const messages = formatMessages([{ role: "user", content: query }]);
    const startTime = Date.now();
    const result = await agent.invoke({ messages });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const toolMessages = result.messages.filter((m: any) => m.constructor?.name === "ToolMessage" || m._getType?.() === "tool");
    const aiMessages = result.messages.filter((m: any) => m._getType?.() === "ai" && m.content);
    const finalMsg = aiMessages[aiMessages.length - 1];

    console.log(`STATUS: SUCCESS (${elapsed}s)`);
    console.log(`Tools Called:`, toolMessages.map((t: any) => t.name || "tool"));
    
    let content = "";
    if (typeof finalMsg?.content === "string") content = finalMsg.content;
    else if (Array.isArray(finalMsg?.content)) content = finalMsg.content.map((p: any) => p.text || String(p)).join("");
    else content = String(finalMsg?.content || "");

    console.log(`Response Snippet:\n`, content.slice(0, 400) + (content.length > 400 ? "..." : ""));
  } catch (err: any) {
    console.error(`STATUS: FAILED ❌`, err.message || err);
  }
}

testRetirement();
