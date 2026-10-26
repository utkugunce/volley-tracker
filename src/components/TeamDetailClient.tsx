"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { TeamBadge } from "@/components/TeamBadge";
import {
  CalendarPlus,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronLeft,
  Trophy,
  Activity,
  Swords,
  Star,
  ArrowRight,
} from "lucide-react";
import { TeamDetails, TeamMatchDetail } from "@/utils/teamData";
import { downloadIcsFile, generateMatchIcs, generateSeasonIcs } from "@/utils/ics";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { getVolleyboxLeagueMapping } from "@/utils/volleybox";
import { useFavorites } from "@/utils/useFavorites";
import { FormBadge } from "@/components/FormBadge";
import { VolleyMatchRow } from "@/components/match/VolleyMatchRow";
import dynamic from "next/dynamic";
import { SkeletonCard } from "@/components/skeletons/Skeleton";
import { Button } from "@/components/arc/button/button";
import { Badge } from "@/components/arc/badge/badge";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { EmptyState } from "@/components/arc/empty-state/empty-state";

const TeamRosterView = dynamic(() => import("@/components/TeamRosterView").then((mod) => mod.TeamRosterView), {
  loading: () => <SkeletonCard lines={4} />,
});
import { trLower } from "@/utils/turkishLocale";
import { ClubPyramidView } from "@/components/team/ClubPyramidView";
import { getLeagueStandingsRoute, getLeagueFixtureRoute } from "@/utils/leagueRoutes";
import { buildFormSeries, computeOpponentRecords, getTeamHalls } from "@/utils/teamStats";
import { TeamFormChart } from "@/components/team/TeamFormChart";
import { TeamOpponentRecords } from "@/components/team/TeamOpponentRecords";
import { TeamHallsCard } from "@/components/team/TeamHallsCard";
import { T } from "@/components/T";
import { SettingsControls } from "@/components/SettingsControls";
import { CalendarSubscribeModal } from "@/components/takvim/CalendarSubscribeModal";

const getClubBrandColors = (teamName: string, is2Lig: boolean = false) => {
  const lower = trLower(teamName);
  if (lower.includes("fenerbahçe") || lower.includes("vakıfbank")) {
    return { accentBorder: "border-yellow-400/35" };
  }
  if (lower.includes("eczacıbaşı")) {
    return { accentBorder: "border-orange-400/35" };
  }
  if (lower.includes("galatasaray")) {
    return { accentBorder: "border-amber-400/35" };
  }
  if (lower.includes("beşiktaş")) {
    return { accentBorder: "border-slate-300/35" };
  }
  if (is2Lig) {
    return { accentBorder: "border-primary/30" };
  }
  return { accentBorder: "border-line/80" };
};

