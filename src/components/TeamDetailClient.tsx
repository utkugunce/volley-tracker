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
} from "lucide-react";
import { TeamDetails, TeamMatchDetail } from "@/utils/teamData";
import { downloadIcsFile, generateMatchIcs, generateSeasonIcs } from "@/utils/ics";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { useFavorites } from "@/utils/useFavorites";
import { FormBadge } from "@/components/FormBadge";

interface TeamDetailClientProps {
  team: TeamDetails;
}

export const TeamDetailClient: React.FC<TeamDetailClientProps> = ({ team }) => {
  const [matchFilter, setMatchFilter] = useState<"all" | "finished" | "upcoming">("all");
  const [downloadingSeason, setDownloadingSeason] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(team.teamName);

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
            <Link
              href={`/karsilastir?takim1=${team.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-800/70 hover:bg-amber-900/60 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
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
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
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
        {/* 2. TAKIM KÜNYESİ VE LOGOSU */}
        <section className="bg-gradient-to-br from-[#0f172a] via-[#0b1325] to-[#1e293b] border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white/95 p-3 border border-slate-700/80 shadow-xl flex items-center justify-center shrink-0">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={`${team.teamName} logosu`}
                  width={128}
                  height={128}
                  className="w-full h-full object-contain rounded-xl"
                  unoptimized={logoSrc.startsWith("http")}
                />
              ) : (
                <Trophy size={56} className="text-primary/70" />
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
                    <MapPin size={11} className="text-primary" />
                    {city}
                  </span>
                ))}
                {team.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30"
                  >
                    <Activity size={11} />
                    {cat}
                  </span>
                ))}
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
                    <Layers size={14} className="text-primary" />
                    <span>Kulübün Diğer Takımları & Yaş Grupları ({team.clubTeams.length}):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {team.clubTeams.map((ct) =>
                      ct.isCurrent ? (
                        <div
                          key={ct.slug + ct.city}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red ring-2 ring-red-500/40"
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
                      <MapPin size={11} className="text-primary" />
                      <span>{oc.city} Takımı</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* KPI İstatistik Şeridi */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-slate-800/80">
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
              <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
                {team.stats.wins}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                Mağlubiyet
              </span>
              <span className="text-xl font-black text-rose-400 font-mono mt-0.5 block">
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
            <div className="col-span-2 sm:col-span-1 bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Son 5 Maç Formu
              </span>
              <FormBadge matches={team.form} className="justify-center mt-2" />
            </div>
          </div>
        </section>

        {/* 3. PUAN DURUMU TABLOLARI */}
        {team.standingsContexts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              <span>Lig & Puan Durumu Konumu</span>
            </h2>

            {team.standingsContexts.map((ctx) => (
              <div
                key={ctx.groupName}
                className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 shadow-md overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span>{ctx.groupName}</span>
                    <span className="text-xs text-slate-400 font-normal">({ctx.city})</span>
                  </h3>
                  <div className="text-xs text-slate-300">
                    Sıra: <strong className="text-amber-400 font-black">#{ctx.standingRow.rank}</strong>
                    <span className="mx-1.5">•</span>
                    Puan: <strong className="text-white font-mono">{ctx.standingRow.points}</strong>
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
                                ? "bg-primary/20 text-white font-bold border-l-4 border-l-primary"
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
                                  <span className="text-[9px] bg-primary text-white px-1.5 py-0.2 rounded font-semibold shrink-0">
                                    Bu Takım
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono">{row.played}</td>
                            <td className="py-1.5 px-2 text-center font-mono text-emerald-400">{row.won}</td>
                            <td className="py-1.5 px-2 text-center font-mono text-rose-400">{row.lost}</td>
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
            ))}
          </section>
        )}

        {/* 4. TAKIM KADROSU (ROSTER) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <span>Takım Kadrosu {team.roster ? `(${team.roster.length} Sporcu)` : ""}</span>
            </h2>
            {team.roster && (
              <span className="text-xs text-slate-400 font-medium">2024-2025 Sezonu</span>
            )}
          </div>

          {team.roster && team.roster.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {team.roster.map((player) => {
                const isLibero = player.isLibero || player.position === "Libero";
                const isSetter = player.position === "Pasör";
                const isSpiker = player.position === "Smaçör";
                const isOpposite = player.position === "Pasör Çaprazı";
                const isMiddle = player.position === "Orta Oyuncu";

                const posBadgeStyle = isLibero
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : isSetter
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : isSpiker
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                  : isOpposite
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : isMiddle
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  : "bg-slate-700/60 text-slate-300 border-slate-600";

                return (
                  <div
                    key={player.number + player.name}
                    className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 rounded-xl p-3.5 transition-all flex items-center gap-3.5 shadow-sm group"
                  >
                    {/* Forma Numarası */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black font-mono text-base flex items-center justify-center shrink-0 shadow-glow-red border border-red-400/40 group-hover:scale-105 transition-transform">
                      {player.number}
                    </div>

                    {/* Oyuncu Bilgileri */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm truncate group-hover:text-primary transition-colors">
                          {player.name}
                        </span>
                        {player.isCaptain && (
                          <span
                            className="bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-black px-1.5 py-0.2 rounded shadow-xs"
                            title="Takım Kaptanı"
                          >
                            (K)
                          </span>
                        )}
                        {player.isLibero && (
                          <span
                            className="bg-rose-500/30 text-rose-300 border border-rose-500/50 text-[10px] font-black px-1.5 py-0.2 rounded shadow-xs"
                            title="Libero"
                          >
                            (L)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${posBadgeStyle}`}>
                          {player.position}
                        </span>
                        {player.birthYear && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {player.birthYear}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 text-center text-slate-400 text-xs">
              <Shield size={24} className="mx-auto text-slate-500 mb-2 opacity-70" />
              <p className="font-medium text-slate-300 text-sm mb-1">Kadro Listesi Henüz Eklenmedi</p>
              <p className="text-slate-400 max-w-md mx-auto">
                Bu takımın sporcu listesi resmi bültenlerde henüz yer almıyor. Kulüp antrenörü veya yöneticisiyseniz kadro bilgisi iletebilirsiniz.
              </p>
            </div>
          )}
        </section>

        {/* 5. SEZON FİKSTÜRÜ (TÜM MAÇLAR) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <span>Sezon Fikstürü ({team.matches.length} Maç)</span>
            </h2>

            {/* Filtre Butonları */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setMatchFilter("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  matchFilter === "all" ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                Tümü ({team.matches.length})
              </button>
              <button
                onClick={() => setMatchFilter("finished")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  matchFilter === "finished" ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                Bitenler ({team.stats.played})
              </button>
              <button
                onClick={() => setMatchFilter("upcoming")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  matchFilter === "upcoming" ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
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
                          ? "border-emerald-500/40 bg-emerald-950/10"
                          : "border-rose-500/40 bg-rose-950/10"
                        : "border-slate-700/70"
                    }`}
                  >
                    {/* Tarih, Saat & Salon */}
                    <div className="min-w-[170px]">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 font-mono">
                        <Calendar size={13} className="text-primary shrink-0" />
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
                    </div>

                    {/* Maç Eşleşmesi (Home vs Away) */}
                    <div className="flex-1 flex items-center justify-center gap-3 text-sm">
                      <div className={`flex-1 flex justify-end items-center ${m.isHome ? "font-black text-white" : "text-slate-300 font-medium"}`}>
                        <TeamVolleyboxLink
                          teamName={m.home_team}
                          category={team.categories[0]}
                          city={m.city || (team.cities.length === 1 ? team.cities[0] : undefined)}
                          className="justify-end text-right"
                        />
                      </div>

                      {/* Skor Rozeti */}
                      <div className="shrink-0 text-center px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 shadow-inner">
                        {isFinished ? (
                          <span className={`font-mono font-black text-sm ${isWon ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-white"}`}>
                            {m.home_score} - {m.away_score}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-slate-400">vs</span>
                        )}
                      </div>

                      <div className={`flex-1 flex justify-start items-center ${!m.isHome ? "font-black text-white" : "text-slate-300 font-medium"}`}>
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
                        <span className="text-[10px] font-mono text-slate-400 hidden md:inline-block">
                          ({m.set_scores.join(", ")})
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
