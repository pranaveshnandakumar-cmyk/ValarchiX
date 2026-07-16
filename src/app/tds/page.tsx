"use client";

import React, { useState, useMemo } from "react";
import { Calculator, Info, HelpCircle } from "lucide-react";
import NumericInput from "@/components/NumericInput";

interface TdsSectionRule {
  section: string;
  name: string;
  rateIndividual: number;
  rateOther: number;
  threshold: number;
  description: string;
}

const TDS_RULES: TdsSectionRule[] = [
  {
    section: "194J",
    name: "Professional / Technical Services",
    rateIndividual: 10,
    rateOther: 10,
    threshold: 30000,
    description: "Applicable on professional fees, royalty, director fees, etc. (reduced to 2% for technical services / call centers in some cases)."
  },
  {
    section: "194C",
    name: "Payment to Contractors",
    rateIndividual: 1,
    rateOther: 2,
    threshold: 30000, // or 100,000 aggregate per year
    description: "Paid to contractors for work execution, advertising, manufacturing, etc."
  },
  {
    section: "194I (Building)",
    name: "Rent on Land & Building",
    rateIndividual: 10,
    rateOther: 10,
    threshold: 240000,
    description: "Applicable on lease, tenancy rent of land or building."
  },
  {
    section: "194I (Machinery)",
    name: "Rent on Plant & Machinery",
    rateIndividual: 2,
    rateOther: 2,
    threshold: 240000,
    description: "Applicable on hire charges or lease of plant, machinery, or equipment."
  },
  {
    section: "194A",
    name: "Interest on Bank Deposits",
    rateIndividual: 10,
    rateOther: 10,
    threshold: 40000, // 50,000 for senior citizens
    description: "TDS on bank fixed deposits or recurring deposits interest."
  },
  {
    section: "194H",
    name: "Commission or Brokerage",
    rateIndividual: 5,
    rateOther: 5,
    threshold: 15000,
    description: "Brokerage or business commissions paid to intermediaries."
  },
  {
    section: "194-IA",
    name: "Transfer of Immovable Property",
    rateIndividual: 1,
    rateOther: 1,
    threshold: 5000000,
    description: "Purchaser of property from resident seller deducts TDS on sale value."
  }
];

