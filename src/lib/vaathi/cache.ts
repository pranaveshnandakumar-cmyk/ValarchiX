/**
 * Valarchi Vaathi — Semantic Response Cache
 * High-performance in-memory cache for static financial concepts and FAQs.
 * Yields 0ms latency and 0 LLM token consumption for frequent educational questions.
 */

interface CacheEntry {
  answer: string;
  source?: string;
  toolsUsed?: string[];
}

const FAQ_CACHE = new Map<string, CacheEntry>();

// Populate static FAQs (0 LLM Tokens Spent!)
const STATIC_FAQS: Array<{ keywords: string[]; answer: string; source?: string }> = [
  {
    keywords: ["what is nav", "definition of nav", "net asset value"],
    answer: `**NAV (Net Asset Value)** represents the per-unit market price of a Mutual Fund scheme.

### How it works:
$$\\text{NAV} = \\frac{\\text{Total Fund Assets} - \\text{Total Fund Liabilities}}{\\text{Total Number of Outstanding Units}}$$

- **Example**: If a mutual fund holds ₹100 Crores in stocks and has 1 Crore units issued, its NAV is **₹100/unit**.
- **Key Insight**: A lower NAV does NOT mean a fund is cheap or better than a fund with a higher NAV. What matters is the **percentage growth (CAGR)** of the underlying portfolio.

📚 *Source: [ValarchiX Mutual Fund Analyzer](/mutual-funds)*`
  },
  {
    keywords: ["what is sip", "definition of sip", "how sip works"],
    answer: `**SIP (Systematic Investment Plan)** is a disciplined method of investing a fixed amount of money in mutual funds at regular intervals (monthly/quarterly).

### Key Benefits:
1. **Rupee-Cost Averaging**: You automatically buy more units when prices are low and fewer units when prices are high.
2. **Power of Compounding**: Small regular contributions grow exponentially over 10-20 years.
3. **Financial Discipline**: Automates savings directly from your bank account.

📚 *Calculate your wealth growth: [ValarchiX SIP Simulator](/sip)*`
  },
  {
    keywords: ["rule of 72", "what is rule of 72"],
    answer: `The **Rule of 72** is a quick mental shortcut to estimate how many years it takes for your money to double at a given annual return.

$$\\text{Years to Double} \\approx \\frac{72}{\\text{Annual Rate of Return (\\%)}}$$

### Examples:
- At **12% Return** (Mutual Funds): $72 \\div 12 = \\mathbf{6 \\text{ Years to Double}}$
- At **6% Return** (Fixed Deposit): $72 \\div 6 = \\mathbf{12 \\text{ Years to Double}}$

📚 *Explore compounding year-by-year: [ValarchiX Compound Interest Calculator](/compound-interest)*`
  },
  {
    keywords: ["what is expense ratio", "expense ratio definition"],
    answer: `**Expense Ratio** is the annual operational fee charged by a mutual fund AMC to manage your portfolio (expressed as a percentage of total AUM).

### Direct vs Regular Plans:
- **Direct Plans**: Lower expense ratio (e.g. 0.5%) because there are no broker commissions.
- **Regular Plans**: Higher expense ratio (e.g. 1.5%) because commissions are paid to distributors.
- **Impact**: A 1% difference in expense ratio can save you **Lakhs of Rupees** over 20 years!

📚 *Compare fund expense ratios: [ValarchiX Mutual Fund Screener](/mutual-funds)*`
  }
];

// Initialize Cache Map
for (const faq of STATIC_FAQS) {
  for (const kw of faq.keywords) {
    FAQ_CACHE.set(kw, { answer: faq.answer, source: faq.source });
  }
}

export function checkSemanticCache(userQuery: string): CacheEntry | null {
  const normalized = userQuery.toLowerCase().trim().replace(/[^\w\s]/gi, "");

  for (const [kw, entry] of FAQ_CACHE.entries()) {
    if (normalized === kw || normalized.includes(kw)) {
      return entry;
    }
  }

  return null;
}
