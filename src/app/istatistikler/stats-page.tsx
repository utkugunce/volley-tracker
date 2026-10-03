import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, BarChart3, Flame, Percent, TrendingUp, Target, ShieldAlert } from "lucide-react";
import { getLeagueAnalytics } from "@/utils/leagueAnalyticsData";
import { MIN_WIN_STREAK, type LeagueAnalytics } from "@/utils/leagueAnalytics";
import { slugify } from "@/utils/slugify";
import { fmt } from "@/utils/formatStats";
import { FormChips, LeaderboardCard } from "@/components/stats/LeaderboardCard";
import { PlayoffSummary } from "@/components/stats/PlayoffSummary";
import { SettingsControls } from "@/components/SettingsControls";
import { T } from "@/components/T";

/**
 * Lig geneli analiz sayfası (/istatistikler ve /istatistikler/[kategori]).
 * Tamamen sunucu bileşenidir: istemciye JavaScript/JSON gönderilmez, ISR ile CDN'den servis edilir.
 */
const SITE_URL = "https://altyapivoleybol.com.tr";

export function categorySlug(category: string): string {
  return slugify(category);
}

/** Kategori adı ("Genç Kızlar Süper Lig") yol parçasından çözülür; bilinmeyen yol null döner. */
export function resolveCategory(analytics: LeagueAnalytics, slug?: string): string | null | undefined {
  if (!slug) return undefined; // "tümü"
  return analytics.categories.find((c) => categorySlug(c) === slug) ?? null;
}

export function getStatsStaticParams(): Array<{ kategori: string }> {
  return getLeagueAnalytics().categories.map((c) => ({ kategori: categorySlug(c) }));
}

