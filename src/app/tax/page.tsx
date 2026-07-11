"use client";

import React, { useState, useMemo } from "react";
import { Calculator, Info, HelpCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function TaxLearningHub() {
  const [grossIncome, setGrossIncome] = useState(1200000);
  
  // Deductions for Old Regime
  const [sec80C, setSec80C] = useState(150000); // Max 1.5L
  const [sec80D, setSec80D] = useState(25000);  // Max 25K/50K
  const [hra, setHra] = useState(50000);
  const [homeLoanInterest, setHomeLoanInterest] = useState(0); // Max 2L under 24b
  const [npsExtra, setNpsExtra] = useState(0); // Max 50K under 80CCD(1B)

  const calculations = useMemo(() => {
    // --- OLD REGIME TAX CALCULATION ---
    const oldStandardDeduction = 50000;
    const totalDeductions = Math.min(150000, sec80C) + 
                            Math.min(50000, sec80D) + 
                            hra + 
                            Math.min(200000, homeLoanInterest) + 
                            Math.min(50000, npsExtra) + 
                            oldStandardDeduction;

    const oldTaxableIncome = Math.max(0, grossIncome - totalDeductions);
    let oldTax = 0;

    // Slabs for Old Regime:
    // Up to 2.5L: Nil
    // 2.5L to 5L: 5%
    // 5L to 10L: 20%
    // Above 10L: 30%
    if (oldTaxableIncome <= 250000) {
      oldTax = 0;
    } else if (oldTaxableIncome <= 500000) {
      oldTax = (oldTaxableIncome - 250000) * 0.05;
    } else if (oldTaxableIncome <= 1000000) {
      oldTax = (250000 * 0.05) + (oldTaxableIncome - 500000) * 0.20;
    } else {
      oldTax = (250000 * 0.05) + (500000 * 0.20) + (oldTaxableIncome - 1000000) * 0.30;
    }

    // 87A Rebate: If taxable income <= 5L, tax is zero
    if (oldTaxableIncome <= 500000) {
      oldTax = 0;
    }

    // Add 4% Cess
    const finalOldTax = oldTax * 1.04;


    // --- NEW REGIME TAX CALCULATION (FY 2025-26 / FY 2026-27 Union Budget 2025 rules) ---
    const newStandardDeduction = 75000;
    const newTaxableIncome = Math.max(0, grossIncome - newStandardDeduction);
    let newTax = 0;

    // Slabs for New Regime (Budget 2025):
    // Up to 4L: Nil
    // 4L to 8L: 5%
    // 8L to 12L: 10%
    // 12L to 16L: 15%
    // 16L to 20L: 20%
    // 20L to 24L: 25%
    // Above 24L: 30%
    if (newTaxableIncome <= 400000) {
      newTax = 0;
    } else if (newTaxableIncome <= 800000) {
      newTax = (newTaxableIncome - 400000) * 0.05;
    } else if (newTaxableIncome <= 1200000) {
      newTax = (400000 * 0.05) + (newTaxableIncome - 800000) * 0.10;
    } else if (newTaxableIncome <= 1600000) {
      newTax = (400000 * 0.05) + (400000 * 0.10) + (newTaxableIncome - 1200000) * 0.15;
    } else if (newTaxableIncome <= 2000000) {
      newTax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (newTaxableIncome - 1600000) * 0.20;
    } else if (newTaxableIncome <= 2400000) {
      newTax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (400000 * 0.20) + (newTaxableIncome - 2000000) * 0.25;
    } else {
      newTax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (400000 * 0.20) + (400000 * 0.25) + (newTaxableIncome - 2400000) * 0.30;
    }

    // 87A Rebate: Under New Regime (Budget 2025), tax is zero if taxable income <= 12L
    if (newTaxableIncome <= 1200000) {
      newTax = 0;
    }

    // Add 4% Cess
    const finalNewTax = newTax * 1.04;

    return {
      oldTaxableIncome,
      totalDeductions,
      oldTaxLiability: Math.round(finalOldTax),
      newTaxableIncome,
      newTaxLiability: Math.round(finalNewTax),
      savings: Math.abs(Math.round(finalOldTax - finalNewTax)),
      preferredRegime: finalOldTax > finalNewTax ? "New Regime" : "Old Regime"
    };
  }, [grossIncome, sec80C, sec80D, hra, homeLoanInterest, npsExtra]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-10 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calculator className="text-emerald" />
            Tax Learning Hub
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Compare Old vs New tax regimes and learn about structural tax harvesting.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-5">
            <h2 className="text-lg font-bold text-white">Tax Calculator Inputs</h2>

            {/* Income Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-grey">Gross Annual Salary / Income</label>
              <input
                type="number"
                value={grossIncome}
                step={25000}
                onChange={(e) => setGrossIncome(Math.max(0, Number(e.target.value)))}
                className="w-full glass-input text-base font-bold text-emerald"
              />
              <span className="text-[10px] text-muted-grey block">
                Includes basic, HRA, special allowances, and other income sources.
              </span>
            </div>

            <div className="border-t border-border-navy/60 pt-4 space-y-4">
              <h3 className="text-sm font-bold text-white">Old Regime Deductions</h3>

              {/* 80C */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-grey">Section 80C (PPF, ELSS, EPF)</span>
                  <span className="text-emerald font-semibold">{formatCurrency(sec80C)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150000}
                  step={5000}
                  value={sec80C}
                  onChange={(e) => setSec80C(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
                <span className="text-[9px] text-muted-grey block">Maximum limit: ₹1,50,000</span>
              </div>

              {/* 80D */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-grey">Section 80D (Health Premium)</span>
                  <span className="text-emerald font-semibold">{formatCurrency(sec80D)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={5000}
                  value={sec80D}
                  onChange={(e) => setSec80D(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
                <span className="text-[9px] text-muted-grey block">Self & Parents: Max ₹50,000</span>
              </div>

              {/* HRA */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-grey">HRA Tax Exemption</span>
                  <span className="text-emerald font-semibold">{formatCurrency(hra)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={250000}
                  step={5000}
                  value={hra}
                  onChange={(e) => setHra(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
              </div>

              {/* Section 24b Home Loan */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-grey">Home Loan Interest (Sec 24b)</span>
                  <span className="text-emerald font-semibold">{formatCurrency(homeLoanInterest)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200000}
                  step={10000}
                  value={homeLoanInterest}
                  onChange={(e) => setHomeLoanInterest(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
                <span className="text-[9px] text-muted-grey block">Self-occupied: Max ₹2,00,000</span>
              </div>

              {/* NPS 80CCD(1B) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-grey">NPS Voluntary (Sec 80CCD)</span>
                  <span className="text-emerald font-semibold">{formatCurrency(npsExtra)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={5000}
                  value={npsExtra}
                  onChange={(e) => setNpsExtra(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
                <span className="text-[9px] text-muted-grey block">Additional deduction: Max ₹50,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Comparisons & Educational Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommendation Banner */}
          <div className="p-6 rounded-2xl border border-emerald/30 bg-gradient-to-br from-emerald/10 to-transparent flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-emerald tracking-wide">Lower Tax Liability Regime (Estimate)</span>
              <h3 className="text-2xl font-extrabold text-white">
                {calculations.preferredRegime}
              </h3>
              <p className="text-sm text-muted-grey">
                {calculations.savings > 0 
                  ? `You save ${formatCurrency(calculations.savings)} by using this regime.` 
                  : "Both regimes result in the exact same tax liability."}
              </p>
            </div>
            <div className="p-3 bg-navy-bg/50 border border-border-navy rounded-xl flex items-center gap-2">
              <ShieldCheck className="text-emerald" size={24} />
              <span className="text-xs font-bold text-white">Optimized</span>
            </div>
          </div>

          {/* Slabs Side-by-Side Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Old Regime Card */}
            <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white">Old Tax Regime</h3>
                <span className="text-xs text-muted-grey">FY 2025-26 / FY 2026-27</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs border-b border-border-navy/60 pb-2">
                  <span className="text-muted-grey">Gross Salary</span>
                  <span className="text-white">{formatCurrency(grossIncome)}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-border-navy/60 pb-2">
                  <span className="text-muted-grey">Deductions (80C, etc.)</span>
                  <span className="text-white">- {formatCurrency(calculations.totalDeductions)}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-border-navy/60 pb-2">
                  <span className="text-muted-grey">Taxable Income</span>
                  <span className="text-white font-semibold">{formatCurrency(calculations.oldTaxableIncome)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-grey font-bold">Net Tax Bill</span>
                  <span className="text-white font-extrabold">{formatCurrency(calculations.oldTaxLiability)}</span>
                </div>
              </div>
            </div>

            {/* New Regime Card */}
            <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white">New Tax Regime</h3>
                <span className="text-xs text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded">Default • Budget 2025</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs border-b border-border-navy/60 pb-2">
                  <span className="text-muted-grey">Gross Salary</span>
                  <span className="text-white">{formatCurrency(grossIncome)}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-border-navy/60 pb-2">
                  <span className="text-muted-grey">Standard Deduction</span>
                  <span className="text-white">- {formatCurrency(75000)}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-border-navy/60 pb-2">
                  <span className="text-muted-grey">Taxable Income</span>
                  <span className="text-white font-semibold">{formatCurrency(calculations.newTaxableIncome)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-grey font-bold">Net Tax Bill</span>
                  <span className="text-emerald font-extrabold">{formatCurrency(calculations.newTaxLiability)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Content Hub */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Info className="text-emerald" size={18} />
              Core Tax Strategies You Should Understand
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 text-xs text-muted-grey leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-white">1. Tax Harvesting (LTCG)</h4>
                <p>
                  Long Term Capital Gains (LTCG) on equity investments are tax-free up to <strong>₹1.25 Lakhs per year</strong>. 
                </p>
                <p>
                  <strong>How to use this:</strong> Every financial year, you can sell mutual funds/stocks that have accrued gains up to ₹1.25L and reinvest the money immediately. This resets your purchase price higher, legally avoiding future tax.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">2. PPF vs NPS (Asset Lock-ins)</h4>
                <p>
                  <strong>PPF (Public Provident Fund)</strong>: EEE status (Exempt on deposit, Exempt on interest, Exempt on withdrawal). Highly secure but locked for 15 years.
                </p>
                <p>
                  <strong>NPS (National Pension Scheme)</strong>: EET status. Locked until age 60. NPS allows equity exposure (up to 75%), which generally yields higher compounding rates than PPF over 20+ years.
                </p>
              </div>
            </div>
          </div>

          {/* Rules and Legal Disclaimer Panel */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="text-emerald" size={18} />
              Budget 2025 Rules & Switch Guidelines
            </h3>
            <div className="text-xs text-muted-grey space-y-3 leading-relaxed">
              <p>
                • <strong>New Tax Regime Slabs (FY 2025-26):</strong> Exempt up to ₹4 Lakhs. Slabs: ₹4L–8L (5%), ₹8L–12L (10%), ₹12L–16L (15%), ₹16L–20L (20%), ₹20L–24L (25%), Above ₹24L (30%).
              </p>
              <p>
                • <strong>Section 87A Rebate:</strong> Tax liability is fully rebated up to ₹12 Lakhs taxable income (making it ₹0 tax). When combined with the ₹75,000 standard deduction, a salaried employee earning up to ₹12.75 Lakhs pays NIL tax.
              </p>
              <p>
                • <strong>Switching Guidelines:</strong> Salaried individuals can switch between the Old and New tax regimes every financial year. Taxpayers with business or professional income (e.g. freelancers, consultants, business owners) can only switch regimes once in their lifetime.
              </p>
              <p className="border-t border-border-navy/60 pt-3 text-[10px] text-amber-500 font-medium">
                ⚠️ <strong>Educational Disclaimer:</strong> Tax estimations are based on current Union Budget 2025 interpretations. Actual calculations can vary based on specific perks, exemptions, and professional profiles. Always consult a qualified CA or tax professional before filing taxes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
