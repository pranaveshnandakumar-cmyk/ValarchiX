import { SimulationOutput } from "./engine";

export function generateChartInsight(chartType: "growth" | "drawdown" | "annual" | "allocation" | "rolling", sim: SimulationOutput): { title: string; content: string; keyTakeaway: string } {
  switch (chartType) {
    case "growth":
      return {
        title: "Portfolio Growth & Compounding Dynamics",
        content: `Your simulated portfolio grew from total invested capital of ₹${(sim.totalInvested / 100000).toFixed(2)} Lakhs to a final value of ₹${(sim.finalValue / 100000).toFixed(2)} Lakhs, delivering a CAGR of ${sim.cagrPct}% and XIRR of ${sim.xirrPct}%. Notice how compounding starts slow in early years and accelerates exponentially in later years.`,
        keyTakeaway: "Patience and staying invested through cycles are the primary catalysts for exponential compounding."
      };

    case "drawdown":
      return {
        title: "Understanding Drawdown & Emotional Resilience",
        content: `The worst historical drop from peak value for this portfolio was -${sim.maxDrawdownPct}%, taking ${sim.maxRecoveryMonths} months to regain previous highs. Notice how debt and gold allocations dampened market drop severity compared to a 100% equity index drawdown (~59% in 2008).`,
        keyTakeaway: "Drawdown resilience prevents panic selling at market bottoms — the single largest source of investor capital loss."
      };

    case "annual":
      return {
        title: "Annual Returns & Sequence of Returns Risk",
        content: `Your portfolio experienced its best year in ${sim.bestYear.year} (+${sim.bestYear.returnPct}%) and its worst year in ${sim.worstYear.year} (${sim.worstYear.returnPct}%). Notice how positive and negative years do not occur evenly; annual returns cluster in cycles.`,
        keyTakeaway: "Short-term market returns are volatile, but multi-year SIP discipline smooths out timing risk."
      };

    case "allocation":
      return {
        title: "Asset Allocation & Correlation",
        content: `Your strategy distributes capital across equity, debt, gold, and cash assets. Historically, equities provide long-term wealth growth, debt provides stability and liquidity, while gold acts as a crisis shelter during equity panics.`,
        keyTakeaway: "Combining non-correlated assets builds a smoother return path without sacrificing long-term inflation beating potential."
      };

    case "rolling":
      return {
        title: "Rolling Returns — The True Measure of Risk",
        content: `Across 3-year rolling periods, this portfolio generated an average CAGR of ${sim.rollingReturns.threeYear.average}%, with a minimum of ${sim.rollingReturns.threeYear.min}% and maximum of ${sim.rollingReturns.threeYear.max}%. Across 5-year rolling windows, positive returns occurred ${sim.rollingReturns.fiveYear.positiveRatioPct}% of the time.`,
        keyTakeaway: "Holding a diversified portfolio for 5+ years drastically reduces the probability of negative returns."
      };
  }
}

export function generateComparisonInsight(simA: SimulationOutput, simB: SimulationOutput, labelA: string = "Portfolio A", labelB: string = "Portfolio B"): string {
  const diffCagr = Math.round((simA.cagrPct - simB.cagrPct) * 100) / 100;
  const diffDrawdown = Math.round((simA.maxDrawdownPct - simB.maxDrawdownPct) * 100) / 100;

  if (diffCagr > 0 && diffDrawdown > 0) {
    return `${labelA} generated higher CAGR (+${diffCagr}% higher than ${labelB}), but experienced significantly larger temporary drawdowns (-${simA.maxDrawdownPct}% vs -${simB.maxDrawdownPct}%). ${labelB} provided a smoother ride with lower peak-to-trough drop.`;
  } else if (diffCagr <= 0 && diffDrawdown <= 0) {
    return `${labelB} generated higher CAGR (+${Math.abs(diffCagr)}% higher than ${labelA}) while maintaining lower maximum drawdowns (-${simB.maxDrawdownPct}% vs -${simA.maxDrawdownPct}%), demonstrating superior risk-adjusted return efficiency during this backtest period.`;
  } else {
    return `Both portfolios show distinct risk-return profiles: ${labelA} delivered a CAGR of ${simA.cagrPct}% with -${simA.maxDrawdownPct}% drawdown, whereas ${labelB} delivered ${simB.cagrPct}% CAGR with -${simB.maxDrawdownPct}% drawdown. Choose the allocation that matches your emotional risk tolerance.`;
  }
}
