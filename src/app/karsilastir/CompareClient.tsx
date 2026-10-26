"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { TeamBadge } from "@/components/TeamBadge";
import { useRouter } from "next/navigation";
import {
  Swords,
  ChevronLeft,
  ArrowRightLeft,
  Calendar,
  ExternalLink,
  Share2,
  Check,
  AlertCircle,
  Activity,
  ChevronRight,
} from "lucide-react";
import { TeamListItem, HeadToHeadComparison } from "@/utils/teamData";
import { FormBadge } from "@/components/FormBadge";
import { VolleyMatchRow } from "@/components/match/VolleyMatchRow";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import type { CompareStatsData } from "@/utils/compareStats";
import { CompareStatsTable } from "@/components/stats/CompareStatsTable";
import { T } from "@/components/T";
import { SettingsControls } from "@/components/SettingsControls";

interface CompareClientProps {
  teamsList: TeamListItem[];
  initialSlug1?: string;
  initialSlug2?: string;
  comparison?: HeadToHeadComparison | null;
  statsData?: CompareStatsData | null;
}

export const CompareClient: React.FC<CompareClientProps> = ({
  teamsList,
  initialSlug1 = "",
  initialSlug2 = "",
  comparison,
  statsData,
}) => {
  const router = useRouter();
  const [slug1, setSlug1] = useState(initialSlug1);
  const [slug2, setSlug2] = useState(initialSlug2);
  const [copied, setCopied] = useState(false);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");

  const handleApply = (newSlug1: string, newSlug2: string) => {
    setSlug1(newSlug1);
    setSlug2(newSlug2);
    const params = new URLSearchParams();
    if (newSlug1) params.set("takim1", newSlug1);
    if (newSlug2) params.set("takim2", newSlug2);
    router.push(`/karsilastir?${params.toString()}`);
  };

  const handleSwap = () => {
    handleApply(slug2, slug1);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredTeams1 = useMemo(() => {
    if (!search1.trim()) return teamsList;
    const q = trLower(search1).trim();
    return teamsList.filter(
      (t) => trIncludes(t.name, q) || trIncludes(t.city, q)
    );
  }, [teamsList, search1]);

  const filteredTeams2 = useMemo(() => {
    if (!search2.trim()) return teamsList;
    const q = trLower(search2).trim();
    return teamsList.filter(
      (t) => trIncludes(t.name, q) || trIncludes(t.city, q)
    );
  }, [teamsList, search2]);

  const quickMatchups = [
    { name1: "Fenerbahçe", slug1: "fenerbahce", name2: "VakıfBank", slug2: "vakifbank" },
    { name1: "Eczacıbaşı", slug1: "eczacibasi", name2: "Galatasaray", slug2: "galatasaray" },
    { name1: "THY", slug1: "thy", name2: "VakıfBank", slug2: "vakifbank" },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans pb-16">
      {/* 1. ÜST NAVİGASYON */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line/70">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link
            prefetch={false}
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-white bg-surface-muted/70 hover:bg-surface-muted px-3 py-1.5 rounded-lg border border-line/70 transition-colors"
          >
            <ChevronLeft size={15} />
            <span>
              <T k="common.home" />
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <SettingsControls />
            {slug1 && slug2 && (
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-white bg-surface-muted/70 hover:bg-surface-muted border border-line/70 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                title="Karşılaştırma linkini kopyala"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                <span>{copied ? "Kopyalandı!" : "Paylaş"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* 2. SAYFA BAŞLIĞI VE TAKIM SEÇİCİ BÖLÜMÜ */}
        <section className="bg-surface border border-line/70 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30">
              <Swords size={19} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                İki Takım Karşılaştırma (Head-to-Head)
              </h1>
            </div>
          </div>

          {/* Hızlı Eşleşmeler */}
          <div className="mt-4 pt-4 border-t border-line/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink-3 font-medium">Popüler Karşılaştırmalar:</span>
            {quickMatchups.map((m, idx) => (
              <button
                key={idx}
                onClick={() => handleApply(m.slug1, m.slug2)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-muted/70 hover:bg-surface-muted text-ink-2 hover:text-white border border-line/60 transition-colors cursor-pointer"
              >
                <span>{m.name1}</span>
                <span className="text-primary font-semibold">vs</span>
                <span>{m.name2}</span>
              </button>
            ))}
          </div>

          {/* İki Takım Dropdown / Seçici */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-3">
            {/* 1. Takım Seçimi */}
            <div className="space-y-1.5">
              <label htmlFor="team1-select" className="block text-xs font-semibold text-ink-2">
                1. Takım
              </label>
              <input
                type="search"
                value={search1}
                onChange={(e) => setSearch1(e.target.value)}
                placeholder="1. takımı veya ili filtrele..."
                aria-label="Birinci takım listesini filtrele"
                className="w-full bg-surface-muted/80 border border-line/70 text-white placeholder:text-ink-3 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 transition-colors"
              />
              <select
                id="team1-select"
                value={slug1}
                onChange={(e) => handleApply(e.target.value, slug2)}
                aria-label="Birinci takımı seçin"
                className="w-full bg-surface-muted border border-line/70 text-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">Takım seçin... ({filteredTeams1.length})</option>
                {filteredTeams1.map((t) => (
                  <option key={`t1-${t.slug}`} value={t.slug}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Değiştir (Swap) Butonu */}
            <div className="flex justify-center pt-2 md:pt-5">
              <button
                onClick={handleSwap}
                disabled={!slug1 && !slug2}
                aria-label="Takımların yerini değiştir"
                title="Takımları yer değiştir"
                className="p-2.5 rounded-xl bg-surface-muted hover:bg-panel text-ink-2 hover:text-white border border-line/70 transition-colors cursor-pointer disabled:opacity-40"
              >
                <ArrowRightLeft size={16} />
              </button>
            </div>

            {/* 2. Takım Seçimi */}
            <div className="space-y-1.5">
              <label htmlFor="team2-select" className="block text-xs font-semibold text-ink-2">
                2. Takım (Rakip)
              </label>
              <input
                type="search"
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
                placeholder="2. takımı veya ili filtrele..."
                aria-label="İkinci takım listesini filtrele"
                className="w-full bg-surface-muted/80 border border-line/70 text-white placeholder:text-ink-3 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 transition-colors"
              />
              <select
                id="team2-select"
                value={slug2}
                onChange={(e) => handleApply(slug1, e.target.value)}
                aria-label="İkinci takımı seçin"
                className="w-full bg-surface-muted border border-line/70 text-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">Rakip takım seçin... ({filteredTeams2.length})</option>
                {filteredTeams2.map((t) => (
                  <option key={`t2-${t.slug}`} value={t.slug}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 3. KARŞILAŞTIRMA SONUÇLARI */}
        {comparison ? (
          <>
            {/* Karşılaşma Kartı Banner */}
            <section className="bg-surface border border-line/70 rounded-2xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-6 text-center">
                {/* 1. Takım */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center mb-3">
                    <TeamBadge
                      name={comparison.team1.teamName}
                      size="xl"
                      className="!w-20 !h-20 sm:!w-24 sm:!h-24 text-2xl sm:text-3xl"
                    />
                  </div>
                  <Link
                    prefetch={false}
                    href={`/takim/${comparison.team1.slug}`}
                    className="text-lg sm:text-xl font-bold text-white hover:text-primary transition-colors flex items-center gap-1.5 justify-center"
                  >
                    <span>{comparison.team1.teamName}</span>
                    <ExternalLink size={14} className="text-ink-3" />
                  </Link>
                  <span className="text-xs text-ink-3 mt-0.5">{comparison.team1.city}</span>
                  <div className="mt-2.5 flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-ink-3">Son Form</span>
                    <FormBadge matches={comparison.team1.form} />
                  </div>
                </div>

                {/* VS Rozeti & Özet Skor */}
                <div className="flex flex-col items-center justify-center px-4 py-2">
                  <div className="w-11 h-11 rounded-xl bg-surface-muted border border-line/70 flex items-center justify-center text-ink-2 font-bold text-xs font-mono mb-2">
                    VS
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-white">
                    <span className="text-primary">{comparison.summary.team1Wins}</span>
                    <span className="text-ink-3 mx-2">-</span>
                    <span className="text-selected-text">{comparison.summary.team2Wins}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-ink-3 mt-1 uppercase tracking-wider">
                    {comparison.summary.totalMatches} Maç
                  </span>
                </div>

                {/* 2. Takım */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center mb-3">
                    <TeamBadge
                      name={comparison.team2.teamName}
                      size="xl"
                      className="!w-20 !h-20 sm:!w-24 sm:!h-24 text-2xl sm:text-3xl"
                    />
                  </div>
                  <Link
                    prefetch={false}
                    href={`/takim/${comparison.team2.slug}`}
                    className="text-lg sm:text-xl font-bold text-white hover:text-primary transition-colors flex items-center gap-1.5 justify-center"
                  >
                    <span>{comparison.team2.teamName}</span>
                    <ExternalLink size={14} className="text-ink-3" />
                  </Link>
                  <span className="text-xs text-ink-3 mt-0.5">{comparison.team2.city}</span>
                  <div className="mt-2.5 flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-ink-3">Son Form</span>
                    <FormBadge matches={comparison.team2.form} />
                  </div>
                </div>
              </div>

              {/* Set Oranı Çubuğu */}
              <div className="mt-6 pt-4 border-t border-line/60 max-w-md mx-auto">
                <div className="flex justify-between text-xs font-semibold text-ink-3 mb-1.5 font-mono tabular-nums">
                  <span>{comparison.summary.team1SetsWon} Kazanılan Set</span>
                  <span className="font-sans">Toplam Set</span>
                  <span>{comparison.summary.team2SetsWon} Kazanılan Set</span>
                </div>
                {comparison.summary.team1SetsWon + comparison.summary.team2SetsWon > 0 ? (
                  <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden flex gap-0.5">
                    <div
                      style={{
                        width: `${
                          (comparison.summary.team1SetsWon /
                            (comparison.summary.team1SetsWon + comparison.summary.team2SetsWon)) *
                          100
                        }%`,
                      }}
                      className="bg-primary transition-all"
                    />
                    <div
                      style={{
                        width: `${
                          (comparison.summary.team2SetsWon /
                            (comparison.summary.team1SetsWon + comparison.summary.team2SetsWon)) *
                          100
                        }%`,
                      }}
                      className="bg-selected transition-all"
                    />
                  </div>
                ) : (
                  <div className="w-full h-2 bg-surface-muted rounded-full" />
                )}
              </div>
            </section>

            {/* GÜÇ DENGESİ & RADAR İSTATİSTİK KARŞILAŞTIRMASI */}
            <section className="bg-surface border border-line/70 rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line/60 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-surface-muted border border-line/70 flex items-center justify-center text-primary">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                      Güç Dengesi & Performans Radarı
                    </h2>
                    <p className="text-[11px] text-ink-3">5 Boyutlu Güç Karşılaştırması</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="font-semibold text-primary truncate max-w-[120px]">{comparison.team1.teamName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-selected" />
                    <span className="font-semibold text-selected-text truncate max-w-[120px]">{comparison.team2.teamName}</span>
                  </div>
                </div>
              </div>

              {(() => {
                const t1WinRate =
                  comparison.team1.stats.played > 0
                    ? Math.round((comparison.team1.stats.wins / comparison.team1.stats.played) * 100)
                    : 50;
                const t2WinRate =
                  comparison.team2.stats.played > 0
                    ? Math.round((comparison.team2.stats.wins / comparison.team2.stats.played) * 100)
                    : 50;

                const t1FormWins = comparison.team1.form.filter((f) => f.result === "W").length;
                const t1FormRate = Math.round((t1FormWins / (comparison.team1.form.length || 1)) * 100);
                const t2FormWins = comparison.team2.form.filter((f) => f.result === "W").length;
                const t2FormRate = Math.round((t2FormWins / (comparison.team2.form.length || 1)) * 100);

                const t1SetSum =
                  (comparison.summary.team1SetsWon + 1) /
                  (comparison.summary.team1SetsWon + comparison.summary.team2SetsWon + 2);
                const t1SetRate = Math.round(t1SetSum * 100);
                const t2SetRate = 100 - t1SetRate;

                const h2hTotal = comparison.summary.team1Wins + comparison.summary.team2Wins;
                const t1H2hRate = h2hTotal > 0 ? Math.round((comparison.summary.team1Wins / h2hTotal) * 100) : 50;
                const t2H2hRate = h2hTotal > 0 ? 100 - t1H2hRate : 50;

                const t1PtsRate = Math.min(
                  100,
                  Math.round(((comparison.team1.stats.wins * 3) / ((comparison.team1.stats.played || 1) * 3)) * 100)
                );
                const t2PtsRate = Math.min(
                  100,
                  Math.round(((comparison.team2.stats.wins * 3) / ((comparison.team2.stats.played || 1) * 3)) * 100)
                );

                const t1Metrics = [t1WinRate, t1FormRate, t1SetRate, t1H2hRate, t1PtsRate];
                const t2Metrics = [t2WinRate, t2FormRate, t2SetRate, t2H2hRate, t2PtsRate];

                const t1Score = Math.round(t1Metrics.reduce((a, b) => a + b, 0) / 5);
                const t2Score = Math.round(t2Metrics.reduce((a, b) => a + b, 0) / 5);

                const center = 100;
                const maxR = 75;
                const axesLabels = ["Galibiyet", "Form (Son 5)", "Set Oranı", "H2H Üstünlük", "Puan Gücü"];

                const getPolygon = (vals: number[]) => {
                  return vals
                    .map((val, idx) => {
                      const clamped = Math.max(15, Math.min(100, val));
                      const r = (clamped / 100) * maxR;
                      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
                      const x = center + r * Math.cos(angle);
                      const y = center + r * Math.sin(angle);
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(" ");
                };

                const getWebPolygon = (percent: number) => {
                  return [0, 1, 2, 3, 4]
                    .map((idx) => {
                      const r = percent * maxR;
                      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
                      const x = center + r * Math.cos(angle);
                      const y = center + r * Math.sin(angle);
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(" ");
                };

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
                      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
                          {[0.25, 0.5, 0.75, 1.0].map((level) => (
                            <polygon
                              key={level}
                              points={getWebPolygon(level)}
                              fill="none"
                              stroke="#1B3550"
                              strokeWidth="1"
                              strokeDasharray={level < 1.0 ? "2,2" : undefined}
                              opacity="0.6"
                            />
                          ))}

                          {[0, 1, 2, 3, 4].map((idx) => {
                            const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
                            const x2 = center + maxR * Math.cos(angle);
                            const y2 = center + maxR * Math.sin(angle);
                            return (
                              <line
                                key={idx}
                                x1={center}
                                y1={center}
                                x2={x2}
                                y2={y2}
                                stroke="#2A4560"
                                strokeWidth="1"
                                opacity="0.5"
                              />
                            );
                          })}

                          <polygon
                            points={getPolygon(t1Metrics)}
                            fill="rgba(255, 107, 44, 0.25)"
                            stroke="#FF6B2C"
                            strokeWidth="2"
                            className="transition-all duration-700"
                          />

                          <polygon
                            points={getPolygon(t2Metrics)}
                            fill="rgba(127, 180, 255, 0.25)"
                            stroke="#7FB4FF"
                            strokeWidth="2"
                            className="transition-all duration-700"
                          />

                          {axesLabels.map((lbl, idx) => {
                            const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
                            const r = maxR + 18;
                            const x = center + r * Math.cos(angle);
                            const y = center + r * Math.sin(angle);
                            return (
                              <text
                                key={idx}
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#94A3B8"
                                fontSize="9"
                                fontWeight="bold"
                              >
                                {lbl}
                              </text>
                            );
                          })}
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-canvas/95 border border-line px-2.5 py-1 rounded-xl text-center flex items-center gap-1.5 font-mono tabular-nums text-xs font-bold">
                            <span className="text-primary">{t1Score}</span>
                            <span className="text-ink-3">vs</span>
                            <span className="text-selected-text">{t2Score}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-6 space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between font-semibold text-ink-2 mb-1">
                          <span className="text-primary font-mono tabular-nums font-bold">
                            %{t1WinRate} ({comparison.team1.stats.wins}G / {comparison.team1.stats.played}M)
                          </span>
                          <span className="text-ink-3 font-medium">Sezon Galibiyet Oranı</span>
                          <span className="text-selected-text font-mono tabular-nums font-bold">
                            %{t2WinRate} ({comparison.team2.stats.wins}G / {comparison.team2.stats.played}M)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden flex gap-0.5">
                          <div
                            style={{ width: `${Math.round((t1WinRate / (t1WinRate + t2WinRate || 1)) * 100)}%` }}
                            className="bg-primary transition-all duration-500"
                          />
                          <div
                            style={{ width: `${100 - Math.round((t1WinRate / (t1WinRate + t2WinRate || 1)) * 100)}%` }}
                            className="bg-selected transition-all duration-500"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold text-ink-2 mb-1">
                          <span className="text-primary font-mono tabular-nums font-bold">
                            %{t1FormRate} ({t1FormWins}/5)
                          </span>
                          <span className="text-ink-3 font-medium">Son 5 Maç Form Gücü</span>
                          <span className="text-selected-text font-mono tabular-nums font-bold">
                            %{t2FormRate} ({t2FormWins}/5)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden flex gap-0.5">
                          <div
                            style={{ width: `${Math.round((t1FormRate / (t1FormRate + t2FormRate || 1)) * 100)}%` }}
                            className="bg-primary transition-all duration-500"
                          />
                          <div
                            style={{ width: `${100 - Math.round((t1FormRate / (t1FormRate + t2FormRate || 1)) * 100)}%` }}
                            className="bg-selected transition-all duration-500"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold text-ink-2 mb-1">
                          <span className="text-primary font-mono tabular-nums font-bold">
                            {comparison.summary.team1SetsWon} Set
                          </span>
                          <span className="text-ink-3 font-medium">H2H Set Üstünlüğü</span>
                          <span className="text-selected-text font-mono tabular-nums font-bold">
                            {comparison.summary.team2SetsWon} Set
                          </span>
                        </div>
                        <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden flex gap-0.5">
                          <div style={{ width: `${t1SetRate}%` }} className="bg-primary transition-all duration-500" />
                          <div style={{ width: `${t2SetRate}%` }} className="bg-selected transition-all duration-500" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold text-ink-2 mb-1">
                          <span className="text-primary font-mono tabular-nums font-bold">
                            {comparison.summary.team1Wins} Galibiyet
                          </span>
                          <span className="text-ink-3 font-medium">Aralarındaki Maçlar</span>
                          <span className="text-selected-text font-mono tabular-nums font-bold">
                            {comparison.summary.team2Wins} Galibiyet
                          </span>
                        </div>
                        <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden flex gap-0.5">
                          <div style={{ width: `${t1H2hRate}%` }} className="bg-primary transition-all duration-500" />
                          <div style={{ width: `${t2H2hRate}%` }} className="bg-selected transition-all duration-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* 3b. YAN YANA SEZON İSTATİSTİKLERİ */}
            {statsData && (
              <CompareStatsTable
                data={statsData}
                name1={comparison.team1.teamName}
                name2={comparison.team2.teamName}
              />
            )}

            {/* 4. ARALARINDAKİ MAÇLAR (H2H — Standart VolleyMatchRow) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar size={17} className="text-primary" />
                  <span>Aralarındaki Maçlar ({comparison.matches.length})</span>
                </h2>
              </div>

              {comparison.matches.length === 0 ? (
                <div className="bg-surface border border-line/70 rounded-2xl p-6 text-center">
                  <AlertCircle size={26} className="mx-auto text-amber-400 mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-white">
                    Bu takımlar bu sezon henüz karşılaşmadı
                  </p>
                  <p className="text-xs text-ink-3 mt-1 max-w-md mx-auto">
                    {comparison.isSameGroup
                      ? "Aynı grupta yer alıyorlar ancak fikstürdeki maçları henüz oynanmamış olabilir."
                      : "Bu takımlar bu sezon aynı grupta yer almıyor — aralarındaki maç bulunamadı."}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-surface border border-line/70 divide-y divide-line/50 overflow-hidden">
                  {comparison.matches.map((m) => (
                    <div key={m.id}>
                      <VolleyMatchRow
                        match={{
                          id: m.id,
                          date: m.date,
                          time: m.time || "",
                          hall: m.hall || "",
                          category: m.category || "",
                          age_group: "",
                          gender: "Kız",
                          group: "",
                          match_no: "",
                          home_team: m.homeTeam,
                          away_team: m.awayTeam,
                          home_score: m.homeScore ?? null,
                          away_score: m.awayScore ?? null,
                          set_scores: m.setScores,
                          status: m.status,
                        }}
                        leagueLabel={m.category}
                        showHall={true}
                      />
                      {m.setScores && m.setScores.length > 0 && (
                        <div className="px-3.5 py-1 text-[11px] font-mono text-ink-3 bg-surface-raised/20 border-t border-line/30">
                          Setler: {m.setScores.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 5. YAN YANA PUAN DURUMU İSTATİSTİKLERİ */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity size={17} className="text-primary" />
                  <span>Puan Durumu İstatistikleri</span>
                </h2>
                {comparison.isSameGroup ? (
                  <span className="text-xs font-semibold text-done bg-done/10 border border-done/30 px-2.5 py-0.5 rounded-full">
                    Aynı Gruptalar: {comparison.sharedGroup?.groupName}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    Farklı Gruplar / Ligler
                  </span>
                )}
              </div>

              {!comparison.isSameGroup && (
                <div className="bg-surface border border-line/70 rounded-xl p-3.5 text-xs text-ink-2 flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Bu takımlar bu sezon aynı grupta yer almıyor — aralarındaki maç bulunamadı veya farklı kategorilerde yarışıyorlar. Aşağıda her iki takımın kendi gruplarındaki güncel performansları yer almaktadır.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[comparison.team1, comparison.team2].map((tm, teamIdx) => (
                  <div key={teamIdx} className="bg-surface border border-line/70 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-line/60 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{tm.teamName}</h3>
                        <span className="text-xs text-ink-3">{tm.city}</span>
                      </div>
                      <Link
                        prefetch={false}
                        href={`/takim/${tm.slug}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Profil</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>

                    {tm.standingsContexts.length > 0 ? (
                      <div className="space-y-2.5">
                        {tm.standingsContexts.map((ctx, idx) => {
                          const row = ctx.standingRow;
                          return (
                            <div key={idx} className="bg-surface-muted/50 rounded-xl p-3.5 border border-line/60">
                              <div className="text-xs font-semibold text-ink mb-2">
                                {ctx.category} • {ctx.groupName}
                              </div>
                              <div className="grid grid-cols-6 gap-2 text-center text-xs font-mono tabular-nums">
                                <div>
                                  <div className="text-ink-3 text-[10px] font-sans">Sıra</div>
                                  <div className="font-bold text-white mt-0.5">#{row.rank}</div>
                                </div>
                                <div>
                                  <div className="text-ink-3 text-[10px] font-sans">O</div>
                                  <div className="font-bold text-white mt-0.5">{row.played}</div>
                                </div>
                                <div>
                                  <div className="text-ink-3 text-[10px] font-sans">G</div>
                                  <div className="font-bold text-done mt-0.5">{row.won}</div>
                                </div>
                                <div>
                                  <div className="text-ink-3 text-[10px] font-sans">M</div>
                                  <div className="font-bold text-form-loss mt-0.5">{row.lost}</div>
                                </div>
                                <div>
                                  <div className="text-ink-3 text-[10px] font-sans">Set</div>
                                  <div className="font-bold text-ink mt-0.5">
                                    {row.sets_won}:{row.sets_lost}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-ink-3 text-[10px] font-sans">Puan</div>
                                  <div className="font-bold text-primary mt-0.5">{row.points}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-ink-3">Bu takım için puan durumu verisi açıklanmamış.</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="bg-surface border border-line/70 rounded-2xl p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-muted border border-line/70 flex items-center justify-center mx-auto text-primary">
              <Swords size={28} />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-base font-bold text-white">Karşılaştırmak için İki Takım Seçin</h2>
              <p className="text-xs text-ink-3 mt-1">
                Yukarıdaki açılır listelerden karşılaştırmak istediğiniz iki takımı seçerek aralarındaki geçmiş maçları, set skorlarını ve puan durumu tablosunu anında görüntüleyebilirsiniz.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
