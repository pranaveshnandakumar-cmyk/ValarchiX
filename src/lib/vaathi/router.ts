/**
 * Valarchi Vaathi — Intent Router & Pre-LLM Calculation Parameter Extractor
 * Pre-classifies intent to select the optimal tool payload or zero-token shortcut.
 */

export type UserIntent = "CALCULATOR" | "CONCEPT_EXPLANATION" | "GENERAL_FINANCE";

export interface IntentRoute {
  intent: UserIntent;
  suggestedTools: string[];
}

export function classifyIntent(query: string): IntentRoute {
  const lower = query.toLowerCase();

  // Numerical Calculation Intent
  if (/\b(\d+)\b/.test(lower) && /\b(sip|lumpsum|invest|retire|tax|emi|goal|lakhs?|crores?)\b/.test(lower)) {
    return {
      intent: "CALCULATOR",
      suggestedTools: ["sipCalculator", "goalPlanner", "retirementCalc", "taxCompare", "lumpsumCalculator"]
    };
  }

  // Educational Concept Intent
  if (/\b(what|explain|how|why|difference|versus|vs|compare)\b/.test(lower)) {
    return {
      intent: "CONCEPT_EXPLANATION",
      suggestedTools: ["fdVsMfCompare", "compoundInterestCalc"]
    };
  }

  return {
    intent: "GENERAL_FINANCE",
    suggestedTools: []
  };
}
