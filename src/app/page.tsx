import React from "react";
import Link from "next/link";
import {
  Layers,
  Shield,
  Percent,
  Target,
  Hourglass,
  PieChart,
  Calculator,
  Coins,
  TrendingUp,
  ArrowDownLeft,
  ArrowRight,
  Landmark,
  ArrowUpRight,
  Flame,
  ShieldAlert
} from "lucide-react";

const STATS = [
  { value: "13+", label: "Financial Calculators" },
  { value: "500+", label: "Mutual Funds Indexed" },
  { value: "100% Safe", label: "No Stock-Picking Risk" },
  { value: "Dynamic", label: "Goal & Pension Math" },
  { value: "Accurate", label: "Regime Tax Rules" }
];


const FOUNDATIONS = [
  {
    question: "What is a Mutual Fund?",
    desc: "A pooled basket of 50+ company shares or government bonds managed by experts. It offers instant diversification with small ticket sizes (starting at ₹500).",
    icon: Layers,
    pros: "Instant diversification, highly liquid, regulated",
    cons: "AMC expense ratios, no direct pick control"
  },
  {
    question: "Why Mutual Funds instead of FDs?",
    desc: "FD interest is eaten by income tax slabs and inflation, causing negative real returns. Mutual Funds compound tax-efficiently above inflation over long terms.",
    icon: Landmark,
    pros: "Beats inflation, compounds tax-efficiently",
    cons: "No guaranteed yields, short-term fluctuations"
  },
  {
    question: "What is Compounding?",
    desc: "Earning returns on your accumulated returns. Time is your greatest asset—the exponential growth curve makes starting early far more critical than the amount invested.",
    icon: TrendingUp,
    pros: "Exponential growth, builds wealth passively",
    cons: "Requires extreme patience and market discipline"
  },
  {
    question: "Why do we need Diversification?",
    desc: "The only free lunch in finance. Spreading savings across sectors (banking, IT, consumer) and assets (equity, bonds, gold) shields you from single stock crashes.",
    icon: PieChart,
    pros: "Shields against individual company failures",
    cons: "Limits potential gains of single concentrated bets"
  },
  {
    question: "What is Asset Allocation?",
    desc: "The art of dividing capital between Equity (growth), Debt (safety), and Gold (insurance hedge) depending on your age, timeline, and risk appetite.",
    icon: Shield,
    pros: "Keeps portfolio stable during market corrections",
    cons: "Requires periodic rebalancing adjustments"
  },
  {
    question: "What is an SIP & its Life Impact?",
    desc: "Systematic Investment Plan. Automatically invests monthly. Enforces financial discipline and uses Rupee Cost Averaging to turn market crashes into buying opportunities.",
    icon: Hourglass,
    pros: "No market timing stress, averages purchase cost",
    cons: "Must remain uninterrupted for 10+ years"
  }
];

const QUICK_ACTIONS = [
  {
    name: "SIP & FD Yield Simulator",
    desc: "Simulate mutual fund compounding, one-time deposits, and compare post-tax real yields against bank FDs.",
    href: "/sip",
    icon: Percent,
    badge: "Core Metric",
    color: "from-emerald/20 to-emerald/5"
  },
  {
    name: "Live Mutual Fund Analyzer",
    desc: "Search actual mutual funds, calculate rolling CAGR yields, and compare performance indices using fast backend data.",
    href: "/mutual-funds",
    icon: Layers,
    badge: "Live Feed",
    color: "from-indigo-500/10 to-indigo-500/5"
  },
  {
    name: "Portfolio Allocator",
    desc: "Check asset overlap, expense ratios, and overall diversification score. No buy/sell tips, just pure logic.",
    href: "/portfolio",
    icon: PieChart,
    badge: "Diagnostic",
    color: "from-amber-500/10 to-amber-500/5"
  }
];

