import { SimulationOutput } from "./engine";

export interface MonteCarloConfig {
  numSimulations?: number;  // Default 1000
  targetWealth?: number;    // Optional goal target
  durationYears: number;
  monthlySip: number;
  lumpSum: number;
  meanAnnualReturnPct: number;
  annualVolatilityPct: number;
}

export interface MonteCarloTimelinePoint {
  year: number;
  p10: number; // Worst Case (10th percentile)
  p25: number; // Conservative
  p50: number; // Median Case (50th percentile)
  p75: number; // Optimistic
  p90: number; // Best Case (90th percentile)
}

export interface MonteCarloResult {
  totalSimulations: number;
  durationYears: number;
  medianFinalWealth: number;
  bestCase90th: number;
  worstCase10th: number;
  successProbabilityPct: number; // % of simulations reaching target wealth
  timeline: MonteCarloTimelinePoint[];
  educationalDisclaimer: string;
}

/**
 * Standard Box-Muller transformation for Gaussian random variables
 */
function randomGaussian(mean: number, stdDev: number): number {
  let u1 = Math.random();
  let u2 = Math.random();
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * stdDev;
}

export function runMonteCarloSimulation(config: MonteCarloConfig): MonteCarloResult {
  const numSims = config.numSimulations || 1000;
  const numMonths = config.durationYears * 12;
  const meanMonthly = (config.meanAnnualReturnPct / 100) / 12;
  const volMonthly = (config.annualVolatilityPct / 100) / Math.sqrt(12);

  // Array to store trajectory of each simulation: sims[simIdx][monthIdx]
  const simResults: number[][] = [];
  let successfulSims = 0;

  for (let sim = 0; sim < numSims; sim++) {
    let currentVal = config.lumpSum;
    const trajectory: number[] = [currentVal];

    for (let m = 1; m <= numMonths; m++) {
      // Monthly return modeled via Geometric Brownian Motion
      const r = randomGaussian(meanMonthly, volMonthly);
      currentVal = (currentVal + config.monthlySip) * (1 + r);
      if (currentVal < 0) currentVal = 0;
      trajectory.push(currentVal);
    }

    const finalVal = trajectory[trajectory.length - 1];
    if (config.targetWealth && config.targetWealth > 0) {
      if (finalVal >= config.targetWealth) successfulSims++;
    } else {
      if (finalVal >= (config.lumpSum + config.monthlySip * numMonths)) successfulSims++;
    }

    simResults.push(trajectory);
  }

  // Calculate percentiles year by year
  const timeline: MonteCarloTimelinePoint[] = [];

  for (let yr = 0; yr <= config.durationYears; yr++) {
    const monthIdx = Math.min(yr * 12, numMonths);
    const valuesAtPoint = simResults.map((t) => t[monthIdx]).sort((a, b) => a - b);

    const p10 = valuesAtPoint[Math.floor(numSims * 0.10)];
    const p25 = valuesAtPoint[Math.floor(numSims * 0.25)];
    const p50 = valuesAtPoint[Math.floor(numSims * 0.50)];
    const p75 = valuesAtPoint[Math.floor(numSims * 0.75)];
    const p90 = valuesAtPoint[Math.floor(numSims * 0.90)];

    timeline.push({
      year: yr,
      p10: Math.round(p10),
      p25: Math.round(p25),
      p50: Math.round(p50),
      p75: Math.round(p75),
      p90: Math.round(p90)
    });
  }

  const finalValues = simResults.map((t) => t[numMonths]).sort((a, b) => a - b);
  const medianFinalWealth = Math.round(finalValues[Math.floor(numSims * 0.50)]);
  const bestCase90th = Math.round(finalValues[Math.floor(numSims * 0.90)]);
  const worstCase10th = Math.round(finalValues[Math.floor(numSims * 0.10)]);
  const successProbabilityPct = Math.round((successfulSims / numSims) * 100);

  return {
    totalSimulations: numSims,
    durationYears: config.durationYears,
    medianFinalWealth,
    bestCase90th,
    worstCase10th,
    successProbabilityPct,
    timeline,
    educationalDisclaimer: "This Monte Carlo simulation models 1,000+ stochastic market paths using normal return distributions derived from historical mean and variance. It does NOT predict future market performance, but illustrates the statistical range of probability."
  };
}
