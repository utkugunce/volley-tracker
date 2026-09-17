import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

    return NextResponse.json(data, {
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
