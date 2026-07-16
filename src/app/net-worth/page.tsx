"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, ShieldCheck, ChevronDown, HelpCircle } from "lucide-react";
import NumericInput from "@/components/NumericInput";

interface LineItem {
  id: number;
  label: string;
  value: number;
}

function ItemList({
  items,
  onAdd,
  onRemove,
  onChange,
  color,
}: {
  items: LineItem[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: "label" | "value", val: string | number) => void;
  color: "emerald" | "red";
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <input
            type="text"
            value={item.label}
            onChange={(e) => onChange(item.id, "label", e.target.value)}
            placeholder="Label…"
            className="flex-1 bg-navy-bg border border-border-navy rounded-lg px-3 py-2 text-xs text-white placeholder-muted-grey focus:outline-none focus:border-emerald/50"
          />
          <NumericInput
            value={item.value}
            onChange={(v) => onChange(item.id, "value", v)}
            min={0}
            max={100000000}
            step={10000}
            type="currency"
          />
          <button
            onClick={() => onRemove(item.id)}
            className="text-muted-grey hover:text-red-400 transition-colors shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className={`flex items-center gap-1.5 text-[11px] font-semibold mt-1 ${
          color === "emerald" ? "text-emerald hover:text-white" : "text-red-400 hover:text-white"
        } transition-colors`}
      >
        <Plus size={13} /> Add Item
      </button>
    </div>
  );
}

let nextId = 100;

export default function NetWorthCalculator() {
  const [showAudit, setShowAudit] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [assets, setAssets] = useState<LineItem[]>([
    { id: 1, label: "Savings & Current Accounts", value: 200000 },
    { id: 2, label: "Mutual Funds & Stocks", value: 500000 },
    { id: 3, label: "Provident Fund (PF / PPF)", value: 300000 },
    { id: 4, label: "Gold & Jewellery", value: 150000 },
    { id: 5, label: "Property / Real Estate", value: 4500000 },
  ]);

  const [liabilities, setLiabilities] = useState<LineItem[]>([
    { id: 6, label: "Home Loan Outstanding", value: 2000000 },
    { id: 7, label: "Car / Personal Loan", value: 300000 },
    { id: 8, label: "Credit Card Dues", value: 50000 },
  ]);

  useEffect(() => setMounted(true), []);

  const addAsset = () => {
    setAssets((p) => [...p, { id: ++nextId, label: "", value: 0 }]);
  };
  const removeAsset = (id: number) => setAssets((p) => p.filter((x) => x.id !== id));
  const changeAsset = (id: number, field: "label" | "value", val: string | number) =>
    setAssets((p) => p.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  const addLiability = () => {
    setLiabilities((p) => [...p, { id: ++nextId, label: "", value: 0 }]);
  };
  const removeLiability = (id: number) => setLiabilities((p) => p.filter((x) => x.id !== id));
  const changeLiability = (id: number, field: "label" | "value", val: string | number) =>
    setLiabilities((p) => p.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  const { totalAssets, totalLiabilities, netWorth, pieData } = useMemo(() => {
    const totalAssets = assets.reduce((s, x) => s + x.value, 0);
    const totalLiabilities = liabilities.reduce((s, x) => s + x.value, 0);
    const netWorth = totalAssets - totalLiabilities;
    const pieData = [
      { name: "Net Worth", value: Math.max(netWorth, 0), color: "#22c55e" },
      { name: "Total Liabilities", value: totalLiabilities, color: "#ef4444" },
    ];
    return { totalAssets, totalLiabilities, netWorth, pieData };
  }, [assets, liabilities]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  if (!mounted) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald" /></div>;

  return (
    <div className="space-y-10 py-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-navy pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Wallet className="text-emerald" />
            Net Worth Calculator
          </h1>
          <p className="text-sm text-muted-grey mt-1">
            Wealth = Total Assets − Total Liabilities. Track your financial snapshot and watch it grow over time.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald bg-emerald/5 border border-emerald/20 px-3 py-1.5 rounded-lg">
          💡 Motto: We don&apos;t tell what to pick, we tell how to pick.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input Lists */}
        <div className="space-y-6">
          {/* Assets */}
          <div className="p-6 glass-card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald" /> Assets
              <span className="ml-auto text-emerald font-bold text-sm">{fmt(totalAssets)}</span>
            </h2>
            <p className="text-[10px] text-muted-grey">Everything you OWN that has monetary value.</p>
            <ItemList items={assets} onAdd={addAsset} onRemove={removeAsset} onChange={changeAsset} color="emerald" />
          </div>

          {/* Liabilities */}
          <div className="p-6 glass-card space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingDown size={16} className="text-red-400" /> Liabilities
              <span className="ml-auto text-red-400 font-bold text-sm">{fmt(totalLiabilities)}</span>
            </h2>
            <p className="text-[10px] text-muted-grey">Everything you OWE — loans, credit card dues, outstanding bills.</p>
            <ItemList items={liabilities} onAdd={addLiability} onRemove={removeLiability} onChange={changeLiability} color="red" />
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {/* Net Worth Card */}
          <div className={`p-6 rounded-2xl border ${netWorth >= 0 ? "border-emerald/40 bg-emerald/5" : "border-red-500/40 bg-red-500/5"} text-center space-y-2`}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-grey">Your Net Worth</p>
            <p className={`text-5xl font-extrabold ${netWorth >= 0 ? "text-emerald glow-emerald" : "text-red-400"}`}>
              {fmt(netWorth)}
            </p>
            <p className="text-[11px] text-muted-grey">
              {netWorth >= 0
                ? `Your assets cover ${((totalAssets / Math.max(totalLiabilities, 1)) * 100).toFixed(0)}% more than your debts.`
                : "Your liabilities exceed your assets — focus on paying down debt first."}
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-emerald block">Total Assets</span>
              <p className="text-xl font-bold text-white mt-1">{fmt(totalAssets)}</p>
            </div>
            <div className="p-4 rounded-xl border border-border-navy bg-navy-card/45">
              <span className="text-[10px] uppercase font-bold text-red-400 block">Total Liabilities</span>
              <p className="text-xl font-bold text-white mt-1">{fmt(totalLiabilities)}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/20 h-[220px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
              <span className="text-[10px] text-muted-grey uppercase font-bold">Net Worth</span>
              <span className={`text-sm font-extrabold ${netWorth >= 0 ? "text-emerald" : "text-red-400"}`}>{fmt(netWorth)}</span>
            </div>
          </div>

          {/* Educational */}
          <div className="p-5 rounded-2xl border border-border-navy bg-navy-card/45 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald" /> Why Net Worth is the True Measure of Wealth
            </h3>
            <p className="text-xs text-muted-grey leading-relaxed">
              Income is a flow — it starts and stops. <strong className="text-white">Net worth is a stock</strong> — it compounds silently. A person earning ₹20L/year but spending ₹19L is less wealthy than someone earning ₹10L and investing ₹4L. Track your net worth quarterly to measure actual financial progress.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: "Negative Net Worth", desc: "Debt > Assets. Focus on clearing high-interest loans before investing.", color: "text-red-400" },
                { label: "Zero to ₹25L", desc: "Building phase. Consistency in SIPs + debt repayment is key.", color: "text-amber-400" },
                { label: "₹25L+", desc: "Compounding takes over. Protect with diversification and insurance.", color: "text-emerald" },
              ].map((s) => (
                <div key={s.label} className="p-2.5 rounded-xl border border-border-navy/60 bg-navy-bg/40">
                  <p className={`text-[10px] font-bold ${s.color}`}>{s.label}</p>
                  <p className="text-[9px] text-muted-grey mt-0.5 leading-tight">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit */}
      <div className="p-6 rounded-2xl border border-border-navy bg-navy-card/45 space-y-4">
        <button onClick={() => setShowAudit(!showAudit)} className="w-full flex justify-between items-center text-sm font-bold text-white hover:text-emerald transition-colors cursor-pointer">
          <span className="flex items-center gap-1.5"><HelpCircle className="text-emerald" size={18} />How This is Calculated</span>
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAudit ? "rotate-180" : ""}`} />
        </button>
        {showAudit && (
          <div className="text-xs text-muted-grey leading-relaxed space-y-3 pt-4 border-t border-border-navy/60 animate-fadeIn">
            <div className="bg-navy-bg/50 p-3 rounded-xl font-mono space-y-1">
              <p>Net Worth = Total Assets − Total Liabilities</p>
              <p>Total Assets = Σ(all asset values you entered)</p>
              <p>Total Liabilities = Σ(all liability values you entered)</p>
            </div>
            <p className="text-[10px] text-amber-500">⚠️ <strong>Disclaimer:</strong> For educational purposes only. Property and investment valuations should be periodically reviewed at market prices.</p>
          </div>
        )}
      </div>
    </div>
  );
}
