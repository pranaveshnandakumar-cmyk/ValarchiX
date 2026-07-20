import { AllocationConfig, SimulationOutput } from "./engine";

export interface HealthMetricDetail {
  id: string;
  name: string;
  score: number; // 0-100
  rating: "Excellent" | "Good" | "Moderate" | "Needs Attention";
  weight: number;
  explanation: string;
  recommendation: string;
}

export interface PortfolioHealthReport {
  overallScore: number;
  grade: "S" | "A+" | "A" | "B" | "C";
  summaryText: string;
  metrics: HealthMetricDetail[];
}

export function calculatePortfolioHealthScore(
  allocation: AllocationConfig,
  simOutput: SimulationOutput
): PortfolioHealthReport {
  const totalWeight = Object.values(allocation).reduce((a, b) => a + b, 0);
  const getPct = (key: keyof AllocationConfig) => (totalWeight > 0 ? (allocation[key] || 0) / totalWeight * 100 : 0);

  const eqPct = getPct("equity") + getPct("niftyNext50") + getPct("international");
  const debtPct = getPct("debt") + getPct("ppf");
  const goldPct = getPct("gold");
  const cashPct = getPct("liquid") + getPct("cash");

  // 1. Diversification Score
  let divScore = 50;
  const activeAssetClasses = [eqPct > 5, debtPct > 5, goldPct > 5, cashPct > 5, getPct("international") > 5].filter(Boolean).length;
  divScore += activeAssetClasses * 10;
  if (eqPct > 85) divScore -= 20; // Concentration risk
  if (debtPct > 85) divScore -= 20;
  divScore = Math.max(10, Math.min(100, divScore));

  // 2. Volatility & Risk Protection
  let volScore = 100 - (simOutput.annualizedVolatilityPct * 3.5);
  volScore = Math.max(15, Math.min(100, volScore));

  // 3. Inflation Protection
  // Equities + Gold hedge inflation
  let inflScore = (eqPct * 0.8) + (goldPct * 0.7) + (debtPct * 0.2);
  inflScore = Math.max(10, Math.min(100, inflScore));

  // 4. Tax Efficiency
  // Equity (12.5% LTCG above 1.25L), PPF (EEE 0% tax), Debt/Liquid (slab tax rate)
  const taxScore = (eqPct * 0.85) + (getPct("ppf") * 1.0) + (goldPct * 0.7) + ((debtPct - getPct("ppf") + cashPct) * 0.4);

  // 5. Liquidity Score
  const liquidPct = cashPct + getPct("debt") * 0.5;
  let liqScore = 50;
  if (liquidPct >= 10 && liquidPct <= 30) liqScore = 95;
  else if (liquidPct > 30) liqScore = 80;
  else liqScore = 40;

  // 6. Emergency Readiness
  const emScore = Math.min(100, Math.max(20, (cashPct * 3) + (debtPct * 0.8)));

  // 7. Retirement Readiness (Compounding potential)
  let retScore = (simOutput.cagrPct / 14) * 100;
  retScore = Math.max(20, Math.min(100, retScore));

  // 8. Drawdown Resilience
  let ddScore = 100 - (simOutput.maxDrawdownPct * 1.3);
  ddScore = Math.max(10, Math.min(100, ddScore));

  const metrics: HealthMetricDetail[] = [
    {
      id: "diversification",
      name: "Asset Diversification",
      score: Math.round(divScore),
      rating: divScore >= 80 ? "Excellent" : divScore >= 65 ? "Good" : divScore >= 50 ? "Moderate" : "Needs Attention",
      weight: 15,
      explanation: `Portfolio spans ${activeAssetClasses} distinct asset categories. Current weights: ${Math.round(eqPct)}% Equity, ${Math.round(debtPct)}% Debt/PPF, ${Math.round(goldPct)}% Gold, ${Math.round(cashPct)}% Cash.`,
      recommendation: divScore < 70 ? "Consider spreading capital across non-correlated assets like Gold and Debt to reduce systemic market risk." : "Solid asset blend preventing single-asset class collapse."
    },
    {
      id: "volatility",
      name: "Risk & Volatility Mitigation",
      score: Math.round(volScore),
      rating: volScore >= 80 ? "Excellent" : volScore >= 65 ? "Good" : volScore >= 50 ? "Moderate" : "Needs Attention",
      weight: 15,
      explanation: `Annualized portfolio volatility is ${simOutput.annualizedVolatilityPct}% compared to pure Nifty equity volatility (~18%).`,
      recommendation: volScore < 60 ? "High annual fluctuations detected. Debt or PPF buffers can smooth sequence-of-returns risk." : "Portfolio demonstrates strong volatility control."
    },
    {
      id: "inflation",
      name: "Inflation Protection",
      score: Math.round(inflScore),
      rating: inflScore >= 80 ? "Excellent" : inflScore >= 65 ? "Good" : inflScore >= 50 ? "Moderate" : "Needs Attention",
      weight: 15,
      explanation: `Growth assets (Equity + Gold) comprise ${Math.round(eqPct + goldPct)}% of allocation, providing a strong real purchasing power hedge over CPI inflation (~6%).`,
      recommendation: inflScore < 60 ? "Too high fixed-income allocation risks purchasing power erosion over 10+ year horizons." : "Portfolio rate of return comfortably beats historical inflation."
    },
    {
      id: "drawdown",
      name: "Drawdown Resilience",
      score: Math.round(ddScore),
      rating: ddScore >= 80 ? "Excellent" : ddScore >= 65 ? "Good" : ddScore >= 50 ? "Moderate" : "Needs Attention",
      weight: 15,
      explanation: `Maximum historical drop was -${simOutput.maxDrawdownPct}% with a recovery duration of ${simOutput.maxRecoveryMonths} months.`,
      recommendation: ddScore < 60 ? "Historical drawdowns exceeded 30%. Test your emotional resilience against market panics." : "Drawdowns remained well-managed during market panics."
    },
    {
      id: "tax",
      name: "Tax Efficiency",
      score: Math.round(taxScore),
      rating: taxScore >= 80 ? "Excellent" : taxScore >= 65 ? "Good" : taxScore >= 50 ? "Moderate" : "Needs Attention",
      weight: 10,
      explanation: `Portfolio leverages EEE (PPF) and LTCG equity tax treatment (${Math.round(eqPct + getPct("ppf"))}% combined efficiency).`,
      recommendation: taxScore < 65 ? "Ensure non-PPF fixed income is held in tax-efficient structures." : "High tax-sheltered and capital-gains friendly structure."
    },
    {
      id: "liquidity",
      name: "Liquidity Balance",
      score: Math.round(liqScore),
      rating: liqScore >= 80 ? "Excellent" : liqScore >= 65 ? "Good" : liqScore >= 50 ? "Moderate" : "Needs Attention",
      weight: 10,
      explanation: `Liquid & accessible capital represents ${Math.round(liquidPct)}% of total portfolio value.`,
      recommendation: liqScore < 60 ? "Maintain adequate liquid reserves to avoid premature equity liquidations during market downturns." : "Optimal balance between invested growth capital and liquidity."
    },
    {
      id: "emergency",
      name: "Emergency Readiness",
      score: Math.round(emScore),
      rating: emScore >= 80 ? "Excellent" : emScore >= 65 ? "Good" : emScore >= 50 ? "Moderate" : "Needs Attention",
      weight: 10,
      explanation: `Cash and liquid debt buffer provides ${Math.round(cashPct + debtPct)}% downside protection.`,
      recommendation: emScore < 50 ? "Build a dedicated 6-month emergency fund outside long-term market investments." : "Sufficient liquidity cushion available for unforeseen expenses."
    },
    {
      id: "retirement",
      name: "Retirement Compounding",
      score: Math.round(retScore),
      rating: retScore >= 80 ? "Excellent" : retScore >= 65 ? "Good" : retScore >= 50 ? "Moderate" : "Needs Attention",
      weight: 10,
      explanation: `Backtested strategy generated a CAGR of ${simOutput.cagrPct}% and XIRR of ${simOutput.xirrPct}%.`,
      recommendation: retScore < 65 ? "To accelerate retirement readiness, consider increasing equity or step-up SIP rates." : "Strong long-term compounding capacity."
    }
  ];

  const totalWeightedScore = metrics.reduce((sum, m) => sum + (m.score * m.weight), 0) / 100;
  const overallScore = Math.round(totalWeightedScore);

  let grade: "S" | "A+" | "A" | "B" | "C" = "B";
  if (overallScore >= 90) grade = "S";
  else if (overallScore >= 80) grade = "A+";
  else if (overallScore >= 70) grade = "A";
  else if (overallScore >= 60) grade = "B";
  else grade = "C";

  let summaryText = "";
  if (overallScore >= 85) {
    summaryText = "Exceptionally balanced portfolio strategy! Combines robust growth potential with strong drawdown buffers and inflation hedging.";
  } else if (overallScore >= 70) {
    summaryText = "Well-structured asset allocation. Maintains solid compounding capability while managing downside risk across market cycles.";
  } else {
    summaryText = "Moderate portfolio health. High concentration in either equity volatility or fixed-income inflation drag detected.";
  }

  return {
    overallScore,
    grade,
    summaryText,
    metrics
  };
}
