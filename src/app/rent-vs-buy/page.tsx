"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Home, ChevronDown, HelpCircle, Landmark, TrendingUp } from "lucide-react";
import NumericInput from "@/components/NumericInput";

export default function RentVsBuyCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Shared
  const [years, setYears] = useState(20);

  // Renting
  const [monthlyRent, setMonthlyRent] = useState(25000);
  const [rentIncrease, setRentIncrease] = useState(7); // % per year
  const [rentInvestmentReturn, setRentInvestmentReturn] = useState(12); // what you invest the down payment at

  // Buying
  const [propertyPrice, setPropertyPrice] = useState(8000000);
  const [downPayment, setDownPayment] = useState(1600000); // 20%
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [propertyAppreciation, setPropertyAppreciation] = useState(6); // % per year
  const [maintenancePercent, setMaintenancePercent] = useState(1); // % of property value per year
  const [registrationCost, setRegistrationCost] = useState(400000); // stamp duty + registration

  useEffect(() => setMounted(true), []);

  const { chartData, breakEvenYear, rentSummary, buySummary } = useMemo(() => {
    const loanAmount = propertyPrice - downPayment;
    const r = loanRate / 100 / 12;
    const n = loanTenure * 12;
    const emi = r > 0 ? (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loanAmount / n;
    const annualEMI = emi * 12;

    // Renting: opportunity cost of down payment if invested
    const dpReturn = rentInvestmentReturn / 100 / 12;
    const totalDownPlusCosts = downPayment + registrationCost;

    let rentTotal = 0;
    let buyTotal = registrationCost;
    let chartData = [];
    let breakEvenYear: number | null = null;

    let currentRent = monthlyRent;
    let investedDownPayment = totalDownPlusCosts;
    let propertyValue = propertyPrice;

    for (let y = 1; y <= years; y++) {
      // Renting cost this year
      const rentThisYear = currentRent * 12;
      rentTotal += rentThisYear;
      currentRent *= (1 + rentIncrease / 100);

      // Investment growth of down payment (compound monthly)
      investedDownPayment = investedDownPayment * Math.pow(1 + dpReturn, 12);

      // Buying cost this year (EMI + maintenance, capped at loan tenure)
      const emiThisYear = y <= loanTenure ? annualEMI : 0;
      const maintenanceThisYear = propertyValue * (maintenancePercent / 100);
      buyTotal += emiThisYear + maintenanceThisYear;
      propertyValue *= (1 + propertyAppreciation / 100);

      // Net cost of buying = total paid - property value gained
      const netBuyCost = buyTotal - (propertyValue - propertyPrice);
      // Net cost of renting = total rent + opportunity cost of not investing dp
      const netRentCost = rentTotal + (investedDownPayment - totalDownPlusCosts);

      if (!breakEvenYear && netBuyCost <= rentTotal) {
        breakEvenYear = y;
      }

      chartData.push({
        year: `Yr ${y}`,
        "Total Rent Paid": Math.round(rentTotal),
        "Net Buy Cost": Math.round(Math.max(0, netBuyCost)),
        "Property Value": Math.round(propertyValue),
      });
    }

    const rentSummary = {
      totalRentPaid: rentTotal,
      downPaymentGrowth: Math.round(investedDownPayment),
    };
    const buySummary = {
      totalPaid: buyTotal,
      propertyValue: Math.round(propertyValue),
      netWealthGain: Math.round(propertyValue - buyTotal),
    };

    return { chartData, breakEvenYear, rentSummary, buySummary };
  }, [years, monthlyRent, rentIncrease, rentInvestmentReturn, propertyPrice, downPayment, loanRate, loanTenure, propertyAppreciation, maintenancePercent, registrationCost]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
  const fmtL = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : `₹${(v / 100000).toFixed(2)}L`;

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Home className="text-emerald" /> Home Rent vs. Buy Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Compare the true long-term financial cost of renting vs. buying — accounting for EMIs, appreciation, maintenance, and opportunity cost.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-5">
          <div className="p-5 glass-card space-y-5">
            <h2 className="text-base font-bold text-white">Comparison Period</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-grey">Years to compare</span>
                <span className="text-emerald">{years} yrs</span>
              </div>
              <input type="range" min={5} max={35} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer" />
            </div>
          </div>

          <div className="p-5 glass-card space-y-4">
            <h2 className="text-base font-bold text-blue-400 flex items-center gap-2"><Landmark size={15} /> Renting Parameters</h2>
            {[
              { label: "Monthly Rent", value: monthlyRent, set: setMonthlyRent, min: 5000, max: 200000, step: 1000, type: "currency" as const },
              { label: "Annual Rent Increase (%)", value: rentIncrease, set: setRentIncrease, min: 0, max: 20, step: 0.5, type: "number" as const },
              { label: "Down Payment Return (%)", value: rentInvestmentReturn, set: setRentInvestmentReturn, min: 4, max: 20, step: 0.5, type: "number" as const },
            ].map((f) => (
              <div key={f.label} className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">{f.label}</span>
                <NumericInput value={f.value} onChange={f.set} min={f.min} max={f.max} step={f.step} type={f.type} />
              </div>
            ))}
          </div>

          <div className="p-5 glass-card space-y-4">
            <h2 className="text-base font-bold text-emerald flex items-center gap-2"><Home size={15} /> Buying Parameters</h2>
            {[
              { label: "Property Price", value: propertyPrice, set: setPropertyPrice, min: 1000000, max: 100000000, step: 100000, type: "currency" as const },
              { label: "Down Payment", value: downPayment, set: setDownPayment, min: 100000, max: 30000000, step: 100000, type: "currency" as const },
              { label: "Home Loan Rate (%)", value: loanRate, set: setLoanRate, min: 6, max: 15, step: 0.1, type: "number" as const },
              { label: "Loan Tenure (yrs)", value: loanTenure, set: setLoanTenure, min: 5, max: 30, step: 1, type: "number" as const },
              { label: "Property Appreciation (%)", value: propertyAppreciation, set: setPropertyAppreciation, min: 0, max: 20, step: 0.5, type: "number" as const },
              { label: "Annual Maintenance (%)", value: maintenancePercent, set: setMaintenancePercent, min: 0, max: 3, step: 0.1, type: "number" as const },
              { label: "Stamp Duty + Registration", value: registrationCost, set: setRegistrationCost, min: 0, max: 3000000, step: 50000, type: "currency" as const },
            ].map((f) => (
              <div key={f.label} className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-grey">{f.label}</span>
                <NumericInput value={f.value} onChange={f.set} min={f.min} max={f.max} step={f.step} type={f.type} />
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Break Even */}
          <div className={`p-5 rounded-2xl border text-center space-y-1 ${breakEvenYear ? "border-emerald/40 bg-emerald/5" : "border-amber-500/40 bg-amber-500/5"}`}>
            <p className="text-xs uppercase font-bold text-muted-grey">Break-Even Point</p>
            {breakEvenYear ? (
              <>
                <p className="text-4xl font-extrabold text-emerald glow-emerald">Year {breakEvenYear}</p>
                <p className="text-xs text-muted-grey">Buying becomes cheaper than renting after {breakEvenYear} years</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-amber-400">Not within {years} years</p>
                <p className="text-xs text-muted-grey">Renting + investing the down payment remains cheaper in this scenario</p>
              </>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
              <h3 className="text-xs font-bold text-blue-400">🏠 Renting Scenario</h3>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-grey">Total Rent Paid</span><span className="text-white font-semibold">{fmtL(rentSummary.totalRentPaid)}</span></div>
                <div className="flex justify-between"><span className="text-muted-grey">Down Payment Grows To</span><span className="text-emerald font-semibold">{fmtL(rentSummary.downPaymentGrowth)}</span></div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-emerald/30 bg-emerald/5 space-y-2">
              <h3 className="text-xs font-bold text-emerald">🏡 Buying Scenario</h3>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-grey">Total Outflow</span><span className="text-white font-semibold">{fmtL(buySummary.totalPaid)}</span></div>
                <div className="flex justify-between"><span className="text-muted-grey">Property Value</span><span className="text-emerald font-semibold">{fmtL(buySummary.propertyValue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-grey">Net Wealth Gain</span><span className={`font-semibold ${buySummary.netWealthGain >= 0 ? "text-emerald" : "text-red-400"}`}>{fmtL(buySummary.netWealthGain)}</span></div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cumulative Cost Comparison ({years} Years)</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="rent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="buy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} interval={Math.floor(years / 5)} />
                  <YAxis tick={{ fill: "#6b8cba", fontSize: 10 }} tickLine={false} tickFormatter={(v) => v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : `${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Total Rent Paid" stroke="#3b82f6" fill="url(#rent)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Net Buy Cost" stroke="#22c55e" fill="url(#buy)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Education */}
          <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><TrendingUp size={15} className="text-emerald" /> The Hidden Costs Most People Ignore</h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-grey">
              <div>
                <p className="font-bold text-blue-400 mb-1">When Renting Wins</p>
                <ul className="space-y-1 text-[11px] list-disc pl-4">
                  <li>Property appreciation is low (&lt;5%)</li>
                  <li>You invest the down payment productively</li>
                  <li>You move cities frequently for career growth</li>
                  <li>Property prices are very high vs. rental yield</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-emerald mb-1">When Buying Wins</p>
                <ul className="space-y-1 text-[11px] list-disc pl-4">
                  <li>You plan to stay 10+ years in one city</li>
                  <li>Rental yield is high relative to EMI</li>
                  <li>Property is in a high-appreciation corridor</li>
                  <li>Psychological value of ownership matters</li>
                </ul>
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
          <div className="text-xs text-muted-grey pt-4 border-t border-border-navy/60 animate-fadeIn space-y-2">
            <div className="bg-navy-bg/50 p-3 rounded-xl font-mono space-y-1">
              <p>EMI = P × r × (1+r)^n / [(1+r)^n − 1]</p>
              <p>Annual Rent grows at: Rent × (1 + rentIncrease%)^year</p>
              <p>Property Value grows at: Price × (1 + appreciation%)^year</p>
              <p>Net Buy Cost = Total Paid − (Property Value − Purchase Price)</p>
            </div>
            <p className="text-[10px] text-amber-500">⚠️ <strong>Disclaimer:</strong> Educational model. Actual returns, appreciation, and costs vary significantly by city and market conditions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
