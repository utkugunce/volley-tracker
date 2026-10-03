"use client";

import React from "react";
import { History, CheckCircle2 } from "lucide-react";
import { formatDateTurkish } from "@/utils/calendar";
import type { AppMainTab } from "@/utils/dashboardRoutes";

interface ResultsEmptyStateProps {
  city: string | undefined;
  resultsSubTab: "all" | "yesterday";
  yesterdayStr: string;
  resultsCount: number;
  filteredResultCount: number;
  totalResultsAcrossAll: number;
  selectedResultDate: string;
  showOnlyFavorites: boolean;
  isFiltered: boolean;
  setResultsSubTab: (subTab: "all" | "yesterday") => void;
  setActiveMainTab: (tab: AppMainTab) => void;
  onSelectCity: (slug: string) => void;
  onResetFilters: () => void;
}

/** Sonuçlar sekmesinde listelenecek maç yokken gösterilen boş durum kartı. */
export const ResultsEmptyState: React.FC<ResultsEmptyStateProps> = ({
  city,
  resultsSubTab,
  yesterdayStr,
  resultsCount,
  filteredResultCount,
  totalResultsAcrossAll,
  selectedResultDate,
  showOnlyFavorites,
  isFiltered,
  setResultsSubTab,
  setActiveMainTab,
  onSelectCity: handleSelectCity,
  onResetFilters: resetFilters,
}) => (
  <div className="text-center py-12 bg-gradient-to-br from-canvas via-surface-muted to-panel border border-slate-800 rounded-2xl p-6 max-w-lg mx-auto my-8 shadow-xl">
    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-emerald-400 border border-slate-700">
      {resultsSubTab === "yesterday" ? <History size={22} /> : <CheckCircle2 size={22} />}
    </div>

    {resultsSubTab === "yesterday" ? (
      <>
        <h3 className="text-sm font-bold text-white mb-1">
          {city && city !== "Tüm İller"
            ? `TVF ${city} İçin Dün (${formatDateTurkish(yesterdayStr)}) Oynanan Maç Bulunmuyor`
            : `Dün (${formatDateTurkish(yesterdayStr)}) Oynanan Maç Bulunmuyor`}
        </h3>
        <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
          Dün bu ilde oynanmış maç kaydı bulunmuyor. Önceki tüm maç sonuçlarını görüntülemek için Tüm Sonuçlar sekmesine geçebilirsiniz.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setResultsSubTab("all")}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-md inline-flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            <span>Tüm Sonuçları Görüntüle ({resultsCount})</span>
          </button>
          {city !== "Tüm İller" && (
            <button
              type="button"
              onClick={() => handleSelectCity("all")}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition-colors shadow-md"
            >
              Tüm İllerin Dünkü Sonuçları
            </button>
          )}
        </div>
      </>
    ) : filteredResultCount === 0 && !isFiltered ? (
      <>
        <h3 className="text-sm font-bold text-white mb-1">
          {city && city !== "Tüm İller"
            ? `TVF ${city} İçin Henüz Biten Maç Bulunmuyor`
            : "Henüz Tamamlanan Maç Kaydı Bulunmuyor"}
        </h3>
        <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
          {city && city !== "Tüm İller"
            ? `TVF ${city} fikstüründeki maçlar oynanıp skorlar açıklandığında sonuçlar anında burada listelenecektir.`
            : "Fikstür maçları oynandıkça skor ve set sonuçları otomatik olarak burada listelenir."}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setActiveMainTab("fixtures")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-fg text-xs font-bold hover:bg-primary-hover transition-colors shadow-md"
          >
            Fikstürü Görüntüle
          </button>
          {city !== "Tüm İller" && (
            <button
              onClick={() => handleSelectCity("all")}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition-colors shadow-md"
            >
              Tüm İllerin Sonuçlarını Gör ({totalResultsAcrossAll})
            </button>
          )}
        </div>
      </>
    ) : (
      <>
        <h3 className="text-sm font-bold text-white mb-1">
          {selectedResultDate !== "all"
            ? `${formatDateTurkish(selectedResultDate)} Tarihinde Sonuçlanan Maç Bulunamadı`
            : showOnlyFavorites
            ? "Favori Maçlarınız Arasında Biten Maç Bulunmuyor"
            : "Kriterlere Uygun Sonuçlanan Maç Bulunamadı"}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {selectedResultDate !== "all"
            ? "Seçilen tarihte oynanmış veya sonucu sisteme girilmiş bir maç kaydı bulunmuyor."
            : showOnlyFavorites
            ? "Favoriye aldığınız maçlar tamamlandığında skorları burada görüntülenecektir."
            : "Seçtiğiniz lig veya arama filtresine uygun sonuçlanan maç kaydı bulunmamaktadır."}
        </p>
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-md cursor-pointer"
          >
            Filtreleri Sıfırla
          </button>
        )}
      </>
    )}
  </div>
);
