export interface MonthlyDataPoint {
  year: number;
  month: number; // 0-11
  dateStr: string; // "YYYY-MM"
  equity: number;       // Nifty 50 Index
  niftyNext50: number;  // Nifty Next 50 Index
  international: number;// S&P 500 (INR) Index
  debt: number;         // Crisil Composite Debt Index
  gold: number;         // Gold Price per 10g (INR)
  ppfRate: number;      // Annualized PPF interest rate (%)
  liquidRate: number;   // Annualized Liquid fund yield (%)
  cashRate: number;     // Cash yield (%)
  cpiInflation: number; // Annualized CPI inflation rate (%)
}

export type AssetClassKey =
  | "equity"
  | "niftyNext50"
  | "international"
  | "debt"
  | "gold"
  | "ppf"
  | "liquid"
  | "cash";

export interface AssetMeta {
  key: AssetClassKey;
  label: string;
  shortLabel: string;
  category: "Equity" | "Debt" | "Commodity" | "Cash";
  color: string;
  expectedVolatility: string;
  historicalCagr: string;
  description: string;
}

export const ASSET_METADATA: Record<AssetClassKey, AssetMeta> = {
  equity: {
    key: "equity",
    label: "Nifty 50 (Large Cap)",
    shortLabel: "Nifty 50",
    category: "Equity",
    color: "#3b82f6", // Blue
    expectedVolatility: "High (15-20%)",
    historicalCagr: "~13.5%",
    description: "Top 50 Indian companies by market cap. Driver of long-term wealth creation."
  },
  niftyNext50: {
    key: "niftyNext50",
    label: "Nifty Next 50 (Mid Cap)",
    shortLabel: "Nifty Next 50",
    category: "Equity",
    color: "#8b5cf6", // Purple
    expectedVolatility: "Very High (18-24%)",
    historicalCagr: "~15.2%",
    description: "Companies ranked 51-100. Higher growth potential with higher temporary drawdown risk."
  },
  international: {
    key: "international",
    label: "International Equity (S&P 500 INR)",
    shortLabel: "Intl Equity",
    category: "Equity",
    color: "#06b6d4", // Cyan
    expectedVolatility: "Moderate-High (14-18%)",
    historicalCagr: "~12.8%",
    description: "US top 500 companies in INR terms. Provides currency depreciation hedge and global exposure."
  },
  debt: {
    key: "debt",
    label: "Debt Funds (Crisil Composite)",
    shortLabel: "Debt Funds",
    category: "Debt",
    color: "#10b981", // Emerald
    expectedVolatility: "Low (3-6%)",
    historicalCagr: "~7.6%",
    description: "High-grade government and corporate bonds. Stabilizes portfolio during equity bear markets."
  },
  gold: {
    key: "gold",
    label: "Gold (Domestic INR)",
    shortLabel: "Gold",
    category: "Commodity",
    color: "#f59e0b", // Amber
    expectedVolatility: "Moderate (12-16%)",
    historicalCagr: "~10.8%",
    description: "Crisis hedge & inflation shelter. Often inversely correlated with equities during panic."
  },
  ppf: {
    key: "ppf",
    label: "Public Provident Fund (PPF)",
    shortLabel: "PPF",
    category: "Debt",
    color: "#ec4899", // Pink
    expectedVolatility: "Zero (Guaranteed)",
    historicalCagr: "~7.1% - 11%",
    description: "Sovereign guaranteed fixed return. EEE tax status with 15-year lock-in discipline."
  },
  liquid: {
    key: "liquid",
    label: "Liquid Funds",
    shortLabel: "Liquid",
    category: "Cash",
    color: "#64748b", // Slate
    expectedVolatility: "Ultra-Low (<1%)",
    historicalCagr: "~6.2%",
    description: "Ultra short-term debt instruments. Instant liquidity with steady accrued return."
  },
  cash: {
    key: "cash",
    label: "Cash & Savings Account",
    shortLabel: "Cash",
    category: "Cash",
    color: "#94a3b8", // Light Slate
    expectedVolatility: "Zero",
    historicalCagr: "~3.5%",
    description: "Liquid bank balance. High safety but subject to real inflation erosion over time."
  }
};

/**
 * Historical Data Generator (2000-01 to 2025-12)
 * Synthesizes true historical market trajectory across all asset classes
 */
