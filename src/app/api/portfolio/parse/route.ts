import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface SchemeRecord {
  code: number;
  name: string;
  category: string;
  nav: number | null;
  assetClass: "Equity" | "Debt" | "Hybrid" | "Gold" | "Other";
}

interface ParsedHolding {
  name: string;
  code: number;
  category: string;
  assetClass: string;
  sector: string;
  weight: number;
  expenseRatio: number;
  nav: number | null;
  units: number;
  purchaseNav: number;
}

const CACHE_FILE = path.join(process.cwd(), "schemes-cache.json");

function loadCachedSchemes(): SchemeRecord[] | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      const cached = JSON.parse(raw);
      if (cached.data && Array.isArray(cached.data)) {
        return cached.data;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function deriveSector(category: string, name: string): string {
  const lc = (category + " " + name).toLowerCase();
  if (lc.includes("technology") || lc.includes("it") || lc.includes("digital")) return "Technology";
  if (lc.includes("pharma") || lc.includes("healthcare") || lc.includes("health")) return "Healthcare";
  if (lc.includes("banking") || lc.includes("financial") || lc.includes("bank")) return "Financials";
  if (lc.includes("infrastructure") || lc.includes("infra") || lc.includes("capital goods") || lc.includes("manufacturing")) return "Capital Goods";
  if (lc.includes("energy") || lc.includes("power")) return "Energy";
  if (lc.includes("consumption") || lc.includes("fmcg") || lc.includes("consumer")) return "Consumer";
  if (lc.includes("gold") || lc.includes("silver") || lc.includes("commodit")) return "Precious Metals";
  if (lc.includes("liquid") || lc.includes("overnight") || lc.includes("money market")) return "Liquid Reserves";
  if (lc.includes("gilt") || lc.includes("corporate bond") || lc.includes("credit") || lc.includes("debt") || lc.includes("dynamic bond") || lc.includes("short duration") || lc.includes("medium duration") || lc.includes("long duration") || lc.includes("low duration") || lc.includes("ultra short") || lc.includes("floater")) return "Fixed Income";
  return "Diversified";
}

function fuzzyMatch(text: string, schemes: SchemeRecord[]): ParsedHolding[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const matched: ParsedHolding[] = [];
  const seenCodes = new Set<number>();

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    
    let bestScheme: SchemeRecord | null = null;
    let maxMatchedWords = 0;
    let bestCleanedLength = 0;

    for (const scheme of schemes) {
      if (seenCodes.has(scheme.code)) continue;

      const fullNameLower = scheme.name.toLowerCase();
      // Clean scheme option tags to get core name
      const cleanedName = fullNameLower
        .replace(/\b(direct|regular|plan|growth|dividend|idcw|payout|reinvestment|option|growth option)\b/gi, "")
        .replace(/[^a-z0-9\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

      const words = cleanedName.split(/\s+/).filter(w => w.length > 2);
      if (words.length === 0) continue;

      const matchedCount = words.filter(word => lineLower.includes(word)).length;
      const isMatch = matchedCount === words.length && words.length >= 2;

      if (isMatch) {
        if (words.length > maxMatchedWords || (words.length === maxMatchedWords && cleanedName.length > bestCleanedLength)) {
          maxMatchedWords = words.length;
          bestCleanedLength = cleanedName.length;
          bestScheme = scheme;
        }
      }
    }

    if (bestScheme) {
      seenCodes.add(bestScheme.code);

      // Extract all numbers on this line
      const numbers = line.match(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g) || [];
      const parsedNumbers = numbers.map(n => parseFloat(n.replace(/,/g, ""))).filter(n => n > 0);

      let units = 100; // Default units
      let purchaseNav = bestScheme.nav || 10; // Default purchase price
      let currentValue = 0;

      if (parsedNumbers.length >= 2) {
        const maxVal = Math.max(...parsedNumbers);

        // Try mathematical product validation: units * NAV = total value
        let foundTrio = false;
        for (let i = 0; i < parsedNumbers.length; i++) {
          for (let j = 0; j < parsedNumbers.length; j++) {
            if (i === j) continue;
            const product = parsedNumbers[i] * parsedNumbers[j];
            for (let k = 0; k < parsedNumbers.length; k++) {
              if (k === i || k === j) continue;
              const val = parsedNumbers[k];
              if (Math.abs(product - val) / val < 0.05) {
                currentValue = val;
                if (parsedNumbers[i] > parsedNumbers[j]) {
                  purchaseNav = parsedNumbers[i];
                  units = parsedNumbers[j];
                } else {
                  purchaseNav = parsedNumbers[j];
                  units = parsedNumbers[i];
                }
                foundTrio = true;
                break;
              }
            }
            if (foundTrio) break;
          }
          if (foundTrio) break;
        }

        if (!foundTrio) {
          currentValue = maxVal;
          const decimalNumbers = parsedNumbers.filter(n => n % 1 !== 0);
          if (decimalNumbers.length > 0) {
            units = decimalNumbers[0];
            const remaining = parsedNumbers.filter(n => n !== currentValue && n !== units);
            if (remaining.length > 0) {
              purchaseNav = remaining[0];
            } else {
              purchaseNav = bestScheme.nav || 10;
            }
          } else {
            const remaining = parsedNumbers.filter(n => n !== currentValue).sort((a, b) => b - a);
            if (remaining.length >= 2) {
              purchaseNav = remaining[0];
              units = remaining[1];
            } else if (remaining.length === 1) {
              units = remaining[0];
              purchaseNav = bestScheme.nav || 10;
            }
          }
        }
      } else if (parsedNumbers.length === 1) {
        if (parsedNumbers[0] > 1000) {
          currentValue = parsedNumbers[0];
          purchaseNav = bestScheme.nav || 10;
          units = currentValue / purchaseNav;
        } else {
          units = parsedNumbers[0];
          purchaseNav = bestScheme.nav || 10;
        }
      }

      if (currentValue === 0) {
        currentValue = units * (bestScheme.nav || purchaseNav || 10);
      }

      matched.push({
        name: bestScheme.name,
        code: bestScheme.code,
        category: bestScheme.category,
        assetClass: bestScheme.assetClass,
        sector: deriveSector(bestScheme.category, bestScheme.name),
        weight: currentValue,
        expenseRatio: 0,
        nav: bestScheme.nav,
        units: Number(units.toFixed(3)),
        purchaseNav: Number(purchaseNav.toFixed(2))
      });
    }
  }

  const totalAmount = matched.reduce((sum, h) => sum + h.weight, 0);
  if (totalAmount > 0) {
    matched.forEach((h) => {
      h.weight = Math.round((h.weight / totalAmount) * 100);
    });
    const currentSum = matched.reduce((sum, h) => sum + h.weight, 0);
    if (currentSum !== 100 && matched.length > 0) {
      matched[0].weight += 100 - currentSum;
    }
  } else {
    const equalWeight = Math.floor(100 / Math.max(1, matched.length));
    matched.forEach((h, i) => {
      h.weight = i === 0 ? 100 - equalWeight * (matched.length - 1) : equalWeight;
    });
  }

  return matched;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const extractedText: string = body.text || "";

    if (!extractedText.trim()) {
      return NextResponse.json(
        { success: false, error: "No text provided for parsing" },
        { status: 400 }
      );
    }

    // Load cached schemes
    let schemes = loadCachedSchemes();

    if (!schemes || schemes.length === 0) {
      // Try to fetch fresh if no cache exists
      try {
        const res = await fetch("https://www.amfiindia.com/spages/NAVAll.txt", {
          next: { revalidate: 0 }
        });
        if (res.ok) {
          const rawText = await res.text();
          // Quick inline parse
          const lines = rawText.split("\n");
          schemes = [];
          let currentCategory = "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (!trimmed.includes(";")) {
              if (trimmed.startsWith("Scheme Code")) continue;
              if (trimmed.toLowerCase().includes("scheme")) {
                currentCategory = trimmed;
              }
              continue;
            }
            const parts = trimmed.split(";");
            if (parts.length < 5) continue;
            const code = parseInt(parts[0], 10);
            if (isNaN(code)) continue;
            const name = parts[3]?.trim() || "";
            if (!name) continue;
            const lc = currentCategory.toLowerCase();
            let assetClass: SchemeRecord["assetClass"] = "Other";
            if (
              lc.includes("equity") || 
              lc.includes("elss") || 
              lc.includes("small cap") || 
              lc.includes("mid cap") || 
              lc.includes("large cap") || 
              lc.includes("flexi cap") || 
              lc.includes("multi cap") || 
              lc.includes("contra") || 
              lc.includes("value") || 
              lc.includes("focused") || 
              lc.includes("dividend yield") || 
              lc.includes("thematic") || 
              lc.includes("sectoral") || 
              lc.includes("index") || 
              lc.includes("nifty") || 
              lc.includes("sensex") ||
              lc.includes("growth")
            ) {
              assetClass = "Equity";
            } else if (
              lc.includes("debt") || 
              lc.includes("liquid") || 
              lc.includes("money market") || 
              lc.includes("overnight") || 
              lc.includes("ultra short") || 
              lc.includes("short duration") || 
              lc.includes("medium duration") || 
              lc.includes("long duration") || 
              lc.includes("gilt") || 
              lc.includes("corporate bond") || 
              lc.includes("credit risk") || 
              lc.includes("banking") || 
              lc.includes("floater") || 
              lc.includes("dynamic bond") || 
              lc.includes("low duration") ||
              lc.includes("income")
            ) {
              assetClass = "Debt";
            } else if (
              lc.includes("hybrid") || 
              lc.includes("balanced") || 
              lc.includes("aggressive") || 
              lc.includes("conservative") || 
              lc.includes("arbitrage") || 
              lc.includes("equity savings") || 
              lc.includes("multi asset") ||
              lc.includes("retirement") ||
              lc.includes("children") ||
              lc.includes("solution oriented")
            ) {
              assetClass = "Hybrid";
            } else if (lc.includes("gold") || lc.includes("silver") || lc.includes("commodit") || lc.includes("commodities")) {
              assetClass = "Gold";
            }
            const navStr = parts[4]?.trim();
            const nav = navStr && navStr !== "N.A." ? parseFloat(navStr) : null;
            schemes.push({ code, name, category: currentCategory, nav, assetClass });
          }
          // Cache it
          try {
            const CACHE_FILE_PATH = path.join(process.cwd(), "schemes-cache.json");
            fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify({ timestamp: Date.now(), data: schemes }), "utf-8");
          } catch { /* non-critical */ }
        }
      } catch {
        // Network failure
      }
    }

    if (!schemes || schemes.length === 0) {
      return NextResponse.json(
        { success: false, error: "AMFI scheme database not available. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    // Filter to only Direct Growth plans (most common in statements)
    // But also keep all for matching flexibility
    const holdings = fuzzyMatch(extractedText, schemes);

    return NextResponse.json({
      success: true,
      count: holdings.length,
      totalSchemes: schemes.length,
      holdings
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Parse error" },
      { status: 500 }
    );
  }
}
