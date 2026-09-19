"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Swords,
  ChevronLeft,
  Trophy,
  ArrowRightLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Share2,
  Check,
  AlertCircle,
  Activity,
  ChevronRight,
} from "lucide-react";
import { TeamListItem, HeadToHeadComparison } from "@/utils/teamData";
import { FormBadge } from "@/components/FormBadge";

interface CompareClientProps {
  teamsList: TeamListItem[];
  initialSlug1?: string;
  initialSlug2?: string;
  comparison?: HeadToHeadComparison | null;
}

export const CompareClient: React.FC<CompareClientProps> = ({
  teamsList,
  initialSlug1 = "",
  initialSlug2 = "",
  comparison,
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

  // Filtrelenmiş takım listeleri
  const filteredTeams1 = useMemo(() => {
    if (!search1.trim()) return teamsList;
    const q = search1.toLowerCase().trim();
    return teamsList.filter(
      (t) => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q)
    );
  }, [teamsList, search1]);

  const filteredTeams2 = useMemo(() => {
    if (!search2.trim()) return teamsList;
    const q = search2.toLowerCase().trim();
    return teamsList.filter(
      (t) => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q)
    );
  }, [teamsList, search2]);

  const quickMatchups = [
    { name1: "Fenerbahçe", slug1: "fenerbahce", name2: "VakıfBank", slug2: "vakifbank" },
    { name1: "Eczacıbaşı", slug1: "eczacibasi", name2: "Galatasaray", slug2: "galatasaray" },
    { name1: "THY", slug1: "thy", name2: "VakıfBank", slug2: "vakifbank" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* 1. ÜST NAVİGASYON */}
      <header className="sticky top-0 z-40 bg-[#0b1325]/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Ana Sayfa</span>
          </Link>

          <div className="flex items-center gap-2">
            {slug1 && slug2 && (
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
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
        <section className="bg-gradient-to-br from-[#0f172a] via-[#0b1325] to-[#1e293b] border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Swords size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                İki Takım Karşılaştırma (Head-to-Head)
              </h1>
              <p className="text-xs text-slate-400">
                Aralarındaki geçmiş maçlar, skorlar ve yan yana lig puan durumu istatistikleri
              </p>
            </div>
          </div>

          {/* Hızlı Eşleşmeler */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Popüler Karşılaştırmalar:</span>
            {quickMatchups.map((m, idx) => (
              <button
                key={idx}
                onClick={() => handleApply(m.slug1, m.slug2)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <span>{m.name1}</span>
                <span className="text-amber-400 font-bold">vs</span>
                <span>{m.name2}</span>
              </button>
            ))}
          </div>

          {/* İki Takım Dropdown / Seçici */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-3">
            {/* 1. Takım Seçimi */}
            <div className="space-y-1.5">
              <label htmlFor="team1-select" className="block text-xs font-bold text-slate-300">
                1. Takım
              </label>
              <select
                id="team1-select"
                value={slug1}
                onChange={(e) => handleApply(e.target.value, slug2)}
                aria-label="Birinci takımı seçin"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Takım seçin...</option>
                {teamsList.map((t) => (
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
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                <ArrowRightLeft size={16} />
              </button>
            </div>

            {/* 2. Takım Seçimi */}
            <div className="space-y-1.5">
              <label htmlFor="team2-select" className="block text-xs font-bold text-slate-300">
                2. Takım (Rakip)
              </label>
              <select
                id="team2-select"
                value={slug2}
                onChange={(e) => handleApply(slug1, e.target.value)}
                aria-label="İkinci takımı seçin"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Rakip takım seçin...</option>
                {teamsList.map((t) => (
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
            <section className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-6 text-center">
                {/* 1. Takım */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center mb-3 drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]">
                    {comparison.team1.mapping?.local_logo || comparison.team1.mapping?.logo_url ? (
                      <Image
                        src={comparison.team1.mapping?.local_logo || comparison.team1.mapping?.logo_url || ""}
                        alt={comparison.team1.teamName}
                        width={112}
                        height={112}
                        className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
                        <Trophy size={44} className="text-primary/70" />
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/takim/${comparison.team1.slug}`}
                    className="text-lg sm:text-xl font-black text-white hover:text-primary transition-colors flex items-center gap-1.5 justify-center"
                  >
                    <span>{comparison.team1.teamName}</span>
                    <ExternalLink size={14} className="text-slate-400" />
                  </Link>
                  <span className="text-xs text-slate-400 mt-0.5">{comparison.team1.city}</span>
                  <div className="mt-2.5 flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Son Form</span>
                    <FormBadge matches={comparison.team1.form} />
                  </div>
                </div>

                {/* VS Rozeti & Özet Skor */}
                <div className="flex flex-col items-center justify-center px-4 py-2">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm mb-2 shadow-inner">
                    VS
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                    <span className="text-blue-400">{comparison.summary.team1Wins}</span>
                    <span className="text-slate-500 mx-2">-</span>
                    <span className="text-indigo-400">{comparison.summary.team2Wins}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                    {comparison.summary.totalMatches} Maç
                  </span>
                </div>

                {/* 2. Takım */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center mb-3 drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]">
                    {comparison.team2.mapping?.local_logo || comparison.team2.mapping?.logo_url ? (
                      <Image
                        src={comparison.team2.mapping?.local_logo || comparison.team2.mapping?.logo_url || ""}
                        alt={comparison.team2.teamName}
                        width={112}
                        height={112}
                        className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
                        <Trophy size={44} className="text-indigo-400/70" />
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/takim/${comparison.team2.slug}`}
                    className="text-lg sm:text-xl font-black text-white hover:text-primary transition-colors flex items-center gap-1.5 justify-center"
                  >
                    <span>{comparison.team2.teamName}</span>
                    <ExternalLink size={14} className="text-slate-400" />
                  </Link>
                  <span className="text-xs text-slate-400 mt-0.5">{comparison.team2.city}</span>
                  <div className="mt-2.5 flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Son Form</span>
                    <FormBadge matches={comparison.team2.form} />
                  </div>
                </div>
              </div>

              {/* Set Oranı Çubuğu */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 max-w-md mx-auto">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                  <span>{comparison.summary.team1SetsWon} Kazanılan Set</span>
                  <span className="text-slate-500">Toplam Set</span>
                  <span>{comparison.summary.team2SetsWon} Kazanılan Set</span>
                </div>
                {comparison.summary.team1SetsWon + comparison.summary.team2SetsWon > 0 ? (
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
                    <div
                      style={{
                        width: `${
                          (comparison.summary.team1SetsWon /
                            (comparison.summary.team1SetsWon + comparison.summary.team2SetsWon)) *
                          100
                        }%`,
                      }}
                      className="bg-blue-500 transition-all"
                    />
                    <div
                      style={{
                        width: `${
                          (comparison.summary.team2SetsWon /
                            (comparison.summary.team1SetsWon + comparison.summary.team2SetsWon)) *
                          100
                        }%`,
                      }}
                      className="bg-indigo-500 transition-all"
                    />
                  </div>
                ) : (
                  <div className="w-full h-2 bg-slate-800 rounded-full" />
                )}
              </div>
            </section>

            {/* GÜÇ DENGESİ & RADAR İSTATİSTİK KARŞILAŞTIRMASI */}
            <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-primary">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Güç Dengesi & Performans Radarı
                    </h2>
                    <p className="text-[11px] text-slate-400">Sofascore & Instat Tarzı 5 Boyutlu Güç Karşılaştırması</p>
                  </div>
                </div>
                {/* Lejant */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span className="font-bold text-sky-300 truncate max-w-[120px]">{comparison.team1.teamName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                    <span className="font-bold text-indigo-300 truncate max-w-[120px]">{comparison.team2.teamName}</span>
                  </div>
                </div>
              </div>

              {/* 5 Boyutlu Metriklerin Hesaplanması */}
              {(() => {
                // 1. Galibiyet Oranı
                const t1WinRate = comparison.team1.stats.played > 0
                  ? Math.round((comparison.team1.stats.wins / comparison.team1.stats.played) * 100)
                  : 50;
                const t2WinRate = comparison.team2.stats.played > 0
                  ? Math.round((comparison.team2.stats.wins / comparison.team2.stats.played) * 100)
                  : 50;

                // 2. Form Gücü (Son 5 Maç)
                const t1FormWins = comparison.team1.form.filter((f) => f.result === "W").length;
                const t1FormRate = Math.round((t1FormWins / (comparison.team1.form.length || 1)) * 100);
                const t2FormWins = comparison.team2.form.filter((f) => f.result === "W").length;
                const t2FormRate = Math.round((t2FormWins / (comparison.team2.form.length || 1)) * 100);

                // 3. Set Verimliliği (H2H + Sezon)
                const t1SetSum = (comparison.summary.team1SetsWon + 1) / (comparison.summary.team1SetsWon + comparison.summary.team2SetsWon + 2);
                const t1SetRate = Math.round(t1SetSum * 100);
                const t2SetRate = 100 - t1SetRate;

                // 4. Doğrudan Eşleşme (H2H Üstünlüğü)
                const h2hTotal = comparison.summary.team1Wins + comparison.summary.team2Wins;
                const t1H2hRate = h2hTotal > 0 ? Math.round((comparison.summary.team1Wins / h2hTotal) * 100) : 50;
                const t2H2hRate = h2hTotal > 0 ? 100 - t1H2hRate : 50;

                // 5. Puan Kapasitesi
                const t1PtsRate = Math.min(100, Math.round(((comparison.team1.stats.wins * 3) / ((comparison.team1.stats.played || 1) * 3)) * 100));
                const t2PtsRate = Math.min(100, Math.round(((comparison.team2.stats.wins * 3) / ((comparison.team2.stats.played || 1) * 3)) * 100));

                const t1Metrics = [t1WinRate, t1FormRate, t1SetRate, t1H2hRate, t1PtsRate];
                const t2Metrics = [t2WinRate, t2FormRate, t2SetRate, t2H2hRate, t2PtsRate];

                const t1Score = Math.round(t1Metrics.reduce((a, b) => a + b, 0) / 5);
                const t2Score = Math.round(t2Metrics.reduce((a, b) => a + b, 0) / 5);

                // Radar SVG Hesaplaması
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
                    {/* Sol / Orta: Radar Grafiği */}
                    <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
                      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
                          {/* Izgara Web Katmanları */}
                          {[0.25, 0.5, 0.75, 1.0].map((level) => (
                            <polygon
                              key={level}
                              points={getWebPolygon(level)}
                              fill="none"
                              stroke="#334155"
                              strokeWidth="1"
                              strokeDasharray={level < 1.0 ? "2,2" : undefined}
                              opacity="0.6"
                            />
                          ))}

                          {/* 5 Eksen Çizgileri */}
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
                                stroke="#475569"
                                strokeWidth="1"
                                opacity="0.5"
                              />
                            );
                          })}

                          {/* Takım 1 Poligonu (Sky Blue) */}
                          <polygon
                            points={getPolygon(t1Metrics)}
                            fill="rgba(56, 189, 248, 0.3)"
                            stroke="#38bdf8"
                            strokeWidth="2"
                            className="transition-all duration-700"
                          />

                          {/* Takım 2 Poligonu (Indigo) */}
                          <polygon
                            points={getPolygon(t2Metrics)}
                            fill="rgba(129, 140, 248, 0.3)"
                            stroke="#818cf8"
                            strokeWidth="2"
                            className="transition-all duration-700"
                          />

                          {/* Eksen Etiketleri */}
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
                                fill="#94a3b8"
                                fontSize="9"
                                fontWeight="bold"
                              >
                                {lbl}
                              </text>
                            );
                          })}
                        </svg>

                        {/* Merkez Güç Puanı Rozeti */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-slate-950/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-lg text-center flex items-center gap-1.5 font-mono text-xs font-black">
                            <span className="text-sky-400">{t1Score}</span>
                            <span className="text-slate-600">vs</span>
                            <span className="text-indigo-400">{t2Score}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sağ: Detaylı Karşılaştırma Barları */}
                    <div className="lg:col-span-6 space-y-4 text-xs">
                      {/* 1. Galibiyet Oranı */}
                      <div>
                        <div className="flex justify-between font-bold text-slate-300 mb-1">
                          <span className="text-sky-400 font-mono font-black">%{t1WinRate} ({comparison.team1.stats.wins}G / {comparison.team1.stats.played}M)</span>
                          <span className="text-slate-400 font-medium">Sezon Galibiyet Oranı</span>
                          <span className="text-indigo-400 font-mono font-black">%{t2WinRate} ({comparison.team2.stats.wins}G / {comparison.team2.stats.played}M)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/80">
                          <div style={{ width: `${Math.round((t1WinRate / (t1WinRate + t2WinRate || 1)) * 100)}%` }} className="bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-500" />
                          <div style={{ width: `${100 - Math.round((t1WinRate / (t1WinRate + t2WinRate || 1)) * 100)}%` }} className="bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500" />
                        </div>
                      </div>

                      {/* 2. Son 5 Maç Başarısı */}
                      <div>
                        <div className="flex justify-between font-bold text-slate-300 mb-1">
                          <span className="text-sky-400 font-mono font-black">%{t1FormRate} ({t1FormWins}/5)</span>
                          <span className="text-slate-400 font-medium">Son 5 Maç Form Gücü</span>
                          <span className="text-indigo-400 font-mono font-black">%{t2FormRate} ({t2FormWins}/5)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/80">
                          <div style={{ width: `${Math.round((t1FormRate / (t1FormRate + t2FormRate || 1)) * 100)}%` }} className="bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-500" />
                          <div style={{ width: `${100 - Math.round((t1FormRate / (t1FormRate + t2FormRate || 1)) * 100)}%` }} className="bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500" />
                        </div>
                      </div>

                      {/* 3. Set Verimliliği */}
                      <div>
                        <div className="flex justify-between font-bold text-slate-300 mb-1">
                          <span className="text-sky-400 font-mono font-black">{comparison.summary.team1SetsWon} Set</span>
                          <span className="text-slate-400 font-medium">H2H Set Üstünlüğü</span>
                          <span className="text-indigo-400 font-mono font-black">{comparison.summary.team2SetsWon} Set</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/80">
                          <div style={{ width: `${t1SetRate}%` }} className="bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500" />
                          <div style={{ width: `${t2SetRate}%` }} className="bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500" />
                        </div>
                      </div>

                      {/* 4. Doğrudan Galibiyet */}
                      <div>
                        <div className="flex justify-between font-bold text-slate-300 mb-1">
                          <span className="text-sky-400 font-mono font-black">{comparison.summary.team1Wins} Galibiyet</span>
                          <span className="text-slate-400 font-medium">Aralarındaki Maçlar</span>
                          <span className="text-indigo-400 font-mono font-black">{comparison.summary.team2Wins} Galibiyet</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/80">
                          <div style={{ width: `${t1H2hRate}%` }} className="bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-500" />
                          <div style={{ width: `${t2H2hRate}%` }} className="bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* 4. ARALARINDAKİ MAÇLAR (H2H) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  <span>Aralarındaki Maçlar ({comparison.matches.length})</span>
                </h2>
              </div>

              {comparison.matches.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 text-center">
                  <AlertCircle size={28} className="mx-auto text-amber-400 mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-300">
                    Bu takımlar bu sezon henüz karşılaşmadı
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    {comparison.isSameGroup
                      ? "Aynı grupta yer alıyorlar ancak fikstürdeki maçları henüz oynanmamış olabilir."
                      : "Bu takımlar bu sezon aynı grupta yer almıyor — aralarındaki maç bulunamadı."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {comparison.matches.map((m) => {
                    const isFinished = m.status === "finished";
                    return (
                      <div
                        key={m.id}
                        className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Tarih & Salon */}
                          <div className="text-xs text-slate-400">
                            <div className="font-bold text-slate-300 font-mono">
                              {m.date} {m.time ? `• ${m.time}` : ""}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-slate-400">
                              <MapPin size={11} className="text-primary" />
                              <span>{m.hall || "Salon Belirtilmedi"}</span>
                              {m.category && <span>({m.category})</span>}
                            </div>
                          </div>

                          {/* Takımlar ve Skor */}
                          <div className="flex items-center justify-center gap-3 self-center sm:self-auto font-semibold text-sm">
                            <span
                              className={`${
                                m.winner === "team1"
                                  ? "text-emerald-400 font-black"
                                  : "text-slate-200"
                              }`}
                            >
                              {m.homeTeam}
                            </span>

                            <div className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 font-mono font-black text-sm">
                              {isFinished && m.homeScore !== undefined && m.awayScore !== undefined ? (
                                <span>
                                  {m.homeScore} - {m.awayScore}
                                </span>
                              ) : (
                                <span className="text-xs text-amber-400">Oynanacak</span>
                              )}
                            </div>

                            <span
                              className={`${
                                m.winner === "team2"
                                  ? "text-emerald-400 font-black"
                                  : "text-slate-200"
                              }`}
                            >
                              {m.awayTeam}
                            </span>
                          </div>

                          {/* Set Detayları veya Durum */}
                          <div className="text-right text-xs">
                            {m.setScores && m.setScores.length > 0 ? (
                              <div className="text-[11px] text-slate-400 font-mono">
                                Setler: {m.setScores.join(", ")}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">
                                {isFinished ? "Sonuçlandı" : "Planlandı"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 5. YAN YANA PUAN DURUMU İSTATİSTİKLERİ */}
            <section className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Activity size={18} className="text-primary" />
                  <span>Puan Durumu İstatistikleri</span>
                </h2>
                {comparison.isSameGroup ? (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                    Aynı Gruptalar: {comparison.sharedGroup?.groupName}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-0.5 rounded-full">
                    Farklı Gruplar / Ligler
                  </span>
                )}
              </div>

              {!comparison.isSameGroup && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Bu takımlar bu sezon aynı grupta yer almıyor — aralarındaki maç bulunamadı veya farklı kategorilerde yarışıyorlar. Aşağıda her iki takımın kendi gruplarındaki güncel performansları yer almaktadır.
                  </span>
                </div>
              )}

              {/* Yan Yana İstatistik Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Takım İstatistikleri */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{comparison.team1.teamName}</h3>
                      <span className="text-xs text-slate-400">{comparison.team1.city}</span>
                    </div>
                    <Link
                      href={`/takim/${comparison.team1.slug}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Profil</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>

                  {comparison.team1.standingsContexts.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.team1.standingsContexts.map((ctx, idx) => {
                        const row = ctx.standingRow;
                        return (
                          <div key={idx} className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-700/50">
                            <div className="text-xs font-semibold text-slate-300 mb-2">
                              {ctx.category} • {ctx.groupName}
                            </div>
                            <div className="grid grid-cols-6 gap-2 text-center text-xs">
                              <div>
                                <div className="text-slate-400 text-[10px]">Sıra</div>
                                <div className="font-bold text-white mt-0.5">#{row.rank}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">O</div>
                                <div className="font-bold text-white mt-0.5">{row.played}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">G</div>
                                <div className="font-bold text-emerald-400 mt-0.5">{row.won}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">M</div>
                                <div className="font-bold text-rose-400 mt-0.5">{row.lost}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">Set</div>
                                <div className="font-bold text-slate-200 mt-0.5">
                                  {row.sets_won}:{row.sets_lost}
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">Puan</div>
                                <div className="font-black text-amber-400 mt-0.5">{row.points}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Bu takım için puan durumu verisi açıklanmamış.</p>
                  )}
                </div>

                {/* 2. Takım İstatistikleri */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{comparison.team2.teamName}</h3>
                      <span className="text-xs text-slate-400">{comparison.team2.city}</span>
                    </div>
                    <Link
                      href={`/takim/${comparison.team2.slug}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Profil</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>

                  {comparison.team2.standingsContexts.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.team2.standingsContexts.map((ctx, idx) => {
                        const row = ctx.standingRow;
                        return (
                          <div key={idx} className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-700/50">
                            <div className="text-xs font-semibold text-slate-300 mb-2">
                              {ctx.category} • {ctx.groupName}
                            </div>
                            <div className="grid grid-cols-6 gap-2 text-center text-xs">
                              <div>
                                <div className="text-slate-400 text-[10px]">Sıra</div>
                                <div className="font-bold text-white mt-0.5">#{row.rank}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">O</div>
                                <div className="font-bold text-white mt-0.5">{row.played}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">G</div>
                                <div className="font-bold text-emerald-400 mt-0.5">{row.won}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">M</div>
                                <div className="font-bold text-rose-400 mt-0.5">{row.lost}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">Set</div>
                                <div className="font-bold text-slate-200 mt-0.5">
                                  {row.sets_won}:{row.sets_lost}
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-[10px]">Puan</div>
                                <div className="font-black text-amber-400 mt-0.5">{row.points}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Bu takım için puan durumu verisi açıklanmamış.</p>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Takım Seçilmediğinde Gösterilecek Karşılama Ekranı */
          <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Swords size={32} />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-lg font-bold text-white">Karşılaştırmak için İki Takım Seçin</h2>
              <p className="text-xs text-slate-400 mt-1">
                Yukarıdaki açılır listelerden karşılaştırmak istediğiniz iki takımı seçerek aralarındaki geçmiş maçları, set skorlarını ve puan durumu tablosunu anında görüntüleyebilirsiniz.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