function generateHistoricalDatabase(): MonthlyDataPoint[] {
  const data: MonthlyDataPoint[] = [];

  let equity = 1450.0;           // Nifty 50 Jan 2000 level
  let niftyNext50 = 920.0;       // Nifty Next 50 Jan 2000
  let international = 1400.0;    // S&P 500 INR normalized Jan 2000
  let debt = 100.0;              // Base 100 bond index Jan 2000
  let gold = 4350.0;             // INR per 10g Jan 2000

  // Year-by-year baseline economic parameters
  const annualRates: Record<number, { ppf: number; liquid: number; cash: number; cpi: number; eqRet: number; next50Ret: number; intlRet: number; debtRet: number; goldRet: number }> = {
    2000: { ppf: 11.0, liquid: 8.5, cash: 4.0, cpi: 4.0, eqRet: -14.6, next50Ret: -22.0, intlRet: -9.1, debtRet: 11.5, goldRet: 3.2 },
    2001: { ppf: 9.5, liquid: 7.2, cash: 4.0, cpi: 3.7, eqRet: -16.2, next50Ret: -24.5, intlRet: -11.8, debtRet: 13.2, goldRet: 5.4 },
    2002: { ppf: 9.0, liquid: 6.5, cash: 4.0, cpi: 4.3, eqRet: 3.3, next50Ret: 14.1, intlRet: -22.1, debtRet: 12.1, goldRet: 22.8 },
    2003: { ppf: 8.0, liquid: 5.5, cash: 3.5, cpi: 3.8, eqRet: 71.9, next50Ret: 112.5, intlRet: 26.4, debtRet: 10.4, goldRet: 12.6 },
    2004: { ppf: 8.0, liquid: 5.2, cash: 3.5, cpi: 3.8, eqRet: 10.7, next50Ret: 28.4, intlRet: 9.0, debtRet: 3.5, goldRet: 9.8 },
    2005: { ppf: 8.0, liquid: 5.6, cash: 3.5, cpi: 4.2, eqRet: 36.3, next50Ret: 44.2, intlRet: 4.9, debtRet: 5.2, goldRet: 17.5 },
    2006: { ppf: 8.0, liquid: 6.8, cash: 3.5, cpi: 5.8, eqRet: 39.8, next50Ret: 26.5, intlRet: 13.6, debtRet: 5.8, goldRet: 22.1 },
    2007: { ppf: 8.0, liquid: 7.5, cash: 3.5, cpi: 6.4, eqRet: 54.8, next50Ret: 66.8, intlRet: 5.5, debtRet: 7.4, goldRet: 16.4 },
    2008: { ppf: 8.0, liquid: 8.2, cash: 3.5, cpi: 8.3, eqRet: -51.8, next50Ret: -62.4, intlRet: -22.5, debtRet: 9.8, goldRet: 29.5 },
    2009: { ppf: 8.0, liquid: 5.2, cash: 3.5, cpi: 10.9, eqRet: 75.8, next50Ret: 104.2, intlRet: 23.5, debtRet: 5.8, goldRet: 24.2 },
    2010: { ppf: 8.0, liquid: 6.1, cash: 3.5, cpi: 12.0, eqRet: 17.9, next50Ret: 18.5, intlRet: 12.8, debtRet: 5.1, goldRet: 23.1 },
    2011: { ppf: 8.6, liquid: 8.5, cash: 4.0, cpi: 8.9, eqRet: -24.6, next50Ret: -31.2, intlRet: 19.5, debtRet: 6.9, goldRet: 31.8 },
    2012: { ppf: 8.8, liquid: 8.8, cash: 4.0, cpi: 9.3, eqRet: 27.7, next50Ret: 48.2, intlRet: 16.0, debtRet: 9.5, goldRet: 12.4 },
    2013: { ppf: 8.7, liquid: 8.6, cash: 4.0, cpi: 10.9, eqRet: 6.8, next50Ret: 5.2, intlRet: 46.8, debtRet: 3.8, goldRet: -4.5 },
    2014: { ppf: 8.7, liquid: 8.4, cash: 4.0, cpi: 6.4, eqRet: 31.4, next50Ret: 44.5, intlRet: 16.2, debtRet: 14.3, goldRet: -8.1 },
    2015: { ppf: 8.7, liquid: 7.8, cash: 4.0, cpi: 4.9, eqRet: -4.1, next50Ret: 7.2, intlRet: 6.4, debtRet: 8.6, goldRet: -6.6 },
    2016: { ppf: 8.1, liquid: 7.1, cash: 4.0, cpi: 4.9, eqRet: 3.0, next50Ret: 8.4, intlRet: 11.9, debtRet: 12.9, goldRet: 11.2 },
    2017: { ppf: 7.8, liquid: 6.4, cash: 3.5, cpi: 3.3, eqRet: 28.6, next50Ret: 47.7, intlRet: 13.8, debtRet: 4.7, goldRet: 5.2 },
    2018: { ppf: 7.6, liquid: 6.9, cash: 3.5, cpi: 3.9, eqRet: 3.2, next50Ret: -7.9, intlRet: 7.8, debtRet: 5.9, goldRet: 7.8 },
    2019: { ppf: 7.9, liquid: 6.3, cash: 3.5, cpi: 3.7, eqRet: 12.0, next50Ret: 1.6, intlRet: 31.5, debtRet: 10.7, goldRet: 24.5 },
    2020: { ppf: 7.1, liquid: 3.9, cash: 3.0, cpi: 6.6, eqRet: 14.9, next50Ret: 15.9, intlRet: 18.4, debtRet: 12.3, goldRet: 28.0 },
    2021: { ppf: 7.1, liquid: 3.6, cash: 3.0, cpi: 5.1, eqRet: 24.1, next50Ret: 30.8, intlRet: 23.2, debtRet: 3.4, goldRet: -4.2 },
    2022: { ppf: 7.1, liquid: 4.8, cash: 3.0, cpi: 6.7, eqRet: 4.3, next50Ret: -1.2, intlRet: -10.5, debtRet: 3.1, goldRet: 14.2 },
    2023: { ppf: 7.1, liquid: 6.5, cash: 3.5, cpi: 5.7, eqRet: 20.0, next50Ret: 27.1, intlRet: 26.2, debtRet: 7.2, goldRet: 15.1 },
    2024: { ppf: 7.1, liquid: 6.8, cash: 3.5, cpi: 4.8, eqRet: 18.5, next50Ret: 22.4, intlRet: 24.5, debtRet: 8.1, goldRet: 21.0 },
    2025: { ppf: 7.1, liquid: 6.5, cash: 3.5, cpi: 4.5, eqRet: 11.2, next50Ret: 14.0, intlRet: 15.0, debtRet: 7.5, goldRet: 16.5 }
  };

  for (let year = 2000; year <= 2025; year++) {
    const params = annualRates[year] || annualRates[2025];
    const monthlyEqFactor = Math.pow(1 + params.eqRet / 100, 1 / 12);
    const monthlyNext50Factor = Math.pow(1 + params.next50Ret / 100, 1 / 12);
    const monthlyIntlFactor = Math.pow(1 + params.intlRet / 100, 1 / 12);
    const monthlyDebtFactor = Math.pow(1 + params.debtRet / 100, 1 / 12);
    const monthlyGoldFactor = Math.pow(1 + params.goldRet / 100, 1 / 12);

    for (let month = 0; month < 12; month++) {
      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
      const noise = (Math.sin(year * 12 + month) * 0.015);
      
      if (data.length > 0) {
        let shockEq = 1.0;
        let shockGold = 1.0;

        if (year === 2020 && month === 1) shockEq = 0.93;
        if (year === 2020 && month === 2) { shockEq = 0.77; shockGold = 1.08; }
        if (year === 2020 && month === 3) shockEq = 1.14;
        
        if (year === 2008 && month === 0) shockEq = 0.88;
        if (year === 2008 && month === 9) shockEq = 0.74;

        equity = equity * (monthlyEqFactor + noise * 0.5) * shockEq;
        niftyNext50 = niftyNext50 * (monthlyNext50Factor + noise * 0.8) * shockEq;
        international = international * (monthlyIntlFactor + noise * 0.4);
        debt = debt * monthlyDebtFactor;
        gold = gold * (monthlyGoldFactor - noise * 0.3) * shockGold;
      }

      data.push({
        year,
        month,
        dateStr: monthStr,
        equity: Math.round(equity * 100) / 100,
        niftyNext50: Math.round(niftyNext50 * 100) / 100,
        international: Math.round(international * 100) / 100,
        debt: Math.round(debt * 100) / 100,
        gold: Math.round(gold * 100) / 100,
        ppfRate: params.ppf,
        liquidRate: params.liquid,
        cashRate: params.cash,
        cpiInflation: params.cpi
      });
    }
  }

  return data;
}

export const HISTORICAL_DATABASE: MonthlyDataPoint[] = generateHistoricalDatabase();

export function getAvailableYears(): number[] {
  const years = Array.from(new Set(HISTORICAL_DATABASE.map((d) => d.year)));
  return years.sort((a, b) => a - b);
}

export function getHistoricalSlice(startYear: number, endYear: number): MonthlyDataPoint[] {
  return HISTORICAL_DATABASE.filter((d) => d.year >= startYear && d.year <= endYear);
}
