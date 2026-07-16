"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Calculator, Info, HelpCircle, Plus, Trash2, Calendar, TrendingUp } from "lucide-react";
import NumericInput from "@/components/NumericInput";

interface Transaction {
  id: string;
  date: string;
  amount: number; // negative for investment, positive for redemptions
}

export default function XirrCalculator() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", date: "2024-01-01", amount: -100000 },
    { id: "2", date: "2024-07-01", amount: -10000 },
    { id: "3", date: "2025-01-01", amount: -10000 },
    { id: "4", date: "2025-07-01", amount: 145000 }
  ]);

  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setInflation(data.inflationRate);
      })
      .catch((err) => console.error("Error loading rates", err));
  }, []);

  const addTransaction = () => {
    // Pick the day after the last transaction date
    let lastDate = "2025-07-02";
    if (transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.date).getTime());
      const maxDate = new Date(Math.max(...dates));
      maxDate.setDate(maxDate.getDate() + 30); // default to 1 month later
      lastDate = maxDate.toISOString().split("T")[0];
    }
    
    setTransactions([
      ...transactions,
      {
        id: Math.random().toString(),
        date: lastDate,
        amount: 10000
      }
    ]);
  };

  const removeTransaction = (id: string) => {
    if (transactions.length <= 2) {
      alert("At least 2 transactions are required to calculate XIRR.");
      return;
    }
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, field: keyof Transaction, val: any) => {
    setTransactions(
      transactions.map(t => (t.id === id ? { ...t, [field]: val } : t))
    );
  };

  // Robust XIRR Solver (Newton-Raphson)
  const calculateXirrResult = useMemo(() => {
    // Validation: Needs at least one positive and one negative cashflow
    const amounts = transactions.map(t => t.amount);
    const hasNegative = amounts.some(a => a < 0);
    const hasPositive = amounts.some(a => a > 0);

    if (!hasNegative || !hasPositive) {
      return { success: false, error: "XIRR requires both cash outflows (negative) and inflows/valuations (positive)." };
    }

    // Sort cash flows by date
    const parsedFlows = transactions
      .map(t => ({
        date: new Date(t.date),
        amount: t.amount
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const d1 = parsedFlows[0].date.getTime();

    // Equation f(r) = sum( C_k / (1+r)^((d_k-d_1)/365) )
    const f = (r: number) => {
      let sum = 0;
      for (let i = 0; i < parsedFlows.length; i++) {
        const days = (parsedFlows[i].date.getTime() - d1) / (1000 * 60 * 60 * 24);
        sum += parsedFlows[i].amount / Math.pow(1 + r, days / 365);
      }
      return sum;
    };

    // Derivative df(r)
    const df = (r: number) => {
      let sum = 0;
      for (let i = 0; i < parsedFlows.length; i++) {
        const days = (parsedFlows[i].date.getTime() - d1) / (1000 * 60 * 60 * 24);
        sum -= (days / 365) * parsedFlows[i].amount / Math.pow(1 + r, (days / 365) + 1);
      }
      return sum;
    };

    // Solver iteration
    let r = 0.1; // initial guess
    const maxIterations = 100;
    const precision = 1e-7;
    let converged = false;

    for (let iter = 0; iter < maxIterations; iter++) {
      const val = f(r);
      const deriv = df(r);
      if (Math.abs(deriv) < 1e-12) break;
      
      const nextR = r - val / deriv;
      if (Math.abs(nextR - r) < precision) {
        r = nextR;
        converged = true;
        break;
      }
      r = nextR;
    }

    if (!converged) {
      // Fallback: try bisection method in range [-0.99, 5]
      let low = -0.99;
      let high = 5.0;
      for (let iter = 0; iter < 100; iter++) {
        const mid = (low + high) / 2;
        const val = f(mid);
        if (Math.abs(val) < 1e-5) {
          r = mid;
          converged = true;
          break;
        }
        if (f(low) * val < 0) {
          high = mid;
        } else {
          low = mid;
        }
      }
    }

    if (!converged) {
      return { success: false, error: "XIRR solver did not converge. Check date sequence and amounts." };
    }

    const xirrNominal = r * 100;
    const infRate = inflation / 100;
    // Real XIRR = (1 + XIRR) / (1 + inflation) - 1
    const xirrReal = ((1 + r) / (1 + infRate) - 1) * 100;

    // Summary calculations
    let totalInvested = 0;
    let totalRedeemed = 0;
    amounts.forEach(a => {
      if (a < 0) totalInvested += Math.abs(a);
      else totalRedeemed += a;
    });

    return {
      success: true,
      xirrNominal: xirrNominal.toFixed(2),
      xirrReal: xirrReal.toFixed(2),
      totalInvested,
      totalRedeemed,
      netGain: totalRedeemed - totalInvested
    };
  }, [transactions, inflation]);

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
            XIRR Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Calculate the Extended Internal Rate of Return (XIRR) for irregular transaction cash flows, adjusted for inflation.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cashflow Input Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 glass-card space-y-4">
            <div className="flex justify-between items-center border-b border-border-navy/60 pb-3">
              <h2 className="text-lg font-bold text-white">Cash Flow Ledger</h2>
              <button
                onClick={addTransaction}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald text-navy-bg font-extrabold rounded-lg hover:bg-emerald/90 text-xs transition-colors cursor-pointer"
              >
                <Plus size={14} />
                Add Cash Flow
              </button>
            </div>

            {/* Input list header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 text-[10px] uppercase font-bold text-muted-grey px-2">
              <div className="col-span-4">Transaction Date</div>
              <div className="col-span-6">Amount (Negative: Invested / Positive: Redeemed)</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {/* Input list */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {transactions.map((t) => (
                <div key={t.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-2 rounded-xl bg-navy-bg border border-border-navy/60 hover:border-emerald/30 transition-all">
                  
                  {/* Date Input */}
                  <div className="col-span-4 relative flex items-center gap-2">
                    <Calendar className="text-muted-grey shrink-0" size={14} />
                    <input
                      type="date"
                      value={t.date}
                      onChange={(e) => updateTransaction(t.id, "date", e.target.value)}
                      className="bg-transparent text-xs font-bold text-white outline-none border-b border-border-navy/60 focus:border-emerald pb-0.5 w-full cursor-pointer"
                    />
                  </div>

                  {/* Amount Input */}
                  <div className="col-span-6 flex items-center gap-2">
                    <NumericInput
                      value={t.amount}
                      onChange={(val) => updateTransaction(t.id, "amount", val)}
                      min={-1000000000}
                      max={1000000000}
                      step={500}
                      type="currency"
                      className="w-full text-left"
                    />
                    <span className="text-[9px] text-muted-grey shrink-0 leading-none">
                      {t.amount < 0 ? "📉 Outflow (Buy)" : "📈 Inflow (Sell/Val)"}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => removeTransaction(t.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer inline-flex border border-red-500/20"
                      title="Remove transaction"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-muted-grey leading-relaxed p-3 bg-navy-bg border border-border-navy/60 rounded-xl space-y-1">
              <span className="font-bold text-white block">💡 Dynamic Valuation Rule:</span>
              To evaluate a running portfolio, the **last transaction** should be the **current date** with a **positive amount** representing the current valuation of your holdings. All past buys should be entered as negative amounts.
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass-card space-y-6">
            <h2 className="text-lg font-bold text-white">XIRR Calculations</h2>

            {/* Inflation Toggle */}
            <div className="space-y-4 border-b border-border-navy/60 pb-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                  Adjust for Inflation
                  <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces cash flow values to calculate real rate of return."><HelpCircle size={14} /></span>
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
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-grey">Expected Inflation Rate</span>
                    <NumericInput
                      value={inflation}
                      onChange={setInflation}
                      min={0}
                      max={25}
                      step={0.1}
                      type="percent"
                      className="text-amber-500 focus-within:border-amber-500/50"
                    />
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    step={0.5}
                    value={inflation}
                    onChange={(e) => setInflation(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-navy-bg h-1 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Calculations results */}
            {calculateXirrResult.success ? (
              <div className="space-y-6">
                {/* Nominal vs Real Output */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border-navy bg-navy-light/10 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-grey block">Nominal XIRR</span>
                    <p className="text-2xl font-black text-emerald mt-1">{calculateXirrResult.xirrNominal}%</p>
                  </div>
                  <div className="p-4 rounded-xl border border-emerald/20 bg-emerald/5 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald block">Real XIRR</span>
                    <p className="text-2xl font-black text-white mt-1">
                      {adjustInflation ? `${calculateXirrResult.xirrReal}%` : "—"}
                    </p>
                  </div>
                </div>

                {/* Ledger metrics */}
                <div className="space-y-2 border-t border-border-navy/60 pt-4 text-xs font-semibold text-light-grey">
                  <div className="flex justify-between">
                    <span className="text-muted-grey">Total Cash Invested:</span>
                    <span>{formatCurrency(calculateXirrResult.totalInvested || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-grey">Total Payout/Value:</span>
                    <span>{formatCurrency(calculateXirrResult.totalRedeemed || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border-navy/40 pt-2 text-emerald">
                    <span>Net Gain:</span>
                    <span className="font-bold">{formatCurrency(calculateXirrResult.netGain || 0)}</span>
                  </div>
                </div>

                {adjustInflation && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-light-grey rounded-lg text-[10px] leading-relaxed">
                    <span className="font-bold text-amber-500 mr-0.5">⚠️ Real Growth Reality:</span>
                    Your nominal compound rate is <strong>{calculateXirrResult.xirrNominal}%</strong>. Factoring in <strong>{inflation}%</strong> price inflation, the real rate at which your capital grew in purchasing power is <strong>{calculateXirrResult.xirrReal}%</strong> p.a.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold leading-normal">
                {calculateXirrResult.error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guide Section */}
      <section className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
          <Info className="text-emerald" size={20} />
          XIRR (Extended Internal Rate of Return) Explained
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-grey">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Nominal XIRR vs. Simple Returns</h4>
            <p>
              When you invest money periodically (like monthly mutual fund SIPs, partial lumpsum additions, or erratic buy-and-sell transactions), calculating simple absolute return or basic CAGR is highly misleading because they ignore **when** each cash flow took place.
            </p>
            <p>
              <strong>XIRR (Extended Internal Rate of Return):</strong> This calculates the single annualized rate of return that matches the present value of all irregular cash flows (both buys and sells/valuations) to zero. It is the only mathematically correct metric to assess the compounding power of real-world portfolios with periodic additions or withdrawals.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">How Inflation-Adjusted XIRR is Computed</h4>
            <p>
              Just as nominal XIRR represents your nominal compound return, **Real XIRR** represents the rate at which your actual purchasing power grew.
            </p>
            <p>
              To calculate it, we discount each transaction cash flow to the initial investment date using the inflation rate:
              <div className="bg-navy-bg p-2 border border-border-navy my-1 rounded text-[10px] text-center font-mono">
                C&apos;_k = C_k / (1 + inflation)^((d_k - d_1)/365)
              </div>
              Then we run the XIRR numerical solver on these discounted cash flows. This is mathematically identical to the Fisher Equation:
              <div className="bg-navy-bg p-2 border border-border-navy my-1 rounded text-[10px] text-center font-mono">
                Real XIRR = (1 + Nominal XIRR) / (1 + Inflation) - 1
              </div>
              Real XIRR reveals whether your active portfolio allocation beats inflation, or if your gains are largely an illusion.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
