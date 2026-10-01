"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Star, 
  MapPin, 
  ChevronRight, 
  ChevronDown, 
  Flame, 
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { CityInfo } from "@/types/fixture";

interface LeftSidebarPlaceholderProps {
  cities?: CityInfo[];
  currentCity?: string;
  onSelectCity?: (citySlug: string) => void;
  favoritesCount?: number;
  totalMatches?: number;
}

export const LeftSidebarPlaceholder: React.FC<LeftSidebarPlaceholderProps> = ({
  cities = [],
  currentCity = "all",
  onSelectCity,
  favoritesCount = 0,
  totalMatches = 0,
}) => {
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [isCitiesOpen, setIsCitiesOpen] = useState(true);

  // Popüler / öncelikli iller
  const popularCitySlugs = ["istanbul", "ankara", "izmir", "bursa", "antalya", "eskisehir", "canakkale"];

  return (
    <div className="flex flex-col h-full text-xs select-none">
      {/* 1. Üst Başlık */}
      <div className="px-3.5 py-3 border-b border-[#2A2E3D] flex items-center justify-between bg-[#1E222D]/90">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Trophy size={13} />
          </div>
          <div>
            <h2 className="font-bold text-white text-[13px] tracking-wide">Lig Navigasyonu</h2>
            <p className="text-[10px] text-[#94A3B8]">TVF Altyapı & Lig Ağacı</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-[#121212] text-blue-400 px-1.5 py-0.5 rounded border border-[#2A2E3D]">
          {totalMatches > 0 ? `${totalMatches} Maç` : "81 İl"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
        {/* 2. Sabitlenen Favoriler & Kısayollar */}
        <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-2 space-y-1.5">
          <button
            type="button"
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-[#94A3B8] hover:text-white px-1.5 py-1 rounded transition-colors"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Star size={12} className="text-amber-400 fill-amber-400/20" />
              <span>Favoriler & Hızlı Erişim</span>
            </span>
            {isFavoritesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {isFavoritesOpen && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#1E222D]/60 hover:bg-[#1E222D] border border-transparent hover:border-[#2A2E3D] text-[#F1F5F9] transition-all">
                <span className="flex items-center gap-2">
                  <Star size={12} className="text-amber-400" />
                  <span className="font-medium">Takip Edilen Maçlar</span>
                </span>
                <span className="font-mono text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  {favoritesCount}
                </span>
              </div>

              {/* Kadınlar 2. Ligi Hızlı Bağlantısı */}
              <Link
                href="/kadinlar-2-ligi"
                className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/40 text-purple-200 transition-all group"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  <span className="font-semibold group-hover:text-white">TVF Kadınlar 2. Ligi</span>
                </span>
                <span className="text-[10px] text-purple-400 font-mono">16 Grup →</span>
              </Link>
            </div>
          )}
        </div>

        {/* 3. Popüler İller & Hiyerarşik Ağaç Önizleme */}
        <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-2 space-y-1.5">
          <button
            type="button"
            onClick={() => setIsCitiesOpen(!isCitiesOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-[#94A3B8] hover:text-white px-1.5 py-1 rounded transition-colors"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <MapPin size={12} className="text-blue-400" />
              <span>İl Temsilcilikleri</span>
            </span>
            {isCitiesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {isCitiesOpen && (
            <div className="space-y-0.5 pt-1">
              {/* Tüm İller Butonu */}
              <button
                type="button"
                onClick={() => onSelectCity?.("all")}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-all ${
                  currentCity === "all" || !currentCity
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold"
                    : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E222D]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Layers size={12} className="text-blue-400" />
                  <span>Tüm İller (81 İl)</span>
                </span>
                <span className="font-mono text-[10px] text-[#94A3B8]">Türkiye</span>
              </button>

              {popularCitySlugs.map((slug) => {
                const cityData = cities.find((c) => c.slug === slug);
                const cityName = cityData ? cityData.name : slug.charAt(0).toUpperCase() + slug.slice(1);
                const count = cityData?.matches_count || 0;
                const isActive = currentCity === slug;

                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => onSelectCity?.(slug)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold"
                        : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E222D]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-blue-400" : "bg-[#2A2E3D]"}`} />
                      <span className="truncate">{cityName}</span>
                    </span>
                    {count > 0 && (
                      <span className="font-mono text-[10px] text-[#94A3B8] shrink-0">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Yaş Kategorileri Önizleme */}
        <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold mb-2 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            <span>Kategoriler</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <span className="px-2 py-1 rounded bg-[#1E222D] text-[#F1F5F9] border border-[#2A2E3D] text-center font-medium">
              Genç (U18)
            </span>
            <span className="px-2 py-1 rounded bg-[#1E222D] text-[#F1F5F9] border border-[#2A2E3D] text-center font-medium">
              Yıldız (U16)
            </span>
            <span className="px-2 py-1 rounded bg-[#1E222D] text-[#94A3B8] border border-[#2A2E3D] text-center">
              Küçük (U14)
            </span>
            <span className="px-2 py-1 rounded bg-[#1E222D] text-[#94A3B8] border border-[#2A2E3D] text-center">
              Midi (U12)
            </span>
          </div>
        </div>

        {/* 5. Faz 2 Bilgi Rozeti */}
        <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-300 flex items-start gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0 animate-ping" />
          <p className="text-[10px] text-[#94A3B8] leading-tight">
            <strong className="text-blue-300">Aşama 1:</strong> 3 kolonlu düzen aktif. Aşama 2&apos;de bu sol panele tam hiyerarşik lig ağacı (Tree/Accordion) entegre edilecektir.
          </p>
        </div>
      </div>
    </div>
  );
};
