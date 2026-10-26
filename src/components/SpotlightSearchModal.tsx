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
} from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { slugify } from "@/utils/slugify";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { triggerHaptic } from "@/utils/haptics";
import { trLower, trIncludes } from "@/utils/turkishLocale";

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
  const [typeFilter, setTypeFilter] = useState<"all" | "team" | "city" | "hall">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTypeFilter("all");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = useMemo<SpotlightItem[]>(() => {
    const q = trLower(query).trim();
    if (!q) {
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
      return quickTeams.filter((item) => typeFilter === "all" || item.type === typeFilter);
    }

    const items: SpotlightItem[] = [];

    // 1. Takımlar
    if (typeFilter === "all" || typeFilter === "team") {
      teams.forEach((t) => {
        if (trIncludes(t, q)) {
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
    }

    // 2. Salonlar
    if (typeFilter === "all" || typeFilter === "hall") {
      halls.forEach((h) => {
        if (h !== "Tümü" && trIncludes(h, q)) {
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
    }

    // 3. Şehirler
    if (typeFilter === "all" || typeFilter === "city") {
      cities.forEach((c) => {
        if (trIncludes(c.name, q)) {
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
    }

    // 4. Kategoriler & Kadınlar 2. Ligi kısayolu
    if (typeFilter === "all") {
      if (trIncludes("TVF Kadınlar 2. Ligi", q) || trIncludes("2. Lig", q)) {
        items.push({
          id: "cat-kadinlar-2-ligi",
          type: "category",
          title: "TVF Kadınlar 2. Ligi (16 Grup)",
          subtitle: "Ulusal Lig Paneline Geç",
          action: () => {
            router.push("/kadinlar-2-ligi");
            onClose();
          },
        });
      }
      categories.forEach((cat) => {
        if (cat !== "Tümü" && trIncludes(cat, q)) {
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
    }

    return items.slice(0, 15);
  }, [query, typeFilter, teams, halls, cities, categories, router, onClose, onSelectHall, onSelectCity, onSelectCategory]);

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
      role="dialog"
      aria-modal="true"
      aria-label="Hızlı Arama"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-3 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arama Input Alanı */}
        <div className="relative flex items-center px-4 py-3 border-b border-line/70 bg-surface-muted/40">
          <Search size={17} className="text-ink-3 shrink-0 mr-3" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            aria-label="Takım, salon veya şehir ara"
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Takım, salon veya şehir ara..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-ink-3 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Aramayı temizle"
              className="p-1 rounded-lg text-ink-3 hover:text-white cursor-pointer"
            >
              <X size={15} aria-hidden="true" />
            </button>
          ) : (
            <kbd
              className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-ink-3 bg-surface-muted px-2 py-0.5 rounded border border-line/70"
              aria-hidden="true"
            >
              ESC
            </kbd>
          )}
        </div>

        {/* Hızlı Tür Filtresi Şeridi */}
        <div className="px-3 py-1.5 border-b border-line/50 bg-surface flex items-center gap-1 text-[11px]">
          {(
            [
              { id: "all", label: "Tümü" },
              { id: "team", label: "Takımlar" },
              { id: "city", label: "Şehirler" },
              { id: "hall", label: "Salonlar" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setTypeFilter(f.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === f.id
                  ? "bg-primary text-primary-fg font-semibold"
                  : "text-ink-2 hover:text-white hover:bg-surface-muted/60 font-medium"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sonuç Listesi */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
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
                  className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-surface-muted text-white"
                      : "text-ink-2 hover:bg-surface-muted/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.type === "team" ? (
                      <TeamBadge name={item.title} logoUrl={item.logo} size="sm" />
                    ) : item.type === "hall" ? (
                      <div className="w-7 h-7 rounded-lg bg-surface-muted text-ink-2 flex items-center justify-center shrink-0 border border-line/70">
                        <MapPin size={13} />
                      </div>
                    ) : item.type === "city" ? (
                      <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Trophy size={13} />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-surface-muted text-ink-2 flex items-center justify-center shrink-0 border border-line/70">
                        <Users size={13} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-white truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[10px] text-ink-3 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    size={14}
                    className={`shrink-0 transition-transform ${
                      isSelected ? "text-primary translate-x-0.5" : "text-ink-3"
                    }`}
                  />
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-ink-3">
              &quot;{query}&quot; için eşleşen takım, salon veya şehir bulunamadı.
            </div>
          )}
        </div>

        {/* Alt Kısayol Bilgilendirmesi */}
        <div className="px-4 py-2 bg-surface-muted/40 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-3">
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
