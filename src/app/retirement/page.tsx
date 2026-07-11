"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Hourglass, AlertCircle, Sparkles, BookOpen, HelpCircle } from "lucide-react";

export default function RetirementPlanner() {
  const [currentAge, setCurrentAge] = useState(25);
  const [retireAge, setRetireAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [monthlyExpense, setMonthlyExpense] = useState(50000);
  const [inflation, setInflation] = useState(5.09);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [preReturn, setPreReturn] = useState(12);
  const [postReturn, setPostReturn] = useState(6.95);
  const [swr, setSwr] = useState(4); // Safe Withdrawal Rate (%)
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
        setPostReturn(data.bondYield10Y);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  const calculations = useMemo(() => {
    const preRetireYears = retireAge - currentAge;
    const postRetireYears = lifeExpectancy - retireAge;
    const data = [];
    const activeInflation = adjustInflation ? inflation : 0;

    // 1. Inflated Annual Expense at Retirement
    const inflatedMonthlyExpense = monthlyExpense * Math.pow(1 + activeInflation / 100, preRetireYears);
    const annualRetireExpense = inflatedMonthlyExpense * 12;

    // 2. Corpus Required (using the Safe Withdrawal Rate or annuity framework)
    // Corpus = Annual Expense / SWR
    const corpusRequired = annualRetireExpense / (swr / 100);

    // 3. Monthly SIP Required to get to Corpus
    // Monthly SIP = [Corpus * i] / [((1 + i)^n - 1) * (1 + i)]
    const r = preReturn / 100;
    const monthlyRate = r / 12;
    const totalMonths = preRetireYears * 12;
    let monthlySip = 0;
    if (preRetireYears > 0) {
      monthlySip = (corpusRequired * monthlyRate) / ((Math.pow(1 + monthlyRate, totalMonths) - 1) * (1 + monthlyRate));
    }

    // 4. Generate Accumulation & Decumulation Curve Year-by-Year
    let currentWealth = 0;
    const monthlyPreRate = r / 12;
    const monthlyPostRate = postReturn / 100 / 12;
    const monthlyWithdrawal = annualRetireExpense / 12;

    // Accumulation Phase
    for (let y = 0; y <= preRetireYears; y++) {
      if (y > 0) {
        // Compound interest on existing wealth, plus adding SIP monthly for 12 months
        for (let m = 0; m < 12; m++) {
          currentWealth = (currentWealth + monthlySip) * (1 + monthlyPreRate);
        }
      }
      data.push({
        age: currentAge + y,
        "Retirement Corpus": Math.round(currentWealth),
        phase: "Accumulation"
      });
    }

    // Decumulation Phase
    let retirementWealth = corpusRequired;
    for (let y = 1; y <= postRetireYears; y++) {
      // Subtract withdrawal monthly and compound remaining balance
      // If adjustInflation is true, the withdrawal amount increases with inflation every year during retirement.
      const currentYearMonthlyWithdrawal = adjustInflation 
        ? monthlyWithdrawal * Math.pow(1 + activeInflation / 100, y - 1) 
        : monthlyWithdrawal;
      for (let m = 0; m < 12; m++) {
        retirementWealth = (retirementWealth - currentYearMonthlyWithdrawal) * (1 + monthlyPostRate);
      }
      // Clamp to 0
      retirementWealth = Math.max(0, retirementWealth);
      data.push({
        age: retireAge + y,
        "Retirement Corpus": Math.round(retirementWealth),
        phase: "Decumulation"
      });
    }

    return {
      chartData: data,
      inflatedMonthlyExpense: Math.round(inflatedMonthlyExpense),
      annualRetireExpense: Math.round(annualRetireExpense),
      corpusRequired: Math.round(corpusRequired),
      monthlySip: Math.round(monthlySip)
    };
  }, [currentAge, retireAge, lifeExpectancy, monthlyExpense, inflation, preReturn, postReturn, swr, adjustInflation]);

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
            <Hourglass className="text-emerald" />
            Retirement & FIRE Planner
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Determine your retirement independence corpus and calculate your pre-retirement savings goal.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-5">
            <h2 className="text-lg font-bold text-white">Retirement Details</h2>

            {/* Age Sliders */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-grey">Current Age</label>
                <input
                  type="number"
                  value={currentAge}
                  min={18}
                  max={retireAge - 1}
                  onChange={(e) => setCurrentAge(Math.max(18, Number(e.target.value)))}
                  className="w-full glass-input text-sm text-center font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-grey">Retirement Age</label>
                <input
                  type="number"
                  value={retireAge}
                  min={currentAge + 1}
                  max={80}
                  onChange={(e) => setRetireAge(Math.min(80, Number(e.target.value)))}
                  className="w-full glass-input text-sm text-center font-bold"
                />
              </div>
            </div>

            {/* Monthly Expenses */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-grey">Current Monthly Expense</span>
                <span className="text-emerald font-bold">{formatCurrency(monthlyExpense)}</span>
              </div>
              <input
                type="range"
                min={10000}
                max={500000}
                step={5000}
                value={monthlyExpense}
                onChange={(e) => setMonthlyExpense(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹10K</span>
                <span>₹5L</span>
              </div>
            </div>

            {/* Pre/Post Return Rates */}
            <div className="space-y-3 pt-3 border-t border-border-navy/60">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-grey">Pre-Retirement Return (Equity)</span>
                  <span className="text-emerald font-semibold">{preReturn}%</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={18}
                  step={0.5}
                  value={preReturn}
                  onChange={(e) => setPreReturn(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
                <div className="flex justify-start pt-0.5">
                  <button
                    type="button"
                    onClick={() => setPreReturn(12)}
                    className="text-[9px] font-bold text-white border border-border-navy bg-navy-light/40 hover:bg-navy-light px-2 py-0.5 rounded transition-all"
                  >
                    Equity Index (12%)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-grey">Post-Retirement Return (Debt)</span>
                  <span className="text-emerald font-semibold">{postReturn}%</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={10}
                  step={0.5}
                  value={postReturn}
                  onChange={(e) => setPostReturn(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
                <div className="flex justify-start pt-0.5">
                  <button
                    type="button"
                    onClick={() => setPostReturn(rates.bondYield10Y)}
                    className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all"
                  >
                    Sovereign 10Y Yield ({rates.bondYield10Y}%)
                  </button>
                </div>
              </div>
            </div>

            {/* Inflation & Safe Withdrawal Rate */}
            <div className="space-y-3 pt-3 border-t border-border-navy/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Adjusts expenses and retirement withdrawals for purchasing power loss over time."><HelpCircle size={14} /></span>
                </label>
                <input
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                  className="rounded border-border-navy text-emerald focus:ring-emerald accent-emerald h-4 w-4"
                />
              </div>

              {adjustInflation && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-grey">Expected Inflation Rate</span>
                    <span className="text-emerald font-semibold">{inflation}%</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    step={0.5}
                    value={inflation}
                    onChange={(e) => setInflation(Number(e.target.value))}
                    className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                  />
                  <div className="flex justify-start pt-0.5">
                    <button
                      type="button"
                      onClick={() => setInflation(rates.inflationRate)}
                      className="text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded transition-all"
                    >
                      CPI Inflation ({rates.inflationRate}%)
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-grey">Safe Withdrawal Rate (SWR)</span>
                  <span className="text-emerald font-semibold">{swr}%</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={6}
                  step={0.25}
                  value={swr}
                  onChange={(e) => setSwr(Number(e.target.value))}
                  className="w-full accent-emerald bg-navy-bg h-1 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-muted-grey">
                  <span>3% (Conservative)</span>
                  <span>6% (Aggressive)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output Dashboards and Curves */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
              <span className="text-[10px] uppercase font-bold text-muted-grey">
                {adjustInflation ? "Monthly Expense at retirement" : "Monthly Expense (Nominal)"}
              </span>
              <p className="text-lg font-bold text-white mt-1">
                {formatCurrency(calculations.inflatedMonthlyExpense)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">
                {adjustInflation ? `Due to ${inflation}% inflation` : "Nominal value (no inflation adjustment)"}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald/30 bg-emerald/5">
              <span className="text-[10px] uppercase font-bold text-emerald">
                {adjustInflation ? "Required Net Corpus" : "Required Corpus (Nominal)"}
              </span>
              <p className="text-lg font-bold text-white mt-1">
                {formatCurrency(calculations.corpusRequired)}
              </p>
              <span className="text-[9px] text-emerald/80 block mt-0.5">
                {adjustInflation ? `${100 / swr}x Inflated Annual Expenses` : `${100 / swr}x Nominal Annual Expenses`}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
              <span className="text-[10px] uppercase font-bold text-muted-grey">SIP Needed to Achieve</span>
              <p className="text-lg font-bold text-white mt-1">
                {formatCurrency(calculations.monthlySip)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">SIP monthly for {retireAge - currentAge} yrs</span>
            </div>
          </div>

          {/* Accumulation vs Decumulation Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">FIRE Wealth Curve (Ages {currentAge} to {lifeExpectancy})</h3>
              <div className="flex gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald rounded-full"></span> Accumulation</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Decumulation</span>
              </div>
            </div>
            
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="age" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#081c3a",
                      borderColor: "#112d55",
                      borderRadius: "8px",
                      color: "#f1f5f9"
                    }}
                    formatter={(val: any) => [formatCurrency(val), "Retirement Corpus"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="Retirement Corpus"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorCorpus)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Hub */}
      <div className="grid md:grid-cols-2 gap-6 pt-6">
        <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="text-emerald" size={20} />
            The 4% Rule Explained
          </h3>
          <div className="text-sm text-muted-grey space-y-3 leading-relaxed">
            <p>
              Based on the Trinity Study, a retiree can safely withdraw <strong>4%</strong> of their initial retirement portfolio in the first year, and adjust that amount for inflation every subsequent year, with a near-zero probability of running out of money over a 30-year retirement.
            </p>
            <p>
              To implement this, your target corpus must be exactly <strong>25 times</strong> your annual retirement expenses. If your retirement annual expense is ₹12 Lakhs, you need:
              {"\\[\\text{Corpus} = \\text{₹12L} \\times 25 = \\text{₹3 Crore}\\]"}
            </p>
            <p className="text-xs text-emerald italic">
              * Lowering the withdrawal rate (e.g. 3.25%) reduces risk if you plan to retire early (FIRE) and need the corpus to last 40+ years.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="text-emerald" size={20} />
            Sequence of Returns Risk
          </h3>
          <div className="text-sm text-muted-grey space-y-3 leading-relaxed">
            <p>
              This is the risk that market returns are negative in the early years of your retirement.
            </p>
            <p>
              If the stock market crashes right after you retire and you are forced to sell shares when prices are depressed to fund your living expenses, your portfolio will deplete much faster than if the crash occurred late in retirement.
            </p>
            <p>
              <strong>Mitigation Strategy:</strong> Implement a **bucket strategy** or keep 3–5 years of retirement cash needs in liquid debt instruments, letting your equity bucket compound undisturbed during downturns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
