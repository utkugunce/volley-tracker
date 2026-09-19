import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { timingSafeEqual } from "crypto";
import {
  getPushSubscriptions,
  sendWebPush,
  StoredSubscription,
} from "@/utils/webPush";
import { applyOverridesToMatchesAsync } from "@/utils/overrides";
import { parseMatchDateTime } from "@/utils/notifications";
import { Match } from "@/types/fixture";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function loadAllMatches(): Match[] {
  const allMatches: Match[] = [];
  const seenIds = new Set<string>();

  // 1. data/cities dizinindeki tüm illeri topla
  const citiesDir = path.join(process.cwd(), "data", "cities");
  if (fs.existsSync(citiesDir)) {
    const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(citiesDir, file), "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.matches)) {
          for (const m of parsed.matches) {
            if (m.id && !seenIds.has(m.id)) {
              seenIds.add(m.id);
              allMatches.push(m);
            }
          }
        }
      } catch {
        // Hatalı dosyayı atla
      }
    }
  }

  // 2. data/fixtures.json fallback
  const fixturesPath = path.join(process.cwd(), "data", "fixtures.json");
  if (fs.existsSync(fixturesPath)) {
    try {
      const content = fs.readFileSync(fixturesPath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.matches)) {
        for (const m of parsed.matches) {
          if (m.id && !seenIds.has(m.id)) {
            seenIds.add(m.id);
            allMatches.push(m);
          }
        }
      }
    } catch {
      // Hatalı dosyayı atla
    }
  }

  return allMatches;
}

function doesSubscriptionMatch(sub: StoredSubscription, match: Match): boolean {
  const favTeams = (sub.favoriteTeams || []).map((t) => t.toLowerCase().trim());
  const favMatches = sub.favoriteMatches || [];

  // Doğrudan maç ID'si eşleşiyor mu?
  if (favMatches.includes(match.id)) {
    return true;
  }

  // Takım eşleşmesi var mı?
  if (favTeams.length > 0) {
    const home = (match.home_team || "").toLowerCase();
    const away = (match.away_team || "").toLowerCase();
    const matchesTeam = favTeams.some(
      (team) => home.includes(team) || away.includes(team)
    );
    if (matchesTeam) return true;
  }

  // Abone hiçbir filtre seçmediyse tüm maç bildirimlerini alır
  if (favTeams.length === 0 && favMatches.length === 0) {
    return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Yetkilendirme kontrolü (CRON_SECRET veya ADMIN_TOKEN)
    const cronSecret = process.env.CRON_SECRET;
    const adminToken = process.env.ADMIN_TOKEN;
    const expectedSecret = cronSecret || adminToken;

    if (expectedSecret) {
      const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      const xAdmin = req.headers.get("x-admin-token");
      const urlSecret = req.nextUrl.searchParams.get("secret");
      const provided = authHeader || xAdmin || urlSecret;

      if (!provided) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
      }

      const matchesCron = Boolean(cronSecret && safeCompare(provided, cronSecret));
      const matchesAdmin = Boolean(adminToken && safeCompare(provided, adminToken));

      if (!matchesCron && !matchesAdmin) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
      }
    }

    const subscriptions = await getPushSubscriptions();
    if (subscriptions.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "Aktif bildirim abonesi bulunamadı.",
        sent: 0,
        failed: 0,
      });
    }

    const rawMatches = loadAllMatches();
    const allMatches = await applyOverridesToMatchesAsync(rawMatches);

    // Parametre ile test veya özel dakika penceresi desteği
    const leadMinutes = parseInt(req.nextUrl.searchParams.get("leadMinutes") || "35", 10);
    const windowMs = leadMinutes * 60 * 1000;
    const now = new Date();

    // Önümüzdeki pencerede başlayacak olan ve tamamlanmamış maçları filtrele
    const upcomingMatches = allMatches.filter((match) => {
      if (match.status === "finished") return false;
      const matchDate = parseMatchDateTime(match.date, match.time);
      if (!matchDate) return false;

      const diffMs = matchDate.getTime() - now.getTime();
      return diffMs > 0 && diffMs <= windowMs;
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const match of upcomingMatches) {
      const venue = match.hall || (match as any).venue || "Belirtilmedi";
      const payload = {
        title: `🏐 Maç Başlıyor! (${match.time})`,
        body: `${match.home_team} - ${match.away_team} maçı ${match.time}'da başlıyor! Salon: ${venue}`,
        tag: `match-${match.id}`,
        data: {
          url: `/mac/${match.id}`,
          matchId: match.id,
        },
      };

      for (const sub of subscriptions) {
        if (doesSubscriptionMatch(sub, match)) {
          const res = await sendWebPush(sub, payload);
          if (res.success) {
            sentCount++;
          } else {
            failedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      upcomingMatchesCount: upcomingMatches.length,
      totalSubscribers: subscriptions.length,
      sent: sentCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Bildirim dağıtım hatası:", err);
    return NextResponse.json(
      { error: "Bildirimler dağıtılırken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// Vercel Cron veya GET tetiklemeleri için GET desteği
export async function GET(req: NextRequest) {
  return POST(req);
}
