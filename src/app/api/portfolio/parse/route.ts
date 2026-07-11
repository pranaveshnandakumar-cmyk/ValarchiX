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
  investedValue?: number;
  currentValue?: number;
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
  if (/\b(technology|it|digital)\b/i.test(lc)) return "Technology";
  if (/\b(pharma|healthcare|health)\b/i.test(lc)) return "Healthcare";
  if (/\b(banking|financial|financials|bank)\b/i.test(lc)) return "Financials";
  if (/\b(infrastructure|infra|capital goods|manufacturing)\b/i.test(lc)) return "Capital Goods";
  if (/\b(energy|power)\b/i.test(lc)) return "Energy";
  if (/\b(consumption|fmcg|consumer)\b/i.test(lc)) return "Consumer";
  if (/\b(gold|silver|commodity|commodities)\b/i.test(lc)) return "Precious Metals";
  if (/\b(liquid|overnight|money market)\b/i.test(lc)) return "Liquid Reserves";
  if (/\b(gilt|corporate bond|credit|debt|dynamic bond|short duration|medium duration|long duration|low duration|ultra short|floater)\b/i.test(lc)) return "Fixed Income";
  return "Diversified";
}

function isWordMatch(w1: string, w2: string): boolean {
  if (w1 === w2) return true;
  if (w1.startsWith(w2) || w2.startsWith(w1)) {
    return Math.min(w1.length, w2.length) >= 4;
  }
  return false;
}

