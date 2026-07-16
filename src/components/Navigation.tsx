"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Layers,
  Shield,
  Percent,
  Target,
  Hourglass,
  PieChart,
  Calculator,
  Menu,
  X,
  Info,
  Sun,
  Moon,
  Coins,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ShieldAlert,
  Flame,
  Wallet,
  Coffee,
  Clock,
  BarChart2,
  Scissors,
  CreditCard,
  HeartPulse,
  TrendingDown,
  Zap,
  Download
} from "lucide-react";

const NAV_ITEMS = [
  {
    category: "Core",
    items: [
      { name: "Home Dashboard", href: "/", icon: Home },
      { name: "Beyond FDs & Learning", href: "/beyond-fds", icon: Info }
    ]
  },
  {
    category: "Analyzers",
    items: [
      { name: "Mutual Funds", href: "/mutual-funds", icon: Layers },
      { name: "Debt Funds", href: "/debt-funds", icon: Shield }
    ]
  },
  {
    category: "Budgeting & Cash Flow",
    items: [
      { name: "Net Worth", href: "/net-worth", icon: Wallet },
      { name: "Emergency Fund", href: "/emergency-fund", icon: ShieldAlert },
      { name: "Latte Factor", href: "/latte-factor", icon: Coffee },
      { name: "Rent vs. Buy", href: "/rent-vs-buy", icon: Home }
    ]
  },
  {
    category: "Wealth Building",
    items: [
      { name: "SIP & FD Simulator", href: "/sip", icon: Percent },
      { name: "Step Up SIP", href: "/step-up-sip", icon: ArrowUpRight },
      { name: "Compound Interest", href: "/compound-interest", icon: TrendingUp },
      { name: "Cost of Delay", href: "/cost-of-delay", icon: Clock },
      { name: "Inflation Calculator", href: "/inflation", icon: BarChart2 },
      { name: "RD Calculator", href: "/rd", icon: Percent },
      { name: "ROI & CAGR", href: "/roi", icon: TrendingUp },
      { name: "XIRR Calculator", href: "/xirr", icon: Zap }
    ]
  },
  {
    category: "Debt Tools",
    items: [
      { name: "Debt Snowball / Avalanche", href: "/debt-payoff", icon: Scissors },
      { name: "Loan EMI Simulator", href: "/emi", icon: Landmark },
      { name: "Credit Card Payoff", href: "/credit-card", icon: CreditCard }
    ]
  },
  {
    category: "Retirement & Planning",
    items: [
      { name: "Goal Planner", href: "/goal", icon: Target },
      { name: "FIRE Early Retirement", href: "/fire", icon: Flame },
      { name: "Retirement", href: "/retirement", icon: Hourglass },
      { name: "Human Life Value (HLV)", href: "/hlv", icon: HeartPulse },
      { name: "PPF Calculator", href: "/ppf", icon: Coins },
      { name: "NPS Calculator", href: "/nps", icon: TrendingUp },
      { name: "SWP Calculator", href: "/swp", icon: ArrowDownLeft },
      { name: "SSY Calculator", href: "/ssy", icon: Coins },
      { name: "EPF Calculator", href: "/epf", icon: Coins },
      { name: "Gratuity Calculator", href: "/gratuity", icon: Coins },
      { name: "APY Pension Simulator", href: "/apy", icon: Coins },
      { name: "Post Office MIS", href: "/pomis", icon: Coins },
      { name: "SCSS Calculator", href: "/scss", icon: Coins }
    ]
  },
  {
    category: "Portfolio & Tax",
    items: [
      { name: "Portfolio Allocator", href: "/portfolio", icon: PieChart },
      { name: "Tax Regime Hub", href: "/tax", icon: Calculator },
      { name: "HRA Exemption", href: "/hra", icon: Calculator },
      { name: "Advanced Income Tax", href: "/income-tax", icon: Calculator },
      { name: "TDS Calculator", href: "/tds", icon: Calculator },
      { name: "NSC Calculator", href: "/nsc", icon: Coins }
    ]
  }
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border-navy bg-navy-bg/85 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-grey hover:text-white md:hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="valarchiX" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold tracking-wider text-white">
                valarchi<span className="text-emerald font-extrabold">X</span>
              </span>
            </Link>
          </div>

          {/* Core Motto */}
          <div className="hidden text-sm font-medium text-emerald bg-emerald/5 border border-emerald/20 px-4 py-1.5 rounded-full md:block">
            💡 “We don&apos;t tell what to pick, we tell how to pick”
          </div>

          {/* Theme Switch & Actions */}
          <div className="flex items-center gap-3">
            {pathname !== "/" && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald/30 bg-emerald/10 text-emerald hover:bg-emerald hover:text-navy-bg transition-all text-xs font-bold cursor-pointer"
                title="Download PDF Report"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Download PDF</span>
              </button>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border-navy bg-navy-card/30 text-emerald hover:text-white hover:border-emerald/40 transition-all"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
        {/* Mobile Motto Banner */}
        <div className="block md:hidden bg-emerald/5 border-t border-b border-emerald/10 text-center py-1 text-[11px] font-medium text-emerald">
          “We don&apos;t tell what to pick, we tell how to pick”
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed bottom-0 top-16 z-30 flex w-64 flex-col border-r border-border-navy bg-navy-bg transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-6">
            {NAV_ITEMS.map((group) => (
              <div key={group.category} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-grey px-3">
                  {group.category}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                            isActive
                              ? "bg-navy-light text-emerald border-l-2 border-emerald"
                              : "text-muted-grey hover:bg-navy-light hover:text-white"
                          }`}
                        >
                          <Icon size={18} className={isActive ? "text-emerald" : ""} />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Global Footer Disclaimer */}
        <div className="border-t border-border-navy p-4 bg-navy-bg">
          <div className="flex items-start gap-2 text-[10px] text-muted-grey">
            <Info size={14} className="text-emerald shrink-0 mt-0.5" />
            <p className="leading-tight">
              <strong>Disclaimer:</strong> Educational purposes only. We do not provide personalized financial advice.
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
