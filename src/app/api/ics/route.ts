import { NextRequest, NextResponse } from "next/server";
import { getTeamDetailsBySlug } from "@/utils/teamData";
import { loadAllCityData } from "@/utils/team/loaders";
import { generateSeasonIcs } from "@/utils/ics";
import { slugify } from "@/utils/slugify";
import { normalizeCitySlug } from "@/utils/volleybox";
import type { Match } from "@/types/fixture";

export const dynamic = "force-dynamic";

/**
 * Abone olunabilir canlı takvim akışı (.ics / webcal).
 *
 * Kullanım:
 *   - Takım takvimi: /api/ics?team=vakifbank-u18&city=istanbul
 *   - Lig / Kategori takvimi: /api/ics?category=genc-kizlar-super-lig&city=istanbul
 *
 * Yanıt:
 *   - Content-Type: text/calendar; charset=utf-8
 *   - Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400
 *   - Vercel ISR kotasını tüketmez; Edge CDN'den önbellekle servis edilir.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const teamParam = searchParams.get("team")?.trim();
  const cityParam = searchParams.get("city")?.trim();
  const categoryParam = searchParams.get("category")?.trim() || searchParams.get("league")?.trim();

  if (!teamParam && !categoryParam) {
    return new NextResponse("Lütfen geçerli bir 'team' veya 'category' parametresi belirtin.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    let matches: Match[] = [];
    let calendarTitle = "Altyapı Voleybol Maç Takvimi";
    let filename = "voleybol-takvim";

    if (teamParam) {
      const cleanTeamSlug = teamParam.replace(/\.ics$/i, "");
      const team = getTeamDetailsBySlug(cleanTeamSlug, cityParam);

      if (!team || team.matches.length === 0) {
        return new NextResponse("Bu takım için fikstür kaydı bulunamadı.", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      matches = team.matches;
      calendarTitle = `${team.teamName} Sezon Fikstürü`;
      filename = `${team.slug}-takvim`;
    } else if (categoryParam) {
      const allData = loadAllCityData();
      const targetCategorySlug = slugify(categoryParam);
      const targetCitySlug = cityParam ? normalizeCitySlug(cityParam) : "";

      matches = allData.matches.filter((m) => {
        if (!m.category) return false;
        if (slugify(m.category) !== targetCategorySlug && !m.category.toLowerCase().includes(categoryParam.toLowerCase())) {
          return false;
        }
        if (targetCitySlug) {
          const mCitySlug = normalizeCitySlug(m.city || "İstanbul");
          if (mCitySlug !== targetCitySlug) return false;
        }
        return true;
      });

      if (matches.length === 0) {
        return new NextResponse("Bu kategori için fikstür kaydı bulunamadı.", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      calendarTitle = `${matches[0].category || categoryParam} Fikstürü`;
      filename = `${targetCategorySlug}-takvim`;
    }

    const icsContent = generateSeasonIcs(matches, calendarTitle);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${filename}.ics"`,
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Takvim akışı oluşturulurken hata:", error);
    return new NextResponse("Takvim akışı oluşturulamadı.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
