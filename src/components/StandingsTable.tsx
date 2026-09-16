"use client";

import React, { useState, useMemo } from "react";
import { StandingItem } from "@/types/fixture";
import { Trophy, HelpCircle } from "lucide-react";
import { TeamVolleyboxLink } from "./TeamVolleyboxLink";
import { LeagueVolleyboxLink } from "./LeagueVolleyboxLink";

interface StandingsTableProps {
  standingsData: {
    [category: string]: StandingItem[];
  };
  city?: string;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standingsData, city }) => {
  const allKeys = Object.keys(standingsData);

  // Benzersiz Ligleri ve Grupları tespit et
  const leagues = useMemo(() => {
    const set = new Set<string>();
    allKeys.forEach((k) => {
      const idx = k.indexOf(" - ");
      const leagueName = idx !== -1 ? k.slice(0, idx).trim() : k.trim();
      if (leagueName) set.add(leagueName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr", { numeric: true }));
  }, [allKeys]);

  const [selectedLeague, setSelectedLeague] = useState<string>(
    leagues[0] || "Genç Kızlar Süper Lig"
  );

  // Seçili lige ait gruplar
  const groupsInLeague = useMemo(() => {
    const groups: string[] = [];
    allKeys.forEach((k) => {
      if (k.startsWith(selectedLeague + " - ")) {
        const groupPart = k.slice(selectedLeague.length + 3).trim();
        if (groupPart && !groups.includes(groupPart)) {
          groups.push(groupPart);
        }
      } else if (k === selectedLeague) {
        if (!groups.includes("Genel")) {
          groups.push("Genel");
        }
      }
    });
    const sorted = groups.sort((a, b) => a.localeCompare(b, "tr", { numeric: true }));
    return sorted.length > 0 ? sorted : ["A Grubu"];
  }, [allKeys, selectedLeague]);

  const [selectedGroup, setSelectedGroup] = useState<string>(
    groupsInLeague[0] || "A Grubu"
  );

  // Lig değiştiğinde varsayılan grubu güncelle
  React.useEffect(() => {
    if (groupsInLeague.length > 0 && !groupsInLeague.includes(selectedGroup)) {
      setSelectedGroup(groupsInLeague[0]);
    }
  }, [selectedLeague, groupsInLeague, selectedGroup]);

  // Seçili lig ve gruba ait kesin anahtarı bul (sessiz fallback yok!)
  const currentKey = useMemo(() => {
    if (selectedGroup === "Genel" && standingsData[selectedLeague]) {
      return selectedLeague;
    }
    const combinedKey = `${selectedLeague} - ${selectedGroup}`;
    if (standingsData[combinedKey]) {
      return combinedKey;
    }
    if (standingsData[selectedGroup]) {
      return selectedGroup;
    }
    return combinedKey;
  }, [selectedLeague, selectedGroup, standingsData]);

  // Sadece seçili lig ve gruba ait veri alınır, alakasız grupların verisi asla gösterilmez
  const items = standingsData[currentKey] || [];

  if (allKeys.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#0f172a] via-[#0b1325] to-[#1e293b] border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-500 border border-slate-700">
          <HelpCircle size={22} />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">
          Puan Durumu Verisi Henüz Açıklanmadı
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Bu il veya kategori için resmi puan cetveli TVF tarafından sisteme girildiğinde burada görüntülenecektir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Lig & Grup Seçici Barı */}
      <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 shadow-md no-print space-y-2.5">
        {/* Lig Seçimi (Genç Kızlar / Yıldız Kızlar) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase min-w-[50px]">
            Lig:
          </span>
          {leagues.map((lg) => {
            const isActive = selectedLeague === lg;
            return (
              <button
                key={lg}
                onClick={() => setSelectedLeague(lg)}
                title={lg}
                className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {lg}
              </button>
            );
          })}
        </div>

        {/* Grup Seçimi */}
        {groupsInLeague.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 uppercase min-w-[50px]">
              Grup:
            </span>
            {groupsInLeague.map((grp) => {
              const isActive = selectedGroup === grp;
              return (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  title={grp}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all max-w-[240px] truncate sm:max-w-none ${
                    isActive
                      ? "bg-primary text-white shadow-sm font-bold"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600/50"
                  }`}
                >
                  {grp}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Puan Durumu Tablosu veya Boş Durum */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl shadow-md overflow-hidden">
        {/* Başlık Şeridi */}
        <div className="bg-[#111827] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold tracking-tight">
              <LeagueVolleyboxLink league={selectedLeague} city={city}>
                {selectedLeague.toLocaleUpperCase("tr-TR")}
              </LeagueVolleyboxLink>
              {selectedGroup ? ` • ${selectedGroup.toLocaleUpperCase("tr-TR")}` : ""} - PUAN DURUMU
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {items.length} Takım
          </span>
        </div>

        {/* Tablo veya Boş Durum (Empty State) */}
        {items.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-500 border border-slate-700">
              <HelpCircle size={22} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Bu grup için puan durumu verisi henüz mevcut değil.
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Seçtiğiniz {selectedLeague} - {selectedGroup} kategorisine ait resmi puan cetveli TVF il temsilciliği tarafından sisteme girildiğinde burada görüntülenecektir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 font-bold border-b border-slate-700 uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-4">Takım</th>
                <th className="py-2.5 px-2 text-center w-12" title="Oynanan Maç">O</th>
                <th className="py-2.5 px-2 text-center w-12" title="Galibiyet">G</th>
                <th className="py-2.5 px-2 text-center w-12" title="Mağlubiyet">M</th>
                <th className="py-2.5 px-3 text-center w-24" title="Aldığı Set - Verdiği Set">Setler</th>
                <th className="py-2.5 px-2 text-center w-16 hidden md:table-cell" title="Set Oranı">Set Oran</th>
                <th className="py-2.5 px-3 text-center w-28 hidden lg:table-cell" title="Aldığı Sayı - Verdiği Sayı">Sayılar</th>
                <th className="py-2.5 px-3 text-center w-16 bg-slate-800/60 font-black text-white" title="Puan">P</th>
                <th className="py-2.5 px-4 text-center w-36 hidden sm:table-cell" title="Son 5 Maç Formu">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.map((row) => {
                const isTop4 = row.rank <= 4;

                return (
                  <tr
                    key={row.rank}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      row.rank % 2 === 1 ? "bg-transparent" : "bg-slate-900/20"
                    }`}
                  >
                    {/* Sıra & Final Etabı Çizgisi */}
                    <td className="py-3 px-3 text-center font-bold text-xs relative">
                      <span
                        className={`absolute left-0 top-1 bottom-1 w-1 rounded-r ${
                          isTop4 ? "bg-emerald-500" : "bg-transparent"
                        }`}
                      />
                      <span className={isTop4 ? "text-emerald-400 font-black" : "text-slate-500"}>
                        {row.rank}
                      </span>
                    </td>

                    {/* Takım Adı */}
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap text-sm">
                      <TeamVolleyboxLink teamName={row.team} category={selectedLeague} city={city} />
                    </td>

                    {/* O */}
                    <td className="py-3 px-2 text-center text-slate-300 font-medium">
                      {row.played}
                    </td>

                    {/* G */}
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">
                      {row.won}
                    </td>

                    {/* M */}
                    <td className="py-3 px-2 text-center text-rose-400 font-medium">
                      {row.lost}
                    </td>

                    {/* Setler (AS - VS) */}
                    <td className="py-3 px-3 text-center font-mono text-slate-200 whitespace-nowrap">
                      <span className="font-bold">{row.sets_won}</span>
                      <span className="text-slate-500 mx-1">:</span>
                      <span className="text-slate-400">{row.sets_lost}</span>
                    </td>

                    {/* Set Oranı */}
                    <td className="py-3 px-2 text-center font-mono text-slate-400 hidden md:table-cell">
                      {row.set_ratio}
                    </td>

                    {/* Sayılar (AP - VP) */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px] hidden lg:table-cell whitespace-nowrap">
                      {row.points_won}:{row.points_lost}
                    </td>

                    {/* Puan (P) */}
                    <td className="py-3 px-3 text-center bg-slate-800/60 font-mono font-black text-sm text-white">
                      {row.points}
                    </td>

                    {/* Form (Flashscore İmzası: Yeşil G ve Kırmızı M rozetleri) */}
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {row.form.map((f, fIdx) => (
                          <span
                            key={fIdx}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white leading-none ${
                              f === "W"
                                ? "bg-emerald-500 shadow-sm"
                                : "bg-red-500 shadow-sm"
                            }`}
                            title={f === "W" ? "Galibiyet (3 veya 2 puan)" : "Mağlubiyet"}
                          >
                            {f === "W" ? "G" : "M"}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Alt Açıklama / Legend (Flashscore Tarzı) */}
        <div className="bg-slate-900/60 border-t border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="font-semibold text-slate-300">1 - 4: Final Etabı (Play-Off)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-600" />
              <span>5 - 8: Klasman Etabı</span>
            </div>
          </div>

          <div className="text-slate-500 font-mono text-[10px]">
            * TVF Puan Sistemi: 3-0/3-1 (3 puan), 3-2 (2/1 puan)
          </div>
        </div>
      </div>
    </div>
  );
};
