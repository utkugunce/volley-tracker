"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  MapPin,
  Users,
  Trophy,
  ArrowRight,
  Sparkles,
  Command,
} from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { slugify } from "@/utils/slugify";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { triggerHaptic } from "@/utils/haptics";

interface SpotlightItem {
  id: string;
  type: "team" | "hall" | "city" | "category";
  title: string;
  subtitle?: string;
  action: () => void;
  logo?: string | null;
}

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams?: string[];
  halls?: string[];
  cities?: { name: string; slug: string }[];
  categories?: string[];
  onSelectCity?: (slug: string) => void;
  onSelectCategory?: (category: string) => void;
  onSelectHall?: (hall: string) => void;
}

export const SpotlightSearchModal: React.FC<SpotlightSearchModalProps> = ({
  isOpen,
  onClose,
  teams = [],
  halls = [],
  cities = [],
  categories = [],
  onSelectCity,
  onSelectCategory,
  onSelectHall,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Otomatik focus
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Arama sonuçları
  const results = useMemo<SpotlightItem[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Varsayılan popüler aramalar / öneriler
      const quickTeams = teams.slice(0, 5).map((t) => {
        const mapping = getVolleyboxMapping(t);
        return {
          id: `team-${t}`,
          type: "team" as const,
          title: t,
          subtitle: "Takım Profili ve Kadrosu",
          logo: mapping?.local_logo || mapping?.logo_url,
          action: () => {
            router.push(`/takim/${slugify(mapping?.matched_as || t)}`);
            onClose();
          },
        };
      });
      return quickTeams;
    }

    const items: SpotlightItem[] = [];

    // 1. Takımlar
    teams.forEach((t) => {
      if (t.toLowerCase().includes(q)) {
        const mapping = getVolleyboxMapping(t);
        items.push({
          id: `team-${t}`,
          type: "team",
          title: t,
          subtitle: "Takım Profili ve Fikstürü",
          logo: mapping?.local_logo || mapping?.logo_url,
          action: () => {
            router.push(`/takim/${slugify(mapping?.matched_as || t)}`);
            onClose();
          },
        });
      }
    });

    // 2. Salonlar
    halls.forEach((h) => {
      if (h !== "Tümü" && h.toLowerCase().includes(q)) {
        items.push({
          id: `hall-${h}`,
          type: "hall",
          title: h,
          subtitle: "Müsabaka Salonu",
          action: () => {
            onSelectHall?.(h);
            onClose();
          },
        });
      }
    });

    // 3. Şehirler
    cities.forEach((c) => {
      if (c.name.toLowerCase().includes(q)) {
        items.push({
          id: `city-${c.slug}`,
          type: "city",
          title: `${c.name} İl Temsilciliği`,
          subtitle: "Şehir Fikstürüne Geç",
          action: () => {
            onSelectCity?.(c.slug);
            onClose();
          },
        });
      }
    });

    // 4. Kategoriler
    categories.forEach((cat) => {
      if (cat !== "Tümü" && cat.toLowerCase().includes(q)) {
        items.push({
          id: `cat-${cat}`,
          type: "category",
          title: cat,
          subtitle: "Lig / Kategori Filtresi",
          action: () => {
            onSelectCategory?.(cat);
            onClose();
          },
        });
      }
    });

    return items.slice(0, 15);
  }, [query, teams, halls, cities, categories, router, onClose, onSelectHall, onSelectCity, onSelectCategory]);

  // Klavye kısayolları (ArrowUp, ArrowDown, Enter, ESC)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          triggerHaptic("selection");
          results[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-3 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#080c14] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arama Input Alanı */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search size={18} className="text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Takım, salon veya şehir ara..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Sonuç Listesi */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.type === "team" ? (
                      <TeamBadge name={item.title} logoUrl={item.logo} size="sm" />
                    ) : item.type === "hall" ? (
                      <div className="w-7 h-7 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                        <MapPin size={13} />
                      </div>
                    ) : item.type === "city" ? (
                      <div className="w-7 h-7 rounded-full bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                        <Trophy size={13} />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                        <Users size={13} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    size={14}
                    className={`shrink-0 transition-transform ${
                      isSelected ? "text-primary translate-x-1" : "text-slate-600"
                    }`}
                  />
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              "{query}" için eşleşen takım, salon veya şehir bulunamadı.
            </div>
          )}
        </div>

        {/* Alt Kısayol Bilgilendirmesi */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ ile Gezin</span>
            <span>↵ ile Seç</span>
          </div>
          <span className="hidden sm:inline">Global Spotlight</span>
        </div>
      </div>
    </div>
  );
};
