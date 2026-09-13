import fs from "fs";
import path from "path";
import { DashboardClient } from "@/components/DashboardClient";
import { FixturesData } from "@/types/fixture";

export const dynamic = "force-dynamic";

function getInitialFixtures(): FixturesData {
  try {
    const filePath = path.join(process.cwd(), "data", "fixtures.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Fikstür dosyası okunamadı:", e);
  }

  return {
    city: "İstanbul",
    title: "TVF İstanbul Genç & Yıldız Kızlar Süper Lig",
    updated_at: new Date().toISOString(),
    total_matches: 0,
    source: "TVF İstanbul Voleybol İl Temsilciliği",
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