export function buildStatsMetadata(slug?: string): Metadata {
  const analytics = getLeagueAnalytics();
  const category = resolveCategory(analytics, slug);
  if (category === null) {
    return { title: "İstatistik Bulunamadı", robots: { index: false, follow: true } };
  }
  const label = category ?? "Tüm Ligler";
  const lists = analytics.lists[category ?? "all"];
  const path = category ? `/istatistikler/${categorySlug(category)}` : "/istatistikler";
  const title = category ? `${category} İstatistikleri ve Analiz` : "Lig İstatistikleri ve Analiz";
  const description = `${label}: en uzun galibiyet serisi, en yüksek set oranı, en formda takımlar, en çok sayı atan ve yiyen takımlar ve play-off matematiği. ${lists.totals.teams} takım, ${lists.totals.finishedMatches} oynanmış maç üzerinden.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: { title, description, url: `${SITE_URL}${path}`, type: "website", locale: "tr_TR" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function StatsPageView({ slug }: { slug?: string }) {
  const analytics = getLeagueAnalytics();
  const category = resolveCategory(analytics, slug);
  if (category === null) notFound();

  const lists = analytics.lists[category ?? "all"];
  const showCategory = !category;
  const tabs: Array<{ label: string; href: string; active: boolean }> = [
    { label: "Tümü", href: "/istatistikler", active: !category },
    ...analytics.categories.map((c) => ({
      label: c,
      href: `/istatistikler/${categorySlug(c)}`,
      active: c === category,
    })),
  ];

  const noData =
    lists.longestWinStreaks.length === 0 &&
    lists.bestSetRatio.length === 0 &&
    lists.bestForm.length === 0 &&
    lists.topScoring.length === 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      <header className="sticky top-0 z-40 bg-surface-muted/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <ChevronLeft size={16} />
            <span><T k="common.home" /></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/karsilastir" className="text-xs font-bold text-primary hover:underline">
              <T k="stats.compareLink" />
            </Link>
            <SettingsControls />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <section className="bg-gradient-to-br from-canvas via-surface-muted to-panel border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {category ? `${category} İstatistikleri` : <T k="stats.title" />}
              </h1>
              <p className="text-xs text-slate-400">
                Resmi fikstür ve puan durumu verisinden hesaplanır; veri olmayan bölümler gösterilmez.
              </p>
            </div>
          </div>
          <nav aria-label="Lig kategorisi" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                prefetch={false}
                aria-current={t.active ? "page" : undefined}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  t.active
                    ? "bg-primary text-primary-fg border-primary"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/60 rounded-xl p-2.5">
              <dt className="text-[10px] text-slate-400">Takım</dt>
              <dd className="text-base font-black text-white tabular-nums">{lists.totals.teams}</dd>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2.5">
              <dt className="text-[10px] text-slate-400">Grup</dt>
              <dd className="text-base font-black text-white tabular-nums">{lists.totals.groups}</dd>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2.5">
              <dt className="text-[10px] text-slate-400">Oynanan Maç</dt>
              <dd className="text-base font-black text-white tabular-nums">{lists.totals.finishedMatches}</dd>
            </div>
          </dl>
        </section>

        {noData && (
          <p className="text-sm text-slate-400 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 text-center">
            Bu kategori için henüz yeterli maç verisi yok. Maçlar oynandıkça sıralamalar burada görünecek.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LeaderboardCard
            id="lb-streak"
            title="En Uzun Galibiyet Serisi"
            subtitle={`Sezon boyunca üst üste en çok galibiyet (en az ${MIN_WIN_STREAK})`}
            icon={<Flame size={16} />}
            entries={lists.longestWinStreaks}
            showCategory={showCategory}
            renderValue={(e) => `${e.value} galibiyet`}
            renderMeta={(e) =>
              e.extra?.active ? <span className="text-emerald-300 font-bold">Seri devam ediyor</span> : <>{e.played} maçta</>
            }
          />
          <LeaderboardCard
            id="lb-setratio"
            title="En Yüksek Set Oranı"
            subtitle="Alınan set / verilen set (en az 2 maç)"
            icon={<Percent size={16} />}
            entries={lists.bestSetRatio}
            showCategory={showCategory}
            renderValue={(e) => (e.value === null ? "MAX" : fmt(e.value, 3))}
            renderMeta={(e) => (
              <>
                {e.extra?.setsFor}–{e.extra?.setsAgainst} set • {e.played} maç
              </>
            )}
          />
          <LeaderboardCard
            id="lb-form"
            title="En Formda Takımlar"
            subtitle="Son 5 maçta toplanan lig puanı (en az 3 maç)"
            icon={<TrendingUp size={16} />}
            entries={lists.bestForm}
            showCategory={showCategory}
            renderValue={(e) => `${e.value}/${e.extra?.maxPoints} puan`}
            renderMeta={(e) => (e.form ? <FormChips results={e.form} /> : null)}
          />
          <LeaderboardCard
            id="lb-scoring"
            title="En Çok Sayı Atan"
            subtitle="Set başına ortalama atılan sayı (en az 2 maç, hükmen hariç)"
            icon={<Target size={16} />}
            entries={lists.topScoring}
            showCategory={showCategory}
            renderValue={(e) => fmt(e.value, 1)}
            renderMeta={(e) => (
              <>
                maç başına {fmt(e.extra?.perMatchFor as number | null, 1)} • {e.extra?.sets} set
              </>
            )}
          />
          <LeaderboardCard
            id="lb-conceding"
            title="En Çok Sayı Yiyen"
            subtitle="Set başına ortalama yenen sayı (en az 2 maç, hükmen hariç)"
            icon={<ShieldAlert size={16} />}
            entries={lists.topConceding}
            showCategory={showCategory}
            renderValue={(e) => fmt(e.value, 1)}
            renderMeta={(e) => (
              <>
                maç başına {fmt(e.extra?.perMatchAgainst as number | null, 1)} • {e.extra?.sets} set
              </>
            )}
          />
        </div>

        <PlayoffSummary playoff={lists.playoff} showCategory={showCategory} />

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Sıralamalar, puan durumu gruplarındaki takımlar ve bu gruplarda oynanmış maçlar üzerinden hesaplanır. Çok az maç oynamış
          takımların değerleri değişkendir; bu nedenle liste başına asgari maç sayısı uygulanır. Sayı ortalamaları yalnızca set skorları
          eksiksiz girilmiş, hükmen olmayan maçlardan hesaplanır.
        </p>
      </main>
    </div>
  );
}
