"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Info, HelpCircle, TrendingUp, AlertTriangle, Landmark, ShieldCheck } from "lucide-react";

export default function SipCalculator() {
  const [calcMode, setCalcMode] = useState<"sip" | "lumpsum" | "fd-vs-mf">("sip");
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(12);
  const [fdRate, setFdRate] = useState(7.0);
  const [taxSlab, setTaxSlab] = useState(30); // 10%, 20%, 30%
  const [years, setYears] = useState(15);
  const [inflation, setInflation] = useState(5.09);
  const [adjustInflation, setAdjustInflation] = useState(true);
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

  // Update default amount on mode change to match standard scales
  const handleModeChange = (mode: "sip" | "lumpsum" | "fd-vs-mf") => {
    setCalcMode(mode);
    if (mode === "sip") {
      setAmount(10000);
      setRate(12);
    } else {
      setAmount(100000);
      setRate(12);
    }
  };

  // Re-calculate the numbers based on state changes
  const calculations = useMemo(() => {
    const data = [];
    let totalInvested = 0;
    let futureValue = 0;
    let inflationAdjustedValue = 0;

    const r = rate / 100;
    const infRate = inflation / 100;
    
    if (calcMode === "sip") {
      const monthlyRate = r / 12;
      const monthlyInfRate = infRate / 12;
      
      for (let y = 1; y <= years; y++) {
        const months = y * 12;
        const fvValue = amount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
        const invested = amount * months;
        const realMonthlyRate = (1 + monthlyRate) / (1 + monthlyInfRate) - 1;
        const infAdjustedFv = amount * (((Math.pow(1 + realMonthlyRate, months) - 1) / realMonthlyRate) * (1 + realMonthlyRate));

        totalInvested = invested;
        futureValue = fvValue;
        inflationAdjustedValue = infAdjustedFv;

        data.push({
          year: `Yr ${y}`,
          "Amount Invested": Math.round(invested),
          "Future Value": Math.round(fvValue),
          "Inflation Adjusted": Math.round(infAdjustedFv)
        });
      }
    } else if (calcMode === "lumpsum") {
      for (let y = 1; y <= years; y++) {
        const fvValue = amount * Math.pow(1 + r, y);
        const infAdjustedFv = fvValue / Math.pow(1 + infRate, y);

        totalInvested = amount;
        futureValue = fvValue;
        inflationAdjustedValue = infAdjustedFv;

        data.push({
          year: `Yr ${y}`,
          "Amount Invested": Math.round(amount),
          "Future Value": Math.round(fvValue),
          "Inflation Adjusted": Math.round(infAdjustedFv)
        });
      }
    } else {
      // FD vs Mutual Fund Real Yield mode
      const rf = fdRate / 100;
      const taxRate = taxSlab / 100;
      const fdPostTaxRate = rf * (1 - taxRate);

      for (let y = 1; y <= years; y++) {
        // FD Post-Tax Nominal & Real (Inflation Adjusted)
        const fdNominal = amount * Math.pow(1 + fdPostTaxRate, y);
        const fdReal = fdNominal / Math.pow(1 + infRate, y);

        // Mutual Fund Nominal
        const mfNominal = amount * Math.pow(1 + r, y);
        // Calculate 12.5% LTCG Tax with ₹1.25L exemption (simulated at year y withdrawal)
        const mfGain = mfNominal - amount;
        const mfTax = Math.max(0, mfGain - 125000) * 0.125;
        const mfPostTax = mfNominal - mfTax;
        const mfReal = mfPostTax / Math.pow(1 + infRate, y);

        data.push({
          year: `Yr ${y}`,
          "Fixed Deposit (Real Value)": Math.round(fdReal),
          "Mutual Fund (Real Value)": Math.round(mfReal),
          "FD Nominal": Math.round(fdNominal),
          "MF Nominal": Math.round(mfPostTax)
        });
      }

      totalInvested = amount;
      
      // Calculate final values for stats
      const finalMfNominal = amount * Math.pow(1 + r, years);
      const finalMfGain = finalMfNominal - amount;
      const finalMfTax = Math.max(0, finalMfGain - 125000) * 0.125;
      futureValue = finalMfNominal - finalMfTax; // MF post-tax final

      const finalFdNominal = amount * Math.pow(1 + fdPostTaxRate, years);
      const finalFdReal = finalFdNominal / Math.pow(1 + infRate, years);
      inflationAdjustedValue = finalFdReal; // Store FD final real
    }

    return {
      totalInvested,
      futureValue: Math.round(futureValue),
      inflationAdjustedValue: Math.round(inflationAdjustedValue),
      chartData: data
    };
  }, [calcMode, amount, rate, fdRate, taxSlab, years, inflation]);

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
            <TrendingUp className="text-emerald" />
            Compounding & Yield Simulator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Simulate compounding speeds, adjust for inflation, and compare Fixed Deposits against Index Mutual Funds.
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
            <h2 className="text-lg font-bold text-white">Investment Parameters</h2>

            {/* Toggle Switch */}
            <div className="flex bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
              <button
                onClick={() => handleModeChange("sip")}
                className={`flex-1 py-2 rounded-md transition-all ${
                  calcMode === "sip" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                }`}
              >
                Monthly SIP
              </button>
              <button
                onClick={() => handleModeChange("lumpsum")}
                className={`flex-1 py-2 rounded-md transition-all ${
                  calcMode === "lumpsum" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                }`}
              >
                Lumpsum
              </button>
              <button
                onClick={() => handleModeChange("fd-vs-mf")}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                  calcMode === "fd-vs-mf" ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                }`}
              >
                <Landmark size={10} />
                <span>FD vs MF</span>
              </button>
            </div>

            {/* Amount Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-grey">
                  {calcMode === "sip" ? "Monthly SIP Amount" : "Lumpsum Principal"}
                </span>
                <span className="text-emerald">{formatCurrency(amount)}</span>
              </div>
              <input
                type="range"
                min={calcMode === "sip" ? 500 : 10000}
                max={calcMode === "sip" ? 100000 : 2500000}
                step={calcMode === "sip" ? 500 : 10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>{calcMode === "sip" ? "₹500" : "₹10K"}</span>
                <span>{calcMode === "sip" ? "₹1L" : "₹25L"}</span>
              </div>
            </div>

            {/* Mutual Fund Return Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-grey">
                  {calcMode === "fd-vs-mf" ? "Mutual Fund Return Rate" : "Expected Return Rate (p.a.)"}
                </span>
                <span className="text-emerald">{rate}%</span>
              </div>
              <input
                type="range"
                min={4}
                max={25}
                step={0.5}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>4%</span>
                <span>25%</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setRate(rates.bondYield10Y)}
                  className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all"
                >
                  Sovereign 10Y Yield ({rates.bondYield10Y}%)
                </button>
                <button
                  type="button"
                  onClick={() => setRate(12)}
                  className="text-[9px] font-bold text-white border border-border-navy bg-navy-light/40 hover:bg-navy-light px-2 py-0.5 rounded transition-all"
                >
                  Equity Index (12%)
                </button>
              </div>
            </div>

            {/* FD Specific Sliders */}
            {calcMode === "fd-vs-mf" && (
              <div className="space-y-4 pt-4 border-t border-border-navy/60 animate-fadeIn">
                {/* FD Yield Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-grey">Fixed Deposit Rate (p.a.)</span>
                    <span className="text-emerald">{fdRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={10}
                    step={0.1}
                    value={fdRate}
                    onChange={(e) => setFdRate(Number(e.target.value))}
                    className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-grey">
                    <span>4%</span>
                    <span>10%</span>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setFdRate(rates.repoRate)}
                      className="text-[9px] font-bold text-emerald border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 px-2 py-0.5 rounded transition-all"
                    >
                      RBI Repo Rate ({rates.repoRate}%)
                    </button>
                  </div>
                </div>

                {/* Tax Slab selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-grey block">
                    Your FD Tax Slab (Income Tax)
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                    {[10, 20, 30].map((slab) => (
                      <button
                        key={slab}
                        type="button"
                        onClick={() => setTaxSlab(slab)}
                        className={`py-1 rounded transition-colors ${
                          taxSlab === slab ? "bg-amber-500 text-navy-bg" : "text-muted-grey hover:text-white"
                        }`}
                      >
                        {slab}% Slab
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] text-muted-grey block leading-tight">
                    *FD interest is taxed at your income slab. Mutual Funds enjoy 12.5% flat LTCG after 1 year.
                  </span>
                </div>
              </div>
            )}

            {/* Time Horizon Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-grey">Time Horizon</span>
                <span className="text-emerald">{years} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={40}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-grey">
                <span>1 Yr</span>
                <span>40 Yrs</span>
              </div>
            </div>

            {/* Inflation Toggle */}
            {calcMode !== "fd-vs-mf" && (
              <div className="border-t border-border-navy pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-grey flex items-center gap-1.5">
                    Adjust for Inflation
                    <span className="text-muted-grey/60 cursor-help inline-flex" title="Reduces the final value by inflation rate to show real purchasing power."><HelpCircle size={14} /></span>
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
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-grey">Expected Inflation Rate</span>
                      <span className="text-amber-500">{inflation}%</span>
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
                    <div className="flex justify-between text-[10px] text-muted-grey">
                      <span>3%</span>
                      <span>12%</span>
                    </div>
                    <div className="pt-1 text-left">
                      <button
                        type="button"
                        onClick={() => setInflation(rates.inflationRate)}
                        className="text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded transition-all"
                      >
                        CPI Inflation Baseline ({rates.inflationRate}%)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* In FD mode, inflation is always visible because it is critical to compare real yields */}
            {calcMode === "fd-vs-mf" && (
              <div className="border-t border-border-navy pt-4 space-y-2 animate-fadeIn">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-grey">Economic Inflation Rate</span>
                  <span className="text-amber-500">{inflation}%</span>
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
                <div className="flex justify-between text-[10px] text-muted-grey">
                  <span>3%</span>
                  <span>12%</span>
                </div>
                <div className="pt-1 text-left">
                  <button
                    type="button"
                    onClick={() => setInflation(rates.inflationRate)}
                    className="text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-2 py-0.5 rounded transition-all"
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
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Invested</span>
              <p className="text-xl font-bold text-white mt-1">
                {formatCurrency(calculations.totalInvested)}
              </p>
            </div>
            
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">
                {calcMode === "fd-vs-mf" ? "Mutual Fund Final (Post-Tax)" : "Estimated Future Value"}
              </span>
              <p className="text-xl font-bold text-emerald mt-1">
                {formatCurrency(calculations.futureValue)}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">
                {calcMode === "fd-vs-mf" ? "Fixed Deposit (Post-Tax Real)" : "Inflation Adjusted Value"}
              </span>
              <p className={`text-xl font-bold mt-1 ${
                calcMode === "fd-vs-mf" && calculations.inflationAdjustedValue < amount ? "text-red-400" : "text-amber-500"
              }`}>
                {formatCurrency(calculations.inflationAdjustedValue)}
              </p>
              {calcMode === "fd-vs-mf" && calculations.inflationAdjustedValue < amount && (
                <span className="text-[9px] text-red-400 font-semibold block leading-tight mt-0.5">
                  ⚠️ Negative Real Returns! Your purchasing power shrank.
                </span>
              )}
            </div>
          </div>

          {/* Chart Display */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {calcMode === "fd-vs-mf" 
                  ? "Real Purchasing Power Comparison (Inflation-Adjusted)" 
                  : "Compounding Growth Area Map"}
              </h3>
              <span className="text-[10px] text-muted-grey bg-navy-bg px-2 py-0.5 border border-border-navy rounded font-mono">
                {years} Yr Timeline
              </span>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={calculations.chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val/1000}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#081c3a",
                      borderColor: "#112d55",
                      borderRadius: "8px",
                      color: "#f1f5f9"
                    }}
                    formatter={(v: any) => [formatCurrency(v), ""]}
                  />
                  <Legend iconType="circle" />
                  
                  {calcMode === "fd-vs-mf" ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="Mutual Fund (Real Value)"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorFv)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Fixed Deposit (Real Value)"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorFd)"
                        strokeWidth={2}
                      />
                    </>
                  ) : (
                    <>
                      <Area
                        type="monotone"
                        dataKey="Future Value"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorFv)"
                        strokeWidth={2}
                      />
                      {adjustInflation && (
                        <Area
                          type="monotone"
                          dataKey="Inflation Adjusted"
                          stroke="#f59e0b"
                          fillOpacity={1}
                          fill="url(#colorReal)"
                          strokeWidth={2}
                        />
                      )}
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Educational Note cards */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Info className="text-emerald" size={18} />
              Educational Concept: Real Yields vs Taxes
            </h3>

            {calcMode === "fd-vs-mf" ? (
              <div className="text-xs text-muted-grey leading-relaxed space-y-3 border-t border-border-navy/60 pt-4">
                <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <p>
                    <strong>The FD Wealth erosion:</strong> Banks offer nominal rates (e.g. 7%). After subtracting 30% income tax slab, the yield drops to <strong>4.9%</strong>. Since inflation is <strong>5.09%</strong>, your purchasing power drops by <strong>-0.19% every year</strong>. Your money is actually shrinking in real terms!
                  </p>
                </div>
                <div className="flex items-start gap-2 bg-emerald/5 border border-emerald/10 p-3 rounded-xl">
                  <ShieldCheck className="text-emerald shrink-0 mt-0.5" size={16} />
                  <p>
                    <strong>The Mutual Fund Compounding Advantage:</strong> Equities compound at a higher nominal rate (e.g. 12%). Because tax is deferred until withdrawal (and LTCG enjoy a flat 12.5% rate with a ₹1.25L annual exemption), your money grows with less tax friction, yielding a real post-tax return of <strong>~6.5% p.a.</strong> above inflation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-grey leading-relaxed grid md:grid-cols-2 gap-6 border-t border-border-navy/60 pt-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-white">The Compounding Engine</h4>
                  <p>
                    Compounding builds wealth exponentially. Over 15 years, a ₹10,000 monthly SIP (total invested: ₹18 Lakhs) growing at 12% compounds to more than ₹50 Lakhs! Time is the most critical variable—starting 3 years earlier can increase your final wealth by 40% due to late-stage exponential curves.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-white">Why Adjust for Inflation?</h4>
                  <p>
                    At 5% inflation, a cup of coffee costing ₹100 today will cost ₹208 in 15 years. While your nominal corpus might reach ₹50 Lakhs, its purchasing power (real value) is equivalent to only ₹24 Lakhs today. Always calibrate your targets using the <strong>Inflation Adjusted</strong> toggle to ensure you budget enough!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
