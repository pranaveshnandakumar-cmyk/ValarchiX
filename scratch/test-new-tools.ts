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

async function testNewTools() {
  console.log("=== TESTING ALL NEW CALCULATOR TOOLS & DECLINE PHRASE ===");
  const agent = createVaathiAgent();

  const tests = [
    {
      name: "1. PPF Calculator (ppfCalc)",
      query: "How much will I get if I deposit ₹1.5 Lakhs annually in PPF for 15 years?"
    },
    {
      name: "2. HRA Exemption (hraExemptionCalc)",
      query: "My basic salary is ₹50,000/month, HRA received is ₹20,000/month, and rent paid is ₹18,000 in Mumbai. How much HRA is exempt?"
    },
    {
      name: "3. Non-Finance Decline Message Test",
      query: "What is the capital of France?"
    }
  ];

  for (const test of tests) {
    console.log(`\n----------------------------------------`);
    console.log(`RUNNING: ${test.name}`);
    console.log(`Query: "${test.query}"`);
    console.log(`----------------------------------------`);
    try {
      const messages = formatMessages([{ role: "user", content: test.query }]);
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

      console.log(`Response Output:\n`, content);
    } catch (err: any) {
      console.error(`STATUS: FAILED ❌`, err.message || err);
    }
    await new Promise(res => setTimeout(res, 5000));
  }

  console.log("\n=== ALL TOOLS VERIFICATION COMPLETE ===");
}

testNewTools();
