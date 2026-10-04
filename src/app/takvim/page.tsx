import { Metadata } from "next";
import { TakvimShell } from "@/components/takvim/TakvimShell";
import { TakvimCalendar } from "@/components/takvim/TakvimCalendar";
import { TakvimeEkle, type TakvimSubscription } from "@/components/takvim/TakvimeEkle";
import { SULTANLAR_FEEDS, fetchSultanlarMatches } from "@/utils/sultanlarIcs";
import { toCalendarMatch } from "@/utils/takvimData";
import type { CalendarMatch } from "@/utils/takvim";

/**
 * Vodafone Sultanlar Ligi takvimi. Sayfa istek başına üretilmez: ISR ile 30 dakikada bir yenilenir
 * (Vercel yazma kotası). Veri, .ics akışlarıyla aynı TVF okuyucusundan gelir; "bugün" ve seçili gün
 * tarayıcıda hesaplanır, bu yüzden sunucu çıktısı kişiye/zamana göre değişmez.
 */
export const revalidate = 1800;

export function generateMetadata(): Metadata {
  const title = "Vodafone Sultanlar Ligi Takvimi — Altyapı Voleybol";
  const description =
    "Vodafone Sultanlar Ligi maçlarını ay takvimi üzerinde görün: gün gün maç saatleri, salonlar, yayıncı kanal ve skorlar. Fenerbahçe Medicana ve Zeren Spor maçlarını takvimine ekle.";
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

async function loadMatches(): Promise<{ matches: CalendarMatch[]; loadError: boolean }> {
  try {
    // cache: null → fetch'e önbellek bayrağı verilmez; sayfa dinamik olmaz, çıktıyı `revalidate` önbelleğe alır.
    const all = await fetchSultanlarMatches(fetch, { cache: null });
    return { matches: all.map(toCalendarMatch), loadError: false };
  } catch {
    return { matches: [], loadError: true };
  }
}

export default async function TakvimPage() {
  const { matches, loadError } = await loadMatches();
  return (
    <TakvimShell>
      <div className="space-y-4 pb-6">
        <div>
          <h1 className="font-display font-extrabold text-ink text-xl sm:text-2xl tracking-tight">Vodafone Sultanlar Ligi Takvimi</h1>
          <p className="text-xs sm:text-sm text-ink-2 mt-0.5">
            Bir güne tıklayarak o günün maçlarını gör. Kaynak: TVF — yalnızca TVF&apos;nin yayınladığı haftalar gösterilir.
          </p>
        </div>
        <TakvimCalendar matches={matches} loadError={loadError} />
        <TakvimeEkle subscriptions={SUBSCRIPTIONS} />
      </div>
    </TakvimShell>
  );
}
