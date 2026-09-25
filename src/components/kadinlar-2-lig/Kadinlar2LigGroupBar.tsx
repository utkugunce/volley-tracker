"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { MapPin, ChevronDown, Search, Check, Layers } from "lucide-react";
import { Kadinlar2LigGroup, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import { trIncludes, trLower } from "@/utils/turkishLocale";

interface Kadinlar2LigGroupBarProps {
  groups: Kadinlar2LigGroup[];
  selectedGroup: number;
  onSelectGroup: (groupNo: number) => void;
  allMatches?: Kadinlar2LigMatch[];
}

/**
 * TVF şehir isimlerini Türkçe kurallarına uygun biçimlendirir.
 * Örn: "ADANA" -> "Adana", "K.MARAŞ" -> "Kahramanmaraş", "İSTANBUL" -> "İstanbul"
 */
function formatCityName(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const up = trimmed.toUpperCase();
  if (up === "K.MARAŞ" || up === "KMARAS" || up === "KAHRAMANMARAŞ") {
    return "Kahramanmaraş";
  }
  const lower = trimmed.toLocaleLowerCase("tr");
  return lower.charAt(0).toLocaleUpperCase("tr") + lower.slice(1);
}

export const Kadinlar2LigGroupBar: React.FC<Kadinlar2LigGroupBarProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  allMatches,
}) => {
  // 1. İller ve Gruplar Arası İlişkiyi Haritalandır
  const { distinctCities, cityToGroups, groupToCities } = useMemo(() => {
    const cityMap = new Map<string, Set<number>>();
    const groupMap = new Map<number, Set<string>>();

    const matches =
      allMatches && allMatches.length > 0
        ? allMatches
        : groups.flatMap((g) => g.fikstur || []);

    matches.forEach((m) => {
      if (m.sehir && m.grup_no) {
        const c = formatCityName(m.sehir);
        if (c) {
          if (!cityMap.has(c)) cityMap.set(c, new Set());
          cityMap.get(c)!.add(m.grup_no);

          if (!groupMap.has(m.grup_no)) groupMap.set(m.grup_no, new Set());
          groupMap.get(m.grup_no)!.add(c);
        }
      }
    });

    const sortedCities = Array.from(cityMap.keys()).sort((a, b) =>
      a.localeCompare(b, "tr", { numeric: true })
    );

    return {
      distinctCities: sortedCities,
      cityToGroups: cityMap,
      groupToCities: groupMap,
    };
  }, [groups, allMatches]);

  // Seçili İl Durumu (Varsayılan olarak geçerli grubun ilk şehri veya Tüm İller)
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    const citiesOfCurrent = groupToCities.get(selectedGroup);
    if (citiesOfCurrent && citiesOfCurrent.size > 0) {
      return Array.from(citiesOfCurrent)[0];
    }
    return "Tüm İller";
  });

  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState<boolean>(false);
  const [citySearchTerm, setCitySearchTerm] = useState<string>("");
  const [isCategoryGroupOpen, setIsCategoryGroupOpen] = useState<boolean>(true);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dışarıdan (URL veya başka bileşenden) selectedGroup değişirse şehri senkronize et
  useEffect(() => {
    if (selectedCity && selectedCity !== "Tüm İller") {
      const allowedGroups = cityToGroups.get(selectedCity);
      if (allowedGroups && !allowedGroups.has(selectedGroup)) {
        const citiesOfNewGroup = groupToCities.get(selectedGroup);
        if (citiesOfNewGroup && citiesOfNewGroup.size > 0) {
          setSelectedCity(Array.from(citiesOfNewGroup)[0]);
        } else {
          setSelectedCity("Tüm İller");
        }
      }
    }
  }, [selectedGroup, cityToGroups, groupToCities, selectedCity]);

  // İl Arama Filtresi (Türkçe karakter ve ASCII toleranslı)
  const filteredCities = useMemo(() => {
    const all = ["Tüm İller", ...distinctCities];
    if (!citySearchTerm.trim()) return all;
    const q = trLower(citySearchTerm).trim();
    return all.filter((c) => trIncludes(c, q));
  }, [distinctCities, citySearchTerm]);

  // Şehir seçildiğinde
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setIsCityDropdownOpen(false);
    setCitySearchTerm("");
    setIsCategoryGroupOpen(true); // "ili seçince altındaki kategori grup kısmı da açılsın"

    if (cityName !== "Tüm İller") {
      const groupsOfCity = cityToGroups.get(cityName);
      if (groupsOfCity && groupsOfCity.size > 0) {
        // Eğer seçili grup bu ilin gruplarında yoksa ilk grubu aktif yap
        if (!groupsOfCity.has(selectedGroup)) {
          const firstGrup = Array.from(groupsOfCity).sort((a, b) => a - b)[0];
          onSelectGroup(firstGrup);
        }
      }
    }
  };

  // Seçili şehre göre gösterilecek gruplar
  const availableGroups = useMemo(() => {
    if (!selectedCity || selectedCity === "Tüm İller") {
      return groups;
    }
    const allowed = cityToGroups.get(selectedCity);
    if (!allowed || allowed.size === 0) {
      return groups;
    }
    return groups.filter((g) => allowed.has(g.grup_no));
  }, [selectedCity, cityToGroups, groups]);

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 shadow-card no-print space-y-3">
      {/* 1. İL SEÇİMİ (Açılır Menü / Dropdown) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 shrink-0">
            <MapPin size={13} className="text-rose-400 shrink-0" />
            İL:
          </span>

          {/* Şehir Seçim Dropdown Menüsü */}
          <div className="relative" ref={cityDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              aria-expanded={isCityDropdownOpen}
              aria-haspopup="listbox"
              aria-label={selectedCity || "İl Seçiniz"}
              className="flex items-center justify-between gap-2.5 bg-slate-900/90 hover:bg-slate-850 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm active:scale-95 cursor-pointer min-w-[210px] sm:min-w-[240px] focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-2xs" />
                <span className="text-white font-extrabold truncate text-[13px]">
                  {selectedCity || "Tüm İller"}
                </span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {distinctCities.length} İl
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 text-slate-400 ${
                    isCityDropdownOpen ? "rotate-180 text-rose-400" : ""
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Açılır Menü */}
            {isCityDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-[#0f172a] border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Arama Inputu */}
                <div className="p-2.5 border-b border-slate-800 bg-[#0b1325]">
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="İl ara (örn: Ankara, İstanbul, İzmir)..."
                      value={citySearchTerm}
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/70 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-slate-500"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Şehirler Listesi */}
                <div
                  className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar"
                  role="listbox"
                >
                  {filteredCities.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Eşleşen il bulunamadı.
                    </div>
                  ) : (
                    filteredCities.map((cityName) => {
                      const isSelected = selectedCity === cityName;
                      const groupCount =
                        cityName === "Tüm İller"
                          ? groups.length
                          : cityToGroups.get(cityName)?.size || 0;

                      return (
                        <button
                          key={cityName}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleCitySelect(cityName)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-red-600/20 text-rose-300 font-bold border border-red-500/40"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected
                                  ? "bg-rose-500 shadow-glow-red"
                                  : "bg-slate-600"
                              }`}
                            />
                            <span className="truncate">{cityName}</span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-400 border border-slate-700/50">
                              {groupCount} Grup
                            </span>
                            {isSelected && (
                              <Check
                                size={14}
                                className="text-rose-400 shrink-0"
                              />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seçili İl ve Açılır/Kapanır Gösterge */}
        {selectedCity && (
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-400">
            <span className="text-[11px] font-medium text-slate-400">
              Seçili İl: <strong className="text-white font-bold">{selectedCity}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsCategoryGroupOpen(!isCategoryGroupOpen)}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60"
            >
              <span>{isCategoryGroupOpen ? "Filtreleri Gizle" : "Kategori & Grupları Aç"}</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${
                  isCategoryGroupOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* 2. KATEGORİ, LİG VE GRUP SEÇİCİ BÖLÜMÜ (İl seçilince açılır) */}
      {isCategoryGroupOpen ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Lig Seçimi */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase min-w-[55px] sm:min-w-[65px] flex items-center gap-1">
              <Layers size={12} className="text-amber-400 shrink-0" />
              Lig:
            </span>
            <button
              type="button"
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red ring-2 ring-red-500/30 cursor-default"
            >
              <span>Kadınlar 2. Ligi</span>
            </button>
          </div>

          {/* Grup Seçimi */}
          {availableGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-800/80">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase min-w-[55px] sm:min-w-[65px]">
                Grup:
              </span>
              {availableGroups.map((grp) => {
                const isActive = selectedGroup === grp.grup_no;
                return (
                  <button
                    key={grp.grup_no}
                    type="button"
                    onClick={() => onSelectGroup(grp.grup_no)}
                    title={`Kadınlar 2. Ligi ${grp.grup_adi}`}
                    className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red ring-2 ring-red-500/30"
                        : "glass-panel text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-700/60"
                    }`}
                  >
                    <span>Grup {grp.grup_no}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-800 text-slate-400 border border-slate-700/60"
                      }`}
                    >
                      {grp.takim_sayisi}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
          Kategori ve grup filtreleri gizlendi. Açmak için yukarıdaki butona tıklayabilirsiniz.
        </div>
      )}
    </div>
  );
};
