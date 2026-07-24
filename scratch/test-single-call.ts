import fs from 'fs';
import path from 'path';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { vaathiTools } from '../src/lib/vaathi/tools';
import { VAATHI_SYSTEM_PROMPT } from '../src/lib/vaathi/system-prompt';

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

async function testSingleCall() {
  console.log("=== TESTING SINGLE-PASS 1-CALL EXECUTION ===");
  const apiKey = process.env.GROQ_API_KEY;

  const toolsMap = new Map();
  for (const t of vaathiTools) {
    toolsMap.set(t.name, t);
  }

  const llm = new ChatGroq({
    model: "llama-3.1-8b-instant",
    apiKey: apiKey,
    temperature: 0.5,
    maxTokens: 1024,
  }).bindTools(vaathiTools.slice(0, 8));

  const query = "I need ₹50 lakhs in 10 years, how much SIP?";

  try {
    const startTime = Date.now();
    
    // Call 1 (Single LLM Call)
    const response = await llm.invoke([
      new SystemMessage(VAATHI_SYSTEM_PROMPT),
      new HumanMessage(query)
    ]);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⚡ SINGLE CALL COMPLETED IN ${elapsed}s (Total LLM API Calls: 1)`);

    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log("Tool Calls Requested by LLM:", response.tool_calls);
      for (const tc of response.tool_calls) {
        const targetTool = toolsMap.get(tc.name);
        if (targetTool) {
          const toolResult = await targetTool.invoke(tc.args);
          console.log(`Tool Result for ${tc.name}:`, toolResult);
        }
      }
    } else {
      console.log("Direct Text Response:", response.content);
    }

  } catch (err: any) {
    console.error("❌ Single Call Failed:", err.message || err);
  }
}

testSingleCall();