const WinLossDonut: React.FC<{ wins: number; losses: number }> = ({ wins, losses }) => {
  const total = wins + losses;
  const winPercent = total > 0 ? Math.round((wins / total) * 100) : 0;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const winStroke = total > 0 ? (wins / total) * circumference : 0;

  return (
    <div className="flex items-center gap-3 bg-surface-muted/50 border border-line/60 rounded-xl p-2.5">
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
              stroke="#10B981"
              strokeWidth="6"
              strokeDasharray={`${winStroke} ${circumference}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-bold font-mono tabular-nums text-white">%{winPercent}</span>
          <span className="text-[8px] font-semibold text-ink-3 uppercase">Gal</span>
        </div>
      </div>
      <div className="text-xs space-y-0.5 min-w-0 font-mono tabular-nums">
        <div className="flex items-center gap-1.5 text-done font-semibold truncate">
          <span className="w-2 h-2 rounded-full bg-done shrink-0" />
          <span>{wins}G</span>
        </div>
        <div className="flex items-center gap-1.5 text-form-loss font-semibold truncate">
          <span className="w-2 h-2 rounded-full bg-form-loss shrink-0" />
          <span>{losses}M</span>
        </div>
      </div>
    </div>
  );
};

interface TeamDetailClientProps {
  team: TeamDetails;
  statsSlot?: React.ReactNode;
  clubSlot?: React.ReactNode;
}

export const TeamDetailClient: React.FC<TeamDetailClientProps> = ({ team, statsSlot, clubSlot }) => {
  const [matchFilter, setMatchFilter] = useState<"all" | "finished" | "upcoming">("all");
  const [, setDownloadingSeason] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(team.teamName);
  const is2LigTeam = team.categories.some((c) => c.includes("Kadınlar 2. Ligi"));
  const brand = getClubBrandColors(team.teamName, is2LigTeam);

  const formSeries = useMemo(() => buildFormSeries(team.matches), [team.matches]);
  const opponentRecords = useMemo(() => computeOpponentRecords(team.matches), [team.matches]);
  const teamHalls = useMemo(() => getTeamHalls(team.matches), [team.matches]);

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

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans pb-16">
      {/* 1. ÜST NAVİGASYON VE BAŞLIK BÖLÜMÜ */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line/70">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <div className="flex items-center gap-2">
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

            {is2LigTeam && (
              <Link
                href="/kadinlar-2-ligi"
                prefetch={false}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-white bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/30 transition-colors"
                title="TVF Kadınlar 2. Ligi Paneli"
              >
                <Trophy size={13} className="text-primary" />
                <span className="hidden sm:inline">2. Lig Paneli</span>
                <span className="sm:hidden">2. Lig</span>
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SettingsControls />
            <Link
              prefetch={false}
              href={`/karsilastir?takim1=${team.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-white bg-surface-muted/70 hover:bg-surface-muted border border-line/70 px-3 py-1.5 rounded-lg transition-colors"
              title="Bu takımı rakiple karşılaştır"
            >
              <Swords size={13} className="text-primary" />
              <span>Rakiple Karşılaştır</span>
            </Link>

            {team.mapping?.volleybox_url && (
              <a
                href={team.mapping.volleybox_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 px-3 py-1.5 rounded-lg transition-colors"
                title="Volleybox Kulüp / Takım Profilini Aç"
              >
                <span>Volleybox</span>
                <ExternalLink size={12} />
              </a>
            )}

            <Button
              variant={isFav ? "primary" : "secondary"}
              size="sm"
              onClick={() => toggleFavorite(team.teamName)}
              className={`cursor-pointer ${
                isFav
                  ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                  : "text-ink-2 hover:text-white"
              }`}
              title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
            >
              <Star size={13} className={isFav ? "fill-amber-400 text-amber-400 mr-1" : "text-ink-3 mr-1"} />
              <span className="hidden sm:inline">{isFav ? "Favorilerde" : "Favorilere Ekle"}</span>
              <span className="sm:hidden">{isFav ? "Takipte" : "Takip"}</span>
            </Button>

            {team.matches.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCalendarModal(true)}
                className="font-semibold cursor-pointer"
                title="Tüm sezon maçlarını Apple, Google veya Outlook takviminize ekleyin"
              >
                <CalendarPlus size={13} className="mr-1 text-amber-300" />
                <span className="hidden sm:inline">Takvime Abone Ol</span>
                <span className="sm:hidden">Takvim</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* 2. TAKIM KÜNYESİ VE LOGOSU (FotMob / Apple Sports Mat Yüzey) */}
        <section className={`relative overflow-hidden bg-surface border ${brand.accentBorder} rounded-2xl p-5 sm:p-6`}>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Kulüp Rozet Arması */}
            <div className="shrink-0">
              <TeamBadge name={team.teamName} size="xl" className="!w-20 !h-20 sm:!w-24 sm:!h-24 text-2xl sm:text-3xl" />
            </div>

            {/* Bilgiler */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {team.cities.map((city) => (
                  <Badge key={city} tone="neutral" size="sm" icon={<MapPin size={11} className="text-ink-3" />}>
                    {city}
                  </Badge>
                ))}
                {team.categories.map((cat) => {
                  const is2Lig = cat.includes("Kadınlar 2. Ligi");
                  return (
                    <Badge
                      key={cat}
                      tone={is2Lig ? "warning" : "info"}
                      size="sm"
                      icon={<Activity size={11} />}
                    >
                      {cat}
                    </Badge>
                  );
                })}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-words">
                  {team.teamName}
                </h1>
                <button
                  onClick={() => toggleFavorite(team.teamName)}
                  className="p-1.5 rounded-lg bg-surface-muted/80 hover:bg-surface-muted border border-line/70 transition-all cursor-pointer inline-flex items-center justify-center"
                  title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                >
                  <Star size={17} className={isFav ? "fill-amber-400 text-amber-400" : "text-ink-3 hover:text-amber-300"} />
                </button>
              </div>

              {team.mapping?.matched_as && (
                <p className="text-xs text-ink-3 mt-1 flex items-center gap-1">
                  <span>Volleybox Eşleşmesi:</span>
                  <strong className="text-ink">{team.mapping.matched_as}</strong>
                </p>
              )}

              <ClubPyramidView team={team} />

              {team.otherCities && team.otherCities.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-line/60 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-ink-3 font-medium">Bu kulübün diğer illerdeki takımları:</span>
                  {team.otherCities.map((oc) => (
                    <Link
                      prefetch={false}
                      key={oc.citySlug}
                      href={oc.path}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-muted hover:bg-panel text-ink border border-line/70 transition-colors"
                    >
                      <MapPin size={11} className="text-ink-3" />
                      <span>{oc.city} Takımı</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* KPI İstatistik Şeridi & Sezon Donut Grafiği */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-line/60 items-center">
            <div className="bg-surface-muted/50 border border-line/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider block">
                Toplam Maç
              </span>
              <span className="text-xl font-bold text-white font-mono tabular-nums mt-0.5 block">
                {team.stats.totalMatches}
              </span>
            </div>
            <div className="bg-surface-muted/50 border border-line/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-semibold text-done uppercase tracking-wider block">
                Galibiyet
              </span>
              <span className="text-xl font-bold text-done font-mono tabular-nums mt-0.5 block">
                {team.stats.wins}
              </span>
            </div>
            <div className="bg-surface-muted/50 border border-line/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-semibold text-form-loss uppercase tracking-wider block">
                Mağlubiyet
              </span>
              <span className="text-xl font-bold text-form-loss font-mono tabular-nums mt-0.5 block">
                {team.stats.losses}
              </span>
            </div>
            <div className="bg-surface-muted/50 border border-line/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
                Kalan Maç
              </span>
              <span className="text-xl font-bold text-amber-400 font-mono tabular-nums mt-0.5 block">
                {team.stats.upcoming}
              </span>
            </div>
            <div className="bg-surface-muted/50 border border-line/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider block">
                Son 5 Form
              </span>
              <FormBadge matches={team.form} className="justify-center mt-2" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <WinLossDonut wins={team.stats.wins} losses={team.stats.losses} />
            </div>
          </div>
        </section>

        {/* 2b. FORM GRAFİĞİ */}
        <TeamFormChart series={formSeries} />

        {/* 2c. İSTATİSTİKLER VE PLAY-OFF DURUMU */}
        {statsSlot}
        {clubSlot}

        {/* 3. PUAN DURUMU TABLOLARI */}
        {team.standingsContexts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy size={17} className="text-primary" />
              <span>Lig & Puan Durumu Konumu</span>
            </h2>

            {team.standingsContexts.map((ctx) => {
              const standingsHref = getLeagueStandingsRoute(ctx.groupName, ctx.city);
              const fixtureHref = getLeagueFixtureRoute(ctx.groupName, ctx.city);

              return (
                <div
                  key={ctx.groupName}
                  className="bg-surface border border-line/70 rounded-xl p-4 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-1.5 h-3.5 rounded-full bg-primary shrink-0" />
                      <Link
                        prefetch={false}
                        href={standingsHref}
                        className="text-sm font-semibold text-white hover:text-primary inline-flex items-center gap-1 transition-colors cursor-pointer group/title"
                        title={`${ctx.groupName} Puan Durumuna Git`}
                      >
                        <span>{ctx.groupName}</span>
                        <ArrowRight size={13} className="text-ink-3 group-hover/title:text-primary transition-colors" />
                      </Link>
                      {(() => {
                        const vbLeague = getVolleyboxLeagueMapping(ctx.groupName, ctx.city);
                        if (!vbLeague?.volleybox_url) return null;
                        return (
                          <a
                            href={vbLeague.volleybox_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink-3 hover:text-emerald-400 transition-colors p-0.5 rounded shrink-0 inline-flex items-center"
                            title={`${vbLeague.matched_as || ctx.groupName} — Volleybox Turnuva Sayfası`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                          </a>
                        );
                      })()}
                      <span className="text-xs text-ink-3 font-normal">
                        {ctx.city === "TVF Kadınlar 2. Ligi" ? (
                          <Link href="/kadinlar-2-ligi" prefetch={false} className="text-primary hover:underline">
                            (TVF Kadınlar 2. Ligi)
                          </Link>
                        ) : (
                          `(${ctx.city})`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="text-xs text-ink-2 font-mono tabular-nums">
                        Sıra: <strong className="text-primary font-bold">#{ctx.standingRow.rank}</strong>
                        <span className="mx-1.5">•</span>
                        Puan: <strong className="text-white font-bold">{ctx.standingRow.points}</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          prefetch={false}
                          href={standingsHref}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
                          title={`${ctx.groupName} Puan Durumuna Git`}
                        >
                          <Trophy size={11} />
                          <span>Puan Durumu →</span>
                        </Link>
                        <Link
                          prefetch={false}
                          href={fixtureHref}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-surface-muted text-ink hover:text-white border border-line/70 transition-colors cursor-pointer"
                          title={`${ctx.groupName} Fikstürüne Git`}
                        >
                          <Calendar size={11} className="text-ink-2" />
                          <span>Fikstür →</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-line/60 text-ink-3 text-[11px] font-semibold">
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
                      <tbody className="divide-y divide-line/40">
                        {ctx.fullGroupTable.map((row) => {
                          const isThisTeam = row.team.trim() === ctx.standingRow.team.trim();
                          return (
                            <tr
                              key={row.team}
                              className={`transition-colors ${
                                isThisTeam
                                  ? "bg-primary/10 text-white font-semibold"
                                  : "text-ink-2 hover:bg-surface-muted/40"
                              }`}
                            >
                              <td className="py-1.5 px-2 text-center font-mono tabular-nums text-ink-3">{row.rank}</td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-1.5">
                                  <TeamVolleyboxLink
                                    teamName={row.team}
                                    category={ctx.category}
                                    city={ctx.city}
                                    className={isThisTeam ? "font-semibold text-white" : "text-ink-2 font-medium"}
                                  />
                                  {isThisTeam && (
                                    <Badge tone="info" size="sm">
                                      Bu Takım
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-1.5 px-2 text-center font-mono tabular-nums">{row.played}</td>
                              <td className="py-1.5 px-2 text-center font-mono tabular-nums text-done">{row.won}</td>
                              <td className="py-1.5 px-2 text-center font-mono tabular-nums text-form-loss">{row.lost}</td>
                              <td className="py-1.5 px-2 text-center font-mono tabular-nums">{row.sets_won}</td>
                              <td className="py-1.5 px-2 text-center font-mono tabular-nums">{row.sets_lost}</td>
                              <td className="py-1.5 px-2 text-center font-mono tabular-nums font-bold text-white bg-surface-muted/30">
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

        {/* 4b. SALON BİLGİSİ */}
        <TeamHallsCard halls={teamHalls} />

        {/* 5. SEZON FİKSTÜRÜ (TÜM MAÇLAR — Standart VolleyMatchRow) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar size={17} className="text-primary" />
                <span>Sezon Fikstürü ({team.matches.length} Maç)</span>
              </h2>
              {team.standingsContexts[0] && (
                <Link
                  prefetch={false}
                  href={getLeagueFixtureRoute(team.standingsContexts[0].groupName, team.standingsContexts[0].city)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-white bg-surface hover:bg-surface-muted border border-line/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Ligin resmi fikstür sayfasına git"
                >
                  <Calendar size={12} className="text-primary" />
                  <span>Lig Fikstürüne Git</span>
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>

            <SegmentedControl
              options={[
                { value: "all", label: `Tümü (${team.matches.length})` },
                { value: "finished", label: `Bitenler (${team.stats.played})` },
                { value: "upcoming", label: `Gelecek (${team.stats.upcoming})` },
              ]}
              value={matchFilter}
              onValueChange={(val) => setMatchFilter(val as "all" | "finished" | "upcoming")}
            />
          </div>

          {filteredMatches.length === 0 ? (
            <div className="bg-surface border border-line/70 rounded-xl p-6 text-center">
              <EmptyState
                title="Maç Bulunmuyor"
                description="Bu filtreye uygun maç bulunmuyor."
              />
            </div>
          ) : (
            <div className="rounded-xl bg-surface border border-line/70 divide-y divide-line/50 overflow-hidden">
              {filteredMatches.map((m) => (
                <div key={m.id} className="flex items-center justify-between pr-2 sm:pr-3">
                  <div className="flex-1 min-w-0">
                    <VolleyMatchRow
                      match={m}
                      cityName={m.city || (team.cities.length === 1 ? team.cities[0] : undefined)}
                      leagueLabel={m.category}
                      showHall={true}
                    />
                  </div>
                  {m.date !== "TBD" && (
                    <button
                      type="button"
                      onClick={() => handleDownloadSingleMatchIcs(m)}
                      className="shrink-0 p-2 rounded-lg text-ink-3 hover:text-amber-400 hover:bg-surface-muted/70 transition-colors cursor-pointer"
                      title="Bu maçı takvime ekle (.ics)"
                      aria-label="Bu maçı takvime ekle (.ics)"
                    >
                      <CalendarPlus size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. RAKİP BAZINDA GEÇMİŞ SONUÇLAR (HEAD-TO-HEAD) */}
        <TeamOpponentRecords
          records={opponentRecords}
          category={team.categories[0]}
          city={team.cities.length === 1 ? team.cities[0] : undefined}
        />
      </main>

      {/* Canlı Takvim Abonelik Modalı */}
      <CalendarSubscribeModal
        teamName={team.teamName}
        teamSlug={team.slug}
        city={team.city}
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onDownloadIcs={handleDownloadSeasonIcs}
      />
    </div>
  );
};
