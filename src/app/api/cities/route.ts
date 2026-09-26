import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isCityHidden } from "@/utils/cityHelper";

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
    const filteredCities = (data.cities || []).filter((c: any) => !isCityHidden(c.slug));
    const activeCount = filteredCities.filter((c: any) => c.has_matches || (c.matches_count && c.matches_count > 0)).length;

    const sanitizedData = {
      ...data,
      total_cities: filteredCities.length,
      active_cities: activeCount,
      cities: filteredCities,
    };

    return NextResponse.json(sanitizedData, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
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
