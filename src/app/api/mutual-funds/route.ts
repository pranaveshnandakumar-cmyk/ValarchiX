import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function parseDateString(dateStr: string): Date {
  const [day, month, year] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const code = searchParams.get("code");

  // Case 1: Search Query (Direct lookup in official AMFI cache)
  if (query) {
    try {
      const cachePath = path.join(process.cwd(), "schemes-cache.json");
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, "utf-8");
        const cached = JSON.parse(raw);
        if (cached.data && Array.isArray(cached.data)) {
          const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
          const matches = cached.data
            .filter((s: any) => {
              const nameLower = s.name.toLowerCase();
              return queryWords.every(word => nameLower.includes(word));
            })
            .slice(0, 10)
            .map((s: any) => ({
              schemeCode: s.code,
              schemeName: s.name
            }));
          return NextResponse.json(matches);
        }
      }
      
      // Fallback: search via mfapi.in if cache is not available
      const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      // Map properties cleanly to fit standard format
      const formatted = data.map((item: any) => ({
        schemeCode: item.schemeCode,
        schemeName: item.schemeName
      }));
      
      return NextResponse.json(formatted.slice(0, 10)); // Limit to top 10 search matches
    } catch (err) {
      return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 });
    }
  }

  // Case 2: Fund Details Calculations Proxy (Computes CAGRs and Volatilities on Backend)
  if (code) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(`https://api.mfapi.in/mf/${code}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const rawJson = await res.json();

      if (!rawJson.data || rawJson.data.length === 0) {
        return NextResponse.json({ error: "No scheme data found" }, { status: 404 });
      }

      // Sort chronological (oldest first)
      const sortedData = rawJson.data
        .map((p: any) => ({ date: p.date, nav: Number(p.nav) }))
        .sort((a: any, b: any) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime());

      const latestPoint = sortedData[sortedData.length - 1];
      let currentNav = latestPoint.nav;

      // Look up current NAV in official AMFI cache for 100% accuracy
      let amfiNav: number | null = null;
      try {
        const cachePath = path.join(process.cwd(), "schemes-cache.json");
        if (fs.existsSync(cachePath)) {
          const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
          const matched = cached.data?.find((s: any) => s.code === Number(code));
          if (matched && matched.nav !== null) {
            amfiNav = matched.nav;
          }
        }
      } catch (err) {
        console.error("Failed to read AMFI cache for NAV override", err);
      }

      if (amfiNav !== null) {
        currentNav = amfiNav;
        // Also update the latest point in sortedData so the charts show the official current NAV
        if (sortedData.length > 0) {
          sortedData[sortedData.length - 1].nav = amfiNav;
        }
      }

      // Helper to find NAV point closest to N days ago
      const findNavNPeriodsAgo = (daysAgo: number): number | null => {
        const targetTime = parseDateString(latestPoint.date).getTime() - daysAgo * 24 * 60 * 60 * 1000;
        let closestPoint = sortedData[0];
        let minDiff = Math.abs(parseDateString(closestPoint.date).getTime() - targetTime);

        for (let i = 1; i < sortedData.length; i++) {
          const diff = Math.abs(parseDateString(sortedData[i].date).getTime() - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestPoint = sortedData[i];
          }
        }
        
        if (minDiff > 45 * 24 * 60 * 60 * 1000) {
          return null; // out of range
        }
        return closestPoint.nav;
      };

      const nav1Y = findNavNPeriodsAgo(365);
      const nav3Y = findNavNPeriodsAgo(1095);
      const nav5Y = findNavNPeriodsAgo(1825);

      const cagr1Y = nav1Y ? ((currentNav / nav1Y) - 1) * 100 : null;
      const cagr3Y = nav3Y ? (Math.pow(currentNav / nav3Y, 1 / 3) - 1) * 100 : null;
      const cagr5Y = nav5Y ? (Math.pow(currentNav / nav5Y, 1 / 5) - 1) * 100 : null;

      // Calculate Volatility (last 1 year)
      const oneYearAgoTime = parseDateString(latestPoint.date).getTime() - 365 * 24 * 60 * 60 * 1000;
      const recentYearData = sortedData.filter((p: any) => parseDateString(p.date).getTime() >= oneYearAgoTime);

      const dailyReturns: number[] = [];
      for (let i = 1; i < recentYearData.length; i++) {
        dailyReturns.push((recentYearData[i].nav - recentYearData[i - 1].nav) / recentYearData[i - 1].nav);
      }

      let volatility = 0;
      let sharpe = 0;
      let sortino = 0;

      if (dailyReturns.length > 1) {
        const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (dailyReturns.length - 1);
        const dailyStd = Math.sqrt(variance);
        
        volatility = dailyStd * Math.sqrt(250) * 100;

        const rfRate = 7.0; // 10Y Bond yield proxy
        const activeReturn = cagr3Y || cagr1Y || 0;

        if (volatility > 0) {
          sharpe = (activeReturn - rfRate) / volatility;

          const negativeReturns = dailyReturns.filter(r => r < 0);
          if (negativeReturns.length > 0) {
            const downsideVariance = negativeReturns.reduce((sum, val) => sum + Math.pow(val, 2), 0) / dailyReturns.length;
            const downsideStd = Math.sqrt(downsideVariance) * Math.sqrt(250) * 100;
            if (downsideStd > 0) {
              sortino = (activeReturn - rfRate) / downsideStd;
            }
          }
        }
      }

      // DOWN-SAMPLE the chart data to a maximum of 120 points so the payload size drops to under 15KB
      const targetPointCount = 120;
      const skipRatio = Math.max(1, Math.floor(sortedData.length / targetPointCount));
      const downSampledChartData = [];
      for (let i = 0; i < sortedData.length; i += skipRatio) {
        downSampledChartData.push(sortedData[i]);
      }
      
      // Ensure the latest point is always included
      if (downSampledChartData.length > 0 && downSampledChartData[downSampledChartData.length - 1].date !== latestPoint.date) {
        downSampledChartData.push(latestPoint);
      }

      return NextResponse.json({
        meta: {
          fund_house: rawJson.meta.fund_house,
          scheme_category: rawJson.meta.scheme_category,
          scheme_code: rawJson.meta.scheme_code,
          scheme_name: rawJson.meta.scheme_name,
        },
        currentNav,
        cagr1Y: cagr1Y ? Math.round(cagr1Y * 100) / 100 : null,
        cagr3Y: cagr3Y ? Math.round(cagr3Y * 100) / 100 : null,
        cagr5Y: cagr5Y ? Math.round(cagr5Y * 100) / 100 : null,
        volatility: Math.round(volatility * 100) / 100,
        sharpe: Math.round(sharpe * 100) / 100,
        sortino: Math.round(sortino * 100) / 100,
        downSampledChartData,
      });

    } catch (err) {
      console.error("Failed to parse scheme details", err);
      return NextResponse.json({ error: "Failed to retrieve fund details" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
}
