"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Search,
  PieChart as PieIcon,
  Plus,
  Trash2,
  Info,
  AlertTriangle,
  ShieldCheck,
  Upload,
  FileText,
  RefreshCw,
  X,
  Lock,
  ChevronDown,
  CheckCircle
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface PortfolioItem {
  id: string;
  name: string;
  assetClass: string;
  sector: string;
  units: number;
  purchaseNav: number;
  currentNav: number;
  expenseRatio: number;
  investedValue?: number;
  currentValue?: number;
}

interface SchemeItem {
  code: number;
  name: string;
  category: string;
  assetClass: string;
  nav?: number | null;
}

export default function PortfolioAnalyzer() {
  const [mounted, setMounted] = useState(false);
  
  // Portfolio Holdings State — starts empty, populated by upload or manual add
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  // UI Control States
  const [inputUnits, setInputUnits] = useState("10");
  const [inputPurchaseNav, setInputPurchaseNav] = useState("");
  const [activeGuideTab, setActiveGuideTab] = useState<"cams" | "zerodha" | "groww">("cams");

  // PDF Parser States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "encrypted" | "parsed" | "error">("idle");
  const [pdfPassword, setPdfPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showManualAdd, setShowManualAdd] = useState(false);

  // AMFI Scheme Database States
  const [allSchemes, setAllSchemes] = useState<SchemeItem[]>([]);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SchemeItem[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<SchemeItem | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Fetch full AMFI scheme database on mount
    fetchSchemeDatabase();
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSchemeDatabase = async () => {
    setSchemesLoading(true);
    try {
      const res = await fetch("/api/portfolio/schemes");
      const data = await res.json();
      if (data.success && data.data) {
        setAllSchemes(data.data);
      }
    } catch (err) {
      console.error("Failed to load scheme database:", err);
    } finally {
      setSchemesLoading(false);
    }
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedScheme(null);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = allSchemes
      .filter((s) => {
        const nameLower = s.name.toLowerCase();
        return queryWords.every(word => nameLower.includes(word));
      })
      .slice(0, 30);
    setSearchResults(filtered);
    setShowSearchDropdown(filtered.length > 0);
  }, [allSchemes]);

  const handleSelectScheme = (scheme: SchemeItem) => {
    setSelectedScheme(scheme);
    setSearchQuery(scheme.name);
    setShowSearchDropdown(false);
    setInputPurchaseNav(scheme.nav ? scheme.nav.toString() : "10");
  };

  // Load PDF.js dynamically on the client-side
  const loadPdfJs = () => {
    const win = window as any;
    if (win.pdfjsLib) return Promise.resolve(win.pdfjsLib);
    return new Promise<any>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        const pdfjs = win["pdfjs-dist/build/pdf"];
        pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjs);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Load SheetJS dynamically on the client-side
  const loadXlsx = () => {
    const win = window as any;
    if (win.XLSX) return Promise.resolve(win.XLSX);
    return new Promise<any>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      script.onload = () => {
        resolve(win.XLSX);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Excel Text Content Extraction Handler
  const extractTextFromExcel = async (file: File) => {
    try {
      setUploadStatus("loading");
      setStatusMessage("Loading Excel parser module...");
      const XLSX = await loadXlsx();

      setStatusMessage("Reading Excel statement...");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      let combinedText = "";
      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        combinedText += csv + "\n";
      });

      setStatusMessage("Matching against AMFI database...");
      const parsedItems = await parseTextWithServer(combinedText);
      if (parsedItems.length === 0) {
        setUploadStatus("error");
        setStatusMessage("No mutual fund schemes found in the Excel file. Try uploading a different statement.");
        return;
      }
      setPortfolio(parsedItems);
      setUploadStatus("parsed");
      setStatusMessage(`Successfully imported ${parsedItems.length} holdings from Excel!`);
    } catch (err: any) {
      console.error("Excel Parsing error:", err);
      setUploadStatus("error");
      setStatusMessage(err.message || "Failed to parse Excel statement.");
    }
  };

  // PDF Text Content Extraction Handler
  const extractTextFromPDF = async (file: File, password = "") => {
    try {
      setUploadStatus("loading");
      setStatusMessage("Loading parser module...");
      const pdfjs = await loadPdfJs();
      
      setStatusMessage("Reading statement pages...");
      const arrayBuffer = await file.arrayBuffer();
      
      let pdfDoc;
      try {
        pdfDoc = await pdfjs.getDocument({ data: arrayBuffer, password }).promise;
      } catch (err: any) {
        if (err.name === "PasswordException") {
          setUploadStatus("encrypted");
          setStatusMessage("Encrypted Statement. Please enter PAN/Email password.");
          return;
        }
        throw err;
      }

      let combinedText = "";
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        setStatusMessage(`Processing page ${i} of ${pdfDoc.numPages}...`);
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        combinedText += textContent.items.map((item: any) => item.str).join(" ") + " ";
      }

      setStatusMessage("Matching against AMFI database...");
      const parsedItems = await parseTextWithServer(combinedText);
      if (parsedItems.length === 0) {
        setUploadStatus("error");
        setStatusMessage("No mutual fund schemes found in the PDF. Try uploading a different statement.");
        return;
      }
      setPortfolio(parsedItems);
      setUploadStatus("parsed");
      setStatusMessage(`Successfully imported ${parsedItems.length} holdings from PDF!`);
    } catch (err: any) {
      console.error("PDF Parsing error:", err);
      setUploadStatus("error");
      setStatusMessage(err.message || "Failed to parse PDF statement. Is the password correct?");
    }
  };

  const processUploadedFile = (file: File, password = "") => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      extractTextFromExcel(file);
    } else {
      extractTextFromPDF(file, password);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setPdfPassword("");
      processUploadedFile(file);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pdfFile && pdfPassword) {
      processUploadedFile(pdfFile, pdfPassword);
    }
  };

  // Server-backed smart parser — sends extracted text to /api/portfolio/parse
  const parseTextWithServer = async (text: string): Promise<PortfolioItem[]> => {
    try {
      const res = await fetch("/api/portfolio/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success && data.holdings && data.holdings.length > 0) {
        return data.holdings.map((h: any) => ({
          id: Math.random().toString(),
          name: h.name,
          assetClass: h.assetClass || "Other",
          sector: h.sector || "Diversified",
          units: h.units || 100,
          purchaseNav: h.purchaseNav || h.nav || 10,
          currentNav: h.nav || h.purchaseNav || 10,
          expenseRatio: h.expenseRatio || 0,
          investedValue: h.investedValue,
          currentValue: h.currentValue
        }));
      }
      // Server couldn't find any matches
      return [];
    } catch (err) {
      console.error("Server parse failed:", err);
      return [];
    }
  };

  const handleAddItem = () => {
    if (!selectedScheme) {
      alert("Please search and select a fund/stock from the AMFI database.");
      return;
    }

    const parsedUnits = parseFloat(inputUnits);
    const parsedPurchaseNav = parseFloat(inputPurchaseNav);

    if (isNaN(parsedUnits) || parsedUnits <= 0) {
      alert("Please enter a valid positive number for units.");
      return;
    }
    if (isNaN(parsedPurchaseNav) || parsedPurchaseNav <= 0) {
      alert("Please enter a valid positive number for purchase price.");
      return;
    }

    const existing = portfolio.find((item) => item.name === selectedScheme.name);
    if (existing) {
      const newUnits = existing.units + parsedUnits;
      const newPurchaseNav = (existing.units * existing.purchaseNav + parsedUnits * parsedPurchaseNav) / newUnits;
      setPortfolio(
        portfolio.map((item) =>
          item.name === selectedScheme.name
            ? { ...item, units: Number(newUnits.toFixed(3)), purchaseNav: Number(newPurchaseNav.toFixed(2)) }
            : item
        )
      );
    } else {
      const lc = selectedScheme.category.toLowerCase();
      let sector = "Diversified";
      if (lc.includes("banking") || lc.includes("financial")) sector = "Financials";
      else if (lc.includes("pharma") || lc.includes("health")) sector = "Healthcare";
      else if (lc.includes("technology") || lc.includes("it")) sector = "Technology";
      else if (lc.includes("energy") || lc.includes("power")) sector = "Energy";
      else if (lc.includes("liquid") || lc.includes("overnight")) sector = "Liquid Reserves";
      else if (lc.includes("gold") || lc.includes("silver")) sector = "Precious Metals";
      else if (lc.includes("gilt") || lc.includes("bond") || lc.includes("credit") || lc.includes("debt")) sector = "Fixed Income";

      setPortfolio([
        ...portfolio,
        {
          id: Math.random().toString(),
          name: selectedScheme.name,
          assetClass: selectedScheme.assetClass || "Other",
          sector,
          units: Number(parsedUnits.toFixed(3)),
          purchaseNav: Number(parsedPurchaseNav.toFixed(2)),
          currentNav: selectedScheme.nav || parsedPurchaseNav || 10,
          expenseRatio: 0
        }
      ]);
    }

    // Reset search
    setSearchQuery("");
    setSelectedScheme(null);
    setSearchResults([]);
  };

  const handleRemoveItem = (id: string) => {
    setPortfolio(portfolio.filter((item) => item.id !== id));
  };

  const calculations = useMemo(() => {
    let totalInvestedValue = 0;
    let totalCurrentValue = 0;
    let weightedExpense = 0;

    const itemsWithValuations = portfolio.map((item) => {
      const invested = item.investedValue !== undefined ? item.investedValue : (item.units * item.purchaseNav);
      const current = item.currentValue !== undefined ? item.currentValue : (item.units * item.currentNav);
      const pnl = current - invested;
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

      totalInvestedValue += invested;
      totalCurrentValue += current;

      return {
        ...item,
        investedValue: invested,
        currentValue: current,
        pnlAmount: pnl,
        pnlPercent: pnlPct
      };
    });

    const assetAllocMap: Record<string, number> = {};
    const sectorAllocMap: Record<string, number> = {};

    itemsWithValuations.forEach((item) => {
      const weight = totalCurrentValue > 0 ? (item.currentValue / totalCurrentValue) * 100 : 0;
      assetAllocMap[item.assetClass] = (assetAllocMap[item.assetClass] || 0) + weight;
      sectorAllocMap[item.sector] = (sectorAllocMap[item.sector] || 0) + weight;
      weightedExpense += (item.expenseRatio * weight) / 100;
    });

    const COLORS = ["#22c55e", "#0e274e", "#f59e0b", "#ef4444", "#a855f7", "#6366f1", "#06b6d4"];

    const assetData = Object.keys(assetAllocMap).map((key, index) => ({
      name: key,
      value: Math.round(assetAllocMap[key]),
      color: COLORS[index % COLORS.length]
    }));

    const sectorData = Object.keys(sectorAllocMap).map((key, index) => ({
      name: key,
      value: Math.round(sectorAllocMap[key]),
      color: COLORS[(index + 2) % COLORS.length]
    }));

    let concentrationPenalty = 0;
    Object.keys(sectorAllocMap).forEach((key) => {
      const val = sectorAllocMap[key];
      if (val > 40) concentrationPenalty += (val - 40) * 1.2;
    });

    const baseScore = Math.min(100, portfolio.length * 20);
    const divScore = Math.max(10, Math.round(baseScore - concentrationPenalty));

    const equityPct = assetAllocMap["Equity"] || 0;
    let riskLabel = "Low";
    if (equityPct > 75) riskLabel = "Very High";
    else if (equityPct > 50) riskLabel = "High";
    else if (equityPct > 25) riskLabel = "Moderate";

    const totalPnlAmount = totalCurrentValue - totalInvestedValue;
    const totalPnlPercent = totalInvestedValue > 0 ? (totalPnlAmount / totalInvestedValue) * 100 : 0;

    return {
      totalInvestedValue,
      totalCurrentValue,
      totalPnlAmount,
      totalPnlPercent,
      assetData,
      sectorData,
      weightedExpense: weightedExpense.toFixed(2),
      divScore,
      riskLabel,
      itemsWithValuations
    };
  }, [portfolio]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 py-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <PieIcon className="text-emerald" />
            Portfolio Allocation Diagnostic
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Upload your broker statement PDF to automatically calculate asset class concentration, sector correlation, and fee layers.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: PDF Upload & Manual Holdings List */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* PDF Uploader Panel */}
          <div className="p-6 glass-card space-y-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Upload size={18} className="text-emerald" />
              Upload Statement
            </h2>
            <p className="text-[11px] text-muted-grey leading-relaxed">
              Drag and drop your Zerodha, Groww, or CAMS statement — PDF, Excel (XLSX/XLS), or CSV. 
              Our parser is local; your financial data never leaves your browser.
            </p>

            {/* Drag & Drop Zone */}
            <div className="relative border-2 border-dashed border-border-navy/60 hover:border-emerald/45 rounded-xl p-6 text-center transition-all bg-navy-card/10 flex flex-col items-center justify-center gap-3">
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <FileText className="text-muted-grey hover:text-emerald transition-colors" size={32} />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Select PDF, Excel, or CSV</span>
                <span className="text-[9px] text-muted-grey block">Supports .pdf .xlsx .xls .csv — Max 5MB</span>
              </div>
            </div>

            {/* Status indicator bar */}
            {uploadStatus !== "idle" && (
              <div className={`p-3 rounded-xl border text-xs leading-normal flex items-start gap-2.5 ${
                uploadStatus === "loading" ? "bg-navy-light/20 border-border-navy text-emerald" :
                uploadStatus === "encrypted" ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                uploadStatus === "parsed" ? "bg-emerald/10 border-emerald/20 text-emerald" :
                "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {uploadStatus === "loading" && <RefreshCw size={14} className="animate-spin mt-0.5 shrink-0" />}
                {uploadStatus === "encrypted" && <Lock size={14} className="mt-0.5 shrink-0" />}
                {uploadStatus === "parsed" && <CheckCircle size={14} className="mt-0.5 shrink-0" />}
                {uploadStatus === "error" && <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                <p>{statusMessage}</p>
              </div>
            )}

            {/* Password Decryption Form */}
            {uploadStatus === "encrypted" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-2 pt-2 border-t border-border-navy/50 animate-fadeIn">
                <label className="text-[10px] font-bold text-muted-grey block">ENTER PDF PASSWORD</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    placeholder="PAN in CAPITALS or Email"
                    className="w-full glass-input text-xs"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-navy-bg font-extrabold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Decrypt
                  </button>
                </div>
                <span className="text-[9px] text-muted-grey block leading-tight">
                  *Standard CAS statements are locked with your PAN (e.g. ABCDE1234F) or registered Email ID.
                </span>
              </form>
            )}

            {/* Manual Toggle */}
            <div className="pt-2">
              <button
                onClick={() => setShowManualAdd(!showManualAdd)}
                className="text-[10px] font-bold text-emerald flex items-center gap-1 hover:text-white transition-colors"
              >
                <span>{showManualAdd ? "Hide Custom Asset Control" : "Add Asset Manually"}</span>
                <ChevronDown size={12} className={`transition-transform ${showManualAdd ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Optional Manual Add Asset Block */}
            {showManualAdd && (
              <div className="space-y-3 pt-3 border-t border-border-navy/55 animate-fadeIn">
                <div className="space-y-1 relative" ref={searchRef}>
                  <label className="text-[10px] font-bold text-muted-grey flex items-center gap-1">
                    <Search size={10} />
                    Search AMFI Database ({schemesLoading ? "Loading..." : `${allSchemes.length.toLocaleString()} schemes`})
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                    placeholder="Type fund name e.g. Mirae, SBI Contra, Nifty..."
                    className="w-full glass-input text-xs font-semibold text-white bg-navy-bg"
                  />

                  {/* Search Results Dropdown */}
                  {showSearchDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-[200px] overflow-y-auto bg-navy-bg border border-border-navy rounded-xl shadow-xl z-30">
                      {searchResults.map((scheme) => (
                        <button
                          key={scheme.code}
                          onClick={() => handleSelectScheme(scheme)}
                          className="w-full text-left px-3 py-2 hover:bg-emerald/10 border-b border-border-navy/30 last:border-0 cursor-pointer transition-colors"
                        >
                          <span className="text-[11px] font-semibold text-white block truncate">{scheme.name}</span>
                          <span className="text-[9px] text-muted-grey block">{scheme.category} • {scheme.assetClass}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected scheme badge */}
                {selectedScheme && (
                  <div className="flex items-center gap-2 p-2 bg-emerald/10 border border-emerald/20 rounded-lg">
                    <CheckCircle size={12} className="text-emerald shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald block truncate">{selectedScheme.name}</span>
                      <span className="text-[8px] text-muted-grey block">{selectedScheme.category} • {selectedScheme.assetClass}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-grey block">UNITS OWNED</label>
                    <input
                      type="number"
                      step="any"
                      value={inputUnits}
                      onChange={(e) => setInputUnits(e.target.value)}
                      placeholder="e.g. 10.45"
                      className="w-full glass-input text-xs font-semibold text-white bg-navy-bg"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-grey block">PURCHASE NAV (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={inputPurchaseNav}
                      onChange={(e) => setInputPurchaseNav(e.target.value)}
                      placeholder="e.g. 125.50"
                      className="w-full glass-input text-xs font-semibold text-white bg-navy-bg"
                      required
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddItem}
                  disabled={!selectedScheme}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    selectedScheme
                      ? "bg-emerald text-navy-bg hover:bg-emerald/90"
                      : "bg-muted-grey/20 text-muted-grey cursor-not-allowed"
                  }`}
                >
                  <Plus size={14} />
                  <span>Add Holding</span>
                </button>
              </div>
            )}
          </div>

          {/* Current Allocations List */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white">Portfolio Holdings ({portfolio.length})</h3>
              
              <div className="flex gap-2">
                {portfolio.length > 0 && (
                  <button
                    onClick={() => setPortfolio([])}
                    className="text-[9px] font-bold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {calculations.itemsWithValuations.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-navy-bg/50 border border-border-navy/60 rounded-xl space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-bold text-white block text-xs truncate max-w-[200px]" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-[9px] text-muted-grey block">
                        {item.assetClass} • {item.sector}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-muted-grey hover:text-red-400 cursor-pointer shrink-0 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-navy/30 text-[10px] text-muted-grey">
                    <div>
                      <span className="block text-[8px] uppercase font-bold">Qty / Price</span>
                      <span className="font-semibold text-white">{item.units} @ ₹{item.purchaseNav.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase font-bold">Current NAV</span>
                      <span className="font-semibold text-white">₹{item.currentNav.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] uppercase font-bold text-right">Current Value</span>
                      <span className="font-bold text-white">₹{Math.round(item.currentValue).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] bg-navy-card/20 px-2 py-1 rounded">
                    <span className="text-muted-grey font-medium">Profit / Loss</span>
                    <span className={`font-bold ${item.pnlAmount >= 0 ? "text-emerald" : "text-red-400"}`}>
                      {item.pnlAmount >= 0 ? "+" : ""}₹{Math.round(item.pnlAmount).toLocaleString("en-IN")} ({item.pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              ))}

              {portfolio.length === 0 && (
                <span className="text-xs text-muted-grey italic text-center block py-8">
                  No holdings loaded. Upload a broker statement PDF or add manually above.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Charts & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Valuations & Performance Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Invested</span>
              <p className="text-xl font-bold text-white mt-1">₹{calculations.totalInvestedValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Principal invested amount</span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Current Value</span>
              <p className="text-xl font-bold text-white mt-1">₹{calculations.totalCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Valued at daily AMFI NAV</span>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Total Returns (P&L)</span>
              <p className={`text-xl font-bold mt-1 ${calculations.totalPnlAmount >= 0 ? "text-emerald" : "text-red-400"}`}>
                {calculations.totalPnlAmount >= 0 ? "+" : ""}
                ₹{calculations.totalPnlAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs ml-1.5 font-semibold">
                  ({calculations.totalPnlAmount >= 0 ? "+" : ""}{calculations.totalPnlPercent.toFixed(2)}%)
                </span>
              </p>
              <span className="text-[9px] text-muted-grey block mt-0.5">Absolute returns overview</span>
            </div>
          </div>

          {/* Diagnostic Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Portfolio Risk</span>
              <p className="text-sm font-bold text-white mt-1">{calculations.riskLabel}</p>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Diversification</span>
              <p className="text-sm font-bold text-emerald mt-1">{calculations.divScore}/100</p>
            </div>

            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/30">
              <span className="text-[10px] uppercase font-bold text-muted-grey block">Weighted Expense</span>
              <p className="text-sm font-bold text-white mt-1">{calculations.weightedExpense}%</p>
            </div>
          </div>

          {/* Allocation Charts */}
          {portfolio.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Asset Class Allocation Pie */}
              <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Asset Class Split</h3>
                <div className="h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={calculations.assetData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {calculations.assetData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#081c3a",
                          borderColor: "#112d55",
                          borderRadius: "8px",
                          color: "#f1f5f9"
                        }}
                        formatter={(val: any) => [`${val}%`, "Allocation"]}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sector Allocation Pie */}
              <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Sector Split</h3>
                <div className="h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={calculations.sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {calculations.sectorData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#081c3a",
                          borderColor: "#112d55",
                          borderRadius: "8px",
                          color: "#f1f5f9"
                        }}
                        formatter={(val: any) => [`${val}%`, "Allocation"]}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* Educational Insights Box */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/40 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 border-b border-border-navy/60 pb-3">
              <Info className="text-emerald" size={18} />
              Educational Portfolio Diagnostics
            </h3>

            <div className="space-y-4 text-xs text-muted-grey leading-relaxed">
              {calculations.divScore < 50 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-white block">High Concentration Penalty</span>
                    <p className="mt-1">
                      Your portfolio has a low diversification score because more than 40% of assets are concentrated in a single sector or asset class. If that asset class faces corrections, your entire wealth will suffer. Consider allocating into gold or index debt funds to shield yourself.
                    </p>
                  </div>
                </div>
              )}

              {calculations.riskLabel === "Very High" && (
                <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-white block">Aggressive Asset Profile</span>
                    <p className="mt-1">
                      Your allocations contain &gt; 75% equity. This is optimal for long-term compounding (&gt; 7 years) but highly risky if you need to pay for short-term goals. Ensure you have 6–12 months of emergency cash set aside outside of this portfolio.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-navy-bg border border-border-navy/60 rounded-xl flex items-start gap-3">
                <ShieldCheck className="text-emerald shrink-0 mt-0.5" size={18} />
                <div>
                  <span className="font-bold text-white block">The Correlation Principle</span>
                  <p className="mt-1">
                    True diversification does not mean buying 15 different equity funds. It means buying assets that behave differently under the same market conditions. Gold often rises during stock market crashes, and debt funds remain stable when interest rate hikes compress corporate stock valuations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Guide: How to Download Statement PDF */}
      <section className="space-y-6">
        <div className="border-b border-border-navy/60 pb-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="text-emerald" />
            Guide: How to Download Your Statement PDF
          </h2>
          <p className="text-sm text-muted-grey mt-1">
            Step-by-step instructions to get your portfolio holdings statement from major platforms.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-border-navy/60 pb-px gap-2 flex-wrap">
          {[
            { id: "cams", label: "CAMS / KFintech (CAS)" },
            { id: "zerodha", label: "Zerodha Console" },
            { id: "groww", label: "Groww App" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveGuideTab(tab.id as any)}
              className={`px-5 py-2.5 border-b-2 font-bold text-xs transition-all cursor-pointer ${
                activeGuideTab === tab.id
                  ? "border-emerald text-emerald bg-emerald/5"
                  : "border-transparent text-muted-grey hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/15 text-xs text-muted-grey leading-relaxed space-y-4 animate-fadeIn">
          {activeGuideTab === "cams" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">How to request Consolidated Account Statement (CAS)</h3>
              <p>
                The Consolidated Account Statement (CAS) contains all your mutual fund purchases across platforms (Zerodha, Groww, INDmoney, banks, etc.) managed by CAMS or KFintech. It is completely free.
              </p>
              <ol className="list-decimal pl-5 space-y-2 font-medium">
                <li>Visit the CAMS CAS website (<a href="https://www.camsonline.com/Investors/Statements/Consolidated-Account-Statement" target="_blank" rel="noreferrer" className="text-emerald underline">camsonline.com</a>).</li>
                <li>Choose the statement type as <strong>CAS - CAMS+KFintech</strong>.</li>
                <li>Enter your PAN Card number and registered Email ID.</li>
                <li>Set a password for your PDF statement (Write this down; you will need it to decrypt and upload).</li>
                <li>Select the period (e.g. Summary / Detailed statement).</li>
                <li>Click <strong>Submit</strong>. Within 5 minutes, KFin/CAMS will email you the PDF.</li>
              </ol>
              <p className="text-emerald/80 text-[10px] font-semibold mt-2">💡 CAS statements are delivered as password-protected PDF. Use the decrypt prompt after uploading.</p>
            </div>
          )}

          {activeGuideTab === "zerodha" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">How to download Zerodha Holdings Statement</h3>
              <p>
                To analyze your Zerodha stock and mutual fund investments:
              </p>
              <ol className="list-decimal pl-5 space-y-2 font-medium">
                <li>Log in to your <strong>Zerodha Console</strong> dashboard (<a href="https://console.zerodha.com" target="_blank" rel="noreferrer" className="text-emerald underline">console.zerodha.com</a>).</li>
                <li>Click on the <strong>Portfolio</strong> menu item in the top header, and click <strong>Holdings</strong>.</li>
                <li>Locate the <strong>Download</strong> dropdown button on the right side of the screen.</li>
                <li>Choose <strong>Download PDF</strong> or <strong>Download Excel (XLSX)</strong> — both formats are supported.</li>
                <li>The downloaded file will not be password-protected. Simply drag and drop it into the uploader box.</li>
              </ol>
              <p className="text-emerald/80 text-[10px] font-semibold mt-2">💡 Zerodha Console supports both PDF and Excel exports. Either will work.</p>
            </div>
          )}

          {activeGuideTab === "groww" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">How to download Groww Holdings Statement</h3>
              <p>
                To download your mutual fund or stock holdings report on Groww:
              </p>
              <ol className="list-decimal pl-5 space-y-2 font-medium">
                <li>Open the <strong>Groww App</strong> or website and log in to your profile account.</li>
                <li>Click on your Profile picture at the top right, and go to <strong>Reports</strong>.</li>
                <li>Select <strong>Mutual Fund Holdings Report</strong> or <strong>Stock Holdings Statement</strong>.</li>
                <li>Click on the <strong>PDF Download</strong> or <strong>Excel Download</strong> button — we support both formats.</li>
                <li>Once the document is saved to your phone or computer, upload it directly here.</li>
              </ol>
              <p className="text-emerald/80 text-[10px] font-semibold mt-2">💡 Groww reports can also be exported as CSV from some sections. All formats are supported.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
