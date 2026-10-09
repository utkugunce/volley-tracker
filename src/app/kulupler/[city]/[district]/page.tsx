import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClubsByDistrict, getDistrictSummaries } from "@/utils/districtClubs";
import { BreadcrumbJsonLd, SportsClubJsonLd, FaqJsonLd } from "@/components/JsonLd";
import { TeamBadge } from "@/components/TeamBadge";
import {
  MapPin,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Navigation,
  Building2,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { normalizeCitySlug } from "@/utils/volleybox";
import venuesData from "@/data/venues.json";

interface Props {
  params: Promise<{ city: string; district: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, district } = await params;
  const normCity = normalizeCitySlug(city);
  const cityName = normCity.charAt(0).toUpperCase() + normCity.slice(1);
  const distName = district.charAt(0).toUpperCase() + district.slice(1);

  return {
    title: `${distName} Voleybol Kulüpleri & Kurs Rehberi (${cityName}) — Altyapı Voleybol`,
    description: `${cityName} ${distName} bölgesindeki resmi lisanslı voleybol kulüpleri, altyapı seçmeleri, antrenman salonları, Midi, Küçük, Yıldız ve Genç lig takımları.`,
    keywords: [
      `${distName} voleybol kulüpleri`,
      `${distName} voleybol kursu`,
      `${distName} voleybol altyapı seçmeleri`,
      `${cityName} ${distName} voleybol`,
      `${distName} spor okulları`,
    ],
    openGraph: {
      title: `${distName} Voleybol Kulüpleri & Kurs Rehberi`,
      description: `${cityName} ${distName} lisanslı voleybol kulüpleri ve antrenman salonları.`,
      url: `https://altyapivoleybol.com.tr/kulupler/${normCity}/${district}`,
    },
  };
}

export default async function DistrictClubsPage({ params }: Props) {
  const { city, district } = await params;
  const normCity = normalizeCitySlug(city);
  const clubs = getClubsByDistrict(normCity, district);
  const allDistricts = getDistrictSummaries(normCity);
  const currentDistSummary = allDistricts.find((d) => d.slug === district);

  const cityName = normCity.charAt(0).toUpperCase() + normCity.slice(1);
  const districtName = currentDistSummary?.name || (district.charAt(0).toUpperCase() + district.slice(1));
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";

  // Bu ilçedeki spor salonlarını bul
  const districtVenues = venuesData.filter((v) => {
    const vDist = (v.district || "").toLowerCase();
    const target = districtName.toLowerCase();
    return vDist.includes(target) || target.includes(vDist);
  });

  const faqItems = [
    {
      question: `${districtName} ilçesinde voleybol kulübü nasıl seçilir?`,
      answer: `${districtName} bölgesinde voleybol altyapı kulübü seçerken antrenörlerin TVF kademe lisansına, kulübün resmi TVF liglerinde kaç yaş kategorisinde yarıştığına ve antrenman tesisinin ulaşım kolaylığına dikkat edilmelidir.`,
    },
    {
      question: `${districtName} voleybol kulüplerinde deneme antrenmanları nasıl yapılır?`,
      answer: `Kulüpler genellikle sezon başında (Eylül - Ekim) ve ara tatil dönemlerinde sporcu seçmeleri düzenler. Çoğu kulüp sporcu adayını kendi yaş grubundaki mevcut takımla 1-2 deneme antrenmanına davet ederek boy, sıçrama ve koordinasyon seviyesini değerlendirir.`,
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: baseUrl },
          { name: "Voleybol Kulüpleri", url: `${baseUrl}/kulupler` },
          { name: cityName, url: `${baseUrl}/kulupler/${normCity}` },
          { name: districtName, url: `${baseUrl}/kulupler/${normCity}/${district}` },
        ]}
      />
      <FaqJsonLd items={faqItems} />

      {/* Her kulüp için SportsClub Schema */}
      {clubs.slice(0, 10).map((c) => (
        <SportsClubJsonLd
          key={c.id}
          name={c.name}
          url={`${baseUrl}/takim/${c.id}`}
          city={cityName}
          district={districtName}
          teams={c.teams}
        />
      ))}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 flex-1 w-full">
        {/* Üst Navigasyon */}
        <div className="flex items-center justify-between">
          <Link
            href={`/kulupler/${normCity}`}
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-2 hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{cityName} İlçelerine Dön</span>
          </Link>
          <Link
            href="/hangi-ligde-oynar"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Hangi Ligde Oynar?</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-surface to-surface-muted border border-line rounded-3xl p-6 sm:p-8 shadow-card space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <MapPin className="w-3.5 h-3.5" />
            <span>{cityName} • {districtName} Bölgesi</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">
            {districtName} Voleybol Kulüpleri & Kurs Rehberi
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 max-w-2xl leading-relaxed">
            {districtName} ilçesinde antrenman yapan, TVF 2026-2027 resmi altyapı liglerinde mücadele eden spor kulüpleri, spor salonları ve takımlar.
          </p>
        </div>

        {/* Kulüp Listesi */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">
              {districtName} Bölgesindeki Kulüpler ({clubs.length})
            </h2>
            <span className="text-xs text-ink-3">
              Resmi TVF Tescilli
            </span>
          </div>

          {clubs.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-dashed border-line p-8 text-center space-y-2">
              <Building2 className="w-8 h-8 text-ink-3 mx-auto" />
              <p className="text-sm font-bold text-ink">
                Bu ilçede doğrudan kayıtlı kulüp henüz listelenmedi.
              </p>
              <p className="text-xs text-ink-3 max-w-md mx-auto">
                Komşu ilçelerdeki altyapı kulüplerini inceleyebilir veya il genelindeki puan durumunu takip edebilirsiniz.
              </p>
              <Link
                href={`/kulupler/${normCity}`}
                prefetch={false}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
              >
                <span>{cityName} Diğer İlçelerini Gör</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {clubs.map((club) => {
                const prefilledMsg = encodeURIComponent(
                  `Merhaba, ${club.name} kulübünüzün altyapı takımları ve spor okulu antrenmanları hakkında bilgi almak istiyorum.`
                );

                return (
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
                          <div className="text-[11px] text-ink-3">
                            <span>{districtName}</span>
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

                    <div className="pt-2 border-t border-line flex items-center justify-between text-xs gap-2">
                      <a
                        href={`https://wa.me/?text=${prefilledMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                        title="WhatsApp üzerinden bilgi almak için mesaj taslağı oluştur"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Bilgi Al</span>
                      </a>

                      <Link
                        href={`/takim/${club.id}`}
                        prefetch={false}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary group-hover:underline"
                      >
                        <span>Detay & Maçlar</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bu İlçedeki Spor Salonları */}
        {districtVenues.length > 0 && (
          <div className="bg-surface rounded-2xl border border-line p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-base font-black text-ink">
                  {districtName} Bölgesi Spor Salonları
                </h2>
              </div>
              <span className="text-xs font-mono text-ink-3">
                {districtVenues.length} Tesis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {districtVenues.map((v) => (
                <div
                  key={v.id}
                  className="bg-surface-muted/60 rounded-xl p-4 border border-line space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-ink">{v.name}</h3>
                    <p className="text-xs text-ink-2 leading-relaxed">
                      {v.address}
                    </p>
                    {v.transit_info && (
                      <p className="text-[11px] text-ink-3">
                        🚌 {v.transit_info}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-line/60">
                    <span className="text-[11px] font-mono text-ink-3">
                      {v.capacity}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        v.maps_query || v.name
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Yol Tarifi Al</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diğer İlçelere Geçiş */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-black text-ink uppercase tracking-wider">
            {cityName} Diğer Voleybol İlçeleri
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {allDistricts
              .filter((d) => d.slug !== district && d.clubCount > 0)
              .map((d) => (
                <Link
                  key={d.slug}
                  href={`/kulupler/${normCity}/${d.slug}`}
                  prefetch={false}
                  className="px-2.5 py-1 rounded-lg bg-surface-muted hover:bg-surface-raised border border-line text-[11px] font-semibold text-ink-2 hover:text-ink transition-colors"
                >
                  {d.name} ({d.clubCount})
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
