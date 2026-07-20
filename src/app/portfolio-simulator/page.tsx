"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Shield,
  PieChart as PieIcon,
  BarChart3,
  Sliders,
  AlertTriangle,
  Layers,
  Award,
  Zap,
  Target,
  Dices,
  Info,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Lock,
  DollarSign
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

import {
  HISTORICAL_DATABASE,
  getAvailableYears,
  AssetClassKey,
  ASSET_METADATA
} from "@/lib/simulator/historicalData";
import {
  AllocationConfig,
  SimulationConfig,
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">Initializing ValarchiX Historical Simulation Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-20">
      {/* Header & Core Philosophy Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 text-white">
              <PieIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Portfolio Strategy Simulator</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v2.0 Historical Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">ValarchiX Financial Learning Operating System</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/50 px-3.5 py-1.5 rounded-lg border border-slate-700/50">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs text-slate-300">
              <strong className="text-white">Core Principle:</strong> &ldquo;We don&apos;t tell what to pick, we tell how to pick.&rdquo; Purely educational, backtested evidence.
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Input Controls & Asset Sliders Panel */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" /> Backtest Parameters & Asset Allocation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set investment amounts, duration (2000–2025), and adjust asset sliders to total exactly 100%.
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400 mr-1">Presets:</span>
              {Object.entries(PRESET_ALLOCATIONS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setAllocation(preset.config)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700/60"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Investment Amount & Year Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                Monthly SIP (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <span className="text-[11px] text-slate-400">{formatINR(monthlySip)} / month</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                Initial Lump Sum (₹)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={lumpSum}
                onChange={(e) => setLumpSum(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[11px] text-slate-400">{formatINR(lumpSum)} initial</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Start Year</label>
              <select
                value={startYear}
                onChange={(e) => {
                  const yr = Number(e.target.value);
                  setStartYear(yr);
                  if (yr >= endYear) setEndYear(Math.min(2025, yr + 1));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400">Historical start</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">End Year</label>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {availableYears
                  .filter((yr) => yr > startYear)
                  .map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
              </select>
              <span className="text-[11px] text-slate-400">{endYear - startYear} years backtest</span>
            </div>
          </div>

          {/* Allocation Sliders */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Asset Allocation Breakdown</span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                    totalAllocationPct === 100
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                  }`}
                >
                  Total: {totalAllocationPct}%
                </span>
                {totalAllocationPct !== 100 && (
                  <button
                    onClick={normalizeAllocations}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-md transition font-medium"
                  >
                    Auto-Adjust to 100%
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(ASSET_METADATA) as AssetClassKey[]).map((key) => {
                const meta = ASSET_METADATA[key];
                const val = allocation[key] || 0;
                return (
                  <div
                    key={key}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="font-medium text-slate-200">{meta.shortLabel}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{val}%</span>
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
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />

                    <p className="text-[10px] text-slate-400 truncate">{meta.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-800 overflow-x-auto pb-1 scrollbar-none">
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
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition border-t border-x whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-blue-400 border-slate-800 border-b-transparent shadow-lg"
                    : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & BACKTEST RESULTS */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Total Invested</span>
                <div className="text-lg font-bold font-mono text-white">{formatINR(simOutput.totalInvested)}</div>
                <p className="text-[10px] text-slate-500">{endYear - startYear} years cumulative</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Final Portfolio Value</span>
                <div className="text-lg font-bold font-mono text-emerald-400">{formatINR(simOutput.finalValue)}</div>
                <p className="text-[10px] text-emerald-500/80 font-mono">+{formatINR(simOutput.totalGain)} profit</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400">CAGR (Annual Return)</span>
                <div className="text-lg font-bold font-mono text-blue-400">{simOutput.cagrPct}%</div>
                <p className="text-[10px] text-slate-500">Abs Return: {simOutput.absoluteReturnPct}%</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400">XIRR (SIP Return)</span>
                <div className="text-lg font-bold font-mono text-purple-400">{simOutput.xirrPct}%</div>
                <p className="text-[10px] text-slate-500">Exact cash flow yield</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Max Drawdown</span>
                <div className="text-lg font-bold font-mono text-amber-400">-{simOutput.maxDrawdownPct}%</div>
                <p className="text-[10px] text-slate-500">Recovery: {simOutput.maxRecoveryMonths} months</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Sharpe / Volatility</span>
                <div className="text-lg font-bold font-mono text-cyan-400">{simOutput.sharpeRatio}</div>
                <p className="text-[10px] text-slate-500">Vol: {simOutput.annualizedVolatilityPct}%</p>
              </div>
            </div>

            {/* Main Growth Chart */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Historical Wealth Trajectory (Invested vs Portfolio Value)
                  </h3>
                  <p className="text-xs text-slate-400">Month-by-month backtest performance from {startYear} to {endYear}</p>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simOutput.timeline}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="dateStr" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(str) => str.split("-")[0]} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => formatINR(val)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                      formatter={(val: any) => [formatINR(Number(val)), ""]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="portfolioValue" name="Portfolio Value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cumulativeInvested" name="Total Invested" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInvested)" strokeWidth={1.5} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* AI Mentor Note */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-amber-400">AI Mentor Insight: Compounding & Long-Term Growth</h4>
                  <p className="text-xs text-slate-300">{generateChartInsight("growth", simOutput).content}</p>
                </div>
              </div>
            </div>

            {/* Secondary Charts Grid: Drawdown & Annual Returns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Drawdown Timeline Chart */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Drawdown & Panic Resistance Timeline (%)
                </h3>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simOutput.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="dateStr" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(str) => str.split("-")[0]} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => `-${val}%`} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} formatter={(val: any) => [`-${val}%`, "Drawdown"]} />
                      <Area type="monotone" dataKey="drawdownPct" name="Drawdown %" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-xs text-slate-400">{generateChartInsight("drawdown", simOutput).content}</p>
              </div>

              {/* Annual Returns Bar Chart */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Year-by-Year Calendar Returns (%)
                </h3>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={simOutput.annualBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => `${val}%`} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} formatter={(val: any) => [`${val}%`, "Annual Return"]} />
                      <Bar dataKey="annualReturnPct" name="Return %">
                        {simOutput.annualBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.annualReturnPct >= 0 ? "#10b981" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-xs text-slate-400">{generateChartInsight("annual", simOutput).content}</p>
              </div>
            </div>

            {/* Rolling Returns & Year-wise Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" /> Rolling Return Analysis & Consistency
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-blue-400">3-Year Rolling Return</span>
                  <div className="text-sm font-mono text-slate-200">Average: <strong className="text-white">{simOutput.rollingReturns.threeYear.average}%</strong></div>
                  <div className="text-xs text-slate-400 font-mono">Range: {simOutput.rollingReturns.threeYear.min}% to {simOutput.rollingReturns.threeYear.max}%</div>
                  <div className="text-[11px] text-emerald-400">Positive in {simOutput.rollingReturns.threeYear.positiveRatioPct}% of periods</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-purple-400">5-Year Rolling Return</span>
                  <div className="text-sm font-mono text-slate-200">Average: <strong className="text-white">{simOutput.rollingReturns.fiveYear.average}%</strong></div>
                  <div className="text-xs text-slate-400 font-mono">Range: {simOutput.rollingReturns.fiveYear.min}% to {simOutput.rollingReturns.fiveYear.max}%</div>
                  <div className="text-[11px] text-emerald-400">Positive in {simOutput.rollingReturns.fiveYear.positiveRatioPct}% of periods</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-cyan-400">Risk Ratios</span>
                  <div className="text-sm font-mono text-slate-200">Sharpe Ratio: <strong className="text-white">{simOutput.sharpeRatio}</strong></div>
                  <div className="text-sm font-mono text-slate-200">Sortino Ratio: <strong className="text-white">{simOutput.sortinoRatio}</strong></div>
                  <div className="text-[11px] text-slate-400">Risk Free Rate benchmark: 6.0%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPARE STRATEGIES */}
        {activeTab === "compare" && simComparisonOutput && (
          <div className="space-y-8">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" /> Side-by-Side Portfolio Strategy Comparator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Compare your current allocation (Portfolio A) against benchmark Strategy (Portfolio B).
                </p>
              </div>

              {/* Selector for Portfolio B */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-medium text-slate-300">Select Benchmark Strategy (Portfolio B):</span>
                {Object.entries(PRESET_ALLOCATIONS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setComparisonAllocation(preset.config)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-4">Metric Parameter</th>
                      <th className="py-3 px-4 text-blue-400">Portfolio A (User Custom)</th>
                      <th className="py-3 px-4 text-purple-400">Portfolio B (Benchmark)</th>
                      <th className="py-3 px-4 text-slate-300">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-3 px-4 text-slate-300 font-sans">Final Value</td>
                      <td className="py-3 px-4 font-bold text-white">{formatINR(simOutput.finalValue)}</td>
                      <td className="py-3 px-4 font-bold text-white">{formatINR(simComparisonOutput.finalValue)}</td>
                      <td className="py-3 px-4 text-emerald-400">{formatINR(simOutput.finalValue - simComparisonOutput.finalValue)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-300 font-sans">CAGR (Annual Growth)</td>
                      <td className="py-3 px-4 font-bold text-blue-400">{simOutput.cagrPct}%</td>
                      <td className="py-3 px-4 font-bold text-purple-400">{simComparisonOutput.cagrPct}%</td>
                      <td className="py-3 px-4 text-slate-300">{(simOutput.cagrPct - simComparisonOutput.cagrPct).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-300 font-sans">XIRR (SIP Return)</td>
                      <td className="py-3 px-4 font-bold text-blue-400">{simOutput.xirrPct}%</td>
                      <td className="py-3 px-4 font-bold text-purple-400">{simComparisonOutput.xirrPct}%</td>
                      <td className="py-3 px-4 text-slate-300">{(simOutput.xirrPct - simComparisonOutput.xirrPct).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-300 font-sans">Max Drawdown (%)</td>
                      <td className="py-3 px-4 font-bold text-amber-400">-{simOutput.maxDrawdownPct}%</td>
                      <td className="py-3 px-4 font-bold text-amber-400">-{simComparisonOutput.maxDrawdownPct}%</td>
                      <td className="py-3 px-4 text-slate-300">{(simOutput.maxDrawdownPct - simComparisonOutput.maxDrawdownPct).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-300 font-sans">Annual Volatility</td>
                      <td className="py-3 px-4 text-slate-200">{simOutput.annualizedVolatilityPct}%</td>
                      <td className="py-3 px-4 text-slate-200">{simComparisonOutput.annualizedVolatilityPct}%</td>
                      <td className="py-3 px-4 text-slate-300">{(simOutput.annualizedVolatilityPct - simComparisonOutput.annualizedVolatilityPct).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-300 font-sans">Sharpe Ratio</td>
                      <td className="py-3 px-4 text-cyan-400">{simOutput.sharpeRatio}</td>
                      <td className="py-3 px-4 text-cyan-400">{simComparisonOutput.sharpeRatio}</td>
                      <td className="py-3 px-4 text-slate-300">{(simOutput.sharpeRatio - simComparisonOutput.sharpeRatio).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Educational Mentor Commentary */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-blue-400">Non-Judgmental AI Comparative Observation</h4>
                  <p className="text-xs text-slate-300">{generateComparisonInsight(simOutput, simComparisonOutput)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RISK HEALTH SCORE */}
        {activeTab === "health" && healthReport && (
          <div className="space-y-8">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black font-mono shadow-xl shadow-blue-500/20">
                    {healthReport.overallScore}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white">Portfolio Health Score</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Grade {healthReport.grade}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{healthReport.summaryText}</p>
                  </div>
                </div>
              </div>

              {/* 8 Health Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthReport.metrics.map((metric) => (
                  <div key={metric.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{metric.name}</span>
                      <span className="text-xs font-mono font-bold text-blue-400">{metric.score} / 100</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400"
                        style={{ width: `${metric.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-300">{metric.explanation}</p>
                    <p className="text-[10px] text-slate-400 font-medium">💡 {metric.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CRISIS STRESS TEST */}
        {activeTab === "stress" && (
          <div className="space-y-8">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" /> Historical Crisis Stress Testing Engine
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Replays your exact portfolio allocation under iconic historical financial market crashes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stressResults.map((scen) => (
                  <div key={scen.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{scen.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {scen.periodLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div className="bg-slate-900 p-2 rounded border border-slate-800/60">
                          <span className="text-[10px] text-slate-400 block">Market Crash</span>
                          <span className="font-mono font-bold text-red-400">-{scen.marketDropPct}%</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded border border-slate-800/60">
                          <span className="text-[10px] text-slate-400 block">Your Portfolio Drop</span>
                          <span className="font-mono font-bold text-amber-400">-{scen.portfolioDropPct}%</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pt-1">{scen.emotionalContext}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-900">
                      <span className="text-[11px] text-emerald-400 font-medium block">Key Educational Takeaway:</span>
                      <p className="text-[11px] text-slate-400">{scen.keyTakeaway}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WHAT-IF SIMULATOR */}
        {activeTab === "whatif" && whatIfResult && (
          <div className="space-y-8">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" /> Interactive What-If Scenario Modifier
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust SIP step-up rates, pause durations, or top-up bonuses to see immediate wealth impacts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Annual SIP Step-Up (%)</label>
                  <select
                    value={whatIfStepUp}
                    onChange={(e) => setWhatIfStepUp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value={0}>0% (Flat SIP)</option>
                    <option value={5}>5% Step-Up</option>
                    <option value={10}>10% Step-Up</option>
                    <option value={15}>15% Step-Up</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Pause SIP Duration</label>
                  <select
                    value={whatIfPauseMonths}
                    onChange={(e) => setWhatIfPauseMonths(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value={0}>No Pause (Continuous)</option>
                    <option value={6}>6 Months Pause</option>
                    <option value={12}>12 Months Pause</option>
                    <option value={24}>24 Months Pause</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Yearly Bonus Top-Up (₹)</label>
                  <select
                    value={whatIfBonus}
                    onChange={(e) => setWhatIfBonus(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value={0}>₹0</option>
                    <option value={25000}>₹25,000 / year</option>
                    <option value={50000}>₹50,000 / year</option>
                    <option value={100000}>₹100,000 / year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Annual Rebalancing</label>
                  <select
                    value={whatIfRebalance ? "true" : "false"}
                    onChange={(e) => setWhatIfRebalance(e.target.value === "true")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="true font-semibold">Enabled (Annual)</option>
                    <option value="false">Buy & Hold (No rebalance)</option>
                  </select>
                </div>
              </div>

              {/* Result Comparison */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Baseline Final Wealth</span>
                    <span className="text-base font-bold font-mono text-slate-200">{formatINR(whatIfResult.baseline.finalValue)}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">Modified Strategy Wealth</span>
                    <span className="text-base font-bold font-mono text-emerald-400">{formatINR(whatIfResult.modified.finalValue)}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">Wealth Difference</span>
                    <span className="text-base font-bold font-mono text-blue-400">
                      {whatIfResult.diffWealth >= 0 ? "+" : ""}{formatINR(whatIfResult.diffWealth)} ({whatIfResult.diffWealthPct}%)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  💡 <strong>Scenario Insight:</strong> {whatIfResult.insight}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: GOAL PLANNING */}
        {activeTab === "goal" && goalResult && (
          <div className="space-y-8">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" /> Goal Planning & Inflation Adjustment Engine
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Integrate inflation forecasts to evaluate goal achievement probability based on strategy CAGR.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Goal Target Cost Today (₹)</label>
                  <input
                    type="number"
                    step="500000"
                    value={goalTargetToday}
                    onChange={(e) => setGoalTargetToday(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-400">{formatINR(goalTargetToday)} in today&apos;s money</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Target Horizon (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={goalHorizonYears}
                    onChange={(e) => setGoalHorizonYears(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-400">Target year: {new Date().getFullYear() + goalHorizonYears}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Expected Inflation Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={goalInflationPct}
                    onChange={(e) => setGoalInflationPct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-400">Historical CPI avg: 6.0%</span>
                </div>
              </div>

              {/* Goal Calculation Output Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Inflation-Adjusted Target</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{formatINR(goalResult.futureInflationAdjustedTarget)}</span>
                  <span className="text-[10px] text-slate-500 block">Cost in {goalHorizonYears} years</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Projected Portfolio Wealth</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{formatINR(goalResult.projectedFutureWealth)}</span>
                  <span className="text-[10px] text-slate-500 block">Based on strategy CAGR ({simOutput.cagrPct}%)</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Shortfall / Surplus</span>
                  <span className={`text-lg font-bold font-mono ${goalResult.isGoalAchievable ? "text-emerald-400" : "text-red-400"}`}>
                    {goalResult.shortfallOrSurplus >= 0 ? "+" : ""}{formatINR(goalResult.shortfallOrSurplus)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{goalResult.isGoalAchievable ? "Goal On Track" : "Action Needed"}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Recommended Monthly SIP</span>
                  <span className="text-lg font-bold font-mono text-blue-400">{formatINR(goalResult.recommendedMonthlySip)}</span>
                  <span className="text-[10px] text-slate-500 block">Required to bridge goal</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
                💡 <strong>Goal Mentor Guidance:</strong> {goalResult.educationalNote}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MONTE CARLO ENGINE */}
        {activeTab === "montecarlo" && monteCarloResult && (
          <div className="space-y-8">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Dices className="w-5 h-5 text-purple-400" /> Monte Carlo Simulation Engine (1,000+ Random Scenarios)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Models statistical probability distributions based on historical return mean ({simOutput.cagrPct}%) and variance ({simOutput.annualizedVolatilityPct}%).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Median Outcome (50th Pct)</span>
                  <span className="text-lg font-bold font-mono text-white">{formatINR(monteCarloResult.medianFinalWealth)}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Best Case (90th Pct)</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{formatINR(monteCarloResult.bestCase90th)}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Worst Case (10th Pct)</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{formatINR(monteCarloResult.worstCase10th)}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Probability of Success</span>
                  <span className="text-lg font-bold font-mono text-blue-400">{monteCarloResult.successProbabilityPct}%</span>
                </div>
              </div>

              {/* Monte Carlo Fan Chart */}
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monteCarloResult.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(yr) => `Yr ${yr}`} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => formatINR(val)} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} formatter={(val: any) => [formatINR(Number(val)), ""]} />
                    <Area type="monotone" dataKey="p90" name="Best Case (90th)" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={1.5} />
                    <Area type="monotone" dataKey="p50" name="Median Outcome (50th)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                    <Area type="monotone" dataKey="p10" name="Worst Case (10th)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                🔒 {monteCarloResult.educationalDisclaimer}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
