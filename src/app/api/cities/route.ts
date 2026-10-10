import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isCityHidden } from "@/utils/cityHelper";

/** data/cities.json içindeki il kaydından bu rotanın okuduğu alanlar. */
interface CityListEntry {
  slug: string;
  has_matches?: boolean;
  matches_count?: number;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "cities.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        total_cities: 0,
        active_cities: 0,
        cities: [],
      });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    // Canlıda gizlenen illeri filtrele
    const filteredCities = (data.cities || []).filter((c: CityListEntry) => !isCityHidden(c.slug));
    const activeCount = filteredCities.filter((c: CityListEntry) => c.has_matches || (c.matches_count && c.matches_count > 0)).length;

    const sanitizedData = {
      ...data,
      total_cities: filteredCities.length,
      active_cities: activeCount,
      cities: filteredCities,
    };

    return NextResponse.json(sanitizedData, {
      headers: {
        // Veri yalnızca deploy ile değişir; uzun CDN önbelleği Fast Origin Transfer kotasını korur.
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Cities API Error:", error);
    return NextResponse.json(
      { error: "Şehir listesi yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}
