"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarPlus,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronLeft,
  Trophy,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Download,
  Swords,
  Layers,
  Star,
  Users,
  Shield,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { TeamDetails, TeamMatchDetail } from "@/utils/teamData";
import { downloadIcsFile, generateMatchIcs, generateSeasonIcs } from "@/utils/ics";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { getMatchForfeitInfo } from "@/utils/forfeit";
import { getVolleyboxLeagueMapping } from "@/utils/volleybox";
import { useFavorites } from "@/utils/useFavorites";
import { FormBadge } from "@/components/FormBadge";
import { TeamRosterView } from "@/components/TeamRosterView";
import { trLower } from "@/utils/turkishLocale";
import { getLeagueStandingsRoute, getLeagueFixtureRoute } from "@/utils/leagueRoutes";

// Marka kimliği: zemin Fileönü yüzeyi kalır; kulüp rengi yalnız ince çerçeve + düşük opaklıklı
// dekoratif ışıma (metin içermez) ile verilir. Logo, kontrastlı açık plakada gösterilir (`logoPlate`).
const getClubBrandColors = (teamName: string, is2Lig: boolean = false) => {
  const lower = trLower(teamName);
  const base = "from-canvas via-surface-muted to-panel";
  if (lower.includes("fenerbahçe")) {
    return { glowHome: "bg-yellow-400/10", glowAway: "bg-blue-400/10", accentBorder: "border-yellow-400/50", gradient: base, logoPlate: true };
  }
  if (lower.includes("vakıfbank")) {
    return { glowHome: "bg-yellow-400/10", glowAway: "bg-slate-400/10", accentBorder: "border-yellow-400/50", gradient: base, logoPlate: true };
  }
  if (lower.includes("eczacıbaşı")) {
    return { glowHome: "bg-orange-400/10", glowAway: "bg-slate-400/10", accentBorder: "border-orange-400/50", gradient: base, logoPlate: true };
  }
  if (lower.includes("galatasaray")) {
    return { glowHome: "bg-red-400/10", glowAway: "bg-yellow-400/10", accentBorder: "border-red-400/50", gradient: base, logoPlate: true };
  }
  if (lower.includes("beşiktaş")) {
    return { glowHome: "bg-white/10", glowAway: "bg-slate-400/10", accentBorder: "border-slate-300/50", gradient: base, logoPlate: true };
  }
  if (is2Lig) {
    return { glowHome: "bg-orchid/10", glowAway: "bg-purple-400/10", accentBorder: "border-orchid/35", gradient: base, logoPlate: false };
  }
  return { glowHome: "bg-primary/15", glowAway: "bg-selected/10", accentBorder: "border-primary/30", gradient: base, logoPlate: false };
};

