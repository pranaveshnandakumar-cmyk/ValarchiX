# valarchiX - Operating System for Financial Knowledge

> 💡 **“We don't tell what to pick, we tell how to pick”**

**valarchiX** is an interactive, educational platform designed to build deep financial knowledge. Rather than providing investment recommendations, valarchiX empowers users by teaching them how to evaluate business models, assess mutual funds, calculate compounding, and compare tax regimes through dynamic data models and interactive diagnostic planners.

---

## 🌟 Key Features & Modules

### 1. 📊 Mutual Funds Screener & Detail Analyzer
* **Official Daily NAV Sourcing**: Sourced directly from the official **Association of Mutual Funds in India (AMFI)** master database, ensuring 100% accurate Net Asset Values (NAV).
* **Comprehensive Metrics**: Calculates and evaluates compound annual growth rates (**1Y, 3Y, and 5Y CAGR**), annual volatilities, **Sharpe Ratios**, and **Sortino Ratios**.
* **Interactive Charting**: Plots historical NAV performance over customizable time horizons (1Y, 3Y, 5Y) using interactive, rebased line charts that overlay benchmark performance (e.g. Nifty 50) on a common baseline of `100`.
* **Zero-Latency Search**: Features a word-tokenized local cache search engine that resolves queries instantly (0ms network lag) even for complex inputs.

### 2. 🗂️ Portfolio Allocator & Statement Parser
* **CAS Parser**: Upload or paste Zerodha / CAMS Consolidated Account Statement (CAS) logs to immediately extract your holdings.
* **Intelligent Asset Class Mapping**: Automatically classifies holdings into **Equity, Debt, Hybrid, Gold, or Other** using parsed AMFI category headers.
* **Sector Profiling**: Dynamically derives active sectors (Technology, Financials, Healthcare, Precious Metals, Fixed Income, etc.) to analyze diversification.
* **Real-time NAV Feed**: Automatically matches holding details against official daily NAV caches.

### 3. 🪙 Calculators & Planners Suite
* **SIP & FD Simulators**: Model wealth creation paths comparing Systematic Investment Plans with fixed-yield structures.
* **SWP Planner**: Simulate Systematic Withdrawal Plans to design sustainable retirement cash flows.
* **Goal & Retirement Planners**: Plot future corpus requirements factoring in inflation, annual escalations, and target maturity horizons.
* **NPS & PPF Simulators**: Run returns compounding models for public pension and provident schemes.
* **Tax Regime Hub**: Compare personal tax liabilities between the **New vs. Old Indian Tax Regimes** under custom income, deductions, and surcharge inputs.

### 4. 📚 Beyond FDs & Learning Hub
* Educational reference guides describing debt instruments, credit risk structures, interest rate mechanics, and yields.

---

## 🛠️ Technology Stack

* **Framework**: [Next.js (App Router)](https://nextjs.org/) (force-dynamic server rendering for daily updates)
* **Language**: [TypeScript](https://www.typescriptlang.org/) (strict type-safe financial schemas)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (dynamic Dark/Light theme switching support)
* **Charts**: [Recharts](https://recharts.org/) (smooth vector graphs, tooltips, and legends)
* **Icons**: [Lucide React](https://lucide.dev/) (consistent design elements)

---

## ⚙️ Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.x or higher)
* [npm](https://www.npmjs.com/) (v9.x or higher)

### Installation
1. Clone the repository:
   ```bash
   git clone git@github.com:pranaveshnandakumar-cmyk/ValarchiX.git
   cd ValarchiX
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to launch the dashboard.

---

## 🔒 Disclaimer
This platform is for educational and learning purposes only. **valarchiX** does not provide investment, legal, or tax advice. Planning models are designed to teach financial logic. Always perform your own research or consult with a SEBI-registered financial adviser before investing real capital.
