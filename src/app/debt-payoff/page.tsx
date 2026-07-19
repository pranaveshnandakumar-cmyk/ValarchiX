"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Scissors, Plus, Trash2, ChevronDown, HelpCircle, TrendingDown, Zap } from "lucide-react";
import NumericInput from "@/components/NumericInput";

interface Debt {
  id: number;
  name: string;
  balance: number;
  rate: number;  // annual %
  minPayment: number;
}

let uid = 10;

function simulatePayoff(debts: Debt[], strategy: "snowball" | "avalanche", extraPayment: number, adjustInflation: boolean, inflation: number) {
  // Deep copy
  let active = debts.filter(d => d.balance > 0).map(d => ({ ...d, balance: d.balance }));

  // Sort order
  if (strategy === "snowball") {
    active.sort((a, b) => a.balance - b.balance);
  } else {
    active.sort((a, b) => b.rate - a.rate);
  }

  let totalInterest = 0;
  let months = 0;
  const MAX_MONTHS = 600;
  const monthlyInfRate = inflation / 100 / 12;

  while (active.length > 0 && months < MAX_MONTHS) {
    months++;
    // Apply monthly interest to all
    active.forEach(d => {
      const interest = d.balance * (d.rate / 100 / 12);
      d.balance += interest;
      totalInterest += adjustInflation ? (interest / Math.pow(1 + monthlyInfRate, months)) : interest;
    });

    // Apply min payments to all
    active.forEach(d => {
      d.balance = Math.max(0, d.balance - d.minPayment);
    });

    // Apply extra payment to first in priority order
    let extra = extraPayment;
    for (let i = 0; i < active.length && extra > 0; i++) {
      const pay = Math.min(extra, active[i].balance);
      active[i].balance -= pay;
      extra -= pay;
    }

    // Remove paid off
    active = active.filter(d => d.balance > 0.01);
  }

  return { months, totalInterest: Math.round(totalInterest) };
}

