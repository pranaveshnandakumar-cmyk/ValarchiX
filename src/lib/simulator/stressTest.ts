import { AllocationConfig, runPortfolioSimulation } from "./engine";

export interface StressScenarioResult {
  id: string;
  name: string;
  periodLabel: string;
  startYear: number;
  endYear: number;
  marketDropPct: number;
  portfolioDropPct: number;
  troughPortfolioValue: number;
  recoveryMonths: number;
  finalPortfolioValue: number;
  cagrDuringPeriodPct: number;
  emotionalContext: string;
  keyTakeaway: string;
}

export const CRISIS_SCENARIOS = [
  {
    id: "covid2020",
    name: "2020 COVID Crash",
    periodLabel: "Jan 2020 – Dec 2020",
    startYear: 2020,
    endYear: 2020,
    marketDropPct: 38.4,
    emotionalContext: "Markets suffered the fastest drop in history due to global pandemic lockdowns. Panic selling reached peak levels in March 2020.",
    keyTakeaway: "Diversification with Gold (+28%) and Debt stabilized portfolios. Equities rebounded sharply by Dec 2020."
  },
  {
    id: "gfc2008",
    name: "2008 Global Financial Crisis",
    periodLabel: "Jan 2008 – Dec 2009",
    startYear: 2008,
    endYear: 2009,
    marketDropPct: 59.8,
    emotionalContext: "Subprime collapse triggered worldwide banking panic. Equities lost over half their value over 12 painful months.",
    keyTakeaway: "Staying invested and continuing monthly SIPs bought equities at steep historical discounts, creating massive wealth during the 2009-2010 recovery."
  },
  {
    id: "dotcom2000",
    name: "2000 Dot-Com Crash",
    periodLabel: "Jan 2000 – Dec 2003",
    startYear: 2000,
    endYear: 2003,
    marketDropPct: 52.0,
    emotionalContext: "Speculative tech valuation bubble burst globally. Indian markets took 3.5 years to regain previous peak levels.",
    keyTakeaway: "Debt and PPF (then offering 9-11% guaranteed returns) cushioned equity losses until the secular bull run of 2003 began."
  },
  {
    id: "inflation2011",
    name: "2011–2013 High Inflation & Rate Spike",
    periodLabel: "Jan 2011 – Dec 2013",
    startYear: 2011,
    endYear: 2013,
    marketDropPct: 24.6,
    emotionalContext: "CPI inflation breached 10-12% while currency depreciated sharply. Real returns on cash were negative.",
    keyTakeaway: "Gold surged +31.8% in 2011, acting as an extraordinary hedge when both stock and bond returns stalled."
  },
  {
    id: "ratehike2022",
    name: "2022 Rate Hikes & Tech Bear Market",
    periodLabel: "Jan 2022 – Dec 2022",
    startYear: 2022,
    endYear: 2022,
    marketDropPct: 14.5,
    emotionalContext: "Global central banks aggressively hiked interest rates to combat post-pandemic inflation, sparking global tech selloffs.",
    keyTakeaway: "Indian domestic resilience outpaced global markets. Gold (+14.2%) protected capital against INR currency depreciation."
  }
];

export function runStressTestScenarios(
  allocation: AllocationConfig,
  monthlySip: number = 10000,
  lumpSum: number = 100000
): StressScenarioResult[] {
  return CRISIS_SCENARIOS.map((crisis) => {
    const sim = runPortfolioSimulation({
      monthlySip,
      lumpSum,
      startYear: crisis.startYear,
      endYear: crisis.endYear,
      allocation,
      annualStepUpPct: 0
    });

    const minPoint = sim.timeline.reduce((min, p) => (p.portfolioValue < min.portfolioValue ? p : min), sim.timeline[0]);

    return {
      id: crisis.id,
      name: crisis.name,
      periodLabel: crisis.periodLabel,
      startYear: crisis.startYear,
      endYear: crisis.endYear,
      marketDropPct: crisis.marketDropPct,
      portfolioDropPct: sim.maxDrawdownPct,
      troughPortfolioValue: minPoint.portfolioValue,
      recoveryMonths: sim.maxRecoveryMonths,
      finalPortfolioValue: sim.finalValue,
      cagrDuringPeriodPct: sim.cagrPct,
      emotionalContext: `During ${crisis.name}, your portfolio maximum decline was -${sim.maxDrawdownPct}% compared to pure market crash of -${crisis.marketDropPct}%. ${crisis.emotionalContext}`,
      keyTakeaway: crisis.keyTakeaway
    };
  });
}
