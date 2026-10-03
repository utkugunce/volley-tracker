import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Trophy, ChevronLeft } from "lucide-react";
import { getTeamDetailsBySlug } from "@/utils/teamData";
import { TeamDetailClient } from "@/components/TeamDetailClient";

/**
 * Takım sayfası (/takim/[slug]) ve şehir varyantı (/takim/[slug]/[city]) için ortak içerik.
 * Şehir filtresi artık `?sehir=` arama parametresinden değil yoldan gelir; böylece sayfalar `searchParams`
 * okumadan statik/ISR üretilip CDN'den servis edilebilir. Eski `?sehir=` / `?city=` adresleri
 * next.config.mjs içindeki rewrite ile aynı içeriğe çözülür.
 */
const SITE_URL = "https://altyapivoleybol.com.tr";

/** Takım sayfasının kanonik yolu: şehir varyantı varsa `/takim/<slug>/<il>`, yoksa `/takim/<slug>`. */
export function getTeamCanonicalPath(slug: string, citySegment?: string): string {
  return citySegment ? `/takim/${slug}/${encodeURIComponent(citySegment)}` : `/takim/${slug}`;
}

export async function buildTeamMetadata(slug: string, cityFilter?: string): Promise<Metadata> {
  const team = getTeamDetailsBySlug(slug, cityFilter);

  if (!team) {
    return {
      title: "Takım Bulunamadı",
      description: "Aranan voleybol takımı için henüz fikstür veya puan durumu kaydı bulunamadı.",
      robots: { index: false, follow: true },
    };
  }

  const citiesStr = team.cities.join(", ");
  const catStr = team.categories.join(", ");
  const top = team.standingsContexts[0];
  const standingStr = top
    ? ` ${top.groupName} puan durumunda ${top.standingRow.rank}. sırada, ${top.standingRow.played} maçta ${top.standingRow.points} puan.`
    : "";
  const canonical = `${SITE_URL}${getTeamCanonicalPath(slug, cityFilter)}`;

  return {
    // Başlık şablonu (layout.tsx) " | Altyapı Voleybol" ekini zaten ekler.
    title: team.teamName,
    description: `${team.teamName} (${citiesStr}) voleybol takımı ${catStr} sezon fikstürü, güncel puan durumu, maç sonuçları ve Volleybox profili.${standingStr}`,
    alternates: { canonical },
    openGraph: {
      title: `${team.teamName} — Sezon Fikstürü ve Puan Durumu`,
      description: `${team.teamName} maç takvimi, skorları ve lig puan durumu.`,
      url: canonical,
      type: "website",
    },
  };
}

export function TeamPageView({ slug, cityFilter }: { slug: string; cityFilter?: string }) {
  const team = getTeamDetailsBySlug(slug, cityFilter);

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-slate-500 shadow-inner">
          <Trophy size={32} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black mb-2">Bu takım için henüz veri bulunmuyor</h1>
        <p className="text-slate-400 max-w-md text-xs sm:text-sm mb-6">
          Aradığınız takım için il temsilciliği bültenlerinde fikstür veya puan durumu bilgisi henüz açıklanmamış olabilir.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-fg text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-glow-primary"
        >
          <ChevronLeft size={16} />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    );
  }

  const logo = team.mapping?.logo_url;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.teamName,
    sport: "Volleyball",
    url: `${SITE_URL}${getTeamCanonicalPath(slug, cityFilter)}`,
    ...(logo && /^https?:\/\//.test(logo) ? { logo } : {}),
    ...(team.city ? { location: { "@type": "Place", name: team.city } } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // "<" kaçışlanır: takım adı içindeki olası "</script>" dizisi etiketi kapatamasın.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <TeamDetailClient team={team} />
    </>
  );
}
