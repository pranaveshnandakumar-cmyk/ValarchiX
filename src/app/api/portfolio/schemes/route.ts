import { NextResponse } from "next/server";
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

const CACHE_FILE = path.join(process.cwd(), "schemes-cache.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function classifyAssetClass(category: string): SchemeRecord["assetClass"] {
  const lc = category.toLowerCase();
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
    return "Equity";
  }
  if (
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
    return "Debt";
  }
  if (
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
    return "Hybrid";
  }
  if (lc.includes("gold") || lc.includes("silver") || lc.includes("commodities")) {
    return "Gold";
  }
  return "Other";
}

function parseAMFIText(rawText: string): SchemeRecord[] {
  const schemes: SchemeRecord[] = [];
  const lines = rawText.split("\n");

  let currentCategory = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Category header lines don't have semicolons
    if (!trimmed.includes(";")) {
      // Skip the column header line
      if (trimmed.startsWith("Scheme Code")) continue;
      
      // ONLY update the category if it describes a scheme group, not a fund house
      if (trimmed.toLowerCase().includes("scheme")) {
        currentCategory = trimmed;
      }
      continue;
    }

    // Data line: SchemeCode;ISINDiv/Payout;ISINDiv/Reinvestment;SchemeName;NAV;Date
    const parts = trimmed.split(";");
    if (parts.length < 5) continue;

    const code = parseInt(parts[0], 10);
    if (isNaN(code)) continue;

    const name = parts[3]?.trim() || "";
    if (!name) continue;

    const navStr = parts[4]?.trim();
    const nav = navStr && navStr !== "N.A." ? parseFloat(navStr) : null;

    schemes.push({
      code,
      name,
      category: currentCategory,
      nav,
      assetClass: classifyAssetClass(currentCategory)
    });
  }

  return schemes;
}

async function fetchAndCacheSchemes(): Promise<SchemeRecord[]> {
  // Check cache
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      const cached = JSON.parse(raw);
      if (cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data as SchemeRecord[];
      }
    }
  } catch {
    // Cache corrupted, proceed to fetch
  }

  // Fetch from AMFI
  const res = await fetch("https://www.amfiindia.com/spages/NAVAll.txt", {
    next: { revalidate: 0 }
  });

  if (!res.ok) {
    throw new Error(`AMFI API returned ${res.status}`);
  }

  const rawText = await res.text();
  const schemes = parseAMFIText(rawText);

  // Cache to disk
  try {
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ timestamp: Date.now(), data: schemes }),
      "utf-8"
    );
  } catch {
    // Non-critical: cache write failure
  }

  return schemes;
}

export async function GET() {
  try {
    const schemes = await fetchAndCacheSchemes();

    // Return a lightweight version (code + name + category + assetClass + nav)
    const lightweight = schemes.map((s) => ({
      code: s.code,
      name: s.name,
      category: s.category,
      assetClass: s.assetClass,
      nav: s.nav
    }));

    return NextResponse.json({
      success: true,
      count: lightweight.length,
      data: lightweight
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch AMFI scheme list" },
      { status: 500 }
    );
  }
}
