import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Sparkles, Trophy, ArrowRight, ArrowLeft, HelpCircle, Compass, Users } from "lucide-react";
import { getAllGuides, getFeaturedGuides } from "@/data/guides";
import { GuideSearchFilter } from "@/components/guide/GuideSearchFilter";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Altyapı Voleybol Rehberi — Kurallar, Statüler ve Kılavuzlar",
  description:
    "TVF voleybol altyapı ligleri rehberi: Puan durumu ve averaj hesaplama, yaş kategorileri, file yükseklikleri, lisans çıkarma, Türkiye Şampiyonası statüsü ve şehir rehberleri.",
  keywords: [
    "voleybol rehberi",
    "voleybol kuralları",
    "voleybol puan durumu nasıl hesaplanır",
    "tvf altyapı yaş kategorileri",
    "voleybol averaj hesaplama",
    "voleybol lisansı çıkarma",
    "türkiye altyapı voleybol şampiyonası",
    "kadınlar 2 lig statüsü",
  ],
  openGraph: {
    title: "Altyapı Voleybol Rehberi — Kurallar, Statüler ve Kılavuzlar",
    description:
      "TVF voleybol altyapı ligleri rehberi: Puan durumu ve averaj hesaplama, yaş kategorileri, file yükseklikleri ve şehir rehberleri.",
    url: "https://altyapivoleybol.com.tr/rehber",
  },
};

export default function RehberPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";
  const allGuides = getAllGuides();
  const featuredGuides = getFeaturedGuides();

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: baseUrl },
          { name: "Voleybol Rehberi", url: `${baseUrl}/rehber` },
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
          <div className="flex items-center gap-3">
            <Link
              href="/hangi-ligde-oynar"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>Yaş Hesaplayıcı</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/kulupler"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-2 hover:text-ink transition-colors"
            >
              <span>Kulüpler</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Hero Başlık Alanı */}
        <div className="relative overflow-hidden bg-gradient-to-br from-surface via-surface to-primary/5 rounded-3xl border border-line p-6 sm:p-10 shadow-card space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>TVF Altyapı Voleybol Bilgi Bankası</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight max-w-3xl">
            Voleybol Rehberi & Kılavuzlar
          </h1>

          <p className="text-sm sm:text-base text-ink-2 max-w-2xl leading-relaxed">
            Puan durumu kurallarından yaş gruplarına, file boylarından lisans çıkarma adımlarına kadar sporcular, antrenörler ve veliler için kapsamlı altyapı kılavuzları.
          </p>

          {/* Hızlı Kısayol Rozetleri */}
          <div className="pt-2 flex flex-wrap gap-2">
            <Link
              href="/rehber/tvf-2026-2027-altyapi-faaliyet-programi-ve-kontenjanlari"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary transition-colors"
            >
              <span>📅 2026-2027 Faaliyet Programı & Kontenjanlar</span>
            </Link>
            <Link
              href="/rehber/puan-durumu-ve-averaj-hesaplama"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-canvas border border-line text-ink transition-colors"
            >
              <span>📊 Averaj Nasıl Hesaplanır?</span>
            </Link>
            <Link
              href="/rehber/tvf-altyapi-yas-kategorileri-ve-kurallari"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-canvas border border-line text-ink transition-colors"
            >
              <span>🏐 2026-2027 Yaş Grupları</span>
            </Link>
            <Link
              href="/rehber/kadinlar-2-lig-statu-ve-playoff"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-canvas border border-line text-ink transition-colors"
            >
              <span>🏆 Kadınlar 2. Lig Statüsü</span>
            </Link>
            <Link
              href="/rehber/voleybol-lisansi-nasil-cikarilir"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-canvas border border-line text-ink transition-colors"
            >
              <span>📝 Lisans Çıkarma Rehberi</span>
            </Link>
          </div>
        </div>

        {/* Öne Çıkan Rehberler Vitrini */}
        {featuredGuides.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-lg font-black text-ink">Öne Çıkan Temel Kılavuzlar</h2>
              </div>
              <span className="text-xs text-ink-3">En Çok Ziyaret Edilenler</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredGuides.slice(0, 3).map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/rehber/${guide.slug}`}
                  prefetch={false}
                  className="group relative overflow-hidden bg-surface hover:bg-surface-elevated rounded-2xl border border-line hover:border-primary/60 p-5 shadow-card transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {guide.category}
                    </span>
                    <h3 className="text-sm font-bold text-ink group-hover:text-primary transition-colors line-clamp-2">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-ink-2 line-clamp-2 leading-relaxed">
                      {guide.summary}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-line/60 flex items-center justify-between text-[11px] font-bold text-primary">
                    <span>İncele</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* İnteraktif Arama & Filtrelemeli Tüm Rehberler */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">Tüm Rehber ve Kılavuz Makaleleri</h2>
            <span className="text-xs font-mono text-ink-3">{allGuides.length} Kılavuz</span>
          </div>

          <GuideSearchFilter initialGuides={allGuides} />
        </div>

        {/* Alt Bilgi & Araçlar Köprüsü */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-line">
          <Link
            href="/hangi-ligde-oynar"
            prefetch={false}
            className="p-4 rounded-2xl bg-surface border border-line hover:border-primary/50 transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Yaş Kategorisi Hesaplayıcı</div>
              <div className="text-[11px] text-ink-2">Doğum yılına göre resmi ligini bul</div>
            </div>
          </Link>

          <Link
            href="/kulupler"
            prefetch={false}
            className="p-4 rounded-2xl bg-surface border border-line hover:border-primary/50 transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">81 İl Kulüpler Rehberi</div>
              <div className="text-[11px] text-ink-2">Tüm tescilli altyapı kulüpleri</div>
            </div>
          </Link>

          <Link
            href="/puan-durumu"
            prefetch={false}
            className="p-4 rounded-2xl bg-surface border border-line hover:border-primary/50 transition-colors flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Canlı Puan Durumu</div>
              <div className="text-[11px] text-ink-2">Yerel lig sıralamaları ve averajlar</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