const WinLossDonut: React.FC<{ wins: number; losses: number }> = ({ wins, losses }) => {
  const total = wins + losses;
  const winPercent = total > 0 ? Math.round((wins / total) * 100) : 0;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const winStroke = total > 0 ? (wins / total) * circumference : 0;

  return (
    <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5">
      <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="#1B3550"
            strokeWidth="6"
          />
          {wins > 0 && (
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="transparent"
              stroke="#9BE15D"
              strokeWidth="6"
              strokeDasharray={`${winStroke} ${circumference}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-black font-mono text-white">%{winPercent}</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase">Gal</span>
        </div>
      </div>
      <div className="text-xs space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-done font-bold truncate">
          <span className="w-2 h-2 rounded-full bg-done shrink-0"></span>
          <span>{wins}G</span>
        </div>
        <div className="flex items-center gap-1.5 text-form-loss font-bold truncate">
          <span className="w-2 h-2 rounded-full bg-form-loss shrink-0"></span>
          <span>{losses}M</span>
        </div>
      </div>
    </div>
  );
};

interface TeamDetailClientProps {
  team: TeamDetails;
}

export const TeamDetailClient: React.FC<TeamDetailClientProps> = ({ team }) => {
  const [matchFilter, setMatchFilter] = useState<"all" | "finished" | "upcoming">("all");
  const [downloadingSeason, setDownloadingSeason] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(team.teamName);
  const is2LigTeam = team.categories.some((c) => c.includes("Kadınlar 2. Ligi"));
  const brand = getClubBrandColors(team.teamName, is2LigTeam);

  const filteredMatches = team.matches.filter((m) => {
    if (matchFilter === "finished") return m.status === "finished";
    if (matchFilter === "upcoming") return m.status !== "finished";
    return true;
  });

  const handleDownloadSeasonIcs = () => {
    setDownloadingSeason(true);
    try {
      const ics = generateSeasonIcs(team.matches, `${team.teamName} Sezon Fikstürü`);
      downloadIcsFile(`${team.slug}-sezon-fiksturu.ics`, ics);
    } finally {
      setTimeout(() => setDownloadingSeason(false), 800);
    }
  };

  const handleDownloadSingleMatchIcs = (m: TeamMatchDetail) => {
    const ics = generateMatchIcs(m);
    if (ics) {
      downloadIcsFile(`mac-${m.home_team}-${m.away_team}-${m.date}.ics`, ics);
    }
  };

  const logoSrc = team.mapping?.local_logo || team.mapping?.logo_url;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* 1. ÜST NAVİGASYON VE BAŞLIK BÖLÜMÜ */}
      <header className="sticky top-0 z-40 bg-surface-muted/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Ana Sayfa</span>
            </Link>

            {is2LigTeam && (
              <Link
                href="/kadinlar-2-ligi"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-fuchsia-300 hover:text-white bg-fuchsia-950/70 hover:bg-fuchsia-900/80 px-3 py-1.5 rounded-lg border border-fuchsia-700/60 transition-colors shadow-xs"
                title="TVF Kadınlar 2. Ligi Paneli"
              >
                <Trophy size={13} className="text-orchid" />
                <span className="hidden sm:inline">2. Lig Paneli</span>
                <span className="sm:hidden">2. Lig</span>
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/karsilastir?takim1=${team.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-selected-text bg-selected-strong/15 border border-selected/40 hover:bg-selected-strong/25 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
              title="Bu takımı rakiple karşılaştır"
            >
              <Swords size={13} />
              <span>Rakiple Karşılaştır</span>
            </Link>

            {team.mapping?.volleybox_url && (
              <a
                href={team.mapping.volleybox_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg transition-colors"
                title="Volleybox Kulüp / Takım Profilini Aç"
              >
                <span>Volleybox</span>
                <ExternalLink size={12} />
              </a>
            )}

            <button
              onClick={() => toggleFavorite(team.teamName)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                isFav
                  ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-glow-amber"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
              }`}
              title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
            >
              <Star size={13} className={isFav ? "fill-amber-400 text-amber-400" : "text-slate-400"} />
              <span className="hidden sm:inline">{isFav ? "Favorilerde" : "Favorilere Ekle"}</span>
              <span className="sm:hidden">{isFav ? "Takipte" : "Takip"}</span>
            </button>

            {team.matches.length > 0 && (
              <button
                onClick={handleDownloadSeasonIcs}
                disabled={downloadingSeason}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-primary-fg px-3 py-1.5 rounded-lg shadow-glow-primary transition-all cursor-pointer"
                title="Tüm sezon maçlarını iCalendar (.ics) formatında indir"
              >
                <Download size={13} />
                <span className="hidden sm:inline">{downloadingSeason ? "İndiriliyor..." : "Sezonu Takvime Ekle"}</span>
                <span className="sm:hidden">Takvim</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* 2. TAKIM KÜNYESİ VE LOGOSU (Dinamik Kulüp Temalı Hero) */}
        <section className={`relative overflow-hidden bg-gradient-to-br ${brand.gradient} border ${brand.accentBorder} rounded-3xl p-5 sm:p-7 shadow-2xl transition-all duration-300`}>
          {/* Kulüp Ambient Glow Efektleri */}
          <div className={`absolute -top-24 -left-24 w-80 h-80 ${brand.glowHome} rounded-full blur-3xl pointer-events-none`} />
          <div className={`absolute -bottom-24 -right-24 w-80 h-80 ${brand.glowAway} rounded-full blur-3xl pointer-events-none`} />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo (Cut-out) */}
            <div className={`w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0 ${brand.logoPlate ? `rounded-2xl bg-ink border-2 ${brand.accentBorder} p-2.5` : "drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"}`}>
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={`${team.teamName} logosu`}
                  width={128}
                  height={128}
                  className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 hover:scale-105"
                  unoptimized={logoSrc.startsWith("http")}
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
                  <Trophy size={56} className="text-ink-2" />
                </div>
              )}
            </div>

            {/* Bilgiler */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {team.cities.map((city) => (
                  <span
                    key={city}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    <MapPin size={11} className="text-ink-2" />
                    {city}
                  </span>
                ))}
                {team.categories.map((cat) => {
                  const is2Lig = cat.includes("Kadınlar 2. Ligi");
                  return (
                    <span
                      key={cat}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                        is2Lig
                          ? "bg-orchid/15 text-orchid border-orchid/40 shadow-[0_0_12px_rgba(217,139,255,0.25)]"
                          : "bg-surface-raised text-ink-2 border-line"
                      }`}
                    >
                      <Activity size={11} className={is2Lig ? "text-orchid" : ""} />
                      {cat}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
                  {team.teamName}
                </h1>
                <button
                  onClick={() => toggleFavorite(team.teamName)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer inline-flex items-center justify-center"
                  title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                >
                  <Star size={18} className={isFav ? "fill-amber-400 text-amber-400 drop-shadow-xs" : "text-slate-400 hover:text-amber-300"} />
                </button>
              </div>

              {team.mapping?.matched_as && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span>Volleybox Eşleşmesi:</span>
                  <strong className="text-slate-200">{team.mapping.matched_as}</strong>
                </p>
              )}

              {/* KULÜP TAKIMLARI (U18, U16, B, C vb.) */}
              {team.clubTeams && team.clubTeams.length > 1 && (
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Layers size={14} className="text-ink-2" />
                    <span>Kulübün Diğer Takımları & Yaş Grupları ({team.clubTeams.length}):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {team.clubTeams.map((ct) =>
                      ct.isCurrent ? (
                        <div
                          key={ct.slug + ct.city}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-selected-strong text-white shadow-glow-selected"
                          title="Şu an bu takımı görüntülüyorsunuz"
                        >
                          <span>{ct.teamName}</span>
                          {ct.ageCategory && (
                            <span className="bg-black/30 text-white text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold">
                              {ct.ageCategory}
                            </span>
                          )}
                          {ct.teamBranch && (
                            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                              {ct.teamBranch}
                            </span>
                          )}
                          <span className="text-[10px] bg-white/20 px-1 rounded text-white font-medium">Mevcut</span>
                        </div>
                      ) : (
                        <Link
                          key={ct.slug + ct.city}
                          href={ct.path}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold glass-panel text-slate-200 hover:text-white hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all shadow-xs active:scale-95 cursor-pointer"
                          title={`${ct.teamName} detay sayfasını aç`}
                        >
                          <span>{ct.teamName}</span>
                          {ct.ageCategory && (
                            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold">
                              {ct.ageCategory}
                            </span>
                          )}
                          {ct.teamBranch && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                              {ct.teamBranch}
                            </span>
                          )}
                          {ct.city !== team.city && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({ct.city})
                            </span>
                          )}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}

              {team.otherCities && team.otherCities.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Bu kulübün diğer illerdeki takımları:</span>
                  {team.otherCities.map((oc) => (
                    <Link
                      key={oc.citySlug}
                      href={oc.path}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <MapPin size={11} className="text-ink-2" />
                      <span>{oc.city} Takımı</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* KPI İstatistik Şeridi & Sezon Donut Grafiği */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-6 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-slate-800/80 items-center">
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Toplam Maç
              </span>
              <span className="text-xl font-black text-white font-mono mt-0.5 block">
                {team.stats.totalMatches}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Galibiyet
              </span>
              <span className="text-xl font-black text-done font-mono mt-0.5 block">
                {team.stats.wins}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-form-loss uppercase tracking-wider block">
                Mağlubiyet
              </span>
              <span className="text-xl font-black text-form-loss font-mono mt-0.5 block">
                {team.stats.losses}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Kalan Maç
              </span>
              <span className="text-xl font-black text-amber-400 font-mono mt-0.5 block">
                {team.stats.upcoming}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Son 5 Form
              </span>
              <FormBadge matches={team.form} className="justify-center mt-2" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <WinLossDonut wins={team.stats.wins} losses={team.stats.losses} />
            </div>
          </div>
        </section>

        {/* 3. PUAN DURUMU TABLOLARI */}
        {team.standingsContexts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy size={18} className="text-primary" />
              <span>Lig & Puan Durumu Konumu</span>
            </h2>

            {team.standingsContexts.map((ctx) => {
              const standingsHref = getLeagueStandingsRoute(ctx.groupName, ctx.city);
              const fixtureHref = getLeagueFixtureRoute(ctx.groupName, ctx.city);

              return (
                <div
                  key={ctx.groupName}
                  className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 shadow-md overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                      <Link
                        href={standingsHref}
                        className="text-sm font-bold text-white hover:text-amber-400 hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer group/title"
                        title={`${ctx.groupName} Puan Durumuna Git`}
                      >
                        <span>{ctx.groupName}</span>
                        <ArrowRight size={13} className="text-slate-500 group-hover/title:text-amber-400 transition-colors" />
                      </Link>
                      {(() => {
                        const vbLeague = getVolleyboxLeagueMapping(ctx.groupName, ctx.city);
                        if (!vbLeague?.volleybox_url) return null;
                        return (
                          <a
                            href={vbLeague.volleybox_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5 rounded shrink-0 inline-flex items-center opacity-70 hover:opacity-100"
                            title={`${vbLeague.matched_as || ctx.groupName} — Volleybox Turnuva Sayfası`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                          </a>
                        );
                      })()}
                      <span className="text-xs text-slate-400 font-normal">
                        {ctx.city === "TVF Kadınlar 2. Ligi" ? (
                          <Link href="/kadinlar-2-ligi" className="text-fuchsia-400 hover:text-fuchsia-300 hover:underline">
                            (TVF Kadınlar 2. Ligi)
                          </Link>
                        ) : (
                          `(${ctx.city})`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="text-xs text-slate-300">
                        Sıra: <strong className="text-amber-400 font-black">#{ctx.standingRow.rank}</strong>
                        <span className="mx-1.5">•</span>
                        Puan: <strong className="text-white font-mono">{ctx.standingRow.points}</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={standingsHref}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                          title={`${ctx.groupName} Puan Durumuna Git`}
                        >
                          <Trophy size={11} className="text-primary" />
                          <span>Puan Durumu →</span>
                        </Link>
                        <Link
                          href={fixtureHref}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-colors cursor-pointer"
                          title={`${ctx.groupName} Fikstürüne Git`}
                        >
                          <Calendar size={11} className="text-sky-400" />
                          <span>Fikstür →</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-[11px]">
                        <th className="py-1.5 px-2 w-8 text-center">Sıra</th>
                        <th className="py-1.5 px-2">Takım</th>
                        <th className="py-1.5 px-2 text-center">O</th>
                        <th className="py-1.5 px-2 text-center">G</th>
                        <th className="py-1.5 px-2 text-center">M</th>
                        <th className="py-1.5 px-2 text-center">AS</th>
                        <th className="py-1.5 px-2 text-center">VS</th>
                        <th className="py-1.5 px-2 text-center font-bold text-white">P</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {ctx.fullGroupTable.map((row) => {
                        const isThisTeam = row.team.trim() === ctx.standingRow.team.trim();
                        return (
                          <tr
                            key={row.team}
                            className={`transition-colors ${
                              isThisTeam
                                ? "bg-primary/15 text-white font-bold border-l-4 border-l-primary"
                                : "text-slate-300 hover:bg-slate-700/40"
                            }`}
                          >
                            <td className="py-1.5 px-2 text-center font-mono">{row.rank}</td>
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1.5">
                                <TeamVolleyboxLink
                                  teamName={row.team}
                                  category={ctx.category}
                                  city={ctx.city}
                                  className={isThisTeam ? "font-bold text-white" : "text-slate-300 font-medium"}
                                />
                                {isThisTeam && (
                                  <span className="text-[9px] bg-primary text-primary-fg px-1.5 py-0.2 rounded font-semibold shrink-0">
                                    Bu Takım
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono">{row.played}</td>
                            <td className="py-1.5 px-2 text-center font-mono text-done">{row.won}</td>
                            <td className="py-1.5 px-2 text-center font-mono text-form-loss">{row.lost}</td>
                            <td className="py-1.5 px-2 text-center font-mono">{row.sets_won}</td>
                            <td className="py-1.5 px-2 text-center font-mono">{row.sets_lost}</td>
                            <td className="py-1.5 px-2 text-center font-mono font-black text-white bg-slate-800/40">
                              {row.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          </section>
        )}

        {/* 4. TAKIM KADROSU (VOLLEYBOX ROSTER) */}
        <TeamRosterView
          teamName={team.teamName}
          category={team.categories[0] || team.standingsContexts[0]?.groupName}
          volleyboxRoster={team.volleyboxRoster}
          legacyRoster={team.roster}
          volleyboxUrl={team.mapping?.volleybox_url}
        />


        {/* 5. SEZON FİKSTÜRÜ (TÜM MAÇLAR) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-ink-2" />
                <span>Sezon Fikstürü ({team.matches.length} Maç)</span>
              </h2>
              {team.standingsContexts[0] && (
                <Link
                  href={getLeagueFixtureRoute(team.standingsContexts[0].groupName, team.standingsContexts[0].city)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Ligin resmi fikstür sayfasına git"
                >
                  <Calendar size={12} className="text-sky-400" />
                  <span>Lig Fikstürüne Git</span>
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {/* Filtre Butonları */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setMatchFilter("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  matchFilter === "all" ? "bg-selected-strong text-white font-bold shadow-glow-selected" : "text-slate-400 hover:text-white"
                }`}
              >
                Tümü ({team.matches.length})
              </button>
              <button
                onClick={() => setMatchFilter("finished")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  matchFilter === "finished" ? "bg-selected-strong text-white font-bold shadow-glow-selected" : "text-slate-400 hover:text-white"
                }`}
              >
                Bitenler ({team.stats.played})
              </button>
              <button
                onClick={() => setMatchFilter("upcoming")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  matchFilter === "upcoming" ? "bg-selected-strong text-white font-bold shadow-glow-selected" : "text-slate-400 hover:text-white"
                }`}
              >
                Gelecek ({team.stats.upcoming})
              </button>
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-sm">
              Bu filtreye uygun maç bulunmuyor.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMatches.map((m) => {
                const isFinished = m.status === "finished";
                const isWon = m.result === "win";
                const isLoss = m.result === "loss";

                return (
                  <div
                    key={m.id}
                    className={`bg-slate-800/60 hover:bg-slate-800/90 border rounded-xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isFinished
                        ? isWon
                          ? "border-done/40 bg-done/5"
                          : "border-form-loss/40 bg-form-loss/5"
                        : "border-slate-700/70"
                    }`}
                  >
                    {/* Tarih, Saat & Salon */}
                    <div className="min-w-[170px]">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 font-mono">
                        <Calendar size={13} className="text-ink-2 shrink-0" />
                        <span>{m.date}</span>
                        <span>•</span>
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span>{m.time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate max-w-[200px]" title={m.hall}>
                          {m.hall} ({m.city})
                        </span>
                      </div>
                      {m.category && (
                        <div className="mt-1">
                          <Link
                            href={getLeagueFixtureRoute(m.category, m.city || (team.cities.length === 1 ? team.cities[0] : undefined))}
                            className="text-[10px] text-slate-400 hover:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1 transition-colors"
                            title={`${m.category} Lig Fikstürüne Git`}
                          >
                            <span>{m.category}</span>
                            <ArrowRight size={10} />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Maç Eşleşmesi (Home vs Away) */}
                    <div className="flex-1 min-w-0 w-full flex items-center justify-center gap-2 sm:gap-3 text-sm">
                      <div className={`flex-1 min-w-0 flex justify-end items-center ${m.isHome ? "font-black text-white" : "text-slate-300 font-medium"}`}>
                        <TeamVolleyboxLink
                          teamName={m.home_team}
                          category={team.categories[0]}
                          city={m.city || (team.cities.length === 1 ? team.cities[0] : undefined)}
                          className="justify-end text-right"
                        />
                      </div>

                      {/* Skor Rozeti */}
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="text-center px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 shadow-inner">
                          {isFinished ? (
                            <span className={`font-mono font-black text-sm ${isWon ? "text-done" : isLoss ? "text-form-loss" : "text-white"}`}>
                              {m.home_score} - {m.away_score}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-slate-400">vs</span>
                          )}
                        </div>
                        {isFinished && getMatchForfeitInfo(m).isForfeit && (
                          <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1 py-0.2 rounded mt-0.5 shadow-2xs">
                            Hükmen
                          </span>
                        )}
                      </div>

                      <div className={`flex-1 min-w-0 flex justify-start items-center ${!m.isHome ? "font-black text-white" : "text-slate-300 font-medium"}`}>
                        <TeamVolleyboxLink
                          teamName={m.away_team}
                          category={team.categories[0]}
                          city={m.city || (team.cities.length === 1 ? team.cities[0] : undefined)}
                          className="justify-start text-left"
                        />
                      </div>
                    </div>

                    {/* Aksiyonlar: Takvime Ekle & Volleybox */}
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {/* Set Skorları */}
                      {isFinished && m.set_scores && m.set_scores.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-400 hidden md:inline-flex items-center gap-1">
                          <span>({m.set_scores.join(", ")})</span>
                          {getMatchForfeitInfo(m).isForfeit && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1 py-0.2 rounded">
                              Hükmen
                            </span>
                          )}
                        </span>
                      )}

                      {/* Volleybox linki */}
                      {m.volleybox?.synced && m.volleybox.url && (
                        <a
                          href={m.volleybox.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Volleybox Maç Sayfasını Aç"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}

                      {/* Takvime Ekle Butonu */}
                      {m.date !== "TBD" && (
                        <button
                          onClick={() => handleDownloadSingleMatchIcs(m)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white px-2 py-1 rounded-lg border border-slate-600/70 transition-colors cursor-pointer"
                          title="Bu maçı takvime ekle (.ics)"
                        >
                          <CalendarPlus size={12} className="text-amber-400" />
                          <span className="hidden sm:inline">Takvim</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
