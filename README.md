# valarchiX - Operating System for Financial Knowledge

> 💡 **“We don't tell what to pick, we tell how to pick”**

**valarchiX** is an interactive, educational platform designed to build deep financial knowledge. Rather than providing investment recommendations, valarchiX empowers users by teaching them how to evaluate business models, assess mutual funds, calculate compounding, and compare tax regimes through dynamic data models and interactive diagnostic planners.

---

## 🌟 Key Features & Modules

### 1. 📊 Mutual Funds Screener & Detail Analyzer
* **Official Daily NAV Sourcing**: Sourced directly from the official **Association of Mutual Funds in India (AMFI)** master database, ensuring 100% accurate Net Asset Values (NAV).
* **Comprehensive Metrics**: Calculates and evaluates compound annual growth rates (**1Y, 3Y, and 5Y CAGR**), annualized standard deviation (**Volatility**), **Sharpe Ratios**, and **Sortino Ratios**.
* **Interactive Charting**: Plots historical NAV performance over customizable time horizons (1Y, 3Y, 5Y) using interactive, rebased line charts that overlay benchmark performance on a common baseline of `100`.
* **Zero-Latency Search**: Features a word-tokenized local cache search engine that resolves queries instantly (0ms network lag) by splitting queries into words and matching them in any order.
* **Benchmark Disclosures**: Clearly discloses benchmark approximations and data freshness timestamps at the top of the analytics tables and chart legends.

### 2. 🗂️ Portfolio Allocator & Multi-Format Statement Parser
* **Broker Statement Uploader**: Supports drag-and-drop uploading of **PDF, Excel (XLSX/XLS), and CSV** statements exported from popular brokers (e.g. Groww, Zerodha, CAMS).
* **Structured Column Mapping**: Automatically scans and maps column headers like `Units`, `Invested Value`, and `Current Value` to extract values directly, preserving precise valuations down to the penny.
* **Direct Classification Extraction**: Maps `Category` and `Sub-category` columns from uploaded sheets directly as the asset class and sector. This aligns the split charts and diversification scores with your custom spreadsheet definitions.
* **Prefix-Based Matching Heuristics**: Compares sheet entries against local cached AMFI schemes using prefix-based intersection, resolving matches despite spelling variations, hyphens, or spacing.
* **Specificity & Word-Length Constraints**: 
  * Short words (3 letters or less, like `cap` or `mid`) must be exact matches to prevent collisions.
  * Preserves 2-letter AMC brand names (like `JM` or `NJ`).
  * Resolves multi-match collisions by calculating `specificity` (intersection / AMFI words) and using the shortest cleaned name as a tie-breaker.
* **Folio Number Filtering**: Automatically filters out large integers representing folio or account numbers, preventing them from contaminating units or valuation calculations.
* **Interactive Dashboard**: Displays total principal invested, current market valuations, net P&L absolute amount/return percentages, and dynamic allocation weight percentages.

### 3. 🪙 Calculators & Planners Suite (with Math Audits)
* **Calculation Transparency Panels**: Every calculator features a collapsible **"How This is Calculated & Excel Replication"** section displaying math formulas, variables, and step-by-step Excel/Google Sheets functions (e.g. `PMT`, `FV`).
* **SIP & FD Simulators**: Model wealth creation paths comparing Systematic Investment Plans with fixed-yield structures.
* **SWP Planner**: Simulate Systematic Withdrawal Plans (SWP) to design sustainable retirement cash flows, highlighting safe withdrawal rates (4% rule) and sequence of returns risk.
* **Goal & Retirement Planners**: Plot future corpus requirements factoring in inflation, annual escalations, and target maturity horizons.
* **NPS & PPF Simulators**: Run returns compounding models for public pension and provident schemes.
* **Macroeconomic Benchmarks**: Displays active G-Sec 10Y yields and baseline CPI inflation rates sourced dynamically.

### 4. ⚖️ Tax Regime Hub (Union Budget 2025)
* **Budget 2025 Slabs**: Completely aligned with the revised **New Tax Regime** slabs for FY 2025-26 & FY 2026-27:
  * Up to ₹4 Lakhs: NIL
  * ₹4L to ₹8L: 5%
  * ₹8L to ₹12L: 10%
  * ₹12L to ₹16L: 15%
  * ₹16L to ₹20L: 20%
  * ₹20L to ₹24L: 25%
  * Above ₹24L: 30%
* **Standard Deductions**: Formulated to use the default **₹75,000** standard deduction for the New Regime and **₹50,000** for the Old Regime.
* **Section 87A Rebate**: Rebates tax fully up to a taxable income of **₹12,00,000**, meaning salaried individuals earning up to **₹12.75 Lakhs** pay zero tax.
* **Switch Guidelines Panel**: Explains the rules for switching regimes annually (for salaried individuals) versus once-in-a-lifetime (for business/professional income).

### 5. 📚 Beyond FDs & Learning Hub
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

## 🔒 Legal Disclaimer & SEBI Positioning
valarchiX is built solely as an interactive simulator to help users understand business economics, tax regimes, compounding mathematics, and mutual fund valuation metrics. The platform never issues buy, sell, or hold recommendations for any security or asset class. valarchiX is not a registered investment advisor with SEBI. Always seek the services of a certified financial planner, tax consultant, or SEBI-registered investment advisor before making real-world investments. 

Read our full disclosures at `/disclaimer`.
