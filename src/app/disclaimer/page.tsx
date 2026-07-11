"use client";

import React from "react";
import { ShieldCheck, Info, AlertTriangle, Scale, UserCheck } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="space-y-10 py-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="border-b border-border-navy pb-6 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
          <ShieldCheck className="text-emerald w-8 h-8" />
          Legal & Educational Disclaimer
        </h1>
        <p className="text-sm text-muted-grey mt-2">
          Please read this disclosure carefully before using the valarchiX platform.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-6">
        
        {/* Core Philosophy Banner */}
        <div className="p-6 bg-emerald/5 border border-emerald/20 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald font-bold">
            <Info className="w-5 h-5" />
            <span>Core Principle: Education, Not Recommendations</span>
          </div>
          <p className="text-sm text-light-grey leading-relaxed">
            valarchiX is built solely as an interactive simulator to help users understand business economics, tax regimes, compounding mathematics, and mutual fund valuation metrics. 
            <strong> We strictly adhere to our motto: “We don&apos;t tell what to pick, we tell how to pick.”</strong> The platform never issues buy, sell, or hold recommendations for any security or asset class.
          </p>
        </div>

        {/* Major Guardrails Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* No Advisory Services */}
          <div className="p-6 glass-card space-y-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <Scale className="text-emerald w-5 h-5" />
              <h4>No Unregistered Investment Advice</h4>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              valarchiX is not a registered investment advisor with the Securities and Exchange Board of India (SEBI). The metrics, CAGR comparisons, planners, and calculator outputs shown on this site are purely mathematical simulations based on user-supplied inputs and historical feeds. They do not constitute personalized financial planning, taxation advice, or investment recommendations.
            </p>
          </div>

          {/* Seek Professional Help */}
          <div className="p-6 glass-card space-y-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <UserCheck className="text-emerald w-5 h-5" />
              <h4>Consult Certified Professionals</h4>
            </div>
            <p className="text-xs text-muted-grey leading-relaxed">
              Financial decisions involve risks. The planners and estimators provided are designed as learning aids, not guarantees. We highly recommend that you seek the services of a certified financial planner, tax consultant, or SEBI-registered investment advisor before making real-world investments or filing taxes.
            </p>
          </div>
        </div>

        {/* Calculation Risk Warning */}
        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-500 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <span>Mathematical Estimates & Historical Data</span>
          </div>
          <div className="text-xs text-muted-grey space-y-2 leading-relaxed">
            <p>
              • <strong>Historical Performance:</strong> All simulations involving past NAV data or returns are strictly for retrospective analysis. Past performance is not indicative of future returns.
            </p>
            <p>
              • <strong>Assumption Sensitivity:</strong> Calculators on this platform rely on projections (e.g. inflation, step-up rates, market returns). Actual market outcomes may differ dramatically based on economic changes.
            </p>
            <p>
              • <strong>Source Limitations:</strong> While we cache official database NAVs (such as AMFI), data feeds may occasionally experience latency or gaps. Users are advised to cross-verify key metrics with official fund house publications.
            </p>
          </div>
        </div>

        {/* Consent Statement */}
        <div className="text-center text-xs text-muted-grey pt-6">
          By utilizing the calculators, screener tools, and learning materials on valarchiX, you acknowledge and agree that you are solely responsible for your own financial choices and that valarchiX assumes no liability for investment decisions or tax filings made based on this site&apos;s models.
        </div>
      </div>
    </div>
  );
}
