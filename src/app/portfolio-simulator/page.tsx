"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Shield,
  PieChart as PieIcon,
  BarChart3,
  Sliders,
  AlertTriangle,
  Layers,
  Zap,
  Target,
  Dices,
  Info,
  RefreshCw,
  Sparkles,
  Calendar
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

import {
  getAvailableYears,
  AssetClassKey,
  ASSET_METADATA
} from "@/lib/simulator/historicalData";
import {
  AllocationConfig,
  runPortfolioSimulation,
  SimulationOutput
} from "@/lib/simulator/engine";
import { calculatePortfolioHealthScore } from "@/lib/simulator/healthScore";
import { runStressTestScenarios } from "@/lib/simulator/stressTest";
import { evaluateWhatIfScenario } from "@/lib/simulator/whatIf";
import { runMonteCarloSimulation } from "@/lib/simulator/monteCarlo";
import { calculateGoalPlan } from "@/lib/simulator/goalPlanner";
import { generateChartInsight, generateComparisonInsight } from "@/lib/simulator/aiMentor";

// Helper for formatting currency in Indian Lakhs / Crores
function formatINR(val: number): string {
  if (isNaN(val)) return "₹0";
  const absVal = Math.abs(val);
  const sign = val < 0 ? "-" : "";

  if (absVal >= 10000000) {
    return `${sign}₹${(absVal / 10000000).toFixed(2)} Cr`;
  } else if (absVal >= 100000) {
    return `${sign}₹${(absVal / 100000).toFixed(2)} L`;
  } else {
    return `${sign}₹${Math.round(absVal).toLocaleString("en-IN")}`;
  }
}

// Preset Allocations
const PRESET_ALLOCATIONS: Record<string, { label: string; config: AllocationConfig }> = {
  equity100: {
    label: "100% Large Cap Equity",
    config: { equity: 100, niftyNext50: 0, international: 0, debt: 0, gold: 0, ppf: 0, liquid: 0, cash: 0 }
  },
  aggressive: {
    label: "Aggressive (80/20)",
    config: { equity: 50, niftyNext50: 20, international: 10, debt: 10, gold: 10, ppf: 0, liquid: 0, cash: 0 }
  },
  balanced: {
    label: "Balanced (60/20/20)",
    config: { equity: 40, niftyNext50: 15, international: 5, debt: 20, gold: 15, ppf: 5, liquid: 0, cash: 0 }
  },
  conservative: {
    label: "Conservative (30/70)",
    config: { equity: 20, niftyNext50: 10, international: 0, debt: 40, gold: 10, ppf: 15, liquid: 5, cash: 0 }
  },
  allWeather: {
    label: "All Weather Strategy",
    config: { equity: 30, niftyNext50: 10, international: 10, debt: 25, gold: 20, ppf: 5, liquid: 0, cash: 0 }
  }
};

