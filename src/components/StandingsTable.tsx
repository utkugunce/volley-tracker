"use client";

import React, { useState, useMemo } from "react";
import { StandingItem } from "@/types/fixture";
import { Trophy, HelpCircle } from "lucide-react";

interface StandingsTableProps {
  standingsData: {
    [category: string]: StandingItem[];
  };
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standingsData }) => {
  const allKeys = Object.keys(standingsData);

  // Benzersiz Ligleri ve Grupları tespit et
  const leagues = useMemo(() => {
    const set = new Set<string>();
    allKeys.forEach((k) => {
      const parts = k.split(" - ");
      set.add(parts[0]);
    });
    return Array.from(set);
  }, [allKeys]);

  const [selectedLeague, setSelectedLeague] = useState<string>(
    leagues[0] || "Genç Kızlar Süper Lig"
  );

  // Seçili lige ait gruplar
  const groupsInLeague = useMemo(() => {
    return allKeys
      .filter((k) => k.startsWith(selectedLeague))
      .map((k) => {
        const parts = k.split(" - ");
        return parts[1] || parts[0];
      });
  }, [allKeys, selectedLeague]);

  const [selectedGroup, setSelectedGroup] = useState<string>(
    groupsInLeague[0] || "A Grubu"
  );

  // Lig değiştiğinde varsayılan grubu güncelle
  React.useEffect(() => {
    if (!groupsInLeague.includes(selectedGroup)) {
      setSelectedGroup(groupsInLeague[0] || "A Grubu");
    }
  }, [selectedLeague, groupsInLeague, selectedGroup]);

  const currentKey = `${selectedLeague} - ${selectedGroup}`;
  const items = standingsData[currentKey] || standingsData[allKeys[0]] || [];

  return (
    <div className="space-y-4">
      {/* 1. Lig & Grup Seçici Barı (Basit, Temiz ve Hızlı) */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm no-print space-y-2.5">
        {/* Lig Seçimi (Genç Kızlar / Yıldız Kızlar) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase min-w-[50px]">
            Lig:
          </span>
          {leagues.map((lg) => {
            const isActive = selectedLeague === lg;
            return (
              <button
                key={lg}
                onClick={() => setSelectedLeague(lg)}
                className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#0b1325] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lg}
              </button>
            );
          })}
        </div>

        {/* Grup Seçimi (A Grubu, B Grubu, C Grubu) */}
        {groupsInLeague.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase min-w-[50px]">
              Grup:
            </span>
            {groupsInLeague.map((grp) => {
              const isActive = selectedGroup === grp;
              return (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-sm font-bold"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {grp}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Puan Durumu Tablosu (Flashscore & TVF Tarzı) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Başlık Şeridi */}
        <div className="bg-[#1b2438] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold tracking-tight">
              {selectedLeague.toUpperCase()} • {selectedGroup.toUpperCase()} - PUAN DURUMU
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {items.length} Takım
          </span>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-4">Takım</th>
                <th className="py-2.5 px-2 text-center w-12" title="Oynanan Maç">O</th>
                <th className="py-2.5 px-2 text-center w-12" title="Galibiyet">G</th>
                <th className="py-2.5 px-2 text-center w-12" title="Mağlubiyet">M</th>
                <th className="py-2.5 px-3 text-center w-24" title="Aldığı Set - Verdiği Set">Setler</th>
                <th className="py-2.5 px-2 text-center w-16 hidden md:table-cell" title="Set Oranı">Set Oran</th>
                <th className="py-2.5 px-3 text-center w-28 hidden lg:table-cell" title="Aldığı Sayı - Verdiği Sayı">Sayılar</th>
                <th className="py-2.5 px-3 text-center w-16 bg-slate-100 font-black text-slate-800" title="Puan">P</th>
                <th className="py-2.5 px-4 text-center w-36 hidden sm:table-cell" title="Son 5 Maç Formu">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row) => {
                const isTop4 = row.rank <= 4;

                return (
                  <tr
                    key={row.rank}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      row.rank % 2 === 1 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    {/* Sıra & Final Etabı Çizgisi */}
                    <td className="py-3 px-3 text-center font-bold text-xs relative">
                      <span
                        className={`absolute left-0 top-1 bottom-1 w-1 rounded-r ${
                          isTop4 ? "bg-emerald-500" : "bg-transparent"
                        }`}
                      />
                      <span className={isTop4 ? "text-emerald-700 font-black" : "text-slate-500"}>
                        {row.rank}
                      </span>
                    </td>

                    {/* Takım Adı */}
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap text-sm">
                      {row.team}
                    </td>

                    {/* O */}
                    <td className="py-3 px-2 text-center text-slate-700 font-medium">
                      {row.played}
                    </td>

                    {/* G */}
                    <td className="py-3 px-2 text-center text-emerald-700 font-bold">
                      {row.won}
                    </td>

                    {/* M */}
                    <td className="py-3 px-2 text-center text-red-600 font-medium">
                      {row.lost}
                    </td>

                    {/* Setler (AS - VS) */}
                    <td className="py-3 px-3 text-center font-mono text-slate-800 whitespace-nowrap">
                      <span className="font-bold">{row.sets_won}</span>
                      <span className="text-slate-400 mx-1">:</span>
                      <span className="text-slate-600">{row.sets_lost}</span>
                    </td>

                    {/* Set Oranı */}
                    <td className="py-3 px-2 text-center font-mono text-slate-500 hidden md:table-cell">
                      {row.set_ratio}
                    </td>

                    {/* Sayılar (AP - VP) */}
                    <td className="py-3 px-3 text-center font-mono text-slate-500 text-[11px] hidden lg:table-cell whitespace-nowrap">
                      {row.points_won}:{row.points_lost}
                    </td>

                    {/* Puan (P) */}
                    <td className="py-3 px-3 text-center bg-slate-100/80 font-mono font-black text-sm text-slate-900">
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

        {/* Alt Açıklama / Legend (Flashscore Tarzı) */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="font-semibold text-slate-700">1 - 4: Final Etabı (Play-Off)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-300" />
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
