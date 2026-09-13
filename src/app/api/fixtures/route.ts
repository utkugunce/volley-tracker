import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function normalizeCitySlug(str: string): string {
  return str
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCity = searchParams.get("city") || "istanbul";
    const citySlug = normalizeCitySlug(rawCity);
    const refresh = searchParams.get("refresh");
    const category = searchParams.get("category");
    const ageGroup = searchParams.get("age_group");
    const gender = searchParams.get("gender");
    const hall = searchParams.get("hall");
    const search = searchParams.get("q")?.toLowerCase();
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    if (refresh === "1") {
      try {
        execSync("python scripts/scrape_all_provinces.py", {
          cwd: process.cwd(),
          timeout: 45000,
          stdio: "ignore",
        });
      } catch (err) {
        console.warn("Live scraper refresh warning (falling back to cached data):", err);
      }
    }

    // Doğru resmi il ismini bul (cities.json üzerinden)
    let officialCityName = citySlug;
    try {
      const citiesIndexPath = path.join(process.cwd(), "data", "cities.json");
      if (fs.existsSync(citiesIndexPath)) {
        const citiesData = JSON.parse(fs.readFileSync(citiesIndexPath, "utf-8"));
        const found = (citiesData.cities || []).find(
          (c: any) => c.slug === citySlug || c.ilid === rawCity || c.slug === rawCity.toLowerCase()
        );
        if (found) {
          officialCityName = found.name;
        }
      }
    } catch {
      // fallback
    }

    let filePath = path.join(process.cwd(), "data", "fixtures.json");
    if (citySlug && citySlug !== "istanbul") {
      const citySpecificPath = path.join(process.cwd(), "data", "cities", `${citySlug}.json`);
      if (fs.existsSync(citySpecificPath)) {
        filePath = citySpecificPath;
      } else {
        // İlgili ilde henüz fikstür açıklanmamış
        return NextResponse.json({
          city: officialCityName,
          slug: citySlug,
          title: `TVF ${officialCityName} Genç & Yıldız Kızlar Süper Lig`,
          updated_at: new Date().toISOString(),
          total_matches: 0,
          unfiltered_total: 0,
          source: `https://${citySlug}.voleyboliltemsilciligi.com`,
          filters: {
            categories: ["Tümü", "Genç Kızlar Süper Lig", "Yıldız Kızlar Süper Lig"],
            age_groups: ["Tümü", "Genç", "Yıldız"],
            genders: ["Kız"],
            halls: ["Tümü"],
          },
          matches: [],
          standings: {},
          note: "Bu ilin TVF temsilciliği yeni sezon bültenini henüz girmemiştir.",
        });
      }
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          error: "fixtures.json bulunamadı. Lütfen önce scraper'ı çalıştırın.",
          matches: [],
          total_matches: 0,
        },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    let matches = data.matches || [];

    if (category && category !== "Tümü") {
      matches = matches.filter((m: any) => m.category === category);
    }

    if (ageGroup && ageGroup !== "Tümü") {
      matches = matches.filter((m: any) => m.age_group === ageGroup);
    }

    if (gender && gender !== "Tümü") {
      matches = matches.filter((m: any) => m.gender === gender);
    }

    if (hall && hall !== "Tümü") {
      matches = matches.filter((m: any) => m.hall === hall);
    }

    if (status && status !== "Tümü") {
      matches = matches.filter((m: any) => m.status === status);
    }

    if (date) {
      matches = matches.filter((m: any) => m.date === date);
    }

    if (search) {
      matches = matches.filter((m: any) => {
        const home = (m.home_team || "").toLowerCase();
        const away = (m.away_team || "").toLowerCase();
        const hallName = (m.hall || "").toLowerCase();
        const cat = (m.category || "").toLowerCase();
        return (
          home.includes(search) ||
          away.includes(search) ||
          hallName.includes(search) ||
          cat.includes(search)
        );
      });
    }

    return NextResponse.json({
      city: data.city || "İstanbul",
      title: data.title || "TVF İstanbul Genç & Yıldız Kızlar Süper Lig",
      updated_at: data.updated_at,
      total_matches: matches.length,
      unfiltered_total: data.total_matches,
      source: data.source,
      filters: data.filters,
      matches,
      standings: data.standings || {},
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Fikstür verisi okunurken hata oluştu." },
      { status: 500 }
    );
  }
}
