"use client";

import React from "react";
import { Search, X, Filter, Star, Calendar, MapPin, Layers, RotateCcw } from "lucide-react";

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedTier: string;
  onTierChange: (tier: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedVenue: string;
  onVenueChange: (venue: string) => void;
  onlyFavorites: boolean;
  onFavoritesToggle: () => void;
  availableDates: Array<{ date: string; label: string; count: number }>;
  availableVenues: Array<{ name: string; count: number }>;
  favoritesCount: number;
  totalFilteredCount: number;
  onResetFilters: () => void;
  viewMode: "cards" | "compact";
  onViewModeChange: (mode: "cards" | "compact") => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTier,
  onTierChange,
  selectedDate,
  onDateChange,
  selectedVenue,
  onVenueChange,
  onlyFavorites,
  onFavoritesToggle,
  availableDates,
  availableVenues,
  favoritesCount,
  totalFilteredCount,
  onResetFilters,
  viewMode,
  onViewModeChange,
}) => {
  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    selectedTier !== "all" ||
    selectedDate !== "all" ||
    selectedVenue !== "all" ||
    onlyFavorites;

  return (
    <div className="space-y-4 rounded-2xl p-4 sm:p-5 bg-court-panel/90 border border-court-border/80 backdrop-blur-md shadow-md">
      
      {/* 1. Satır: Arama Kutusu, Salon Seçimi ve Favoriler Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Arama */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Takım adı (Eczacıbaşı, Fenerbahçe...), salon veya hakem ara..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-court-card border border-court-border text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Salon Filtresi Dropdown */}
        <div className="relative min-w-[220px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={selectedVenue}
            onChange={(e) => onVenueChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-court-card border border-court-border text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
          >
            <option value="all">Tüm Salonlar ({availableVenues.reduce((a, b) => a + b.count, 0)})</option>
            {availableVenues.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.count})
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>

        {/* Favoriler Toggle Butonu */}
        <button
          type="button"
          onClick={onFavoritesToggle}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 ${
            onlyFavorites
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow"
              : "bg-court-card text-slate-400 border-court-border hover:text-slate-200 hover:border-slate-600"
          }`}
        >
          <Star className={`w-4 h-4 ${onlyFavorites ? "fill-amber-400 text-amber-400" : ""}`} />
          <span>Favori Takımlarım</span>
          {favoritesCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-300">
              {favoritesCount}
            </span>
          )}
        </button>

        {/* Filtreleri Sıfırla */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold transition-all shrink-0"
            title="Tüm filtreleri temizle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Temizle</span>
          </button>
        )}
      </div>

      {/* 2. Satır: Kategori ve Lig Düzeyi Hapları */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-court-border/40">
        
        {/* Kategori Seçimi */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Yaş:
          </span>
          {[
            { id: "all", label: "Tüm Yaş Grupları" },
            { id: "Genç", label: "Genç Kız (U18)" },
            { id: "Yıldız", label: "Yıldız Kız (U16)" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                  : "bg-court-card text-slate-400 hover:text-slate-200 border border-court-border/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lig Düzeyi (Süper Lig / 1. Lig) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Lig:</span>
          {[
            { id: "all", label: "Tüm Ligler" },
            { id: "Süper Lig", label: "Süper Lig" },
            { id: "1. Lig", label: "1. Lig" },
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => onTierChange(tier.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTier === tier.id
                  ? "bg-accent-cyan/90 text-black shadow-sm"
                  : "bg-court-card text-slate-400 hover:text-slate-200 border border-court-border/70"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Satır: Tarih Hapları (Yatay Kaydırılabilir) */}
      <div className="pt-2 border-t border-court-border/40">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5" /> Gün:
          </span>

          <button
            onClick={() => onDateChange("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              selectedDate === "all"
                ? "bg-slate-200 text-slate-950 font-bold shadow-sm"
                : "bg-court-card text-slate-400 hover:text-slate-200 border border-court-border/60"
            }`}
          >
            Tüm Günler
          </button>

          {availableDates.map((d) => (
            <button
              key={d.date}
              onClick={() => onDateChange(d.date)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                selectedDate === d.date
                  ? "bg-brand-500 text-white font-bold shadow-sm shadow-brand-500/25"
                  : "bg-court-card text-slate-300 hover:text-white border border-court-border/60 hover:border-slate-500"
              }`}
            >
              <span>{d.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedDate === d.date ? "bg-black/30 text-white" : "bg-slate-800 text-slate-400"
              }`}>
                {d.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtrelenen sonuç sayısı ve Görünüm Değiştirici */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <span>
            Toplam <strong className="text-brand-400">{totalFilteredCount}</strong> kadın voleybol maçı listeleniyor.
          </span>
          {hasActiveFilters && (
            <span className="text-amber-400 font-medium">• Filtreler Aktif</span>
          )}
        </div>

        {/* Görünüm Modu Seçici (Geniş Kartlar vs Sofascore Kompakt Liste) */}
        <div className="inline-flex p-0.5 rounded-xl bg-court-card border border-court-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "cards"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Geniş Kartlar</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("compact")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === "compact"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Kompakt Tablo (Sofascore)</span>
          </button>
        </div>
      </div>

    </div>
  );
};
