import fs from "fs";
import path from "path";
import { DashboardClient } from "@/components/DashboardClient";
import { FixturesData } from "@/types/fixture";

export const dynamic = "force-dynamic";

function getInitialFixtures(): FixturesData {
  try {
    const citiesDir = path.join(process.cwd(), "data", "cities");
    if (fs.existsSync(citiesDir)) {
      const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith(".json"));
      const allMatches: any[] = [];
      const allStandings: Record<string, any[]> = {};
      const categoriesSet = new Set<string>(["Tümü"]);
      const hallsSet = new Set<string>(["Tümü"]);
      let latestUpdated = new Date(0).toISOString();

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(citiesDir, file), "utf-8");
          const parsed = JSON.parse(content);
          const cityName = parsed.city || file.replace(".json", "");
          if (parsed.updated_at && parsed.updated_at > latestUpdated) {
            latestUpdated = parsed.updated_at;
          }
          if (Array.isArray(parsed.matches)) {
            for (const m of parsed.matches) {
              allMatches.push({
                ...m,
                city: m.city || cityName,
              });
              if (m.category) categoriesSet.add(m.category);
              if (m.hall) hallsSet.add(m.hall);
            }
          }
          if (parsed.standings && typeof parsed.standings === "object") {
            for (const [k, v] of Object.entries(parsed.standings)) {
              allStandings[`${cityName} - ${k}`] = v as any[];
            }
          }
        } catch (e) {
          console.warn(`Error reading city file ${file}:`, e);
        }
      }

      if (allMatches.length > 0) {
        return {
          city: "Tüm İller",
          title: "TVF Türkiye Geneli Genç & Yıldız Kızlar Süper Lig",
          updated_at: latestUpdated > new Date(0).toISOString() ? latestUpdated : new Date().toISOString(),
          total_matches: allMatches.length,
          source: "TVF İl Temsilcilikleri",
          filters: {
            categories: Array.from(categoriesSet),
            age_groups: ["Tümü", "Genç", "Yıldız"],
            genders: ["Kız"],
            halls: Array.from(hallsSet),
          },
          matches: allMatches,
          standings: allStandings,
        };
      }
    }

    const filePath = path.join(process.cwd(), "data", "fixtures.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Fikstür dosyası okunamadı:", e);
  }

  return {
    city: "Tüm İller",
    title: "TVF Türkiye Geneli Genç & Yıldız Kızlar Süper Lig",
    updated_at: new Date().toISOString(),
    total_matches: 0,
    source: "TVF İl Temsilcilikleri",
    filters: {
      categories: ["Tümü", "Genç Kızlar Süper Lig", "Yıldız Kızlar Süper Lig"],
      age_groups: ["Tümü", "Genç", "Yıldız"],
      genders: ["Kız"],
      halls: [],
    },
    matches: [],
  };
}

export default function Page() {
  const initialData = getInitialFixtures();
  return <DashboardClient initialData={initialData} />;
}
