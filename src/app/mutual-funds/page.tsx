"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Layers, Search, Info, ShieldAlert, RefreshCw, HelpCircle, GitCompare, BookOpen, Filter, ArrowUpDown, ChevronRight, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface SearchResult {
  schemeCode: number;
  schemeName: string;
}

interface NavPoint {
  date: string; // DD-MM-YYYY
  nav: number;
}

interface ParsedMetrics {
  name: string;
  category: string;
  house: string;
  code: number;
  currentNav: number;
  cagr1Y: number | null;
  cagr3Y: number | null;
  cagr5Y: number | null;
  volatility: number;
  sharpe: number;
  sortino: number;
  chartData: NavPoint[];
  rawNavs: NavPoint[];
}

export default function MutualFundAnalyzer() {
  const [viewMode, setViewMode] = useState<"screener" | "analyzer">("screener");
  const [screenerFunds, setScreenerFunds] = useState<any[]>([]);
  const [loadingScreener, setLoadingScreener] = useState(false);
  const [screenerFilterCategory, setScreenerFilterCategory] = useState("All");
  const [screenerSearch, setScreenerSearch] = useState("");
  const [screenerSort, setScreenerSort] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "cagr3Y",
    direction: "desc"
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingMain, setLoadingMain] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Selected Fund Keys (AMFI Scheme Codes)
  const [mainCode, setMainCode] = useState<number>(120503); // Default: Axis Bluechip Fund
  const [compareCode, setCompareCode] = useState<number | null>(null);
  
  // Loaded Fund details
  const [mainFund, setMainFund] = useState<ParsedMetrics | null>(null);
  const [compareFund, setCompareFund] = useState<ParsedMetrics | null>(null);
  const [timeHorizon, setTimeHorizon] = useState<"1Y" | "3Y" | "5Y">("3Y");

  // Inflation States
  const [adjustInflation, setAdjustInflation] = useState(true);
  const [inflation, setInflation] = useState(5.09);
  const [rates, setRates] = useState({ repoRate: 6.50, bondYield10Y: 6.95, inflationRate: 5.09 });

  const getRealCagr = (nominalCagr: number | null | undefined) => {
    if (nominalCagr === null || nominalCagr === undefined) return null;
    return ((1 + nominalCagr / 100) / (1 + inflation / 100) - 1) * 100;
  };

  // Fetch screener data on mount
  useEffect(() => {
    setLoadingScreener(true);
    fetch("/api/mutual-funds/screener")
      .then((res) => res.json())
      .then((data) => {
        if (data.funds) {
          setScreenerFunds(data.funds);
        }
      })
      .catch((err) => console.error("Error loading screener data", err))
      .finally(() => setLoadingScreener(false));
  }, []);

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

  // Search Debounce Trigger
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      searchMutualFunds(searchQuery);
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Load Initial Default Fund
  useEffect(() => {
    loadFundData(mainCode, "main");
  }, [mainCode]);

  // Load Compare Fund if set
  useEffect(() => {
    if (compareCode) {
      loadFundData(compareCode, "compare");
    } else {
      setCompareFund(null);
    }
  }, [compareCode]);

  const searchMutualFunds = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/mutual-funds?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Error searching funds", err);
    } finally {
      setIsSearching(false);
    }
  };

  const parseDateString = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const loadFundData = async (code: number, target: "main" | "compare", retryCount = 0) => {
    if (target === "main") { setLoadingMain(true); setErrorMsg(null); }
    else setLoadingCompare(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(`/api/mutual-funds?code=${code}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const parsed: ParsedMetrics = {
        name: data.meta.scheme_name,
        category: data.meta.scheme_category,
        house: data.meta.fund_house,
        code: data.meta.scheme_code,
        currentNav: data.currentNav,
        cagr1Y: data.cagr1Y,
        cagr3Y: data.cagr3Y,
        cagr5Y: data.cagr5Y,
        volatility: data.volatility,
        sharpe: data.sharpe,
        sortino: data.sortino,
        chartData: data.downSampledChartData,
        rawNavs: data.downSampledChartData
      };

      if (target === "main") setMainFund(parsed);
      else setCompareFund(parsed);

    } catch (err: any) {
      console.warn("Error loading fund data:", err.message || err);
      // Auto-retry once on network/timeout failures
      if (retryCount < 1) {
        console.log("Retrying fund load...");
        return loadFundData(code, target, retryCount + 1);
      }
      if (target === "main") {
        setErrorMsg(`Failed to load fund data for scheme ${code}. The AMFI API may be temporarily unavailable.`);
      }
    } finally {
      if (target === "main") setLoadingMain(false);
      else setLoadingCompare(false);
    }
  };

  const sortedAndFilteredScreenerFunds = useMemo(() => {
    return screenerFunds
      .filter((fund) => {
        // Text Search Filter
        const matchesSearch = fund.name.toLowerCase().includes(screenerSearch.toLowerCase()) || 
                              fund.code.toString().includes(screenerSearch);
        if (!matchesSearch) return false;

        // Category Filter
        if (screenerFilterCategory === "All") return true;
        if (screenerFilterCategory === "Large Cap") {
          return fund.category.toLowerCase().includes("large cap") || fund.category.toLowerCase().includes("index");
        }
        if (screenerFilterCategory === "Mid Cap") {
          return fund.category.toLowerCase().includes("mid cap");
        }
        if (screenerFilterCategory === "Small Cap") {
          return fund.category.toLowerCase().includes("small cap");
        }
        if (screenerFilterCategory === "Flexi Cap") {
          return fund.category.toLowerCase().includes("flexi cap") || fund.category.toLowerCase().includes("multi cap");
        }
        if (screenerFilterCategory === "Debt/Liquid") {
          return fund.category.toLowerCase().includes("debt") || 
                 fund.category.toLowerCase().includes("liquid") ||
                 fund.category.toLowerCase().includes("gilt") ||
                 fund.category.toLowerCase().includes("hybrid");
        }
        return true;
      })
      .sort((a, b) => {
        const key = screenerSort.key;
        const valA = a[key];
        const valB = b[key];
        
        // Handle nulls
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (typeof valA === "string") {
          return screenerSort.direction === "asc" 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        } else {
          return screenerSort.direction === "asc"
            ? valA - valB
            : valB - valA;
        }
      });
  }, [screenerFunds, screenerSearch, screenerFilterCategory, screenerSort]);

  // Compute rebased comparison chart data based on time horizon
  const rebasedChartData = useMemo(() => {
    if (!mainFund) return [];

    const getDaysLimit = () => {
      if (timeHorizon === "1Y") return 365;
      if (timeHorizon === "3Y") return 1095;
      return 1825; // 5Y
    };

    const daysLimit = getDaysLimit();
    const latestDate = parseDateString(mainFund.rawNavs[mainFund.rawNavs.length - 1].date);
    const targetCutoffTime = latestDate.getTime() - daysLimit * 24 * 60 * 60 * 1000;

    const filteredMain = mainFund.rawNavs.filter(
      (p) => parseDateString(p.date).getTime() >= targetCutoffTime
    );

    if (filteredMain.length === 0) return [];

    const mainStartNav = filteredMain[0].nav;

    const compareDataMap = new Map<string, number>();
    if (compareFund) {
      const filteredCompare = compareFund.rawNavs.filter(
        (p) => parseDateString(p.date).getTime() >= targetCutoffTime
      );
      if (filteredCompare.length > 0) {
        const compareStartNav = filteredCompare[0].nav;
        filteredCompare.forEach((p) => {
          compareDataMap.set(p.date, (p.nav / compareStartNav) * 100);
        });
      }
    }

    return filteredMain.map((p) => {
      const dateObj = parseDateString(p.date);
      const formattedDate = dateObj.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit"
      });

      const mainVal = compareFund
        ? Math.round((p.nav / mainStartNav) * 100 * 100) / 100
        : p.nav;

      return {
        dateLabel: formattedDate,
        [mainFund.name]: mainVal,
        ...(compareFund && compareDataMap.has(p.date)
          ? { [compareFund.name]: Math.round((compareDataMap.get(p.date) || 0) * 100) / 100 }
          : {})
      };
    });
  }, [mainFund, compareFund, timeHorizon]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(val);
  };

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
            <Layers className="text-emerald" />
            Mutual Funds Screener & Analyzer
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Search real-world mutual funds, compare risk ratios, filter categories, and analyze compounding.
          </p>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="text-[10px] text-emerald bg-emerald/5 border border-emerald/20 px-2 py-0.5 rounded font-semibold">
              Data Source: AMFI Daily NAV Cache
            </span>
            <span className="text-[10px] text-muted-grey bg-navy-card/40 border border-border-navy px-2 py-0.5 rounded">
              NAV Updated Daily Post 9:00 PM IST
            </span>
            <span className="text-[10px] text-muted-grey bg-navy-card/40 border border-border-navy px-2 py-0.5 rounded">
              Benchmarks Approximated via Index Trackers
            </span>
          </div>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg shrink-0">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      {/* Tabs & Inflation Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-navy/60 pb-px gap-4">
        <div className="flex">
          <button
            onClick={() => setViewMode("screener")}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer ${
              viewMode === "screener"
                ? "border-emerald text-emerald bg-emerald/5"
                : "border-transparent text-muted-grey hover:text-white"
            }`}
          >
            <Filter size={16} />
            <span>Mutual Fund Screener</span>
          </button>
          <button
            onClick={() => setViewMode("analyzer")}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer ${
              viewMode === "analyzer"
                ? "border-emerald text-emerald bg-emerald/5"
                : "border-transparent text-muted-grey hover:text-white"
            }`}
          >
            <Layers size={16} />
            <span>Detail Fund Analyzer & Compare</span>
          </button>
        </div>

        {/* Inflation Adjustment Switcher */}
        <div className="flex items-center gap-4 px-4 py-2 bg-navy-card/25 border border-border-navy rounded-xl text-xs font-semibold self-end md:self-auto mb-2 md:mb-0">
          <div className="flex items-center gap-1.5">
            <input
              id="mf-adjust-inflation"
              type="checkbox"
              checked={adjustInflation}
              onChange={(e) => setAdjustInflation(e.target.checked)}
              className="w-4 h-4 accent-emerald cursor-pointer rounded"
            />
            <label htmlFor="mf-adjust-inflation" className="text-muted-grey cursor-pointer flex items-center gap-1">
              Adjust CAGRs for Inflation ({inflation}%)
              <span className="text-muted-grey/60 cursor-help inline-flex" title="Subtracts CPI inflation from CAGRs to show real compound growth rates."><HelpCircle size={12} /></span>
            </label>
          </div>
          {adjustInflation && (
            <div className="flex items-center gap-1.5 border-l border-border-navy pl-3">
              <input
                type="range"
                min={2}
                max={12}
                step={0.1}
                value={inflation}
                onChange={(e) => setInflation(Number(e.target.value))}
                className="w-24 accent-emerald bg-navy-bg h-1 rounded-lg cursor-pointer animate-fadeIn"
              />
              <button
                type="button"
                onClick={() => setInflation(rates.inflationRate)}
                className="text-[9px] text-emerald/80 hover:text-emerald hover:underline cursor-pointer"
                title="Reset to India CPI Baseline"
              >
                Reset ({rates.inflationRate}%)
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === "screener" ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Controls Bar: Category Filter & Text Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-navy-card/25 p-4 rounded-2xl border border-border-navy">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {["All", "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "Debt/Liquid"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setScreenerFilterCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    screenerFilterCategory === cat
                      ? "bg-emerald text-navy-bg shadow-md"
                      : "bg-navy-bg border border-border-navy text-muted-grey hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Text Search Box */}
            <div className="w-full md:w-80 flex items-center gap-2.5 glass-input focus-within:border-emerald py-2">
              <Search className="text-muted-grey" size={16} />
              <input
                type="text"
                value={screenerSearch}
                onChange={(e) => setScreenerSearch(e.target.value)}
                placeholder="Search screener..."
                className="w-full bg-transparent outline-none text-white text-xs"
              />
            </div>
          </div>

          {/* Loading / Table */}
          {loadingScreener ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-emerald text-sm">
              <RefreshCw className="animate-spin text-emerald" size={24} />
              <span>Fetching live AMFI-derived NAVs and risk metrics...</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border-navy bg-navy-card/15">
              <table className="min-w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-navy bg-navy-card/45 text-[10px] text-muted-grey font-bold uppercase tracking-wider">
                    {[
                      { label: "Fund Scheme Name", key: "name" },
                      { label: "Category", key: "category" },
                      { label: "NAV", key: "currentNav" },
                      { label: adjustInflation ? "1Y Real CAGR" : "1Y CAGR", key: "cagr1Y" },
                      { label: adjustInflation ? "3Y Real CAGR" : "3Y CAGR", key: "cagr3Y" },
                      { label: adjustInflation ? "5Y Real CAGR" : "5Y CAGR", key: "cagr5Y" },
                      { label: "Vol.", key: "volatility" },
                      { label: "Sharpe", key: "sharpe" },
                      { label: "Sortino", key: "sortino" }
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => {
                          const isCurrent = screenerSort.key === col.key;
                          setScreenerSort({
                            key: col.key,
                            direction: isCurrent && screenerSort.direction === "desc" ? "asc" : "desc"
                          });
                        }}
                        className="px-4 py-4 cursor-pointer hover:text-white hover:bg-navy-light/35 transition-all"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.label}</span>
                          <ArrowUpDown size={10} className="text-muted-grey/60" />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-navy/40">
                  {sortedAndFilteredScreenerFunds.length > 0 ? (
                    sortedAndFilteredScreenerFunds.map((fund) => {
                      const displayCagr3Y = adjustInflation ? getRealCagr(fund.cagr3Y) : fund.cagr3Y;
                      const isHighCagr = displayCagr3Y && displayCagr3Y >= 15;
                      return (
                        <tr key={fund.code} className="hover:bg-navy-light/20 transition-all font-semibold text-light-grey">
                          <td className="px-4 py-4">
                            <div className="space-y-0.5 max-w-[280px]">
                              <p className="text-white font-bold leading-snug truncate" title={fund.name}>
                                {fund.name}
                              </p>
                              <p className="text-[9px] font-mono text-muted-grey">Code: {fund.code}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[10px]">
                            <span className="bg-navy-light px-2 py-0.5 rounded border border-border-navy text-muted-grey text-[9px] whitespace-nowrap">
                              {fund.category}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-mono text-white">₹{fund.currentNav}</td>
                          <td className="px-4 py-4 font-mono">
                            {fund.cagr1Y ? `${(adjustInflation ? getRealCagr(fund.cagr1Y) : fund.cagr1Y)?.toFixed(2)}%` : "-"}
                          </td>
                          <td className={`px-4 py-4 font-mono ${isHighCagr ? "text-emerald font-bold" : ""}`}>
                            {fund.cagr3Y ? `${(adjustInflation ? getRealCagr(fund.cagr3Y) : fund.cagr3Y)?.toFixed(2)}%` : "-"}
                          </td>
                          <td className="px-4 py-4 font-mono">
                            {fund.cagr5Y ? `${(adjustInflation ? getRealCagr(fund.cagr5Y) : fund.cagr5Y)?.toFixed(2)}%` : "-"}
                          </td>
                          <td className="px-4 py-4 font-mono text-muted-grey">{fund.volatility}%</td>
                          <td className="px-4 py-4 font-mono">{fund.sharpe ?? "-"}</td>
                          <td className="px-4 py-4 font-mono">{fund.sortino ?? "-"}</td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => {
                                setMainCode(fund.code);
                                setViewMode("analyzer");
                              }}
                              className="bg-emerald hover:bg-emerald/90 text-navy-bg font-extrabold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer text-[10px]"
                            >
                              <span>Analyze</span>
                              <ChevronRight size={10} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-muted-grey italic">
                        No funds match the selected filters or query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Educational Glossary on Parameters */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/25 space-y-6">
            <div className="flex items-center gap-2 border-b border-border-navy/60 pb-3">
              <BookOpen className="text-emerald" size={20} />
              <h2 className="text-lg font-bold text-white tracking-tight">Mutual Fund Evaluation Glossary</h2>
            </div>
            
            <p className="text-xs text-muted-grey leading-relaxed">
              When investing in mutual funds, returns are only half the equation. Risk and risk-adjusted metrics tell you whether the fund manager is actually delivering value, or simply taking excessive, dangerous risks.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Rolling Returns
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Unlike simple point-to-point CAGR (which only measures returns between two arbitrary dates), rolling returns calculate averages across multiple overlapping holding periods (e.g. every 3-year window in the last 15 years). This reveals the true consistency of a fund manager and filters out luck or market timing.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Sharpe Ratio
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Measures the excess return generated per unit of total risk (volatility). A Sharpe ratio &gt; 1 indicates the fund is generating excellent return for the volatility it takes. Formulated as <code>(CAGR - Risk Free Rate) / Volatility</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Sortino Ratio
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Similar to Sharpe, but only penalizes <em>downside</em> or negative volatility. It ignores upside swings (which are actually good for investors!). Essential for conservative investors to look at.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Annual Volatility
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Represents the standard deviation of daily returns annualized. Higher volatility means larger swings in value. Equity small caps have 18-20% volatility, while liquid debt funds have &lt; 1%.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Alpha
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  The outperformance of the fund relative to its benchmark index (like Nifty 50). If the benchmark yields 12% and the fund yields 15%, it has an Alpha of +3.0. A positive Alpha indicates active fund management success.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border-navy bg-navy-card/40 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span> Beta
                </h3>
                <p className="text-[11px] text-muted-grey leading-relaxed">
                  Measures the price sensitivity of the fund relative to the market benchmark. A Beta of 1.0 means the fund moves in tandem with the index; &gt; 1.0 means it is more reactive (riskier but faster), &lt; 1.0 means it is defensive.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-fadeIn">
          {/* Main Search Panel */}
          <div className="relative max-w-xl mx-auto z-20">
            <div className="flex items-center gap-3 glass-input focus-within:border-emerald">
              <Search className="text-muted-grey" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mutual funds (e.g. Nippon Large Cap, Parag Parikh)..."
                className="w-full bg-transparent outline-none text-white text-sm"
              />
              {isSearching && <RefreshCw className="text-emerald animate-spin" size={16} />}
            </div>

            {/* Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-14 left-0 w-full rounded-xl border border-border-navy bg-navy-bg shadow-2xl p-2 space-y-1 max-h-[250px] overflow-y-auto z-50">
                {searchResults.map((fundItem) => (
                  <button
                    key={fundItem.schemeCode}
                    onClick={() => {
                      setMainCode(fundItem.schemeCode);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-left text-xs font-semibold text-light-grey hover:bg-navy-light hover:text-emerald transition-colors"
                  >
                    <span className="truncate max-w-[85%]">{fundItem.schemeName}</span>
                    <span className="text-[9px] text-muted-grey border border-border-navy px-1 py-0.5 rounded">
                      {fundItem.schemeCode}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading state indicator */}
          {(loadingMain || loadingCompare) && (
            <div className="flex items-center justify-center gap-2 text-sm text-emerald py-8">
              <RefreshCw className="animate-spin" size={16} />
              <span>Crunching real-time historical NAV charts and risk ratios...</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && !loadingMain && (
            <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3 text-center">
              <p className="text-sm text-red-400 font-semibold">{errorMsg}</p>
              <button
                onClick={() => loadFundData(mainCode, "main")}
                className="inline-flex items-center gap-2 bg-emerald hover:bg-emerald/90 text-navy-bg px-5 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <RefreshCw size={14} />
                Retry Loading
              </button>
            </div>
          )}

          {/* Dashboard Grid */}
          {mainFund && !loadingMain && (
            <div className="grid lg:grid-cols-3 gap-8 animate-fadeIn">
              {/* Left Column: Fund info & Comparisons */}
              <div className="lg:col-span-1 space-y-6">
                <div className="p-6 glass-card space-y-5">
                  <div>
                    <span className="text-[10px] font-bold text-emerald uppercase tracking-wider bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded">
                      {mainFund.category || "Equity Fund"}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-2 leading-snug">{mainFund.name}</h2>
                    <span className="text-xs text-muted-grey block mt-1">Fund House: {mainFund.house}</span>
                  </div>

                  <div className="border-t border-border-navy/60 pt-4 space-y-3 text-xs text-light-grey">
                    <div className="flex justify-between border-b border-border-navy/40 pb-2">
                      <span className="text-muted-grey">Current NAV</span>
                      <span className="text-white font-extrabold">{formatCurrency(mainFund.currentNav)}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-navy/40 pb-2">
                      <span className="text-muted-grey">Benchmark Sourcing</span>
                      <span className="text-white font-semibold">AMFI Daily Nav Feed</span>
                    </div>
                    <div className="flex justify-between border-b border-border-navy/40 pb-2">
                      <span className="text-muted-grey">Scheme Code</span>
                      <span className="text-white font-semibold font-mono">{mainFund.code}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Comparison Panel */}
                <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/30 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <GitCompare className="text-emerald" size={18} />
                    Side-by-Side Comparison
                  </h3>
                  <p className="text-xs text-muted-grey leading-relaxed">
                    Add another fund to overlay their performances on the rebased graph, comparing returns and risks.
                  </p>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-grey block">COMPARE MAIN FUND WITH:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (compareFund) {
                            setCompareCode(null);
                          } else {
                            setCompareCode(120716); 
                          }
                        }}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-colors cursor-pointer ${
                          compareFund 
                            ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
                            : "bg-navy-light border-border-navy text-white hover:border-emerald/40"
                        }`}
                      >
                        {compareFund ? "Clear Comparison" : "Overlay Nifty 50 Index"}
                      </button>
                    </div>
                  </div>

                  {compareFund && !loadingCompare && (
                    <div className="p-4 rounded-xl border border-border-navy bg-navy-bg text-xs space-y-2">
                      <span className="text-[10px] font-bold text-emerald uppercase block">Comparing Against:</span>
                      <span className="font-bold text-white block leading-snug">{compareFund.name}</span>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-navy/60 text-[10px]">
                        <div>
                          <span className="text-muted-grey">{adjustInflation ? "Real CAGR (3Y)" : "CAGR (3Y)"}</span>
                          <span className="text-white font-semibold block">
                            {compareFund.cagr3Y ? `${(adjustInflation ? getRealCagr(compareFund.cagr3Y) : compareFund.cagr3Y)?.toFixed(2)}%` : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-grey">Volatility</span>
                          <span className="text-white font-semibold block">{compareFund.volatility}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* General Advice warning */}
                <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45 space-y-2 text-xs text-muted-grey leading-relaxed">
                  <div className="flex items-center gap-1 text-amber-500">
                    <ShieldAlert size={16} />
                    <span className="font-bold uppercase tracking-wider">Education Disclaimer</span>
                  </div>
                  <p>
                    Ratios are derived strictly from mathematical calculations over daily historical NAV endpoints. Ratios of past return metrics do not guarantee future performance values.
                  </p>
                </div>
              </div>

              {/* Right Column: Math metrics and rebased chart */}
              <div className="lg:col-span-2 space-y-6">
                {/* CAGR returns and Volatilities */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
                    <span className="text-[10px] uppercase font-bold text-muted-grey block">
                      {adjustInflation ? "1Y Real CAGR return" : "1Y CAGR return"}
                    </span>
                    <p className="text-lg font-bold text-white mt-1">
                      {mainFund.cagr1Y ? `${(adjustInflation ? getRealCagr(mainFund.cagr1Y) : mainFund.cagr1Y)?.toFixed(2)}%` : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
                    <span className="text-[10px] uppercase font-bold text-muted-grey block">
                      {adjustInflation ? "3Y Real CAGR return" : "3Y CAGR return"}
                    </span>
                    <p className="text-lg font-bold text-emerald mt-1">
                      {mainFund.cagr3Y ? `${(adjustInflation ? getRealCagr(mainFund.cagr3Y) : mainFund.cagr3Y)?.toFixed(2)}%` : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
                    <span className="text-[10px] uppercase font-bold text-muted-grey block">Annual Volatility</span>
                    <p className="text-lg font-bold text-white mt-1">{mainFund.volatility}%</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
                    <span className="text-[10px] uppercase font-bold text-muted-grey block flex items-center gap-1">
                      Sharpe Ratio
                      <span className="text-muted-grey/60 cursor-help inline-flex" title="Returns excess over 6.95% risk-free rate, divided by volatility."><HelpCircle size={12} /></span>
                    </span>
                    <p className="text-lg font-bold text-white mt-1">{mainFund.sharpe || "N/A"}</p>
                  </div>
                </div>

                {/* Performance Chart with Rebased Comparison */}
                <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        {compareFund ? "Comparative Performance (Rebased to 100)" : "Fund Net Performance"}
                      </h3>
                      <p className="text-xs text-muted-grey mt-0.5">
                        {compareFund 
                          ? "Both funds started at 100 to compare compound return speeds" 
                          : `NAV growth over the selected timeframe`}
                      </p>
                    </div>

                    {/* Horizon Switcher */}
                    <div className="flex bg-navy-bg p-1 rounded-lg border border-border-navy text-[10px] font-bold">
                      {(["1Y", "3Y", "5Y"] as const).map((h) => (
                        <button
                          key={h}
                          onClick={() => setTimeHorizon(h)}
                          className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                            timeHorizon === h ? "bg-emerald text-navy-bg" : "text-muted-grey hover:text-white"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart container */}
                  <div className="h-[280px]">
                    {rebasedChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={rebasedChartData}
                          margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCompare" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#112d55" vertical={false} />
                          <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            width={65}
                            domain={["dataMin - 10", "dataMax + 10"]}
                            tickFormatter={(val) => compareFund ? `${Number(val).toFixed(2)}` : `₹${Number(val).toFixed(2)}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#081c3a",
                              borderColor: "#112d55",
                              borderRadius: "8px",
                              color: "#f1f5f9"
                            }}
                            formatter={(value: any) => [compareFund ? `${Number(value).toFixed(2)}` : `₹${Number(value).toFixed(2)}`, "NAV"]}
                          />
                          <Legend iconType="circle" />
                          <Area
                            type="monotone"
                            dataKey={mainFund.name}
                            stroke="#22c55e"
                            fillOpacity={1}
                            fill="url(#colorMain)"
                            strokeWidth={2}
                          />
                          {compareFund && (
                            <Area
                              type="monotone"
                              dataKey={compareFund.name}
                              stroke="#ef4444"
                              fillOpacity={1}
                              fill="url(#colorCompare)"
                              strokeWidth={2}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-grey italic">
                        Historical data not stretching back far enough for {timeHorizon} view.
                      </div>
                    )}
                  </div>
                  {compareFund && (
                    <p className="text-[10px] text-muted-grey text-right pt-2">
                      * <strong>Benchmark Disclosure:</strong> Benchmarks (like Nifty 50 TRI) are approximated using passive index-tracking mutual fund schemes as direct proxies.
                    </p>
                  )}
                </div>

                {/* Volatility Ratios Explanation card */}
                <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Info className="text-emerald" size={18} />
                    Volatility Risk Indicators (Education Card)
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6 text-xs text-muted-grey leading-relaxed border-t border-border-navy/60 pt-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-white">1. Annualized Volatility</h4>
                      <p>
                        Volatility measures the magnitude of daily price swings. A fund with 18% volatility will experience much larger index corrections than a conservative fund with 9% volatility. Ensure your time horizon supports the fund&apos;s volatility level.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-white">2. Sharpe & Sortino ratios</h4>
                      <p>
                        <strong>Sharpe Ratio</strong> evaluates the excess yield relative to standard deviation. If the Sharpe is high, the manager took efficient risks. <strong>Sortino Ratio</strong> only penalizes downside volatility, making it the preferred metric to examine for conservative portfolios.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
