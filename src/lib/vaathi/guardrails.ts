/**
 * Valarchi Vaathi — Pre-LLM Guardrail Engine
 * Executes BEFORE any LLM call to provide INSTANT (0-token) educational answers or scope refusals.
 */

export interface GuardrailResult {
  intercepted: boolean;
  content?: string;
  category?: "stock_tip" | "crypto_trading" | "non_finance" | "greeting" | "help";
}

const STOCK_TIP_REGEX = /\b(which|what|best|should i|recommend|buy|sell|target|price)\b.*\b(stock|shares?|equity|nifty|sensex|ipo|tata|reliance|infosys|hdfc)\b/i;
const CRYPTO_FO_REGEX = /\b(crypto|bitcoin|btc|ethereum|eth|futures|options|f&o|intraday|forex|binary|trading)\b/i;
const GREETING_REGEX = /^(hi+|hello+|hey+|vanakkam+|good (morning|afternoon|evening)|namaste)\b/i;

export function evaluatePreLLMGuardrail(userQuery: string): GuardrailResult {
  const query = userQuery.trim();

  // 1. Instant Stock Tip / Individual Equity Refusal (0 Tokens Spent)
  if (STOCK_TIP_REGEX.test(query)) {
    return {
      intercepted: true,
      category: "stock_tip",
      content: `I cannot predict specific stock prices, give individual equity buy/sell tips, or recommend specific company shares.

However, I can teach you:
- 📈 **How to evaluate mutual funds & index funds** (CAGR, Expense Ratio, Rolling Returns)
- 📊 **Asset Allocation & Diversification** (100-minus-age rule, Risk management)
- 🏛️ **Tax-efficient investing** (LTCG vs STCG, Sec 80C, Tax Slabs)
- 🎯 **Goal-based planning** (SIP calculation, Inflation adjustment)`
    };
  }

  // 2. Instant Crypto / Speculative Trading Refusal (0 Tokens Spent)
  if (CRYPTO_FO_REGEX.test(query)) {
    return {
      intercepted: true,
      category: "crypto_trading",
      content: `ValarchiX does not support cryptocurrency, F&O (Futures & Options), or intraday speculative trading.

I can help you build long-term wealth with:
- 💡 **Mutual Funds & SIPs**
- 🛡️ **Provident Funds (PPF, EPF, NPS)**
- 🏖️ **Retirement & Emergency Safety Nets**`
    };
  }

  // 3. Instant Friendly Greeting (0 Tokens Spent)
  if (GREETING_REGEX.test(query) && query.length < 30) {
    return {
      intercepted: true,
      category: "greeting",
      content: `Vanakkam! 👋 I am **Valarchi Vaathi**, your personal finance educator on ValarchiX.

Ask me anything about:
- 📈 **SIP & Compounding Calculations**
- 🏛️ **Old vs New Tax Regime Comparison**
- 🏖️ **Retirement & FIRE Corpus Planning**
- 🛡️ **Govt Schemes (PPF, EPF, NPS, SSY, HRA)**`
    };
  }

  return { intercepted: false };
}