const EXPLORE_CARDS = [
  {
    name: "PPF Calculator",
    desc: "Calculate maturity and interest earnings in the Public Provident Fund under the fixed 7.10% tax-free rate.",
    href: "/ppf",
    icon: Coins,
    category: "Debt"
  },
  {
    name: "NPS Calculator",
    desc: "Model retirement corpus accumulation, lump sum withdrawals, and monthly annuity pensions.",
    href: "/nps",
    icon: TrendingUp,
    category: "Retirement"
  },
  {
    name: "SWP Pension Calculator",
    desc: "Simulate systematic withdrawals (SWP) for retirement cash flow, testing for corpus depletion against inflation.",
    href: "/swp",
    icon: ArrowDownLeft,
    category: "Retirement"
  },
  {
    name: "FIRE Early Retirement Simulator",
    desc: "Determine your early financial independence target corpus using safe withdrawal rates and calculate the required monthly SIP.",
    href: "/fire",
    icon: Flame,
    category: "Retirement"
  },
  {
    name: "Financial Goal Planner",
    desc: "Set timelines for a house, car, or marriage with inflation-adjusted targets to calculate your monthly SIP.",
    href: "/goal",
    icon: Target,
    category: "Calculators"
  },
  {
    name: "Step Up SIP Calculator",
    desc: "Calculate how a yearly increase in SIP contributions (either by % or flat amount) accelerates your long-term wealth compounding versus a normal flat SIP.",
    href: "/step-up-sip",
    icon: ArrowUpRight,
    category: "Calculators"
  },
  {
    name: "Retirement Planner",
    desc: "Solve for your target corpus, safe withdrawal rates, inflation-adjusted spend, and retirement age.",
    href: "/retirement",
    icon: Hourglass,
    category: "Calculators"
  },
  {
    name: "Loan EMI & Prepayment Accelerator",
    desc: "Calculate monthly installments and simulate how extra prepayments dramatically save interest and reduce loan tenure.",
    href: "/emi",
    icon: Landmark,
    category: "Calculators"
  },
  {
    name: "Emergency Fund & Runway Planner",
    desc: "Calculate risk-adjusted emergency reserve targets based on job sector stability and family dependent buffers.",
    href: "/emergency-fund",
    icon: ShieldAlert,
    category: "Calculators"
  },
  {
    name: "Tax Regime Hub",
    desc: "Compare Old vs New Tax regimes, learn about tax harvesting, 80C, and asset taxation.",
    href: "/tax",
    icon: Calculator,
    category: "Education"
  },
  {
    name: "Debt Fund Explorer",
    desc: "Compare credit risk, liquid funds, average durations, and find who they are suitable for.",
    href: "/debt-funds",
    icon: Shield,
    category: "Analysis"
  }
];

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-12 md:py-20 px-4 rounded-3xl overflow-hidden bg-gradient-to-b from-navy-card/40 to-transparent border border-border-navy/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.1),transparent_50%)]" />
        
        <div className="relative space-y-6 max-w-4xl">
          {/* Logo */}
          <img src="/logo.svg" alt="valarchiX" className="h-20 w-20 mx-auto rounded-2xl shadow-lg shadow-emerald/20" />
          
          {/* Motto Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-4 py-1.5 text-xs font-semibold text-emerald glow-emerald tracking-wide">
            💡 “We don&apos;t tell what to pick, we tell how to pick”
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl text-white">
            Learn. Analyze. <br className="md:hidden" />
            <span className="gradient-green">Invest Smarter.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-base md:text-xl text-muted-grey leading-relaxed">
            Understand personal asset allocations, mutual funds, tax slabs, retirement targets, and macroeconomics. No volatile individual stock picking, just low-risk index principles.
          </p>
          
          {/* Hero Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/sip"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald hover:bg-emerald/90 px-6 py-3.5 text-sm font-semibold text-navy-bg transition-colors shadow-lg shadow-emerald/10"
            >
              <span>Explore SIP Calculator</span>
              <Percent size={16} />
            </Link>
            <Link
              href="/mutual-funds"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-navy-light hover:bg-navy-light/80 border border-border-navy px-6 py-3.5 text-sm font-semibold text-white transition-colors"
            >
              <span>Analyze Mutual Funds</span>
              <Layers size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Education Promo Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald/30 bg-gradient-to-r from-emerald/10 via-emerald/5 to-transparent p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl text-left">
          <span className="text-[10px] font-bold text-emerald uppercase tracking-wider bg-emerald/10 border border-emerald/20 px-2.5 py-0.5 rounded-full">
            New Masterclass
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Why Move Beyond FDs & Learn Personal Finance?
          </h2>
          <p className="text-xs md:text-sm text-muted-grey leading-relaxed">
            See the magic of compounding in real-time, learn why income tax and inflation make FDs a guaranteed wealth destroyer, and discover how to manage equity risks using simple tools.
          </p>
        </div>
        <Link
          href="/beyond-fds"
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald hover:bg-emerald/90 px-6 py-3.5 text-xs font-bold text-navy-bg transition-all shrink-0 hover:translate-x-1"
        >
          <span>Start Free Masterclass</span>
          <ArrowRight size={14} />
        </Link>
      </section>

      {/* Statistics Section */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center p-6 rounded-2xl glass-card text-center"
          >
            <span className="text-2xl md:text-3xl font-extrabold text-emerald tracking-tight">
              {stat.value}
            </span>
            <span className="text-xs md:text-sm text-muted-grey mt-2">
              {stat.label}
            </span>
          </div>
        ))}
      </section>

      {/* Financial Foundations Hub */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Financial Foundations</h2>
          <p className="text-sm text-muted-grey">Simple, logical answers to the 6 fundamental investing questions</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FOUNDATIONS.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.question} className="p-6 glass-card space-y-4 flex flex-col justify-between hover:border-emerald/30 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-navy-light rounded-lg border border-border-navy text-emerald shrink-0">
                      <Icon size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{f.question}</h3>
                  </div>
                  <p className="text-xs text-muted-grey leading-relaxed">{f.desc}</p>
                </div>

                <div className="border-t border-border-navy/60 pt-3 space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-emerald font-bold">🟢 PROS:</span>
                    <span className="text-light-grey text-right">{f.pros}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-500 font-bold">🔴 CONS/LIMITS:</span>
                    <span className="text-light-grey text-right">{f.cons}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Launch / Hero Features */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Core Hubs</h2>
            <p className="text-sm text-muted-grey">Launch into main diagnostic and compounding tools</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.name}
                className={`relative overflow-hidden rounded-2xl border border-border-navy bg-gradient-to-br ${action.color} p-6 flex flex-col justify-between group transition-all duration-300 hover:border-emerald/40 hover:-translate-y-1`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-navy-card rounded-xl border border-border-navy text-emerald">
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-sm text-muted-grey leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                </div>
                
                <Link
                  href={action.href}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-white group-hover:text-emerald transition-colors pt-6"
                >
                  <span>Launch Tool</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Feature Explorer Grid */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Explore the Operating System</h2>
          <p className="text-sm text-muted-grey">All tools follow a strict education-only design principle</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPLORE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.name} className="flex flex-col justify-between p-6 glass-card">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-navy-light rounded-lg border border-border-navy/55 text-emerald">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-grey border border-border-navy px-2 py-0.5 rounded-md">
                      {card.category}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">{card.name}</h3>
                    <p className="text-xs text-muted-grey leading-relaxed">{card.desc}</p>
                  </div>
                </div>
                
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald hover:text-white transition-colors mt-6"
                >
                  <span>Explore</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