export default function DebtPayoffCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("avalanche");
  const [extraPayment, setExtraPayment] = useState(5000);
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const [debts, setDebts] = useState<Debt[]>([
    { id: 1, name: "Credit Card", balance: 100000, rate: 36, minPayment: 3000 },
    { id: 2, name: "Personal Loan", balance: 300000, rate: 14, minPayment: 8000 },
    { id: 3, name: "Car Loan", balance: 500000, rate: 9.5, minPayment: 12000 },
  ]);

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

  const addDebt = () => setDebts(p => [...p, { id: ++uid, name: "", balance: 100000, rate: 12, minPayment: 3000 }]);
  const removeDebt = (id: number) => setDebts(p => p.filter(d => d.id !== id));
  const changeDebt = (id: number, field: keyof Debt, val: any) =>
    setDebts(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));

  const { snowball, avalanche, chartData, totalBalance } = useMemo(() => {
    const snowball = simulatePayoff(debts, "snowball", extraPayment, adjustInflation, inflation);
    const avalanche = simulatePayoff(debts, "avalanche", extraPayment, adjustInflation, inflation);
    const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
    const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);

    const chartData = [
      { name: "Snowball\n(Lowest Balance First)", months: snowball.months, interest: Math.round(snowball.totalInterest / 1000) },
      { name: "Avalanche\n(Highest Rate First)", months: avalanche.months, interest: Math.round(avalanche.totalInterest / 1000) },
    ];

    return { snowball, avalanche, chartData, totalBalance, totalMin };
  }, [debts, extraPayment, adjustInflation, inflation]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  const interestSaved = snowball.totalInterest - avalanche.totalInterest;
  const monthsSaved = snowball.months - avalanche.months;

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Scissors className="text-emerald" /> Debt Snowball / Avalanche Tool
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Compare the two most proven debt payoff strategies — and find which saves you the most interest and time.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Debt List */}
        <div className="lg:col-span-1 space-y-5">
          <div className="p-5 glass-card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center justify-between">
              Your Debts
              <span className="text-red-400 text-sm">{fmt(totalBalance)}</span>
            </h2>

            <div className="space-y-3">
              {debts.map((d) => (
                <div key={d.id} className="p-3 rounded-xl border border-border-navy/60 bg-navy-bg/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={d.name} onChange={(e) => changeDebt(d.id, "name", e.target.value)} placeholder="Debt name…"
                      className="flex-1 bg-transparent border-b border-border-navy/50 text-xs text-white placeholder-muted-grey focus:outline-none focus:border-emerald/50 pb-0.5" />
                    <button onClick={() => removeDebt(d.id)} className="text-muted-grey hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] text-muted-grey mb-0.5">Balance</p>
                      <NumericInput value={d.balance} onChange={(v) => changeDebt(d.id, "balance", v)} min={0} max={10000000} step={10000} type="currency" />
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-grey mb-0.5">Rate %</p>
                      <NumericInput value={d.rate} onChange={(v) => changeDebt(d.id, "rate", v)} min={0} max={60} step={0.5} type="number" />
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-grey mb-0.5">Min EMI</p>
                      <NumericInput value={d.minPayment} onChange={(v) => changeDebt(d.id, "minPayment", v)} min={0} max={100000} step={500} type="currency" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addDebt} className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald hover:text-white transition-colors">
              <Plus size={13} /> Add Debt
            </button>
          </div>

          <div className="p-5 glass-card space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-sm font-bold text-white">Extra Monthly Payment</span>
                <NumericInput value={extraPayment} onChange={setExtraPayment} min={0} max={500000} step={500} type="currency" />
              </div>
              <input
                type="range"
                min={0}
                max={100000}
                step={500}
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <p className="text-[9.5px] text-muted-grey">Amount you can pay above all minimum payments combined. This is the engine of both strategies.</p>
            </div>

            {/* Inflation Toggle */}
            <div className="space-y-2 border-t border-border-navy/60 pt-4 flex items-center justify-between">
              <label htmlFor="adjust-inflation" className="text-xs font-semibold text-muted-grey cursor-pointer flex items-center gap-1">
                Adjust Interest for Inflation
                <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the future interest paid by the inflation rate to show its value in today's purchasing power."><HelpCircle size={12} /></span>
              </label>
              <input
                id="adjust-inflation"
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
                className="w-4 h-4 accent-emerald cursor-pointer rounded"
              />
            </div>

            {adjustInflation && (
              <div className="space-y-2 border-t border-border-navy/60 pt-4 animate-fadeIn">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-grey">Expected Inflation Rate</span>
                  <NumericInput value={inflation} onChange={setInflation} min={0} max={25} step={0.1} type="percent" />
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
                  className="text-[9px] text-left text-emerald/80 hover:text-emerald block mt-1 hover:underline cursor-pointer font-semibold animate-fadeIn"
                >
                  CPI Inflation Baseline ({rates.inflationRate}%)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strategy selector + winner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "avalanche" as const, label: "🏔️ Avalanche", sub: "Highest interest rate first", months: avalanche.months, interest: avalanche.totalInterest, winner: interestSaved > 0 },
              { key: "snowball" as const, label: "⛄ Snowball", sub: "Lowest balance first", months: snowball.months, interest: snowball.totalInterest, winner: interestSaved < 0 },
            ].map((s) => (
              <button key={s.key} onClick={() => setStrategy(s.key)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${strategy === s.key ? "border-emerald bg-emerald/10" : "border-border-navy bg-navy-card/30 hover:border-emerald/30"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{s.label}</span>
                  {s.winner && <span className="text-[9px] font-bold text-emerald bg-emerald/10 border border-emerald/20 px-1.5 py-0.5 rounded-full">Saves Most ₹</span>}
                </div>
                <p className="text-[10px] text-muted-grey">{s.sub}</p>
                <p className="text-xs font-bold text-white mt-2">{s.months} months to debt-free</p>
                <p className="text-[10px] text-red-400">{adjustInflation ? "Total interest (Real):" : "Total interest:"} {fmt(s.interest)}</p>
              </button>
            ))}
          </div>

          {/* Savings callout */}
          {interestSaved !== 0 && (
            <div className="p-4 rounded-2xl border border-emerald/30 bg-emerald/5 flex items-center gap-4">
              <Zap className="text-emerald shrink-0" size={24} />
              <div>
                <p className="text-sm font-bold text-white">
                  Avalanche saves <span className="text-emerald">{fmt(Math.abs(interestSaved))}</span> in {adjustInflation ? "real interest" : "interest"}
                  {Math.abs(monthsSaved) > 0 && <> and <span className="text-emerald">{Math.abs(monthsSaved)} months</span> vs Snowball</>}
                </p>
                <p className="text-[10px] text-muted-grey">But Snowball gives faster early wins, boosting motivation. Choose based on your psychology.</p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Strategy Comparison {adjustInflation ? "(Adjusted for Inflation)" : "(Nominal)"}</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="name" tick={{ fill: "#6b8cba", fontSize: 9 }} tickLine={false} />
                  <YAxis yAxisId="months" orientation="left" tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} label={{ value: "Months", angle: -90, position: "insideLeft", style: { fill: "#6b8cba", fontSize: 9 } }} />
                  <YAxis yAxisId="interest" orientation="right" tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} tickFormatter={(v) => `${v}K`} />
                  <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="months" dataKey="months" fill="#22c55e" name="Months to Payoff" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="interest" dataKey="interest" fill="#ef4444" name="Interest Paid (₹K)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Education */}
          <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><TrendingDown size={15} className="text-emerald" /> Snowball vs Avalanche — Which Should You Pick?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-grey">
              <div>
                <p className="font-bold text-amber-400 mb-1">⛄ Snowball (Psychological)</p>
                <p>Pay off smallest balance first. Creates quick wins. Research by Dave Ramsey and behavioural economists shows it keeps people motivated — especially those who have struggled to stick to debt plans before.</p>
              </div>
              <div>
                <p className="font-bold text-emerald mb-1">🏔️ Avalanche (Mathematical)</p>
                <p>Pay off highest interest rate first. Always minimises total interest paid. Ideal for disciplined people who don&apos;t need emotional momentum and just want the mathematically optimal path.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button onClick={() => setShowAudit(!showAudit)} className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer">
          <span className="flex items-center gap-1.5"><HelpCircle className="text-emerald" size={18} />How This is Calculated</span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
        </button>
        {showAudit && (
          <div className="text-xs text-muted-grey pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="bg-navy-bg/50 p-3 rounded-xl font-mono space-y-1">
              <p>Each month: Balance += Balance × (rate/12)</p>
              {adjustInflation && <p>Real Interest accrued at month m = Nominal Interest ÷ (1 + monthly_inflation)^m</p>}
              <p>Then: Balance −= min payment</p>
              <p>Extra payment applied to priority debt (per strategy)</p>
              <p>Simulation runs until all balances reach zero</p>
            </div>
            <p className="text-[10px] text-amber-500 mt-2">⚠️ <strong>Disclaimer:</strong> Educational simulation. Actual loan terms may vary.</p>
          </div>
        )}
      </div>
    </div>
  );
}
