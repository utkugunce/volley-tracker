import { Metadata } from "next";
import { TakvimShell } from "@/components/takvim/TakvimShell";
import { TakvimCalendar } from "@/components/takvim/TakvimCalendar";
import { loadAllData } from "@/utils/team/loaders";
import type { CalendarMatch } from "@/utils/takvim";

export const revalidate = 1800;

export function generateMetadata(): Metadata {
  const title = "Altyapı Voleybol Maç Takvimi";
  const description =
    "TVF 81 İl Altyapı Voleybol (Genç, Yıldız, Küçük, Midi Kızlar) karşılaşmalarını ay takvimi üzerinde gün gün saatleri, salonları ve sonuçlarıyla takip edin.";
  const url = "https://altyapivoleybol.com.tr/takvim";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", locale: "tr_TR" },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function loadMatches(): Promise<{ matches: CalendarMatch[]; loadError: boolean }> {
  try {
    const { matches } = loadAllData();
    const calendarMatches: CalendarMatch[] = matches
      .filter((m) => Boolean(m.date))
      .map((m) => ({
        id: m.id,
        date: m.date,
        time: m.time || "",
        week: m.group || "",
        home: m.home_team,
        away: m.away_team,
        venue: m.hall || "",
        city: m.city || "",
        broadcaster: "",
        homeSets: m.home_score ?? null,
        awaySets: m.away_score ?? null,
        setScores: (m.set_scores || []).join(", "),
        league: m.category || "Altyapı",
      }));

    return {
      matches: calendarMatches,
      loadError: false,
    };
  } catch (err) {
    console.error("Error loading takvim matches:", err);
    return {
      matches: [],
      loadError: true,
    };
  }
}

export default async function TakvimPage() {
  const { matches, loadError } = await loadMatches();
  return (
    <TakvimShell>
      <div className="space-y-4 pb-6">
        <div>
          <h1 className="font-display font-extrabold text-ink text-xl sm:text-2xl tracking-tight">
            Altyapı Voleybol Maç Takvimi
          </h1>
          <p className="text-xs text-ink-2 mt-0.5 font-medium">
            TVF 81 İl Altyapı Voleybol Ligleri resmi fikstür ve maç programı
          </p>
        </div>
        <TakvimCalendar matches={matches} loadError={loadError} />
      </div>
    </TakvimShell>
  );
}
