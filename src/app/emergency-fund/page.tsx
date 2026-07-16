"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { HelpCircle, ShieldCheck, ChevronDown, Landmark, Shield, AlertTriangle, HeartPulse, Briefcase, Wrench, Plane } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function EmergencyFundCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [essential, setEssential] = useState(35000);        // rent, food, bills
  const [discretionary, setDiscretionary] = useState(15000); // lifestyle, shopping
  const [debt, setDebt] = useState(10000);                   // EMIs, premiums
  const [targetMonths, setTargetMonths] = useState(6);       // 3 = minimum, 6 = ideal
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [projectionYears, setProjectionYears] = useState(3);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const calculations = useMemo(() => {
    // Total monthly expense (whole family) — emergency fund must cover this in full
    const totalMonthlyExpense = essential + discretionary + debt;

    // Minimum buffer: 3 months of total expense (absolute floor)
    const minCorpus = totalMonthlyExpense * 3;

    // Ideal buffer: 6 months of total expense (recommended target)
    const idealCorpus = totalMonthlyExpense * 6;

    // User-selected target
    const targetCorpus = totalMonthlyExpense * targetMonths;

    // Future inflated target values
    const inf = inflation / 100;
    const futureTargetCorpus = adjustInflation ? Math.round(targetCorpus * Math.pow(1 + inf, projectionYears)) : targetCorpus;
    const futureMinCorpus = adjustInflation ? Math.round(minCorpus * Math.pow(1 + inf, projectionYears)) : minCorpus;
    const futureIdealCorpus = adjustInflation ? Math.round(idealCorpus * Math.pow(1 + inf, projectionYears)) : idealCorpus;

    // Safe return yield on emergency fund savings (like sweep-in FD at 6% p.a.)
    const safeReturn = 0.06; // 6%
    const r = safeReturn / 12;
    const n = projectionYears * 12;
    const monthlySavingsNeeded = (adjustInflation && n > 0)
      ? Math.round((futureTargetCorpus * r) / (Math.pow(1 + r, n) - 1))
      : Math.round(targetCorpus / (n > 0 ? n : 12));

    // Split recommended allocations
    const cashAllocation = Math.round(futureTargetCorpus * 0.20);        // 20% instant-access savings
    const liquidFundAllocation = Math.round(futureTargetCorpus * 0.80);  // 80% sweep FDs / liquid funds

    const pieData = [
      { name: "Savings Account (20%)", value: cashAllocation, color: "#3b82f6" },
      { name: "Sweep FD & Liquid Funds (80%)", value: liquidFundAllocation, color: "#22c55e" }
    ];

    return {
      totalMonthlyExpense,
      targetCorpus,
      minCorpus,
      idealCorpus,
      futureTargetCorpus,
      futureMinCorpus,
      futureIdealCorpus,
      monthlySavingsNeeded,
      cashAllocation,
      liquidFundAllocation,
      pieData
    };
  }, [essential, discretionary, debt, targetMonths, inflation, adjustInflation, projectionYears]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="text-emerald" />
            Emergency Fund Planner
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Build the right safety net — minimum 3 months, ideal 6 months of your total family monthly expense, kept in high-liquidity instruments.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      {/* What is an Emergency Fund? */}
      <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/30 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <HeartPulse className="text-emerald" size={16} />
          What Is an Emergency Fund — and When Do You Use It?
        </h2>
        <p className="text-xs text-muted-grey leading-relaxed">
          An emergency fund is a dedicated, instantly accessible cash reserve set aside <strong className="text-white">only for genuine financial shocks</strong> — not vacations, not gadgets, not planned purchases. It is your household&apos;s financial immune system.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {[
            { icon: <Briefcase size={14} className="text-amber-400" />, title: "Job Loss / Pay Cut", desc: "Cover living costs while you find a new role or stabilise income." },
            { icon: <HeartPulse size={14} className="text-red-400" />, title: "Medical Emergency", desc: "Bridge the gap before insurance reimbursement hits your account." },
            { icon: <Wrench size={14} className="text-blue-400" />, title: "Critical Home / Vehicle Repair", desc: "Burst pipes, car breakdown — urgent repairs that cannot wait." },
            { icon: <Plane size={14} className="text-purple-400" />, title: "Urgent Family Obligation", desc: "Unplanned travel, bereavement costs or sudden family support needs." },
          ].map((item) => (
            <div key={item.title} className="p-3 rounded-xl border border-border-navy/60 bg-navy-bg/40 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-white text-[10px]">
                {item.icon}
                {item.title}
              </div>
              <p className="text-[9.5px] text-muted-grey leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-amber-400 border-t border-border-navy/60 pt-3">
          ⚠️ An emergency fund is <strong>not</strong> an investment. It must stay liquid at all times — prioritise access speed over returns.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sliders and Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-6">
            <h2 className="text-lg font-bold text-white">Monthly Family Expenses</h2>
            <p className="text-[10px] text-muted-grey -mt-3 leading-relaxed">
              Enter your total household outflows. The emergency fund must cover the full amount — these are family expenses, not individual.
            </p>

            {/* Essential Expenses */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey flex items-center gap-1">
                  Essential Outlays
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Rent, home bills, groceries, children's school fees, and medical essentials."><HelpCircle size={12} /></span>
                </span>
                <NumericInput
                  value={essential}
                  onChange={setEssential}
                  min={1000}
                  max={500000}
                  step={1000}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={5000}
                max={150000}
                step={5000}
                value={essential}
                onChange={(e) => setEssential(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹5K</span>
                <span>₹1.5L</span>
              </div>
            </div>

            {/* Discretionary Expenses */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey flex items-center gap-1">
                  Discretionary Spend
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Eating out, OTT subscriptions, lifestyle shopping, hobbies, and leisure spending."><HelpCircle size={12} /></span>
                </span>
                <NumericInput
                  value={discretionary}
                  onChange={setDiscretionary}
                  min={0}
                  max={300000}
                  step={500}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={0}
                max={100000}
                step={2000}
                value={discretionary}
                onChange={(e) => setDiscretionary(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹0</span>
                <span>₹1L</span>
              </div>
            </div>

            {/* Debt/Obligations */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey flex items-center gap-1">
                  Debt EMIs & Insurance
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Fixed liabilities like loan EMIs and annual insurance policy premiums."><HelpCircle size={12} /></span>
                </span>
                <NumericInput
                  value={debt}
                  onChange={setDebt}
                  min={0}
                  max={500000}
                  step={500}
                  type="currency"
                />
              </div>
              <input
                type="range"
                min={0}
                max={100000}
                step={2000}
                value={debt}
                onChange={(e) => setDebt(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>₹0</span>
                <span>₹1L</span>
              </div>
            </div>


            {/* Target Months Selector */}
            <div className="space-y-3 border-t border-border-navy/60 pt-4">
              <div>
                <label className="text-xs font-semibold text-muted-grey block">Target Coverage</label>
                <p className="text-[10px] text-muted-grey/70 mt-0.5">How many months of total expense should your fund cover?</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                {[
                  { months: 3, label: "Minimum (3 Months)", desc: "Absolute floor — for very stable, dual-income households." },
                  { months: 6, label: "Ideal (6 Months)", desc: "Recommended for most families — covers job transitions & medical shocks." },
                ].map((opt) => (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setTargetMonths(opt.months)}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      targetMonths === opt.months
                        ? "bg-emerald/10 border-emerald text-white"
                        : "bg-navy-bg/40 border-border-navy text-muted-grey hover:text-white"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[9px] font-normal text-muted-grey/80 mt-1 leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inflation Projection Controls */}
            <div className="space-y-3 border-t border-border-navy/60 pt-4">
              <div className="flex items-center justify-between">
                <label htmlFor="adjust-inflation" className="text-xs font-semibold text-muted-grey cursor-pointer flex items-center gap-1">
                  Project for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Inflates the target corpus based on the time horizon to reflect future prices."><HelpCircle size={12} /></span>
                </label>
                <input
                  id="adjust-inflation"
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                  className="w-4 h-4 accent-emerald cursor-pointer rounded"
                />
              </div>
            </div>

            {adjustInflation && (
              <div className="space-y-4 border-t border-border-navy/60 pt-4 animate-fadeIn">
                {/* Horizon slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-grey">Years to Build Fund</span>
                    <span className="text-emerald font-bold">{projectionYears} yrs</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={projectionYears}
                    onChange={(e) => setProjectionYears(Number(e.target.value))}
                    className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-grey">
                    <span>1 yr</span>
                    <span>5 yrs</span>
                  </div>
                </div>

                {/* Inflation rate slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-grey">Expected Inflation Rate</span>
                    <span className="text-emerald font-bold">{inflation}%</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={15}
                    step={0.1}
                    value={inflation}
                    onChange={(e) => setInflation(Number(e.target.value))}
                    className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-grey">
                    <span>2%</span>
                    <span>15%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInflation(rates.inflationRate)}
                    className="text-[9px] text-left text-emerald/80 hover:text-emerald block mt-1 hover:underline cursor-pointer"
                  >
                    CPI Inflation Baseline ({rates.inflationRate}%)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results and Visual Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">
                {adjustInflation ? "Future Target Fund" : "Your Target Fund"}
              </span>
              <p className="text-xl font-bold text-emerald mt-1">
                {formatCurrency(calculations.futureTargetCorpus)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                {adjustInflation ? `Today's value: ${formatCurrency(calculations.targetCorpus)}` : `${targetMonths}M × ${formatCurrency(calculations.totalMonthlyExpense)}/mo`}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">
                {adjustInflation ? "Future Minimum Floor" : "Minimum Floor (3M)"}
              </span>
              <p className="text-xl font-bold text-amber-400 mt-1">
                {formatCurrency(calculations.futureMinCorpus)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                {adjustInflation ? `Today's value: ${formatCurrency(calculations.minCorpus)}` : "Never go below this"}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-emerald block">
                {adjustInflation ? "Future Ideal Target" : "Ideal Target (6M)"}
              </span>
              <p className="text-xl font-bold text-emerald glow-emerald mt-1">
                {formatCurrency(calculations.futureIdealCorpus)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                {adjustInflation ? `Today's value: ${formatCurrency(calculations.idealCorpus)}` : "Full peace-of-mind buffer"}
              </span>
            </div>
          </div>

          {/* Monthly Savings Goal Banner */}
          {adjustInflation && (
            <div className="p-4 rounded-xl border border-emerald/20 bg-emerald/5 flex justify-between items-center text-xs font-semibold animate-fadeIn">
              <div>
                <span className="text-[10px] text-muted-grey uppercase block">Monthly Savings Goal</span>
                <p className="text-base font-bold text-white mt-0.5">
                  Save <span className="text-emerald font-extrabold">{formatCurrency(calculations.monthlySavingsNeeded)}</span> / month
                </p>
                <span className="text-[9px] text-muted-grey leading-none">
                  Accumulated in liquid sweep FDs at 6% yield over {projectionYears} years
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-grey uppercase block">Future Inflated Target</span>
                <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(calculations.futureTargetCorpus)}</p>
                <span className="text-[9px] text-muted-grey leading-none">
                  For {targetMonths} months coverage
                </span>
              </div>
            </div>
          )}

          {/* Allocation visual donut chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 grid md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-3 space-y-4 text-left">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Emergency Corpus Recommended Split Allocation
              </h3>
              <p className="text-xs text-muted-grey leading-relaxed">
                Keeping 100% of your emergency fund in normal savings accounts causes it to lose value to inflation. Keeping it in sweep-in FDs or liquid funds earns <strong className="text-white">6.5% – 7.2%</strong>, compounding safely while staying fully accessible.
              </p>
              <div className="space-y-2 border-t border-border-navy/60 pt-3 text-[11px] text-muted-grey">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  <span><strong>Bank Cash (20%):</strong> {formatCurrency(calculations.cashAllocation)} — ATM & Online transactions.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <span><strong>Liquid Instruments (80%):</strong> {formatCurrency(calculations.liquidFundAllocation)} — Sweep FDs, Arbitrage or Liquid Mutual Funds.</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 h-[180px] flex justify-center items-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculations.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {calculations.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                <span className="text-[10px] text-muted-grey uppercase font-bold">Total Reserve</span>
                <span className="text-sm font-extrabold text-white">{formatCurrency(calculations.futureTargetCorpus)}</span>
              </div>
            </div>
          </div>

          {/* Educational Concept Section */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="text-emerald" size={18} />
              Educational Concept: Designing Your Liquidity Runway
            </h3>

            <div className="text-xs text-muted-grey leading-relaxed space-y-4 border-t border-border-navy/60 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <Landmark size={14} className="text-blue-400" />
                    Why 3–6 months of total expense, not salary
                  </h4>
                  <p>
                    Standard internet advice says &quot;save 3 months of salary.&quot; This is flawed. Your emergency fund should cover your actual <strong className="text-white">outflows</strong>, not income. A family spending ₹60,000/month needs ₹1.8L minimum and ₹3.6L ideally — regardless of income level.
                  </p>
                  <p className="text-[11px] text-muted-grey/80">
                    The <strong className="text-white">minimum of 3 months</strong> is the absolute floor — enough to bridge a short job gap or medical event. The <strong className="text-white">ideal of 6 months</strong> gives real peace of mind, covering longer job searches, income volatility, or layered emergencies.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <AlertTriangle size={14} className="text-amber-500" />
                    Mitigating the Inflation Drag
                  </h4>
                  <p>
                    If inflation is 5%, storing ₹5 Lakhs in a savings account earning 3% means you are <strong className="text-white">losing 2% purchasing power every year</strong>.
                  </p>
                  <p className="text-[11px] text-muted-grey/80">
                    Allocate 80% to <strong className="text-white">sweep-in Fixed Deposits</strong> (auto-link FDs to your savings account, breaking only when balance drops to zero) or <strong className="text-white">Liquid Mutual Funds</strong> (ultra-safe, invest in short-term government T-bills). Both earn 6.5–7.2% and remain accessible within 1 business day.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Audit & Sheet Replication */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <button 
              onClick={() => setShowAudit(!showAudit)} 
              className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="text-emerald" size={18} />
                How This is Calculated & Excel Replication
              </span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? 'rotate-180' : ''}`} />
            </button>
            
            {showAudit && (
              <div className="text-xs text-muted-grey leading-relaxed space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Mathematical Model</h4>
                  <div className="bg-navy-bg/50 p-3 rounded-xl space-y-2 font-mono">
                    <p>
                      Total Monthly Expense = Essential + Discretionary + Debt_EMIs
                    </p>
                    <p>
                      Minimum Emergency Fund (Nominal) = Total Monthly Expense × 3
                    </p>
                    <p>
                      Ideal Emergency Fund (Nominal) = Total Monthly Expense × 6
                    </p>
                    <p>
                      Your Target (Nominal) = Total Monthly Expense × {targetMonths}
                    </p>
                    {adjustInflation && (
                      <>
                        <p>
                          Future Inflated Target = Your Target × (1 + Inflation Rate)^Years
                        </p>
                        <p>
                          Monthly Savings Needed = (Future Target × r) / ((1 + r)^n − 1)
                        </p>
                        <p>
                          where r = 6% / 12 (0.005), n = Years × 12
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Excel Replication</h4>
                  <p>In Excel, enter your expenses in cells B1, B2, B3, and compute as follows:</p>
                  <table className="w-full text-[10px] border-collapse border border-border-navy/80 mt-2">
                    <thead>
                      <tr className="bg-navy-bg/60">
                        <th className="border border-border-navy/80 p-2 text-left">Input / Calculation</th>
                        <th className="border border-border-navy/80 p-2 text-left">Formula / Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Essential Expenses (B1)</td>
                        <td className="border border-border-navy/80 p-2">{essential}</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Discretionary Spend (B2)</td>
                        <td className="border border-border-navy/80 p-2">{discretionary}</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Debt / EMIs (B3)</td>
                        <td className="border border-border-navy/80 p-2">{debt}</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Total Monthly Expense (B4)</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=B1+B2+B3</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Minimum Fund (3M)</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-amber-400">=B4*3</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Ideal Fund (6M)</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=B4*6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This tool is for educational purposes only. It does not guarantee cash flow stability or job retention.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
