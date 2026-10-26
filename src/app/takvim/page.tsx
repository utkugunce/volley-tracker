import { Metadata } from "next";
import { TakvimShell } from "@/components/takvim/TakvimShell";
import { TakvimCalendar } from "@/components/takvim/TakvimCalendar";
import { TakvimeEkle, type TakvimSubscription } from "@/components/takvim/TakvimeEkle";
import { SULTANLAR_FEEDS, fetchSultanlarMatches } from "@/utils/sultanlarIcs";
import { toCalendarMatch } from "@/utils/takvimData";
import type { CalendarMatch } from "@/utils/takvim";
import { getKadinlar1LigData } from "@/utils/kadinlar1LigServer";
import { getKadinlar2LigData } from "@/utils/kadinlar2LigServer";
import type { Kadinlar2LigMatch } from "@/types/kadinlar2Lig";

export const revalidate = 86400; // 24 hours ISR cache (Vercel kota)

export function generateMetadata(): Metadata {
  const title = "Voleybol Fikstür ve Maç Takvimi";
  const description =
    "Vodafone Sultanlar Ligi, KFC Kadınlar 1. Ligi ve Kadınlar 2. Ligi maçlarını ay takvimi üzerinde gün gün saatleri, salonları ve sonuçlarıyla takip edin.";
  const url = "https://altyapivoleybol.com.tr/takvim";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", locale: "tr_TR" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  "fenerbahce-medicana": "Fenerbahçe Medicana",
  "zeren-spor": "Zeren Spor",
  "fenerbahce-medicana-zeren-spor": "İkisi birlikte",
};

const SUBSCRIPTIONS: TakvimSubscription[] = SULTANLAR_FEEDS.map((f) => ({
  slug: f.slug,
  label: SUBSCRIPTION_LABELS[f.slug] ?? f.slug,
}));

function parseTurkishDateToIso(tarihStr?: string): string {
  if (!tarihStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(tarihStr)) return tarihStr;
  const parts = tarihStr.split(".");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

function kadinlarMatchToCalendar(m: Kadinlar2LigMatch, leagueName: string): CalendarMatch | null {
  const isoDate = parseTurkishDateToIso(m.tarih);
  if (!isoDate) return null;

  const homeScore = m.set_a ? parseInt(m.set_a, 10) : null;
  const awayScore = m.set_b ? parseInt(m.set_b, 10) : null;

  return {
    id: m.id || `${leagueName}-${m.mac_no}-${m.grup_no}`,
    date: isoDate,
    time: m.saat || "",
    week: m.hafta ? `${m.hafta}. Hafta` : m.grup_adi || "",
    home: m.takim_a_volleybox_name || m.takim_a,
    away: m.takim_b_volleybox_name || m.takim_b,
    venue: m.salon || "",
    city: m.sehir || "",
    broadcaster: "",
    homeSets: isNaN(homeScore as number) ? null : homeScore,
    awaySets: isNaN(awayScore as number) ? null : awayScore,
    setScores: m.set_sonuclari || "",
    league: leagueName,
  };
}

async function loadMatches(): Promise<{ matches: CalendarMatch[]; loadError: boolean }> {
  const allMatches: CalendarMatch[] = [];
  let errorCount = 0;

  // 1. Sultanlar Ligi
  try {
    const all = await fetchSultanlarMatches(fetch, { cache: null });
    const sultanlarMatches = all.map(toCalendarMatch).map((m) => ({ ...m, league: "Sultanlar Ligi" }));
    allMatches.push(...sultanlarMatches);
  } catch {
    errorCount++;
  }

  // 2. KFC Kadınlar 1. Ligi
  try {
    const k1Data = getKadinlar1LigData();
    const k1List = (k1Data.tum_maclar || [])
      .map((m) => kadinlarMatchToCalendar(m, "1. Lig"))
      .filter((m): m is CalendarMatch => m !== null);
    allMatches.push(...k1List);
  } catch {
    // 1. lig opsiyonel hata yönetimi
  }

  // 3. Uzman Posta Kadınlar 2. Ligi
  try {
    const k2Data = getKadinlar2LigData();
    const k2List = (k2Data.tum_maclar || [])
      .map((m) => kadinlarMatchToCalendar(m, "2. Lig"))
      .filter((m): m is CalendarMatch => m !== null);
    allMatches.push(...k2List);
  } catch {
    // 2. lig opsiyonel hata yönetimi
  }

  return {
    matches: allMatches,
    loadError: errorCount > 0 && allMatches.length === 0,
  };
}

export default async function TakvimPage() {
  const { matches, loadError } = await loadMatches();
  return (
    <TakvimShell>
      <div className="space-y-4 pb-6">
        <div>
          <h1 className="font-display font-extrabold text-ink text-xl sm:text-2xl tracking-tight">
            Voleybol Ligleri Maç Takvimi
          </h1>
          <p className="text-xs text-ink-2 mt-0.5 font-medium">
            Vodafone Sultanlar Ligi, KFC Kadınlar 1. Ligi ve Kadınlar 2. Ligi resmi TVF bültenleri
          </p>
        </div>
        <TakvimCalendar matches={matches} loadError={loadError} />
        <TakvimeEkle subscriptions={SUBSCRIPTIONS} />
      </div>
    </TakvimShell>
  );
}
