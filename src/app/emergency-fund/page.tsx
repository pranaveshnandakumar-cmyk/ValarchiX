"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import { Info, HelpCircle, ShieldCheck, ChevronDown, Landmark, Shield, AlertTriangle } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function EmergencyFundCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [essential, setEssential] = useState(35000); // rent, food, bills
  const [discretionary, setDiscretionary] = useState(15000); // lifestyle, shopping
  const [debt, setDebt] = useState(10000); // EMIs, premiums
  const [riskMultiplier, setRiskMultiplier] = useState(6); // 3, 6, 9, 12 depending on sector
  const [dependents, setDependents] = useState(2); // adds 1 month per dependent

  const jobSectors = [
    { label: "Govt / PSU (Low)", multiplier: 3, desc: "Highest job stability, steady income" },
    { label: "Corporate (Medium)", multiplier: 6, desc: "Moderate stability, standard notice periods" },
    { label: "Startup (High)", multiplier: 9, desc: "High volatility, frequent layoffs" },
    { label: "Freelancer (Very High)", multiplier: 12, desc: "Irregular inflows, client contract risks" }
  ];

  const calculations = useMemo(() => {
    // Total months of runway recommended
    const totalMonths = riskMultiplier + dependents;
    
    // Monthly outflows
    const totalMonthlyOutflow = essential + discretionary + debt;
    
    // Target emergency fund assuming 100% of essential + debt, and 30% of lifestyle expenses (discretionary)
    const suggestedLifestyleCut = 0.3; // Cut 70% discretionary
    const essentialMonthlyNeeds = essential + debt + Math.round(discretionary * suggestedLifestyleCut);
    
    const targetCorpus = essentialMonthlyNeeds * totalMonths;

    // Split recommended allocations
    const cashAllocation = Math.round(targetCorpus * 0.20); // 20% in standard savings
    const liquidFundAllocation = Math.round(targetCorpus * 0.80); // 80% in Sweep FDs / Liquid Funds

    const pieData = [
      { name: "Savings Account (20%)", value: cashAllocation, color: "#3b82f6" },
      { name: "Sweep FD & Liquid Funds (80%)", value: liquidFundAllocation, color: "#22c55e" }
    ];

    const survivalOnlyRunway = (essential + debt) * totalMonths;

    return {
      totalMonths,
      totalMonthlyOutflow,
      targetCorpus,
      cashAllocation,
      liquidFundAllocation,
      survivalOnlyRunway,
      pieData
    };
  }, [essential, discretionary, debt, riskMultiplier, dependents]);

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
            Emergency Fund & Runway Planner
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Determine your risk-adjusted emergency reserve targets based on living expenses, family dependencies, job sector security, and allocate it optimally.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sliders and Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-6">
            <h2 className="text-lg font-bold text-white">Expense Outflows</h2>

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

            {/* Dependents Count */}
            <div className="space-y-2 border-t border-border-navy/60 pt-4">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">Number of Dependents</span>
                <NumericInput
                  value={dependents}
                  onChange={setDependents}
                  min={0}
                  max={10}
                  step={1}
                  type="number"
                />
              </div>
              <input
                type="range"
                min={0}
                max={6}
                step={1}
                value={dependents}
                onChange={(e) => setDependents(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>0 Dependents</span>
                <span>6 Dependents</span>
              </div>
              <span className="text-[9.5px] text-muted-grey block leading-tight">
                *Each family dependent adds 1 extra month of expense runway to guard against emergencies.
              </span>
            </div>

            {/* Job Sector Risk Selection */}
            <div className="space-y-2 border-t border-border-navy/60 pt-4">
              <label className="text-xs font-semibold text-muted-grey block">Job / Inflow Sector Risk</label>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                {jobSectors.map((sector) => (
                  <button
                    key={sector.multiplier}
                    type="button"
                    onClick={() => setRiskMultiplier(sector.multiplier)}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      riskMultiplier === sector.multiplier
                        ? "bg-emerald/10 border-emerald text-white"
                        : "bg-navy-bg/40 border-border-navy text-muted-grey hover:text-white"
                    }`}
                  >
                    <span>{sector.label}</span>
                    <span className="text-[9px] font-normal text-muted-grey/80 mt-1 leading-tight">{sector.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results and Visual Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Suggested Emergency Fund</span>
              <p className="text-xl font-bold text-emerald mt-1">
                {formatCurrency(calculations.targetCorpus)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                Risk Runway: {calculations.totalMonths} Months
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Cash Reserve (20%)</span>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {formatCurrency(calculations.cashAllocation)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                For Instant Withdrawals
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-emerald block">Liquid Funds Reserve (80%)</span>
              <p className="text-xl font-bold text-emerald glow-emerald mt-1">
                {formatCurrency(calculations.liquidFundAllocation)}
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5 leading-none">
                For Yield-Optimized Safety
              </span>
            </div>
          </div>

          {/* Allocation visual donut chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 grid md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-3 space-y-4 text-left">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Emergency Corpus Recommended Split Allocation
              </h3>
              <p className="text-xs text-muted-grey leading-relaxed">
                Keeping 100% of your emergency fund in normal savings accounts causes it to lose value to inflation. Keeping it in sweep-in FDs or liquid funds earns **6.5% - 7.2%**, compounding safely while staying fully accessible.
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
                <span className="text-sm font-extrabold text-white">{formatCurrency(calculations.targetCorpus)}</span>
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
                    Why the standard 3-Month rule is broken
                  </h4>
                  <p>
                    Standard internet advice is to save &quot;3 months of salary.&quot; This advice is deeply flawed. Your emergency fund target should not be based on salary, but on **essential outflows (commitments)**. 
                  </p>
                  <p className="text-[11px] text-muted-grey/80">
                    If you earn ₹1 Lakh but have ₹80,000 in monthly expenses (rent + EMIs + dependent costs), a ₹3L fund covers you for barely 3.7 months. If you are in high-volatility sectors (startups, freelance), you need a much longer cushion.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <AlertTriangle size={14} className="text-amber-500" />
                    Mitigating the Inflation Drag
                  </h4>
                  <p>
                    If inflation is 5.09%, storing a large emergency corpus (e.g. ₹5 Lakhs) in a standard savings account earning 3% means you are **losing 2% purchasing power every year**.
                  </p>
                  <p className="text-[11px] text-muted-grey/80">
                    To beat this drag, allocate 80% to **sweep-in Fixed Deposits** (which automatically link FDs to your savings account, breaking and using them only if balance drops to zero) or **Liquid Mutual Funds** (investing in ultra-safe short term government Treasury bills).
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
                      Runway Months (M) = Job_Risk_Multiplier + Dependents
                    </p>
                    <p>
                      Survival-Only Outflow = Essential_Expenses + Debt_EMIs_and_Insurance
                    </p>
                    <p>
                      Suggested Outflow (with 70% lifestyle cuts):
                      <br />
                      Monthly_Needs = Essential_Expenses + Debt_EMIs_and_Insurance + (Discretionary_Expenses * 0.3)
                    </p>
                    <p>
                      Target Emergency Corpus = Monthly_Needs * M
                    </p>
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
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Risk Runway Months (B4)</td>
                        <td className="border border-border-navy/80 p-2">{calculations.totalMonths}</td>
                      </tr>
                      <tr>
                        <td className="border border-border-navy/80 p-2 font-medium text-white">Target Emergency Fund</td>
                        <td className="border border-border-navy/80 p-2 font-mono text-emerald">=(B1 + B3 + B2 * 0.3) * B4</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-amber-500 border-t border-border-navy/60 pt-3">
                  ⚠️ <strong>Disclaimer:</strong> This tool is for training purposes only and represents a mathematical risk model. It does not guarantee cash flow stability or job retention.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
