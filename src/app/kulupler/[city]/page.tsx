import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClubsByCity, getDistrictSummaries } from "@/utils/districtClubs";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { TeamBadge } from "@/components/TeamBadge";
import { MapPin, ArrowLeft, ArrowRight, ShieldCheck, Trophy } from "lucide-react";
import { normalizeCitySlug } from "@/utils/volleybox";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const normCity = normalizeCitySlug(city);
  const cityName = normCity.charAt(0).toUpperCase() + normCity.slice(1);

  return {
    title: `${cityName} Voleybol Kulüpleri & Altyapı Rehberi — Altyapı Voleybol`,
    description: `${cityName} ilindeki resmi TVF lisanslı altyapı voleybol kulüpleri, ilçe dağılımları, yaş kategorileri ve spor salonları rehberi.`,
    openGraph: {
      title: `${cityName} Voleybol Kulüpleri Rehberi`,
      description: `${cityName} voleybol altyapı kulüpleri ve takımları.`,
      url: `https://altyapivoleybol.com.tr/kulupler/${normCity}`,
    },
  };
}

export default async function CityClubsPage({ params }: Props) {
  const { city } = await params;
  const normCity = normalizeCitySlug(city);
  const clubs = getClubsByCity(normCity);
  const districts = getDistrictSummaries(normCity);

  if (clubs.length === 0 && districts.length === 0) {
    notFound();
  }

  const cityName = clubs[0]?.city || (normCity.charAt(0).toUpperCase() + normCity.slice(1));
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: baseUrl },
          { name: "Voleybol Kulüpleri", url: `${baseUrl}/kulupler` },
          { name: cityName, url: `${baseUrl}/kulupler/${normCity}` },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 flex-1 w-full">
        {/* Üst Navigasyon */}
        <div className="flex items-center justify-between">
          <Link
            href="/kulupler"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-2 hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tüm Kulüplere Dön</span>
          </Link>
          <Link
            href={`/puan-durumu/${normCity}`}
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>{cityName} Puan Durumunu Gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-surface to-surface-muted border border-line rounded-3xl p-6 sm:p-8 shadow-card space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{cityName} Altyapı Ağı</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">
            {cityName} Voleybol Kulüpleri
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 max-w-2xl leading-relaxed">
            {cityName} genelindeki {clubs.length} lisanslı voleybol kulübü, antrenman yapılan ilçeler ve yarıştıkları TVF lig kategorileri.
          </p>
        </div>

        {/* İlçe Hapları */}
        {districts.length > 0 && (
          <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-black text-ink uppercase tracking-wider">
              {cityName} İlçeleri
            </h2>
            <div className="flex flex-wrap gap-2">
              {districts.map((d) => (
                <Link
                  key={d.slug}
                  href={`/kulupler/${normCity}/${d.slug}`}
                  prefetch={false}
                  className="px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-surface-raised border border-line text-xs font-semibold text-ink-2 hover:text-ink transition-all inline-flex items-center gap-1.5"
                >
                  <span>{d.name}</span>
                  {d.clubCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-canvas text-ink-3">
                      {d.clubCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Kulüp Listesi */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">
              {cityName} Kulüpleri ({clubs.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {clubs.map((club) => (
              <div
                key={`${club.citySlug}-${club.id}`}
                className="group bg-surface hover:bg-surface-raised rounded-2xl border border-line hover:border-primary/50 p-4 transition-all shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TeamBadge name={club.name} size="sm" />
                    <div className="min-w-0">
                      <Link
                        href={`/takim/${club.id}`}
                        prefetch={false}
                        className="font-bold text-sm text-ink group-hover:text-primary transition-colors block truncate"
                        title={club.name}
                      >
                        {club.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[11px] text-ink-3">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <span>{club.district}</span>
                      </div>
                    </div>
                  </div>

                  {club.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {club.categories.slice(0, 3).map((cat, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-surface-muted text-ink-2 border border-line truncate max-w-[140px]"
                        >
                          {cat.replace("TVF ", "").replace("Kızlar", "Kız")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-ink-3">
                    {club.teams.length} Takım • {club.matchCount} Maç
                  </span>
                  <Link
                    href={`/takim/${club.id}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary group-hover:underline"
                  >
                    <span>Profili İncele</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