function cleanLabel(val: string): string {
  if (!val) return "";
  return val
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function fuzzyMatch(text: string, schemes: SchemeRecord[]): ParsedHolding[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const matched: ParsedHolding[] = [];
  const seenCodes = new Set<number>();

  // 1. Detect structured CSV layout and map headers
  let isCSV = false;
  let nameIdx = -1;
  let unitsIdx = -1;
  let investedIdx = -1;
  let currentIdx = -1;
  let categoryIdx = -1;
  let subcategoryIdx = -1;

  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, "").trim().toLowerCase());
    const hasScheme = cols.some(c => c.includes("scheme") || c.includes("fund") || c.includes("holding"));
    const hasUnits = cols.some(c => c.includes("units") || c.includes("qty") || c.includes("quantity"));
    
    if (hasScheme && hasUnits) {
      isCSV = true;
      nameIdx = cols.findIndex(c => c.includes("scheme name") || c.includes("scheme") || c.includes("holding") || c.includes("name"));
      unitsIdx = cols.findIndex(c => c.includes("units") || c.includes("qty") || c.includes("quantity"));
      investedIdx = cols.findIndex(c => 
        c === "invested value" || c === "invested" || c === "investment" || c === "purchase value" || c === "cost" ||
        (c.includes("invested") || c.includes("purchase") || c.includes("cost"))
      );
      currentIdx = cols.findIndex(c => 
        c === "current value" || c === "market value" || c === "value" || c === "current" ||
        (c.includes("current") || c.includes("market") || (c.includes("value") && !c.includes("invested") && !c.includes("purchase")))
      );
      categoryIdx = cols.findIndex(c => c === "category" || c === "asset class" || c.includes("class"));
      subcategoryIdx = cols.findIndex(c => c.includes("sub-category") || c.includes("subcategory") || c.includes("sub category") || c.includes("sector") || c.includes("type"));
      
      // Start parsing after header row
      lines.splice(0, i + 1);
      break;
    }
  }

  if (isCSV && nameIdx !== -1 && unitsIdx !== -1) {
    for (const line of lines) {
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, "").trim());
      if (cols.length <= Math.max(nameIdx, unitsIdx)) continue;

      const rawName = cols[nameIdx] || "";
      const rawUnits = cols[unitsIdx] || "";
      if (!rawName || !rawUnits) continue;

      const units = parseFloat(rawUnits.replace(/,/g, ""));
      if (isNaN(units) || units <= 0) continue;

      const rawInvested = investedIdx !== -1 ? cols[investedIdx] : "";
      const rawCurrent = currentIdx !== -1 ? cols[currentIdx] : "";
      const investedValue = rawInvested ? parseFloat(rawInvested.replace(/,/g, "")) : 0;
      const currentValue = rawCurrent ? parseFloat(rawCurrent.replace(/,/g, "")) : 0;

      const rawCategory = categoryIdx !== -1 ? cols[categoryIdx] : "";
      const rawSubcategory = subcategoryIdx !== -1 ? cols[subcategoryIdx] : "";

      let bestScheme: SchemeRecord | null = null;
      let maxSpecificity = 0;
      let bestCleanedLength = 9999;

      const rawNameLower = rawName.toLowerCase();
      const rawNameCleaned = rawNameLower
        .replace(/\b(direct|regular|plan|growth|dividend|idcw|payout|reinvestment|option|growth option)\b/gi, "")
        .replace(/[^a-z0-9\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      const rawNameWords = Array.from(new Set(rawNameCleaned.split(/\s+/).filter(w => w.length >= 2)));

      if (rawNameWords.length > 0) {
        for (const scheme of schemes) {
          if (seenCodes.has(scheme.code)) continue;

          const fullNameLower = scheme.name.toLowerCase();
          const cleanedName = fullNameLower
            .replace(/\b(direct|regular|plan|growth|dividend|idcw|payout|reinvestment|option|growth option)\b/gi, "")
            .replace(/[^a-z0-9\s]/gi, " ")
            .replace(/\s+/g, " ")
            .trim();

          const words = Array.from(new Set(cleanedName.split(/\s+/).filter(w => w.length >= 2)));
          if (words.length === 0) continue;

          // Calculate prefix-based matching intersection percentage
          const intersection = words.filter(w1 => 
            rawNameWords.some(w2 => isWordMatch(w1, w2))
          ).length;
          const matchPercent = intersection / Math.min(words.length, rawNameWords.length);
          const specificity = intersection / words.length;

          if (matchPercent >= 0.85 && intersection >= 2) {
            if (specificity > maxSpecificity || (specificity === maxSpecificity && cleanedName.length < bestCleanedLength)) {
              maxSpecificity = specificity;
              bestCleanedLength = cleanedName.length;
              bestScheme = scheme;
            }
          }
        }
      }

      if (bestScheme) {
        seenCodes.add(bestScheme.code);
        const purchaseNav = investedValue > 0 ? (investedValue / units) : (bestScheme.nav || 10);
        const currentNav = bestScheme.nav || (currentValue > 0 ? (currentValue / units) : purchaseNav);

        matched.push({
          name: bestScheme.name,
          code: bestScheme.code,
          category: bestScheme.category,
          assetClass: cleanLabel(rawCategory) || bestScheme.assetClass || "Other",
          sector: cleanLabel(rawSubcategory) || deriveSector(bestScheme.category, bestScheme.name),
          weight: currentValue > 0 ? currentValue : (units * currentNav),
          expenseRatio: 0,
          nav: currentNav,
          units: Number(units.toFixed(3)),
          purchaseNav: Number(purchaseNav.toFixed(2)),
          investedValue: investedValue > 0 ? investedValue : undefined,
          currentValue: currentValue > 0 ? currentValue : undefined
        });
      }
    }
  } else {
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      let bestScheme: SchemeRecord | null = null;
      let maxSpecificity = 0;
      let bestCleanedLength = 9999;

      const lineCleaned = lineLower
        .replace(/\b(direct|regular|plan|growth|dividend|idcw|payout|reinvestment|option|growth option)\b/gi, "")
        .replace(/[^a-z0-9\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      const lineWords = Array.from(new Set(lineCleaned.split(/\s+/).filter(w => w.length >= 2)));

      if (lineWords.length > 0) {
        for (const scheme of schemes) {
          if (seenCodes.has(scheme.code)) continue;

          const fullNameLower = scheme.name.toLowerCase();
          const cleanedName = fullNameLower
            .replace(/\b(direct|regular|plan|growth|dividend|idcw|payout|reinvestment|option|growth option)\b/gi, "")
            .replace(/[^a-z0-9\s]/gi, " ")
            .replace(/\s+/g, " ")
            .trim();

          const words = Array.from(new Set(cleanedName.split(/\s+/).filter(w => w.length >= 2)));
          if (words.length === 0) continue;

          // Calculate prefix-based matching intersection percentage
          const intersection = words.filter(w1 => 
            lineWords.some(w2 => isWordMatch(w1, w2))
          ).length;
          const matchPercent = intersection / Math.min(words.length, lineWords.length);
          const specificity = intersection / words.length;

          if (matchPercent >= 0.85 && intersection >= 2) {
            if (specificity > maxSpecificity || (specificity === maxSpecificity && cleanedName.length < bestCleanedLength)) {
              maxSpecificity = specificity;
              bestCleanedLength = cleanedName.length;
              bestScheme = scheme;
            }
          }
        }
      }

      if (bestScheme) {
        seenCodes.add(bestScheme.code);

        const numbers = line.match(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g) || [];
        const parsedNumbers = numbers.map(n => {
          const val = parseFloat(n.replace(/,/g, ""));
          if (!n.includes(".") && val > 100000) return null; // Filter large folio integers
          return val;
        }).filter((n): n is number => n !== null && n > 0);

        let units = 100;
        let purchaseNav = bestScheme.nav || 10;
        let currentValue = 0;

        if (parsedNumbers.length >= 3) {
          const sorted = [...parsedNumbers].sort((a, b) => a - b);
          units = sorted[0];
          const investedValue = sorted[2];
          currentValue = sorted[1];
          purchaseNav = investedValue / units;
        } else if (parsedNumbers.length === 2) {
          const sorted = [...parsedNumbers].sort((a, b) => a - b);
          units = sorted[0];
          currentValue = sorted[1];
          purchaseNav = bestScheme.nav || 10;
        } else if (parsedNumbers.length === 1) {
          if (parsedNumbers[0] > 1000) {
            currentValue = parsedNumbers[0];
            purchaseNav = bestScheme.nav || 10;
            units = currentValue / purchaseNav;
          } else {
            units = parsedNumbers[0];
            purchaseNav = bestScheme.nav || 10;
            currentValue = units * purchaseNav;
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
          nav: bestScheme.nav || purchaseNav,
          units: Number(units.toFixed(3)),
          purchaseNav: Number(purchaseNav.toFixed(2)),
          investedValue: (units * purchaseNav) || undefined,
          currentValue: currentValue || undefined
        });
      }
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