export default function TdsCalculator() {
  const [grossAmount, setGrossAmount] = useState(100000);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0);
  const [isIndividual, setIsIndividual] = useState(true);
  const [hasPan, setHasPan] = useState(true);

  const calculations = useMemo(() => {
    const rule = TDS_RULES[selectedRuleIndex];
    let rate = isIndividual ? rule.rateIndividual : rule.rateOther;
    
    // Penal TDS rate under Section 206AA if PAN is not furnished (flat 20%)
    const originalRate = rate;
    if (!hasPan) {
      rate = 20;
    }

    const belowThreshold = grossAmount < rule.threshold;
    
    // In practice, TDS is only deducted if gross amount exceeds the threshold
    const tdsAmount = belowThreshold ? 0 : (grossAmount * rate) / 100;
    const netPayout = grossAmount - tdsAmount;

    return {
      rule,
      originalRate,
      appliedRate: rate,
      tdsAmount: Math.round(tdsAmount),
      netPayout: Math.round(netPayout),
      belowThreshold,
      threshold: rule.threshold
    };
  }, [grossAmount, selectedRuleIndex, isIndividual, hasPan]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-10 py-6 animate-fadeIn text-light-grey">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calculator className="text-emerald" />
            TDS Calculator (Tax Deducted at Source)
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Calculate your transactional tax deduction rates, thresholds, and net payouts under various Income Tax sections.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-5">
            <h2 className="text-lg font-bold text-white">Transaction Settings</h2>

            {/* Gross Payment Amount */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-grey font-semibold">Gross Payment Amount</span>
                <NumericInput
                  value={grossAmount}
                  onChange={setGrossAmount}
                  min={0}
                  max={1000000000}
                  step={1000}
                  type="currency"
                />
              </div>
            </div>

            {/* TDS Section Dropdown */}
            <div className="space-y-2">
              <label className="text-xs text-muted-grey block font-semibold">TDS Section & Nature of Payment</label>
              <select
                value={selectedRuleIndex}
                onChange={(e) => setSelectedRuleIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-border-navy bg-navy-bg px-3 py-2 text-xs font-bold text-emerald outline-none focus:border-emerald"
              >
                {TDS_RULES.map((rule, idx) => (
                  <option key={rule.section} value={idx}>
                    Sec {rule.section}: {rule.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payee Type Buttons */}
            <div className="space-y-2">
              <label className="text-xs text-muted-grey block font-semibold">Payee Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsIndividual(true)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${isIndividual
                    ? "bg-emerald border-emerald text-navy-bg"
                    : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                  }`}
                >
                  Individual / HUF
                  <span className="block text-[8px] opacity-80">1% on contractors</span>
                </button>
                <button
                  onClick={() => setIsIndividual(false)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${!isIndividual
                    ? "bg-emerald border-emerald text-navy-bg"
                    : "bg-navy-bg border-border-navy text-muted-grey hover:text-white"
                  }`}
                >
                  Partnership / Company
                  <span className="block text-[8px] opacity-80">2% on contractors</span>
                </button>
              </div>
            </div>

            {/* PAN Available Switch */}
            <div className="flex items-center justify-between border-t border-border-navy/60 pt-4">
              <label className="text-xs font-semibold text-muted-grey">Payee Has Valid PAN Card?</label>
              <input
                type="checkbox"
                checked={hasPan}
                onChange={(e) => setHasPan(e.target.checked)}
                className="rounded border-border-navy text-emerald focus:ring-emerald accent-emerald h-4 w-4"
              />
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Gross Amount</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(grossAmount)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Invoice / Payment value</span>
            </div>

            <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
              <span className="text-[10px] uppercase font-bold text-red-400 block">TDS to Deduct</span>
              <p className="text-xl font-extrabold text-red-400 mt-1">
                {formatCurrency(calculations.tdsAmount)}
              </p>
              <span className="text-[9px] text-red-400 block mt-0.5">
                {calculations.belowThreshold 
                  ? "TDS not deducted (Below Threshold)" 
                  : `TDS Rate applied: ${calculations.appliedRate}%`}
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald/20 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald block">Net Payout to Payee</span>
              <p className="text-xl font-extrabold text-white mt-1">
                {formatCurrency(calculations.netPayout)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Amount credited after tax deduction</span>
            </div>
          </div>

          {/* Section description */}
          <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/25 space-y-3.5 text-xs text-light-grey leading-relaxed">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rule Specific details: Section {calculations.rule.section}</h3>
            <p>{calculations.rule.description}</p>
            <div className="p-3 bg-navy-bg rounded-lg border border-border-navy flex justify-between items-center text-[11px]">
              <div>
                <span className="text-muted-grey block">Statutory Threshold:</span>
                <span className="font-bold text-white">{formatCurrency(calculations.threshold)}</span>
              </div>
              <div className="text-right">
                <span className="text-muted-grey block">Standard Rate:</span>
                <span className="font-bold text-white">{calculations.originalRate}%</span>
              </div>
            </div>
          </div>

          {/* Warning / PAN Penalty callout */}
          {!hasPan && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-xs leading-relaxed text-light-grey flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5 font-bold text-red-400 text-base">🚨</div>
              <div>
                <span className="font-bold text-red-400 mr-1">PAN Card Penalty (Section 206AA):</span>
                Since payee has not furnished a valid PAN card, the statutory TDS rate shoots up to a penal rate of <strong>20%</strong> (normally it would be <strong>{calculations.originalRate}%</strong>). Ensure a PAN card is collected before payouts are processed.
              </div>
            </div>
          )}

          {calculations.belowThreshold && (
            <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs leading-relaxed text-light-grey">
              <span className="font-bold text-amber-500 mr-1">ℹ️ Threshold Rule:</span>
              The gross payment of <strong>{formatCurrency(grossAmount)}</strong> is below the statutory threshold of <strong>{formatCurrency(calculations.threshold)}</strong> for Section {calculations.rule.section}. Hence, TDS deduction is **exempt** and the net payout equals the gross payment.
            </div>
          )}
        </div>
      </div>

      {/* Guide Section */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          What is TDS (Tax Deducted at Source)?
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Concept & Deductor Responsibility</h4>
            <p>
              TDS is a government mechanism designed to collect taxes right at the source of generation. Under the Indian Income Tax Act:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>The Deductor:</strong> The person/business making a payment (like salary, rent, or professional fees) must deduct the tax before transferring the funds to the payee.</li>
              <li><strong>The Payout:</strong> The deducted amount must be deposited with the government on behalf of the payee. The payee gets credit for the TDS in their Form 26AS, which they offset against their final tax liability during annual filing.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Why Inflation Doesn&apos;t Apply to TDS</h4>
            <p>
              <strong>Inflation Reality:</strong> TDS is a transaction-level, immediate tax collection tool. Since tax is deducted and credited to the government at the exact moment the income is paid out, inflation does not erode the TDS percentage itself.
            </p>
            <p>
              However, businesses must understand cash flow dynamics: a high TDS rate (or PAN penalty rate of 20%) locks up valuable working capital in tax refunds for months before the final annual assessment is completed, creating an opportunity cost.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
