import { NextResponse } from "next/server";
import { buildIcs, fetchSultanlarMatches, filterMatchesByTeams, findFeed } from "@/utils/sultanlarIcs";

/**
 * Abone olunabilir takvim: /takvim/<takım>.ics
 *   - /takvim/fenerbahce-medicana.ics
 *   - /takvim/zeren-spor.ics
 *   - /takvim/fenerbahce-medicana-zeren-spor.ics (ikisi birlikte)
 *
 * ISR kullanılmaz (Vercel yazma kotası): yanıt CDN başlıklarıyla 1 saat önbelleğe alınır.
 */
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ team: string }> }) {
  const { team } = await params;
  if (!team.toLowerCase().endsWith(".ics")) {
    return new NextResponse("Bulunamadı", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const feed = findFeed(team.slice(0, -4).toLowerCase());
  if (!feed) {
    return new NextResponse("Bulunamadı", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  try {
    const all = await fetchSultanlarMatches();
    const body = buildIcs(filterMatchesByTeams(all, feed.teams), feed);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${feed.slug}.ics"`,
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Takvim istemcileri hata yanıtında eski veriyi korur; kısa süre sonra yeniden denesin.
    return new NextResponse("TVF fikstürü şu an alınamadı", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "300", "Cache-Control": "no-store" },
    });
  }
}
