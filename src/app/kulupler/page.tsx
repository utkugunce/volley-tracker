import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllClubs, getDistrictSummaries } from "@/utils/districtClubs";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { TeamBadge } from "@/components/TeamBadge";
import { Trophy, MapPin, Search, ArrowRight, ShieldCheck, ArrowLeft, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Voleybol Kulüpleri Rehberi & İlçe Listesi — Altyapı Voleybol",
  description:
    "İstanbul, Ankara, İzmir, Bursa ve Türkiye genelindeki lisanslı voleybol altyapı kulüpleri, yarıştıkları ligler, ilçe dağılımları ve antrenman salonları rehberi.",
  keywords: [
    "voleybol kulüpleri",
    "istanbul voleybol kulüpleri",
    "voleybol altyapı kulüpleri rehberi",
    "kadıköy voleybol kulübü",
    "ankara voleybol kursları",
    "izmir voleybol altyapı",
    "voleybol spor okulları",
  ],
  openGraph: {
    title: "Voleybol Kulüpleri Rehberi & İlçe Listesi — Altyapı Voleybol",
    description: "Türkiye genelindeki 500+ voleybol altyapı kulübü, ilçe rehberi ve lig kategorileri.",
    url: "https://altyapivoleybol.com.tr/kulupler",
  },
};

export default function KuluplerIndexPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";
  const allClubs = getAllClubs();
  const istanbulDistricts = getDistrictSummaries("istanbul").filter((d) => d.clubCount > 0);
  const ankaraDistricts = getDistrictSummaries("ankara").filter((d) => d.clubCount > 0);
  const izmirDistricts = getDistrictSummaries("izmir").filter((d) => d.clubCount > 0);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: baseUrl },
          { name: "Voleybol Kulüpleri", url: `${baseUrl}/kulupler` },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 flex-1 w-full">
        {/* Üst Navigasyon */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-2 hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </Link>
          <Link
            href="/hangi-ligde-oynar"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Hangi Ligde Oynar? (Kategori Bulucu)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hero Bölümü */}
        <div className="bg-gradient-to-br from-surface to-surface-muted border border-line rounded-3xl p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Türkiye Altyapı Kulüpleri Dizini</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">
                Voleybol Kulüpleri & İlçe Rehberi
              </h1>
              <p className="text-xs sm:text-sm text-ink-2 max-w-2xl leading-relaxed">
                İstanbul, Ankara, İzmir, Bursa ve Türkiye genelinde TVF resmi altyapı liglerinde yarışan kulüplerin profilleri, altyapı takımları ve ilçe bazlı dağılımı.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-canvas/80 border border-line p-3.5 rounded-2xl text-center">
                <span className="block text-2xl font-black text-ink font-mono">
                  {allClubs.length}
                </span>
                <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">
                  Kulüp
                </span>
              </div>
              <div className="bg-canvas/80 border border-line p-3.5 rounded-2xl text-center">
                <span className="block text-2xl font-black text-primary font-mono">
                  81
                </span>
                <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">
                  İl Temsilciliği
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* İstanbul İlçe Hızlı Filtresi (SEO Odaklı) */}
        <div className="bg-surface rounded-2xl border border-line p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black text-ink uppercase tracking-wider">
                İstanbul İlçe Voleybol Kulüpleri
              </h2>
            </div>
            <Link
              href="/kulupler/istanbul"
              prefetch={false}
              className="text-xs font-bold text-primary hover:underline"
            >
              Tüm İstanbul →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {istanbulDistricts.map((d) => (
              <Link
                key={d.slug}
                href={`/kulupler/istanbul/${d.slug}`}
                prefetch={false}
                className="px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-surface-raised border border-line text-xs font-semibold text-ink-2 hover:text-ink transition-all inline-flex items-center gap-1.5 active:scale-95"
              >
                <span>{d.name}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-canvas text-ink-3">
                  {d.clubCount}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Ankara & İzmir İlçe Filtreleri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="text-xs font-black text-ink uppercase tracking-wider">
                Ankara Voleybol İlçeleri
              </span>
              <Link
                href="/kulupler/ankara"
                prefetch={false}
                className="text-xs font-bold text-primary hover:underline"
              >
                Tümü →
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ankaraDistricts.slice(0, 8).map((d) => (
                <Link
                  key={d.slug}
                  href={`/kulupler/ankara/${d.slug}`}
                  prefetch={false}
                  className="px-2.5 py-1 rounded-lg bg-surface-muted hover:bg-surface-raised border border-line text-[11px] font-semibold text-ink-2 hover:text-ink transition-colors"
                >
                  {d.name} ({d.clubCount})
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="text-xs font-black text-ink uppercase tracking-wider">
                İzmir Voleybol İlçeleri
              </span>
              <Link
                href="/kulupler/izmir"
                prefetch={false}
                className="text-xs font-bold text-primary hover:underline"
              >
                Tümü →
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {izmirDistricts.slice(0, 8).map((d) => (
                <Link
                  key={d.slug}
                  href={`/kulupler/izmir/${d.slug}`}
                  prefetch={false}
                  className="px-2.5 py-1 rounded-lg bg-surface-muted hover:bg-surface-raised border border-line text-[11px] font-semibold text-ink-2 hover:text-ink transition-colors"
                >
                  {d.name} ({d.clubCount})
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Kulüpler Listesi Izgarası */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">
              Öne Çıkan Altyapı Kulüpleri ({allClubs.length})
            </h2>
            <span className="text-xs text-ink-3">
              TVF Resmi Lig Katılımcıları
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allClubs.slice(0, 48).map((club) => (
              <div
                key={`${club.citySlug}-${club.id}`}
                className="group bg-surface hover:bg-surface-raised rounded-2xl border border-line hover:border-primary/50 p-4 transition-all shadow-sm hover:shadow-card flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
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
                          <span>{club.city} • {club.district}</span>
                        </div>
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
                      {club.categories.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-muted text-ink-3">
                          +{club.categories.length - 3}
                        </span>
                      )}
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
