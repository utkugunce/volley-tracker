"use client";

import React from "react";
import { Search, Edit3 } from "lucide-react";
import { Match } from "@/types/fixture";
import { MatchOverride } from "@/utils/overrides";

export interface MatchesTabProps {
  cities: string[];
  filteredMatches: Match[];
  filterOverriddenOnly: boolean;
  overrides: Record<string, MatchOverride>;
  searchQuery: string;
  selectedCity: string;
  setFilterOverriddenOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setSelectedCity: React.Dispatch<React.SetStateAction<string>>;
  startEdit: (match: Match) => void;
}

export function MatchesTab({ cities, filteredMatches, filterOverriddenOnly, overrides, searchQuery, selectedCity, setFilterOverriddenOnly, setSearchQuery, setSelectedCity, startEdit }: MatchesTabProps) {
  return (
    <div>
      {/* Filtre ve Arama Alanı */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} aria-hidden="true" className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Takım adı, salon, lig veya maç ID ile ara..."
            aria-label="Takım adı, salon, lig veya maç ID ile ara"
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            aria-label="Şehir filtrele"
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <option value="all">Tüm İller ({cities.length})</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterOverriddenOnly(!filterOverriddenOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filterOverriddenOnly
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Sadece Düzenlenenler ({Object.keys(overrides).length})
          </button>
        </div>
      </div>

      {/* Maç Tablosu */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700 uppercase font-mono text-[11px]">
                <th className="py-3 px-3">İl / Lig / Kategori</th>
                <th className="py-3 px-3">Tarih & Saat</th>
                <th className="py-3 px-4">Ev Sahibi Takım</th>
                <th className="py-3 px-2 text-center">Skor</th>
                <th className="py-3 px-4">Deplasman Takım</th>
                <th className="py-3 px-3 text-center">Durum</th>
                <th className="py-3 px-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aranan kritere uygun maç bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => {
                  const hasOverride = !!overrides[m.id];
                  const ov = overrides[m.id];

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        hasOverride ? "bg-amber-950/20" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{m.city}</div>
                        <div className="text-[10px] text-slate-400">{m.category}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-mono text-slate-300">{m.date}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{m.time}</div>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-200">
                        {m.home_team}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold text-sm">
                          {m.home_score !== undefined && m.home_score !== null ? m.home_score : "-"} :{" "}
                          {m.away_score !== undefined && m.away_score !== null ? m.away_score : "-"}
                        </span>
                        {hasOverride && (
                          <div className="text-[9px] text-amber-400 mt-0.5 font-sans font-bold">
                            Override
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-200">
                        {m.away_team}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === "finished"
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                              : m.status === "live"
                              ? "bg-red-950/80 text-red-400 border border-red-800 animate-pulse"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {m.status === "finished" ? "Bitti" : m.status === "live" ? "Canlı" : "Gelecek"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => startEdit(m)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-primary text-slate-200 hover:text-primary-fg border border-slate-700 transition-all cursor-pointer"
                        >
                          <Edit3 size={12} />
                          Düzenle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
