"use client";

import React from "react";
import { Star, SearchX } from "lucide-react";

interface FixturesEmptyStateProps {
  city: string | undefined;
  hasNoMatches: boolean;
  showOnlyFavorites: boolean;
  isFiltered: boolean;
  onSelectCity: (slug: string) => void;
  onResetFilters: () => void;
}

/** Fikstür sekmesinde listelenecek maç yokken gösterilen boş durum kartı / İl sezon takvimi bekleniyor. */
export const FixturesEmptyState: React.FC<FixturesEmptyStateProps> = ({
  city,
  hasNoMatches,
  showOnlyFavorites,
  isFiltered,
  onSelectCity: handleSelectCity,
  onResetFilters: resetFilters,
}) => (
  <div className="text-center py-12 bg-gradient-to-br from-canvas via-surface-muted to-panel border border-slate-800 rounded-2xl p-6 max-w-lg mx-auto my-8 shadow-xl">
    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400 border border-slate-700">
      {showOnlyFavorites ? (
        <Star size={22} className="text-amber-400" />
      ) : (
        <SearchX size={22} />
      )}
    </div>

    {hasNoMatches ? (
      <>
        <h3 className="text-sm font-bold text-white mb-1">
          TVF {city || "Bu İl"} Fikstür Takvimi Henüz Açıklanmadı
        </h3>
        <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
          TVF {city} İl Temsilciliği 2026-2027 sezonu için Genç ve Yıldız Kızlar Süper Lig bültenini sisteme girdiğinde maçlar otomatik olarak burada listelenecektir.
        </p>
        <button
          onClick={() => handleSelectCity("istanbul")}
          className="px-4 py-2 rounded-lg bg-primary text-primary-fg text-xs font-bold hover:bg-primary-hover transition-colors shadow-md"
        >
          İstanbul Fikstürünü Görüntüle (24 Maç)
        </button>
      </>
    ) : (
      <>
        <h3 className="text-sm font-bold text-white mb-1">
          {showOnlyFavorites ? "Favori Maçınız Bulunmuyor" : "Kriterlere Uygun Maç Bulunamadı"}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {showOnlyFavorites
            ? "Maçların yanındaki yıldız ikonuna basarak favorilerinize ekleyebilirsiniz."
            : "Seçtiğiniz tarih, lig veya filtreye ait bültende maç kaydı bulunmamaktadır."}
        </p>
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-fg text-xs font-bold hover:bg-primary-hover transition-colors shadow-md"
          >
            Filtreleri Sıfırla
          </button>
        )}
      </>
    )}
  </div>
);
