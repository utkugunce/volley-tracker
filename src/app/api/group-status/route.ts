import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { computeGroupStatusList, GROUP_STATUS_CONFIGS, GroupStatusKey, GroupStatusItem } from "@/utils/groupStatus";
import { slugify } from "@/utils/slugify";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterCity = searchParams.get("city")?.toLowerCase();

    const citiesDir = path.join(process.cwd(), "data", "cities");
    const citiesIndexPath = path.join(process.cwd(), "data", "cities.json");

    let citiesInfo: any[] = [];
    if (fs.existsSync(citiesIndexPath)) {
      try {
        const cData = JSON.parse(fs.readFileSync(citiesIndexPath, "utf-8"));
        citiesInfo = cData.cities || [];
      } catch (e) {
        console.warn("Could not read cities.json:", e);
      }
    }

    const allMatches: any[] = [];
    const allStandings: Record<string, any[]> = {};

    if (fs.existsSync(citiesDir)) {
      const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(citiesDir, file), "utf-8");
          const parsed = JSON.parse(content);
          const cityName = parsed.city || file.replace(".json", "");
          
          if (Array.isArray(parsed.matches)) {
            for (const m of parsed.matches) {
              allMatches.push({
                ...m,
                city: m.city || cityName,
              });
            }
          }

          if (parsed.standings && typeof parsed.standings === "object") {
            for (const [k, v] of Object.entries(parsed.standings)) {
              allStandings[`${cityName} - ${k}`] = v as any[];
            }
          }
        } catch (e) {
          console.warn(`Error reading ${file}:`, e);
        }
      }
    }

    let groupList = computeGroupStatusList(allMatches, allStandings, citiesInfo);

    if (filterCity && filterCity !== "all" && filterCity !== "tumu" && filterCity !== "turkiye") {
      groupList = groupList.filter((g) => slugify(g.city) === filterCity || g.citySlug === filterCity);
    }

    // Status summary counts
    const summary: Record<GroupStatusKey, number> = {
      all_dated_entered: 0,
      partial: 0,
      not_entered: 0,
      no_matches: 0,
      teams_only: 0,
      all_program_entered: 0,
      finished: 0,
    };

    for (const item of groupList) {
      if (summary[item.statusKey] !== undefined) {
        summary[item.statusKey]++;
      }
    }

    return NextResponse.json({
      success: true,
      totalGroups: groupList.length,
      groups: groupList,
      summary,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("API group-status error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Grup durumları alınamadı" },
      { status: 500 }
    );
  }
}