export default function PortfolioStrategySimulatorPage() {
  const [mounted, setMounted] = useState(false);
  const availableYears = useMemo(() => getAvailableYears(), []);

  // Form Inputs
  const [monthlySip, setMonthlySip] = useState(10000);
  const [lumpSum, setLumpSum] = useState(100000);
  const [startYear, setStartYear] = useState(2005);
  const [endYear, setEndYear] = useState(2025);

  // Asset Allocations (default balanced)
  const [allocation, setAllocation] = useState<AllocationConfig>(PRESET_ALLOCATIONS.balanced.config);

  // Active UI Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "compare" | "health" | "stress" | "whatif" | "goal" | "montecarlo"
  >("overview");

  // Comparison Portfolio State (Portfolio B)
  const [comparisonAllocation, setComparisonAllocation] = useState<AllocationConfig>(
    PRESET_ALLOCATIONS.equity100.config
  );

  // What-If Simulator Options
  const [whatIfStepUp, setWhatIfStepUp] = useState(10);
  const [whatIfPauseMonths, setWhatIfPauseMonths] = useState(0);
  const [whatIfBonus, setWhatIfBonus] = useState(50000);
  const [whatIfRebalance, setWhatIfRebalance] = useState(true);

  // Goal Planner State
  const [goalName, setGoalName] = useState("Retirement Wealth Fund");
  const [goalTargetToday, setGoalTargetToday] = useState(10000000); // 1 Crore
  const [goalCurrentSavings, setGoalCurrentSavings] = useState(200000);
  const [goalHorizonYears, setGoalHorizonYears] = useState(15);
  const [goalInflationPct, setGoalInflationPct] = useState(6.0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate total allocation percentage
  const totalAllocationPct = useMemo(() => {
    return Object.values(allocation).reduce((sum, val) => sum + (val || 0), 0);
  }, [allocation]);

  const normalizeAllocations = () => {
    if (totalAllocationPct === 0) return;
    const factor = 100 / totalAllocationPct;
    const nextAlloc = { ...allocation };
    (Object.keys(nextAlloc) as AssetClassKey[]).forEach((k) => {
      nextAlloc[k] = Math.round(nextAlloc[k] * factor);
    });
    setAllocation(nextAlloc);
  };

  // Primary Simulation Output
  const simOutput: SimulationOutput | null = useMemo(() => {
    try {
      return runPortfolioSimulation({
        monthlySip,
        lumpSum,
        startYear,
        endYear,
        allocation
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [monthlySip, lumpSum, startYear, endYear, allocation]);

  // Comparison Simulation Output (Portfolio B)
  const simComparisonOutput: SimulationOutput | null = useMemo(() => {
    try {
      return runPortfolioSimulation({
        monthlySip,
        lumpSum,
        startYear,
        endYear,
        allocation: comparisonAllocation
      });
    } catch (e) {
      return null;
    }
  }, [monthlySip, lumpSum, startYear, endYear, comparisonAllocation]);

  // Health Score Report
  const healthReport = useMemo(() => {
    if (!simOutput) return null;
    return calculatePortfolioHealthScore(allocation, simOutput);
  }, [allocation, simOutput]);

  // Stress Test Scenarios
  const stressResults = useMemo(() => {
    return runStressTestScenarios(allocation, monthlySip, lumpSum);
  }, [allocation, monthlySip, lumpSum]);

  // What-If Result
  const whatIfResult = useMemo(() => {
    if (!simOutput) return null;
    return evaluateWhatIfScenario(
      { monthlySip, lumpSum, startYear, endYear, allocation },
      { annualStepUpPct: whatIfStepUp, pauseSipMonths: whatIfPauseMonths, bonusYearly: whatIfBonus, rebalanceAnnual: whatIfRebalance }
    );
  }, [monthlySip, lumpSum, startYear, endYear, allocation, whatIfStepUp, whatIfPauseMonths, whatIfBonus, whatIfRebalance, simOutput]);

  // Goal Planner Result
  const goalResult = useMemo(() => {
    const cagr = simOutput ? simOutput.cagrPct : 12.0;
    return calculateGoalPlan({
      goalName,
      targetAmountToday: goalTargetToday,
      currentSavings: goalCurrentSavings,
      monthlyInvestment: monthlySip,
      targetYears: goalHorizonYears,
      expectedInflationPct: goalInflationPct,
      expectedCagrPct: cagr
    });
  }, [goalName, goalTargetToday, goalCurrentSavings, monthlySip, goalHorizonYears, goalInflationPct, simOutput]);

  // Monte Carlo Result
  const monteCarloResult = useMemo(() => {
    const meanReturn = simOutput ? simOutput.cagrPct : 12.0;
    const vol = simOutput ? simOutput.annualizedVolatilityPct : 15.0;
    const yrs = endYear - startYear;
    return runMonteCarloSimulation({
      numSimulations: 1000,
      durationYears: yrs > 0 ? yrs : 10,
      monthlySip,
      lumpSum,
      meanAnnualReturnPct: meanReturn,
      annualVolatilityPct: vol,
      targetWealth: goalTargetToday
    });
  }, [simOutput, startYear, endYear, monthlySip, lumpSum, goalTargetToday]);

  if (!mounted || !simOutput) {
    return (
      <div className="min-h-screen bg-navy-bg text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <RefreshCw className="w-8 h-8 text-emerald animate-spin" />
          <p className="text-muted-grey text-xs sm:text-sm">Initializing ValarchiX Historical Simulation Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-bg text-white font-sans selection:bg-emerald selection:text-white pb-20 space-y-6 sm:space-y-8 py-3 sm:py-6 px-2 sm:px-4 lg:px-6">
      {/* Header & Core Philosophy Banner */}
      <header className="border border-border-navy bg-navy-card/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-blue-600 shadow-md text-white shrink-0">
              <PieIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white">Portfolio Strategy Simulator</h1>
                <span className="px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full bg-emerald/10 text-emerald border border-emerald/20">
                  v2.0 Historical Engine
                </span>
              </div>
              <p className="text-xs text-muted-grey mt-0.5">ValarchiX Financial Learning Operating System</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-navy-bg px-3.5 py-2 rounded-xl border border-border-navy text-xs">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-muted-grey leading-tight">
              <strong className="text-white">Core Principle:</strong> &ldquo;We don&apos;t tell what to pick, we tell how to pick.&rdquo; Purely educational, backtested evidence.
            </span>
          </div>
        </div>
      </header>

      {/* Input Controls & Asset Sliders Panel */}
      <section className="glass-card p-4 sm:p-6 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-border-navy">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald" /> Backtest Parameters & Asset Allocation
            </h2>
            <p className="text-xs text-muted-grey mt-0.5">
              Set investment amounts, duration (2000–2025), and adjust asset sliders to total exactly 100%.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-medium text-muted-grey mr-1 hidden sm:inline">Presets:</span>
            {Object.entries(PRESET_ALLOCATIONS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setAllocation(preset.config)}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-navy-light hover:bg-emerald/10 text-white transition border border-border-navy"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Investment Amount & Year Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-white flex items-center gap-1.5">
              Monthly SIP (₹)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={monthlySip}
              onChange={(e) => setMonthlySip(Math.max(0, Number(e.target.value)))}
              className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald font-mono min-h-[42px]"
            />
            <span className="text-[11px] text-muted-grey">{formatINR(monthlySip)} / month</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white flex items-center gap-1.5">
              Initial Lump Sum (₹)
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              value={lumpSum}
              onChange={(e) => setLumpSum(Math.max(0, Number(e.target.value)))}
              className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald font-mono min-h-[42px]"
            />
            <span className="text-[11px] text-muted-grey">{formatINR(lumpSum)} initial</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white">Start Year</label>
            <select
              value={startYear}
              onChange={(e) => {
                const yr = Number(e.target.value);
                setStartYear(yr);
                if (yr >= endYear) setEndYear(Math.min(2025, yr + 1));
              }}
              className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald min-h-[42px]"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-navy-bg text-white">
                  {yr}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-muted-grey">Historical start</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white">End Year</label>
            <select
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald min-h-[42px]"
            >
              {availableYears
                .filter((yr) => yr > startYear)
                .map((yr) => (
                  <option key={yr} value={yr} className="bg-navy-bg text-white">
                    {yr}
                  </option>
                ))}
            </select>
            <span className="text-[11px] text-muted-grey">{endYear - startYear} years backtest</span>
          </div>
        </div>

        {/* Allocation Sliders */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white">Asset Allocation Breakdown</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                  totalAllocationPct === 100
                    ? "bg-emerald/10 text-emerald border-emerald/30"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse"
                }`}
              >
                Total: {totalAllocationPct}%
              </span>
              {totalAllocationPct !== 100 && (
                <button
                  onClick={normalizeAllocations}
                  className="text-xs bg-emerald hover:bg-emerald/80 text-white px-3 py-1 rounded-md transition font-medium"
                >
                  Auto-Adjust to 100%
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {(Object.keys(ASSET_METADATA) as AssetClassKey[]).map((key) => {
              const meta = ASSET_METADATA[key];
              const val = allocation[key] || 0;
              return (
                <div
                  key={key}
                  className="bg-navy-bg/60 border border-border-navy rounded-xl p-3.5 space-y-2 hover:border-emerald/40 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="font-medium text-white">{meta.shortLabel}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald">{val}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={val}
                    onChange={(e) => {
                      const nextVal = Number(e.target.value);
                      setAllocation((prev) => ({ ...prev, [key]: nextVal }));
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald"
                  />

                  <p className="text-[10px] text-muted-grey truncate">{meta.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tab Navigation (Scrollable & Responsive) */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 border-b border-border-navy overflow-x-auto pb-1 scrollbar-none touch-pan-x">
        {[
          { id: "overview", label: "Overview & Backtest", icon: BarChart3 },
          { id: "compare", label: "Compare Strategies", icon: Layers },
          { id: "health", label: "Risk Health Score", icon: Shield },
          { id: "stress", label: "Crisis Stress Test", icon: AlertTriangle },
          { id: "whatif", label: "What-If Simulator", icon: Zap },
          { id: "goal", label: "Goal Planning", icon: Target },
          { id: "montecarlo", label: "Monte Carlo Engine", icon: Dices }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-t-xl text-xs font-semibold transition border-t border-x whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-navy-card text-emerald border-border-navy border-b-transparent shadow-md"
                  : "text-muted-grey hover:text-white border-transparent hover:bg-navy-light/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & BACKTEST RESULTS */}
      {activeTab === "overview" && (
        <div className="space-y-6 sm:space-y-8">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="glass-card p-3.5 sm:p-4 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-grey">Total Invested</span>
              <div className="text-base sm:text-lg font-bold font-mono text-white truncate">{formatINR(simOutput.totalInvested)}</div>
              <p className="text-[10px] text-muted-grey truncate">{endYear - startYear} yrs cumulative</p>
            </div>

            <div className="glass-card p-3.5 sm:p-4 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-grey">Final Portfolio Value</span>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald truncate">{formatINR(simOutput.finalValue)}</div>
              <p className="text-[10px] text-emerald font-mono truncate">+{formatINR(simOutput.totalGain)} profit</p>
            </div>

            <div className="glass-card p-3.5 sm:p-4 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-grey">CAGR (Annual)</span>
              <div className="text-base sm:text-lg font-bold font-mono text-blue-500">{simOutput.cagrPct}%</div>
              <p className="text-[10px] text-muted-grey truncate">Abs: {simOutput.absoluteReturnPct}%</p>
            </div>

            <div className="glass-card p-3.5 sm:p-4 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-grey">XIRR (SIP Return)</span>
              <div className="text-base sm:text-lg font-bold font-mono text-purple-500">{simOutput.xirrPct}%</div>
              <p className="text-[10px] text-muted-grey truncate">Cash flow yield</p>
            </div>

            <div className="glass-card p-3.5 sm:p-4 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-grey">Max Drawdown</span>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-500">-{simOutput.maxDrawdownPct}%</div>
              <p className="text-[10px] text-muted-grey truncate">Recovery: {simOutput.maxRecoveryMonths} m</p>
            </div>

            <div className="glass-card p-3.5 sm:p-4 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-grey">Sharpe / Volatility</span>
              <div className="text-base sm:text-lg font-bold font-mono text-cyan-500">{simOutput.sharpeRatio}</div>
              <p className="text-[10px] text-muted-grey truncate">Vol: {simOutput.annualizedVolatilityPct}%</p>
            </div>
          </div>

          {/* Main Growth Chart */}
          <div className="glass-card p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald shrink-0" /> Historical Wealth Trajectory (Invested vs Portfolio Value)
                </h3>
                <p className="text-xs text-muted-grey">Month-by-month backtest performance from {startYear} to {endYear}</p>
              </div>
            </div>

            <div className="h-[280px] sm:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simOutput.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="dateStr" stroke="var(--text-muted-color)" tick={{ fontSize: 9 }} tickFormatter={(str) => str.split("-")[0]} />
                  <YAxis stroke="var(--text-muted-color)" tick={{ fontSize: 9 }} tickFormatter={(val) => formatINR(val)} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg)",
                      borderColor: "var(--tooltip-border)",
                      color: "var(--tooltip-text)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)"
                    }}
                    itemStyle={{ color: "var(--tooltip-text)" }}
                    labelStyle={{ color: "var(--tooltip-muted)", fontWeight: "600" }}
                    cursor={{ stroke: "var(--tooltip-muted)", strokeDasharray: "3 3" }}
                    formatter={(val: any) => [formatINR(Number(val)), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area type="monotone" dataKey="portfolioValue" name="Portfolio Value" stroke="#22c55e" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cumulativeInvested" name="Total Invested" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInvested)" strokeWidth={1.5} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* AI Mentor Note */}
            <div className="bg-navy-bg/70 border border-border-navy rounded-xl p-3.5 sm:p-4 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-amber-500">AI Mentor Insight: Compounding & Long-Term Growth</h4>
                <p className="text-xs text-muted-grey leading-relaxed">{generateChartInsight("growth", simOutput).content}</p>
              </div>
            </div>
          </div>

          {/* Secondary Charts Grid: Drawdown & Annual Returns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drawdown Timeline Chart */}
            <div className="glass-card p-4 sm:p-6 space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" /> Drawdown & Panic Resistance Timeline (%)
              </h3>

              <div className="h-[220px] sm:h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simOutput.timeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="dateStr" stroke="var(--text-muted-color)" tick={{ fontSize: 9 }} tickFormatter={(str) => str.split("-")[0]} />
                    <YAxis stroke="var(--text-muted-color)" tick={{ fontSize: 9 }} tickFormatter={(val) => `-${val}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--tooltip-bg)",
                        borderColor: "var(--tooltip-border)",
                        color: "var(--tooltip-text)",
                        borderRadius: "8px",
                        fontSize: "11px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)"
                      }}
                      itemStyle={{ color: "var(--tooltip-text)" }}
                      labelStyle={{ color: "var(--tooltip-muted)", fontWeight: "600" }}
                      cursor={{ stroke: "rgba(245, 158, 11, 0.5)", strokeDasharray: "3 3" }}
                      formatter={(val: any) => [`-${val}%`, "Drawdown"]}
                    />
                    <Area type="monotone" dataKey="drawdownPct" name="Drawdown %" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-muted-grey leading-relaxed">{generateChartInsight("drawdown", simOutput).content}</p>
            </div>

            {/* Annual Returns Bar Chart */}
            <div className="glass-card p-4 sm:p-6 space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500 shrink-0" /> Year-by-Year Calendar Returns (%)
              </h3>

              <div className="h-[220px] sm:h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simOutput.annualBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="year" stroke="var(--text-muted-color)" tick={{ fontSize: 9 }} />
                    <YAxis stroke="var(--text-muted-color)" tick={{ fontSize: 9 }} tickFormatter={(val) => `${val}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--tooltip-bg)",
                        borderColor: "var(--tooltip-border)",
                        color: "var(--tooltip-text)",
                        borderRadius: "8px",
                        fontSize: "11px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)"
                      }}
                      itemStyle={{ color: "var(--tooltip-text)" }}
                      labelStyle={{ color: "var(--tooltip-muted)", fontWeight: "600" }}
                      cursor={{ fill: "var(--tooltip-cursor)", radius: 4 }}
                      formatter={(val: any) => [`${val}%`, "Annual Return"]}
                    />
                    <Bar dataKey="annualReturnPct" name="Return %">
                      {simOutput.annualBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.annualReturnPct >= 0 ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-grey leading-relaxed">{generateChartInsight("annual", simOutput).content}</p>
                <p className="text-[11px] text-amber-500/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg leading-relaxed">
                  💡 <strong>Educational Note on 2020:</strong> While the market suffered a historic <strong>-38.4% crash in March 2020</strong> (visible in the <em>Drawdown Timeline</em> chart), a massive central bank & economic recovery rally pushed full-year 2020 calendar returns positive (<strong>+14.9%</strong>) by Dec 31, 2020.
                </p>
              </div>
            </div>
          </div>

          {/* Rolling Returns & Risk Ratios */}
          <div className="glass-card p-4 sm:p-6 space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500 shrink-0" /> Rolling Return Analysis & Consistency
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-2">
                <span className="text-xs font-semibold text-blue-500">3-Year Rolling Return</span>
                <div className="text-sm font-mono text-white">Average: <strong className="text-emerald">{simOutput.rollingReturns.threeYear.average}%</strong></div>
                <div className="text-xs text-muted-grey font-mono">Range: {simOutput.rollingReturns.threeYear.min}% to {simOutput.rollingReturns.threeYear.max}%</div>
                <div className="text-[11px] text-emerald font-medium">Positive in {simOutput.rollingReturns.threeYear.positiveRatioPct}% of periods</div>
              </div>

              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-2">
                <span className="text-xs font-semibold text-purple-500">5-Year Rolling Return</span>
                <div className="text-sm font-mono text-white">Average: <strong className="text-emerald">{simOutput.rollingReturns.fiveYear.average}%</strong></div>
                <div className="text-xs text-muted-grey font-mono">Range: {simOutput.rollingReturns.fiveYear.min}% to {simOutput.rollingReturns.fiveYear.max}%</div>
                <div className="text-[11px] text-emerald font-medium">Positive in {simOutput.rollingReturns.fiveYear.positiveRatioPct}% of periods</div>
              </div>

              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-2 sm:col-span-2 lg:col-span-1">
                <span className="text-xs font-semibold text-cyan-500">Risk Ratios</span>
                <div className="text-sm font-mono text-white">Sharpe Ratio: <strong className="text-emerald">{simOutput.sharpeRatio}</strong></div>
                <div className="text-sm font-mono text-white">Sortino Ratio: <strong className="text-emerald">{simOutput.sortinoRatio}</strong></div>
                <div className="text-[11px] text-muted-grey">Risk Free Rate benchmark: 6.0%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPARE STRATEGIES */}
      {activeTab === "compare" && simComparisonOutput && (
        <div className="space-y-6 sm:space-y-8">
          <div className="glass-card p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald shrink-0" /> Side-by-Side Portfolio Strategy Comparator
              </h3>
              <p className="text-xs text-muted-grey mt-1">
                Compare your current allocation (Portfolio A) against benchmark Strategy (Portfolio B).
              </p>
            </div>

            {/* Selector for Portfolio B */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-navy-bg p-3.5 rounded-xl border border-border-navy">
              <span className="text-xs font-medium text-white w-full sm:w-auto">Select Benchmark Strategy (Portfolio B):</span>
              {Object.entries(PRESET_ALLOCATIONS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setComparisonAllocation(preset.config)}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-navy-light hover:bg-emerald/10 text-white border border-border-navy transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-xl border border-border-navy">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-border-navy text-muted-grey bg-navy-bg/50">
                    <th className="py-3 px-4">Metric Parameter</th>
                    <th className="py-3 px-4 text-emerald">Portfolio A (User Custom)</th>
                    <th className="py-3 px-4 text-purple-500">Portfolio B (Benchmark)</th>
                    <th className="py-3 px-4 text-white">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-navy font-mono">
                  <tr>
                    <td className="py-3 px-4 text-white font-sans">Final Value</td>
                    <td className="py-3 px-4 font-bold text-emerald">{formatINR(simOutput.finalValue)}</td>
                    <td className="py-3 px-4 font-bold text-white">{formatINR(simComparisonOutput.finalValue)}</td>
                    <td className="py-3 px-4 text-emerald">{formatINR(simOutput.finalValue - simComparisonOutput.finalValue)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-sans">CAGR (Annual Growth)</td>
                    <td className="py-3 px-4 font-bold text-emerald">{simOutput.cagrPct}%</td>
                    <td className="py-3 px-4 font-bold text-purple-500">{simComparisonOutput.cagrPct}%</td>
                    <td className="py-3 px-4 text-white">{(simOutput.cagrPct - simComparisonOutput.cagrPct).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-sans">XIRR (SIP Return)</td>
                    <td className="py-3 px-4 font-bold text-emerald">{simOutput.xirrPct}%</td>
                    <td className="py-3 px-4 font-bold text-purple-500">{simComparisonOutput.xirrPct}%</td>
                    <td className="py-3 px-4 text-white">{(simOutput.xirrPct - simComparisonOutput.xirrPct).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-sans">Max Drawdown (%)</td>
                    <td className="py-3 px-4 font-bold text-amber-500">-{simOutput.maxDrawdownPct}%</td>
                    <td className="py-3 px-4 font-bold text-amber-500">-{simComparisonOutput.maxDrawdownPct}%</td>
                    <td className="py-3 px-4 text-white">{(simOutput.maxDrawdownPct - simComparisonOutput.maxDrawdownPct).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-sans">Annual Volatility</td>
                    <td className="py-3 px-4 text-white">{simOutput.annualizedVolatilityPct}%</td>
                    <td className="py-3 px-4 text-white">{simComparisonOutput.annualizedVolatilityPct}%</td>
                    <td className="py-3 px-4 text-white">{(simOutput.annualizedVolatilityPct - simComparisonOutput.annualizedVolatilityPct).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-white font-sans">Sharpe Ratio</td>
                    <td className="py-3 px-4 text-cyan-500">{simOutput.sharpeRatio}</td>
                    <td className="py-3 px-4 text-cyan-500">{simComparisonOutput.sharpeRatio}</td>
                    <td className="py-3 px-4 text-white">{(simOutput.sharpeRatio - simComparisonOutput.sharpeRatio).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Educational Mentor Commentary */}
            <div className="bg-navy-bg/80 p-4 rounded-xl border border-border-navy flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-emerald shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-emerald">Non-Judgmental AI Comparative Observation</h4>
                <p className="text-xs text-muted-grey leading-relaxed">{generateComparisonInsight(simOutput, simComparisonOutput)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RISK HEALTH SCORE */}
      {activeTab === "health" && healthReport && (
        <div className="space-y-6 sm:space-y-8">
          <div className="glass-card p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black font-mono shadow-xl shrink-0">
                  {healthReport.overallScore}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">Portfolio Health Score</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald/10 text-emerald border border-emerald/30">
                      Grade {healthReport.grade}
                    </span>
                  </div>
                  <p className="text-xs text-muted-grey mt-1 leading-relaxed">{healthReport.summaryText}</p>
                </div>
              </div>
            </div>

            {/* 8 Health Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {healthReport.metrics.map((metric) => (
                <div key={metric.id} className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{metric.name}</span>
                    <span className="text-xs font-mono font-bold text-emerald">{metric.score} / 100</span>
                  </div>

                  <div className="w-full h-1.5 bg-border-navy rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald"
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-muted-grey leading-relaxed">{metric.explanation}</p>
                  <p className="text-[10px] text-emerald font-medium">💡 {metric.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CRISIS STRESS TEST */}
      {activeTab === "stress" && (
        <div className="space-y-6 sm:space-y-8">
          <div className="glass-card p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" /> Historical Crisis Stress Testing Engine
              </h3>
              <p className="text-xs text-muted-grey mt-1">
                Replays your exact portfolio allocation under iconic historical financial market crashes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {stressResults.map((scen) => (
                <div key={scen.id} className="bg-navy-bg/80 p-4 sm:p-5 rounded-xl border border-border-navy space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{scen.name}</h4>
                      <span className="text-[10px] font-mono text-muted-grey bg-navy-card px-2 py-0.5 rounded border border-border-navy shrink-0">
                        {scen.periodLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="bg-navy-card p-2 rounded border border-border-navy">
                        <span className="text-[10px] text-muted-grey block">Market Crash</span>
                        <span className="font-mono font-bold text-red-500">-{scen.marketDropPct}%</span>
                      </div>
                      <div className="bg-navy-card p-2 rounded border border-border-navy">
                        <span className="text-[10px] text-muted-grey block">Your Drop</span>
                        <span className="font-mono font-bold text-amber-500">-{scen.portfolioDropPct}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-grey leading-relaxed pt-1">{scen.emotionalContext}</p>
                  </div>

                  <div className="pt-2 border-t border-border-navy">
                    <span className="text-[11px] text-emerald font-medium block">Key Educational Takeaway:</span>
                    <p className="text-[11px] text-muted-grey leading-relaxed">{scen.keyTakeaway}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WHAT-IF SIMULATOR */}
      {activeTab === "whatif" && whatIfResult && (
        <div className="space-y-6 sm:space-y-8">
          <div className="glass-card p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500 shrink-0" /> Interactive What-If Scenario Modifier
              </h3>
              <p className="text-xs text-muted-grey mt-1">
                Adjust SIP step-up rates, pause durations, or top-up bonuses to see immediate wealth impacts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white">Annual SIP Step-Up (%)</label>
                <select
                  value={whatIfStepUp}
                  onChange={(e) => setWhatIfStepUp(Number(e.target.value))}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald min-h-[42px]"
                >
                  <option value={0} className="bg-navy-bg text-white">0% (Flat SIP)</option>
                  <option value={5} className="bg-navy-bg text-white">5% Step-Up</option>
                  <option value={10} className="bg-navy-bg text-white">10% Step-Up</option>
                  <option value={15} className="bg-navy-bg text-white">15% Step-Up</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white">Pause SIP Duration</label>
                <select
                  value={whatIfPauseMonths}
                  onChange={(e) => setWhatIfPauseMonths(Number(e.target.value))}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald min-h-[42px]"
                >
                  <option value={0} className="bg-navy-bg text-white">No Pause (Continuous)</option>
                  <option value={6} className="bg-navy-bg text-white">6 Months Pause</option>
                  <option value={12} className="bg-navy-bg text-white">12 Months Pause</option>
                  <option value={24} className="bg-navy-bg text-white">24 Months Pause</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white">Yearly Bonus Top-Up (₹)</label>
                <select
                  value={whatIfBonus}
                  onChange={(e) => setWhatIfBonus(Number(e.target.value))}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald min-h-[42px]"
                >
                  <option value={0} className="bg-navy-bg text-white">₹0</option>
                  <option value={25000} className="bg-navy-bg text-white">₹25,000 / year</option>
                  <option value={50000} className="bg-navy-bg text-white">₹50,000 / year</option>
                  <option value={100000} className="bg-navy-bg text-white">₹100,000 / year</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white">Annual Rebalancing</label>
                <select
                  value={whatIfRebalance ? "true" : "false"}
                  onChange={(e) => setWhatIfRebalance(e.target.value === "true")}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald min-h-[42px]"
                >
                  <option value="true" className="bg-navy-bg text-white">Enabled (Annual)</option>
                  <option value="false" className="bg-navy-bg text-white">Buy & Hold (No rebalance)</option>
                </select>
              </div>
            </div>

            {/* Result Comparison */}
            <div className="bg-navy-bg/80 p-4 sm:p-5 rounded-xl border border-border-navy space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <span className="text-xs text-muted-grey block">Baseline Final Wealth</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-white">{formatINR(whatIfResult.baseline.finalValue)}</span>
                </div>

                <div>
                  <span className="text-xs text-muted-grey block">Modified Strategy Wealth</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-emerald">{formatINR(whatIfResult.modified.finalValue)}</span>
                </div>

                <div>
                  <span className="text-xs text-muted-grey block">Wealth Difference</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-blue-500">
                    {whatIfResult.diffWealth >= 0 ? "+" : ""}{formatINR(whatIfResult.diffWealth)} ({whatIfResult.diffWealthPct}%)
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-grey bg-navy-card p-3 rounded-lg border border-border-navy leading-relaxed">
                💡 <strong>Scenario Insight:</strong> {whatIfResult.insight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GOAL PLANNING */}
      {activeTab === "goal" && goalResult && (
        <div className="space-y-6 sm:space-y-8">
          <div className="glass-card p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald shrink-0" /> Goal Planning & Inflation Adjustment Engine
              </h3>
              <p className="text-xs text-muted-grey mt-1">
                Integrate inflation forecasts to evaluate goal achievement probability based on strategy CAGR.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white">Goal Target Cost Today (₹)</label>
                <input
                  type="number"
                  step="500000"
                  value={goalTargetToday}
                  onChange={(e) => setGoalTargetToday(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald font-mono min-h-[42px]"
                />
                <span className="text-[11px] text-muted-grey">{formatINR(goalTargetToday)} in today&apos;s money</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white">Target Horizon (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={goalHorizonYears}
                  onChange={(e) => setGoalHorizonYears(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald font-mono min-h-[42px]"
                />
                <span className="text-[11px] text-muted-grey">Target year: {new Date().getFullYear() + goalHorizonYears}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white">Expected Inflation Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={goalInflationPct}
                  onChange={(e) => setGoalInflationPct(Number(e.target.value))}
                  className="w-full bg-navy-bg border border-border-navy rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald font-mono min-h-[42px]"
                />
                <span className="text-[11px] text-muted-grey">Historical CPI avg: 6.0%</span>
              </div>
            </div>

            {/* Goal Calculation Output Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-1">
                <span className="text-[11px] text-muted-grey block">Inflation-Adjusted Target</span>
                <span className="text-base sm:text-lg font-bold font-mono text-amber-500 truncate block">{formatINR(goalResult.futureInflationAdjustedTarget)}</span>
                <span className="text-[10px] text-muted-grey block">Cost in {goalHorizonYears} years</span>
              </div>

              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-1">
                <span className="text-[11px] text-muted-grey block">Projected Portfolio Wealth</span>
                <span className="text-base sm:text-lg font-bold font-mono text-emerald truncate block">{formatINR(goalResult.projectedFutureWealth)}</span>
                <span className="text-[10px] text-muted-grey block">Based on strategy CAGR ({simOutput.cagrPct}%)</span>
              </div>

              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-1">
                <span className="text-[11px] text-muted-grey block">Shortfall / Surplus</span>
                <span className={`text-base sm:text-lg font-bold font-mono truncate block ${goalResult.isGoalAchievable ? "text-emerald" : "text-red-500"}`}>
                  {goalResult.shortfallOrSurplus >= 0 ? "+" : ""}{formatINR(goalResult.shortfallOrSurplus)}
                </span>
                <span className="text-[10px] text-muted-grey block">{goalResult.isGoalAchievable ? "Goal On Track" : "Action Needed"}</span>
              </div>

              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-1">
                <span className="text-[11px] text-muted-grey block">Recommended Monthly SIP</span>
                <span className="text-base sm:text-lg font-bold font-mono text-blue-500 truncate block">{formatINR(goalResult.recommendedMonthlySip)}</span>
                <span className="text-[10px] text-muted-grey block">Required to bridge goal</span>
              </div>
            </div>

            <div className="bg-navy-bg/80 p-4 rounded-xl border border-border-navy text-xs text-muted-grey leading-relaxed">
              💡 <strong>Goal Mentor Guidance:</strong> {goalResult.educationalNote}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: MONTE CARLO ENGINE */}
      {activeTab === "montecarlo" && monteCarloResult && (
        <div className="space-y-6 sm:space-y-8">
          <div className="glass-card p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Dices className="w-5 h-5 text-purple-500 shrink-0" /> Monte Carlo Simulation Engine (1,000+ Random Scenarios)
              </h3>
              <p className="text-xs text-muted-grey mt-1">
                Models statistical probability distributions based on historical return mean ({simOutput.cagrPct}%) and variance ({simOutput.annualizedVolatilityPct}%).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-1">
                <span className="text-[11px] text-muted-grey block">Median Outcome (50th Pct)</span>
                <span className="text-base sm:text-lg font-bold font-mono text-white truncate block">{formatINR(monteCarloResult.medianFinalWealth)}</span>
              </div>

              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-1">
                <span className="text-[11px] text-muted-grey block">Best Case (90th Pct)</span>
                <span className="text-base sm:text-lg font-bold font-mono text-emerald truncate block">{formatINR(monteCarloResult.bestCase90th)}</span>
              </div>

              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-1">
                <span className="text-[11px] text-muted-grey block">Worst Case (10th Pct)</span>
                <span className="text-base sm:text-lg font-bold font-mono text-amber-500 truncate block">{formatINR(monteCarloResult.worstCase10th)}</span>
              </div>

              <div className="bg-navy-bg/80 p-3.5 sm:p-4 rounded-xl border border-border-navy space-y-1">
                <span className="text-[11px] text-muted-grey block">Probability of Success</span>
                <span className="text-base sm:text-lg font-bold font-mono text-blue-500 truncate block">{monteCarloResult.successProbabilityPct}%</span>
              </div>
            </div>

            {/* Monte Carlo Fan Chart */}
            <div className="h-[280px] sm:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monteCarloResult.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="year" stroke="var(--text-muted-color)" tick={{ fontSize: 9 }} tickFormatter={(yr) => `Yr ${yr}`} />
                  <YAxis stroke="var(--text-muted-color)" tick={{ fontSize: 9 }} tickFormatter={(val) => formatINR(val)} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg)",
                      borderColor: "var(--tooltip-border)",
                      color: "var(--tooltip-text)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)"
                    }}
                    itemStyle={{ color: "var(--tooltip-text)" }}
                    labelStyle={{ color: "var(--tooltip-muted)", fontWeight: "600" }}
                    cursor={{ stroke: "var(--tooltip-muted)", strokeDasharray: "3 3" }}
                    formatter={(val: any) => [formatINR(Number(val)), ""]}
                  />
                  <Area type="monotone" dataKey="p90" name="Best Case (90th)" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={1.5} />
                  <Area type="monotone" dataKey="p50" name="Median Outcome (50th)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                  <Area type="monotone" dataKey="p10" name="Worst Case (10th)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted-grey bg-navy-card p-3 rounded-lg border border-border-navy leading-relaxed">
              🔒 {monteCarloResult.educationalDisclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
