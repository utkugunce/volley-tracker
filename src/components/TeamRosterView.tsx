"use client";

import React, { useMemo, useState } from "react";
import { LayoutGrid, List, Users } from "lucide-react";
import { TeamRosterRecord, RosterPlayer, TeamRosterSeason } from "@/types/roster";
import { Player } from "@/utils/teamData";
import { VolleyballCourtView } from "./VolleyballCourtView";

interface TeamRosterViewProps {
  teamName: string;
  category?: string;
  volleyboxRoster?: TeamRosterRecord;
  legacyRoster?: Player[];
  volleyboxUrl?: string;
}

export const TeamRosterView: React.FC<TeamRosterViewProps> = ({
  teamName,
  volleyboxRoster,
  legacyRoster,
  volleyboxUrl,
}) => {
  const vbUrl = volleyboxRoster?.volleybox_url || volleyboxUrl;

  const currentSeasonData = useMemo<{
    seasonKey: string;
    season?: TeamRosterSeason;
  }>(() => {
    if (!volleyboxRoster?.seasons) {
      return { seasonKey: "2026/27" };
    }

    const seasons = volleyboxRoster.seasons;
    if (
      seasons["2026/27"] &&
      (seasons["2026/27"].players?.length > 0 || seasons["2026/27"].staff?.length > 0)
    ) {
      return { seasonKey: "2026/27", season: seasons["2026/27"] };
    }

    if (seasons["2026/27"]) {
      return { seasonKey: "2026/27", season: seasons["2026/27"] };
    }

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

  const [viewMode, setViewMode] = useState<"table" | "court">("table");

  const heightStats = useMemo(() => {
    const valid = players.filter((p) => typeof p.height_cm === "number" && p.height_cm > 0);
    if (valid.length === 0) return null;
    const avg = valid.reduce((acc, p) => acc + (p.height_cm || 0), 0) / valid.length;
    return Math.round(avg);
  }, [players]);

  const ageStats = useMemo(() => {
    const valid = players.filter((p) => typeof p.age === "number" && p.age > 0);
    if (valid.length === 0) return null;
    const avg = valid.reduce((acc, p) => acc + (p.age || 0), 0) / valid.length;
    return avg.toFixed(1);
  }, [players]);

  return (
    <div className="w-full rounded-xl bg-surface border border-line p-4 sm:p-5 text-ink space-y-4">
      {/* 1. ÜST BAŞLIK */}
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <Users size={15} />
          </div>
          <h2 className="text-base sm:text-lg font-black text-ink tracking-tight">
            {seasonKey} Kadrosu
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Görünüm Değiştirici */}
          <div className="flex items-center rounded-lg bg-surface-muted p-0.5 border border-line">
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-primary text-primary-fg"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              <List size={12} />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode("court")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === "court"
                  ? "bg-primary text-primary-fg"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              <LayoutGrid size={12} />
              <span>Saha</span>
            </button>
          </div>

          {vbUrl && (
            <a
              href={vbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-ink-3 hover:text-ink transition-colors px-2 py-1 rounded-md bg-surface-muted border border-line"
              title="Volleybox profilinde düzenle veya ekle"
            >
              <span>+ Ekle</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. KADRO KPI İSTATİSTİKLERİ */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-surface-muted border border-line rounded-lg p-2.5 text-center">
          <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
            Toplam Kadro
          </span>
          <span className="text-sm sm:text-base font-black text-ink font-mono mt-0.5 block tabular-nums">
            {players.length} <span className="text-xs text-ink-3 font-sans font-normal">Oyuncu</span>
          </span>
        </div>

        <div className="bg-surface-muted border border-line rounded-lg p-2.5 text-center">
          <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
            Boy Ortalaması
          </span>
          <span className="text-sm sm:text-base font-black text-ink font-mono mt-0.5 block tabular-nums">
            {heightStats ? `${heightStats} cm` : "-"}
          </span>
        </div>

        <div className="bg-surface-muted border border-line rounded-lg p-2.5 text-center">
          <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
            Yaş Ortalaması
          </span>
          <span className="text-sm sm:text-base font-black text-ink font-mono mt-0.5 block tabular-nums">
            {ageStats ? `${ageStats} Yaş` : "-"}
          </span>
        </div>
      </div>

      {/* 3. SAHA DİZİLİŞİ VEYA LİSTE MODU */}
      {viewMode === "court" ? (
        <VolleyballCourtView players={players} teamName={teamName} />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-bold text-ink-3 uppercase tracking-wider">
              Oyuncular
            </h3>
          </div>

          {players.length > 0 ? (
            <div className="divide-y divide-line border border-line rounded-lg overflow-hidden bg-surface-muted">
              {players.map((player, idx) => (
                <div
                  key={(player.id || "") + (player.number || "") + player.name + idx}
                  className="w-full hover:bg-surface-raised transition-colors px-3 sm:px-4 py-2 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {player.profile_url ? (
                      <a
                        href={player.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-bold text-ink hover:text-primary truncate flex items-center gap-1 transition-colors"
                      >
                        <span className="truncate">{player.name}</span>
                        <span className="text-primary font-black text-xs shrink-0" title="Volleybox Profili">
                          ✓
                        </span>
                      </a>
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-ink truncate">
                        {player.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center shrink-0 gap-2 sm:gap-4">
                    <div className="text-xs text-ink-2 font-medium text-right sm:text-center w-24 sm:w-36 truncate">
                      {player.position || "-"}
                    </div>

                    <div className="text-xs text-ink-2 font-mono tabular-nums text-right w-16 sm:w-20">
                      {player.height_cm ? `${player.height_cm} cm` : "-"}
                    </div>

                    <div className="text-xs text-ink-3 font-mono tabular-nums text-right w-12 sm:w-14">
                      {player.birth_year || "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-muted border border-line rounded-lg p-5 text-center text-ink-3 text-xs">
              <p className="font-semibold text-ink-2 mb-1">Bu sezon için henüz oyuncu girilmemiş</p>
              <p>Volleybox üzerinde oyuncu eklemek için yukarıdaki bağlantıyı kullanabilirsiniz.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. TEKNİK KADRO BÖLÜMÜ */}
      <div className="space-y-2 pt-2 border-t border-line">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-ink-3 uppercase tracking-wider">
            Teknik Kadro
          </h3>
        </div>

        {staff.length > 0 ? (
          <div className="divide-y divide-line border border-line rounded-lg overflow-hidden bg-surface-muted">
            {staff.map((st, idx) => (
              <div
                key={(st.id || "") + st.name + idx}
                className="w-full hover:bg-surface-raised transition-colors px-3 sm:px-4 py-2 flex items-center justify-between gap-2"
              >
                <div className="flex items-center min-w-0 flex-1">
                  {st.profile_url ? (
                    <a
                      href={st.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-bold text-ink hover:text-primary truncate transition-colors"
                    >
                      {st.name}
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-ink truncate">
                      {st.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center shrink-0 gap-2 sm:gap-4">
                  <div className="text-xs text-ink-2 font-medium text-right sm:text-center w-24 sm:w-36 truncate">
                    {st.position || "Antrenör"}
                  </div>
                  <div className="text-xs text-ink-3 font-mono text-right w-16 sm:w-20">-</div>
                  <div className="text-xs text-ink-3 font-mono text-right w-12 sm:w-14">-</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-muted border border-line rounded-lg p-3 text-center text-ink-3 text-xs">
            Teknik heyet kaydı bulunmuyor
          </div>
        )}
      </div>
    </div>
  );
};
