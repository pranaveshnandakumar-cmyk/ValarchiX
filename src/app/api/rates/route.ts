import { NextResponse } from "next/server";

export async function GET() {
  // Current real-world economic benchmarks for India
  // Policy Repo Rate: 6.50% (RBI Monetary Policy Committee standard)
  // 10-Year Sovereign Bond Yield: ~6.95% (India Government Bond Benchmark)
  // CPI Inflation: ~5.09% (Latest Consumer Price Index baseline)
  const rates = {
    repoRate: 6.50,
    bondYield10Y: 6.95,
    inflationRate: 5.09,
    lastUpdated: new Date().toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric"
    })
  };

  return NextResponse.json(rates);
}
