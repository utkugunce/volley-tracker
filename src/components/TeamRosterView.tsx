"use client";

import React, { useMemo } from "react";
import { ExternalLink, Shield } from "lucide-react";
import { TeamRosterRecord, RosterPlayer, TeamRosterSeason } from "@/types/roster";
import { Player } from "@/utils/teamData";

interface TeamRosterViewProps {
  teamName: string;
  category?: string;
  volleyboxRoster?: TeamRosterRecord;
  legacyRoster?: Player[];
  volleyboxUrl?: string;
}

export const TeamRosterView: React.FC<TeamRosterViewProps> = ({
  teamName,
  category,
  volleyboxRoster,
  legacyRoster,
  volleyboxUrl,
}) => {
  const vbUrl = volleyboxRoster?.volleybox_url || volleyboxUrl;

  // Sadece GÜNCEL SEZON:
  // 1. Varsa '2026/27' (içinde oyuncu olan veya en güncel)
  // 2. Yoksa oyuncusu olan en son güncel sezon
  const currentSeasonData = useMemo<{
    seasonKey: string;
    season?: TeamRosterSeason;
  }>(() => {
    if (!volleyboxRoster?.seasons) {
      return { seasonKey: "2026/27" };
    }

    const seasons = volleyboxRoster.seasons;
    // Öncelik: 2026/27 sezonu (eğer varsa ve oyuncusu varsa)
    if (seasons["2026/27"] && (seasons["2026/27"].players?.length > 0 || seasons["2026/27"].staff?.length > 0)) {
      return { seasonKey: "2026/27", season: seasons["2026/27"] };
    }

    // 2026/27 tanımlıysa onu göster
    if (seasons["2026/27"]) {
      return { seasonKey: "2026/27", season: seasons["2026/27"] };
    }

    // Aksi halde oyuncusu olan en yeni sezon
    const sortedSeasons = Object.entries(seasons).sort(([a], [b]) => b.localeCompare(a));
    const active = sortedSeasons.find(([_, s]) => s.total_players > 0 || s.total_staff > 0);
    if (active) {
      return { seasonKey: active[0], season: active[1] };
    }

    if (sortedSeasons.length > 0) {
      return { seasonKey: sortedSeasons[0][0], season: sortedSeasons[0][1] };
    }

    return { seasonKey: "2026/27" };
  }, [volleyboxRoster]);

  const seasonKey = currentSeasonData.seasonKey;
  const currentSeason = currentSeasonData.season;

  // Oyuncular (Volleybox veya legacy fallback)
  const players: RosterPlayer[] = useMemo(() => {
    if (currentSeason?.players && currentSeason.players.length > 0) {
      return currentSeason.players;
    }
    if (legacyRoster && legacyRoster.length > 0) {
      return legacyRoster.map((p) => ({
        id: null,
        name: p.name,
        number: p.number ? String(p.number) : null,
        position: p.position || "Bilinmiyor",
        height_cm: null,
        birth_year: p.birthYear || null,
        age: p.birthYear ? new Date().getFullYear() - p.birthYear : null,
        nationality: "Türkiye",
        flag_url: "https://volleybox.net/media/img/flags/TR.png",
        profile_url: null,
        is_coach: false,
      }));
    }
    return [];
  }, [currentSeason, legacyRoster]);

  const staff: RosterPlayer[] = useMemo(() => {
    return currentSeason?.staff || [];
  }, [currentSeason]);


  return (
    <div className="w-full rounded-2xl bg-[#080f24] border border-[#172547] p-4 sm:p-6 text-slate-100 shadow-xl space-y-4">
      {/* 1. ÜST BAŞLIK: [LOGO/İKON] 2026/27 + EKLE */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2a4d]">
        <div className="flex items-center gap-3">
          {/* Pembe hatlı grup ikonu (Volleybox birebir) */}
          <div className="w-8 h-8 rounded-lg border border-pink-500/80 bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0">
            <svg
              className="w-4.5 h-4.5 stroke-current fill-none stroke-[2]"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {seasonKey}
          </h2>
        </div>

        {vbUrl && (
          <a
            href={vbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            title="Volleybox profilinde düzenle veya ekle"
          >
            <span>+ Ekle</span>
          </a>
        )}
      </div>


      {/* 3. OYUNCULAR BÖLÜMÜ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pt-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide">
            Oyuncular
          </h3>
          {vbUrl && (
            <a
              href={vbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              + Ekle
            </a>
          )}
        </div>

        {players.length > 0 ? (
          <div className="space-y-1.5">
            {players.map((player, idx) => (
              <div
                key={(player.id || "") + (player.number || "") + player.name + idx}
                className="w-full bg-[#0a1226]/90 hover:bg-[#121f3d] transition-colors border border-[#162342] rounded-lg px-3 sm:px-4 py-2 flex items-center justify-between gap-2"
              >
                {/* Sol Kısım: İsim + Onay İkonu */}
                <div className="flex items-center min-w-0 flex-1">
                  {/* İsim & Link */}
                  {player.profile_url ? (
                    <a
                      href={player.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-bold text-slate-100 hover:text-white truncate flex items-center gap-1 transition-colors"
                    >
                      <span className="truncate">{player.name}</span>
                      <span className="text-indigo-400 font-black text-xs shrink-0" title="Volleybox Profili">✓</span>
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-slate-100 truncate flex items-center gap-1">
                      <span className="truncate">{player.name}</span>
                    </span>
                  )}
                </div>

                {/* Sağ Kısım: Mevki + Boy + Doğum Yılı */}
                <div className="flex items-center shrink-0 gap-2 sm:gap-4">
                  <div className="text-xs text-slate-300 font-medium text-right sm:text-center w-24 sm:w-36 truncate">
                    {player.position || "-"}
                  </div>

                  <div className="text-xs text-slate-300 font-mono text-right w-16 sm:w-20">
                    {player.height_cm ? `${player.height_cm} cm` : "-"}
                  </div>

                  <div className="text-xs text-slate-300 font-mono text-right w-12 sm:w-14">
                    {player.birth_year || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0a1226]/50 border border-[#162342] rounded-lg p-5 text-center text-slate-400 text-xs">
            <p className="font-medium text-slate-300 mb-1">Bu sezon için henüz oyuncu girilmemiş</p>
            <p className="text-slate-500">Volleybox üzerinde oyuncu eklemek için yukarıdaki bağlantıyı kullanabilirsiniz.</p>
          </div>
        )}
      </div>

      {/* 4. TEKNİK KADRO BÖLÜMÜ */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide">
            Teknik kadro
          </h3>
          {vbUrl && (
            <a
              href={vbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              + Ekle
            </a>
          )}
        </div>

        {staff.length > 0 ? (
          <div className="space-y-1.5">
            {staff.map((st, idx) => (
              <div
                key={(st.id || "") + st.name + idx}
                className="w-full bg-[#0a1226]/90 hover:bg-[#121f3d] transition-colors border border-[#162342] rounded-lg px-3 sm:px-4 py-2 flex items-center justify-between gap-2"
              >
                {/* Sol Kısım: İsim */}
                <div className="flex items-center min-w-0 flex-1">
                  {st.profile_url ? (
                    <a
                      href={st.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-bold text-slate-100 hover:text-white truncate transition-colors"
                    >
                      {st.name}
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                      {st.name}
                    </span>
                  )}
                </div>

                {/* Sağ Kısım: Görev / Pozisyon + "-" + "-" */}
                <div className="flex items-center shrink-0 gap-2 sm:gap-4">
                  <div className="text-xs text-slate-300 font-medium text-right sm:text-center w-24 sm:w-36 truncate">
                    {st.position || "Antrenör"}
                  </div>

                  <div className="text-xs text-slate-500 font-mono text-right w-16 sm:w-20">
                    -
                  </div>

                  <div className="text-xs text-slate-500 font-mono text-right w-12 sm:w-14">
                    -
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0a1226]/50 border border-[#162342] rounded-lg p-3.5 text-center text-slate-500 text-xs">
            Teknik heyet kaydı bulunmuyor
          </div>
        )}
      </div>
    </div>
  );
};
