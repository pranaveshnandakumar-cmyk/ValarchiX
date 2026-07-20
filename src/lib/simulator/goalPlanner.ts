export interface GoalPlannerConfig {
  goalName: string;
  targetAmountToday: number; // Goal cost in today's rupees
  currentSavings: number;
  monthlyInvestment: number;
  targetYears: number;
  expectedInflationPct: number; // e.g. 6.0
  expectedCagrPct: number;       // e.g. 12.5 (from strategy backtest)
}

export interface GoalPlannerResult {
  goalName: string;
  targetYears: number;
  todayTargetValue: number;
  futureInflationAdjustedTarget: number;
  projectedFutureWealth: number;
  shortfallOrSurplus: number;
  isGoalAchievable: boolean;
  recommendedMonthlySip: number;
  realPurchasingPowerToday: number;
  achievementProbabilityPct: number;
  educationalNote: string;
}

export function calculateGoalPlan(config: GoalPlannerConfig): GoalPlannerResult {
  const yrs = Math.max(1, config.targetYears);
  const infl = config.expectedInflationPct / 100;
  const rMonthly = (config.expectedCagrPct / 100) / 12;
  const totalMonths = yrs * 12;

  // Inflation-adjusted future goal cost
  const futureInflationAdjustedTarget = Math.round(config.targetAmountToday * Math.pow(1 + infl, yrs));

  // Future value of current savings
  const fvSavings = config.currentSavings * Math.pow(1 + config.expectedCagrPct / 100, yrs);

  // Future value of monthly SIP: FV = P * [ ((1 + r)^n - 1) / r ] * (1 + r)
  let fvSip = 0;
  if (rMonthly > 0) {
    fvSip = config.monthlyInvestment * ((Math.pow(1 + rMonthly, totalMonths) - 1) / rMonthly) * (1 + rMonthly);
  } else {
    fvSip = config.monthlyInvestment * totalMonths;
  }

  const projectedFutureWealth = Math.round(fvSavings + fvSip);
  const shortfallOrSurplus = projectedFutureWealth - futureInflationAdjustedTarget;
  const isGoalAchievable = shortfallOrSurplus >= 0;

  // Recommended monthly SIP to meet future goal target from scratch
  const remainingTargetForSip = Math.max(0, futureInflationAdjustedTarget - fvSavings);
  let recommendedMonthlySip = config.monthlyInvestment;
  if (rMonthly > 0 && remainingTargetForSip > 0) {
    recommendedMonthlySip = Math.round(remainingTargetForSip / (((Math.pow(1 + rMonthly, totalMonths) - 1) / rMonthly) * (1 + rMonthly)));
  }

  // Real purchasing power of projected wealth in today's terms
  const realPurchasingPowerToday = Math.round(projectedFutureWealth / Math.pow(1 + infl, yrs));

  // Achievement probability estimate
  let achievementProbabilityPct = Math.min(100, Math.round((projectedFutureWealth / futureInflationAdjustedTarget) * 100));
  achievementProbabilityPct = Math.max(5, achievementProbabilityPct);

  let educationalNote = "";
  if (isGoalAchievable) {
    educationalNote = `At your portfolio CAGR of ${config.expectedCagrPct}%, your projected wealth (₹${(projectedFutureWealth / 100000).toFixed(2)} L) comfortably covers the inflation-adjusted goal target (₹${(futureInflationAdjustedTarget / 100000).toFixed(2)} L).`;
  } else {
    const diffSip = Math.max(0, recommendedMonthlySip - config.monthlyInvestment);
    educationalNote = `Inflation at ${config.expectedInflationPct}% will raise your goal cost from ₹${(config.targetAmountToday / 100000).toFixed(2)} L to ₹${(futureInflationAdjustedTarget / 100000).toFixed(2)} L in ${yrs} years. To bridge the ₹${(Math.abs(shortfallOrSurplus) / 100000).toFixed(2)} L shortfall, consider stepping up monthly SIP by ₹${diffSip.toLocaleString()}/month or extending horizon.`;
  }

  return {
    goalName: config.goalName,
    targetYears: yrs,
    todayTargetValue: config.targetAmountToday,
    futureInflationAdjustedTarget,
    projectedFutureWealth,
    shortfallOrSurplus,
    isGoalAchievable,
    recommendedMonthlySip,
    realPurchasingPowerToday,
    achievementProbabilityPct,
    educationalNote
  };
}
