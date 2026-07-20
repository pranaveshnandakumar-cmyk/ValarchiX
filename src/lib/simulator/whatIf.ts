import { AllocationConfig, SimulationConfig, runPortfolioSimulation, SimulationOutput } from "./engine";

export interface WhatIfOptions {
  annualStepUpPct: number;    // e.g. 0, 5, 10, 15%
  pauseSipMonths: number;     // e.g. 0, 6, 12, 24
  bonusYearly: number;        // e.g. 0, 25000, 50000, 100000
  rebalanceAnnual: boolean;   // true / false
}

export interface WhatIfComparison {
  baseline: SimulationOutput;
  modified: SimulationOutput;
  diffWealth: number;
  diffWealthPct: number;
  diffInvested: number;
  diffCagrPct: number;
  insight: string;
}

export function evaluateWhatIfScenario(
  baseConfig: SimulationConfig,
  whatIfOpts: WhatIfOptions
): WhatIfComparison {
  const baseline = runPortfolioSimulation({ ...baseConfig, annualStepUpPct: 0, pauseSipMonths: 0, bonusYearly: 0, rebalanceAnnual: false });

  const modifiedConfig: SimulationConfig = {
    ...baseConfig,
    annualStepUpPct: whatIfOpts.annualStepUpPct,
    pauseSipMonths: whatIfOpts.pauseSipMonths,
    bonusYearly: whatIfOpts.bonusYearly,
    rebalanceAnnual: whatIfOpts.rebalanceAnnual
  };

  const modified = runPortfolioSimulation(modifiedConfig);

  const diffWealth = modified.finalValue - baseline.finalValue;
  const diffWealthPct = baseline.finalValue > 0 ? (diffWealth / baseline.finalValue) * 100 : 0;
  const diffInvested = modified.totalInvested - baseline.totalInvested;
  const diffCagrPct = Math.round((modified.cagrPct - baseline.cagrPct) * 100) / 100;

  let insight = "";
  if (whatIfOpts.annualStepUpPct > 0 && whatIfOpts.pauseSipMonths === 0) {
    insight = `A ${whatIfOpts.annualStepUpPct}% annual step-up increased your final wealth by ₹${(diffWealth / 100000).toFixed(2)} Lakhs (+${diffWealthPct.toFixed(1)}%), while investing only ₹${(diffInvested / 100000).toFixed(2)} Lakhs in incremental capital!`;
  } else if (whatIfOpts.pauseSipMonths > 0) {
    insight = `Pausing SIPs for ${whatIfOpts.pauseSipMonths} months reduced final wealth accumulation by ₹${Math.abs(diffWealth / 100000).toFixed(2)} Lakhs due to missing discount buying during market drawdowns.`;
  } else if (whatIfOpts.bonusYearly > 0) {
    insight = `Adding ₹${whatIfOpts.bonusYearly.toLocaleString()} yearly bonus top-ups boosted long-term wealth by ₹${(diffWealth / 100000).toFixed(2)} Lakhs through disciplined re-investment.`;
  } else if (whatIfOpts.rebalanceAnnual) {
    insight = `Annual rebalancing stabilized volatility and adjusted risk exposure, altering final CAGR by ${diffCagrPct >= 0 ? "+" : ""}${diffCagrPct}%.`;
  } else {
    insight = "Select a what-if parameter above to see real-time wealth impact.";
  }

  return {
    baseline,
    modified,
    diffWealth: Math.round(diffWealth),
    diffWealthPct: Math.round(diffWealthPct * 100) / 100,
    diffInvested: Math.round(diffInvested),
    diffCagrPct,
    insight
  };
}
