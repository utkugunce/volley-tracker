import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LeagueFinderWidget } from "@/components/LeagueFinderWidget";
import { FaqJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { Trophy, HelpCircle, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Çocuğum Hangi Voleybol Liginde Oynar? — 2026-2027 TVF Yaş Kategorileri",
  description:
    "Doğum yılı ve cinsiyete göre 2026-2027 sezonu resmi TVF voleybol yaş kategorisini (Mini, Midi, Küçük, Yıldız, Genç), file yüksekliğini, top ölçüsünü ve kulüpleri anında öğrenin.",
  keywords: [
    "voleybol hangi kategorideyim",
    "voleybol yaş grupları 2026",
    "mini voleybol doğum yılı",
    "midi voleybol kaç yaş",
    "küçük kızlar voleybol doğum yılı",
    "voleybol file yükseklikleri",
    "tvf altyapı kategorileri",
  ],
  openGraph: {
    title: "Çocuğum Hangi Voleybol Liginde Oynar? — Voleybol Kategori Hesaplayıcı",
    description:
      "TVF resmi altyapı yaş grupları, file boyları ve kuralları. Doğum yılına göre anında lig ve kategori sorgulama.",
    url: "https://altyapivoleybol.com.tr/hangi-ligde-oynar",
  },
};

const FAQ_ITEMS = [
  {
    question: "TVF altyapı liglerinde yaş kategorileri nasıl belirlenir?",
    answer:
      "Türkiye Voleybol Federasyonu (TVF) altyapı liglerinde kategoriler sporcunun tam gün ve ayına göre değil, doğum yılına göre belirlenir. 2026-2027 sezonunda geçerli yaş aralıkları: Mini Voleybol: 2016-2017 doğumlular, Midi Voleybol: 2014-2015 doğumlular, Küçükler: 2012-2013 doğumlular, Yıldızlar: 2010-2011 doğumlular, Gençler: 2008-2009 doğumlular.",
  },
  {
    question: "Midi Voleybolda libero oynar mı?",
    answer:
      "Hayır, TVF resmi talimatlarına göre Midi Voleybol (11-12 yaş) kategorisinde libero kuralı uygulanmaz. Bu yaş grubundaki tüm sporcuların servis atması, manşet karşılaması ve savunma yapması zorunludur. Libero kuralı Küçükler (13-14 yaş) kategorisinden itibaren başlar.",
  },
  {
    question: "Resmi liglerde file yüksekliği kaç metredir?",
    answer:
      "Mini Voleybolda file yüksekliği kız ve erkek ortak 2.00 metredir. Midi Voleybolda kızlar 2.10m, erkekler 2.15m'dir. Küçüklerde kızlar 2.15m, erkekler 2.24m'dir. Yıldızlarda kızlar 2.24m, erkekler 2.35m'dir. Gençlerde ise kızlar 2.24m, erkekler 2.43m (Büyükler standardı) file yüksekliğinde oynar.",
  },
  {
    question: "Puan durumu ve averaj nasıl hesaplanır?",
    answer:
      "TVF resmi lig statüsünde 3-2-1-0 puan baremi geçerlidir: 3-0 ve 3-1 galibiyetlere 3 puan, 3-2 galibiyete 2 puan, 2-3 mağlubiyete 1 puan, 1-3 ve 0-3 mağlubiyetlere 0 puan verilir. Puan eşitliğinde sırasıyla galibiyet sayısı, Set Averajı (Alınan Set / Verilen Set) ve Sayı Averajı (Alınan Sayı / Verilen Sayı) dikkate alınır.",
  },
];

export default function HangiLigdeOynarPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <FaqJsonLd items={FAQ_ITEMS} />
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: baseUrl },
          { name: "Hangi Ligde Oynar?", url: `${baseUrl}/hangi-ligde-oynar` },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 flex-1">
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
            href="/kulupler"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Voleybol Kulüpleri Rehberi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* İnteraktif Araç Bileşeni */}
        <LeagueFinderWidget />

        {/* 2026-2027 Resmi TVF Altyapı Tablosu */}
        <div className="bg-surface rounded-2xl border border-line p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-ink">
                2026-2027 TVF Resmi Yaş Kategorileri Özeti
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-muted text-ink-2 border border-line">
              Resmi Federasyon Standardı
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-surface-muted text-ink-2 uppercase font-extrabold text-[11px] border-b border-line">
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Doğum Yılları</th>
                  <th className="py-3 px-3">Yaş Aralığı</th>
                  <th className="py-3 px-3">File Boyu (Kız)</th>
                  <th className="py-3 px-3">File Boyu (Erkek)</th>
                  <th className="py-3 px-3">Top No</th>
                  <th className="py-3 px-3">Libero</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink font-medium">
                <tr className="hover:bg-surface-raised transition-colors">
                  <td className="py-3 px-3 font-bold text-ink">Mini Voleybol</td>
                  <td className="py-3 px-3 font-mono">2016 - 2017</td>
                  <td className="py-3 px-3">9 - 10 Yaş</td>
                  <td className="py-3 px-3">2.00 m</td>
                  <td className="py-3 px-3">2.00 m</td>
                  <td className="py-3 px-3">4 No (Hafif)</td>
                  <td className="py-3 px-3 text-ink-3">Yok</td>
                </tr>
                <tr className="hover:bg-surface-raised transition-colors">
                  <td className="py-3 px-3 font-bold text-ink">Midi Voleybol</td>
                  <td className="py-3 px-3 font-mono">2014 - 2015</td>
                  <td className="py-3 px-3">11 - 12 Yaş</td>
                  <td className="py-3 px-3 font-semibold text-primary">2.10 m</td>
                  <td className="py-3 px-3 font-semibold text-sky-400">2.15 m</td>
                  <td className="py-3 px-3">4 No Standart</td>
                  <td className="py-3 px-3 text-ink-3">Yok</td>
                </tr>
                <tr className="hover:bg-surface-raised transition-colors">
                  <td className="py-3 px-3 font-bold text-ink">Küçükler</td>
                  <td className="py-3 px-3 font-mono">2012 - 2013</td>
                  <td className="py-3 px-3">13 - 14 Yaş</td>
                  <td className="py-3 px-3 font-semibold text-primary">2.15 m</td>
                  <td className="py-3 px-3 font-semibold text-sky-400">2.24 m</td>
                  <td className="py-3 px-3">5 No Maç Topu</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">Var (Serbest)</td>
                </tr>
                <tr className="hover:bg-surface-raised transition-colors">
                  <td className="py-3 px-3 font-bold text-ink">Yıldızlar</td>
                  <td className="py-3 px-3 font-mono">2010 - 2011</td>
                  <td className="py-3 px-3">15 - 16 Yaş</td>
                  <td className="py-3 px-3 font-semibold text-primary">2.24 m</td>
                  <td className="py-3 px-3 font-semibold text-sky-400">2.35 m</td>
                  <td className="py-3 px-3">5 No Maç Topu</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">Var</td>
                </tr>
                <tr className="hover:bg-surface-raised transition-colors">
                  <td className="py-3 px-3 font-bold text-ink">Gençler</td>
                  <td className="py-3 px-3 font-mono">2008 - 2009</td>
                  <td className="py-3 px-3">17 - 18 Yaş</td>
                  <td className="py-3 px-3 font-semibold text-primary">2.24 m</td>
                  <td className="py-3 px-3 font-semibold text-sky-400">2.43 m</td>
                  <td className="py-3 px-3">5 No Maç Topu</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">Var</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sık Sorulan Sorular */}
        <div className="bg-surface rounded-2xl border border-line p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black text-ink">
              Altyapı Ligleri & Lisans Hakkında Sıkça Sorulanlar
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="bg-surface-muted/60 p-4 rounded-xl border border-line space-y-1.5"
              >
                <h3 className="text-sm font-bold text-ink">
                  {item.question}
                </h3>
                <p className="text-xs text-ink-2 leading-relaxed font-normal">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
