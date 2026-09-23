"use client";

import React, { useState, useMemo } from "react";
import {
  GROUP_STATUS_CONFIGS,
  GROUP_STATUS_LIST,
  GroupStatusKey,
  GroupStatusItem,
} from "@/utils/groupStatus";
import {
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { trLower, trIncludes } from "@/utils/turkishLocale";

interface GroupStatusViewProps {
  initialGroups?: GroupStatusItem[];
  selectedCity?: string;
  onSelectCity?: (citySlug: string) => void;
  citiesList?: Array<{ name: string; slug: string }>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const GroupStatusView: React.FC<GroupStatusViewProps> = ({
  initialGroups = [],
  selectedCity = "all",
  onSelectCity,
  citiesList = [],
  onRefresh,
  isLoading = false,
}) => {
  const [groups, setGroups] = useState<GroupStatusItem[]>(initialGroups);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<GroupStatusKey | "all">("all");
  const [cityFilter, setCityFilter] = useState(selectedCity || "all");
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({});

  // Eğer initialGroups boşsa veya şehir değiştiyse API'den yükle
  React.useEffect(() => {
    let isMounted = true;
    const loadGroupStatuses = async () => {
      setLoadingData(true);
      try {
        const query = cityFilter && cityFilter !== "all" ? `?city=${cityFilter}` : "";
        const res = await fetch(`/api/group-status${query}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.groups) {
            setGroups(json.groups);
          }
        }
      } catch (err) {
        console.error("Grup durumları yüklenirken hata oluştu:", err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadGroupStatuses();
    return () => {
      isMounted = false;
    };
  }, [cityFilter]);

  // Durum Sayaçları (Legend rozetleri için)
  const statusCounts = useMemo(() => {
    const counts: Record<GroupStatusKey, number> = {
      all_dated_entered: 0,
      partial: 0,
      not_entered: 0,
      no_matches: 0,
      teams_only: 0,
      all_program_entered: 0,
      finished: 0,
    };
    for (const g of groups) {
      if (counts[g.statusKey] !== undefined) {
        counts[g.statusKey]++;
      }
    }
    return counts;
  }, [groups]);

  // Arama ve Filtreleme
  const filteredGroups = useMemo(() => {
    return groups.filter((item) => {
      // Durum Filtresi
      if (selectedStatus !== "all" && item.statusKey !== selectedStatus) {
        return false;
      }

      // Arama Metni Filtresi (İl, Kategori, Grup veya Takım adı)
      if (searchQuery.trim()) {
        const q = trLower(searchQuery.trim());
        const matchCity = trIncludes(item.city, q);
        const matchCategory = trIncludes(item.category, q);
        const matchGroup = trIncludes(item.group, q);
        const matchTeams = item.teams?.some((t) => trIncludes(t, q));
        if (!matchCity && !matchCategory && !matchGroup && !matchTeams) {
          return false;
        }
      }

      return true;
    });
  }, [groups, selectedStatus, searchQuery]);

  // İllere göre gruplandırılmış liste
  const cityGroups = useMemo(() => {
    const map = new Map<string, GroupStatusItem[]>();
    for (const item of filteredGroups) {
      const list = map.get(item.city) || [];
      list.push(item);
      map.set(item.city, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "tr"));
  }, [filteredGroups]);

  const toggleCityExpand = (cityName: string) => {
    setExpandedCities((prev) => ({
      ...prev,
      [cityName]: !prev[cityName],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const [cityName] of cityGroups) {
      next[cityName] = true;
    }
    setExpandedCities(next);
  };

  const collapseAll = () => {
    setExpandedCities({});
  };

  return (
    <div className="space-y-6">
      {/* 1. ÜST BİLGİ VE BAŞLIK KARTI */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0d1628] to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/20 text-rose-300 border border-primary/30">
                <Layers size={12} />
                Volleybox Veri Entegrasyonu
              </span>
              <span className="text-xs text-slate-500 font-mono">• Canlı Takip</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Grup & Fikstür Giriş Durumu
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Türkiye genelinde 81 ilin voleybol altyapı liglerinde (Genç & Yıldız Kızlar) hangi grupların
              Volleybox platformuna girildiğini, kısmi durumlarını ve lig sonuçlarını takip edin.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading || loadingData}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                title="Verileri Yenile"
              >
                <RefreshCw size={14} className={isLoading || loadingData ? "animate-spin text-primary" : ""} />
                <span>Yenile</span>
              </button>
            )}

            <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Toplam Grup</div>
              <div className="text-lg font-black text-white font-mono">{groups.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GÖRSELDEKİ RESMİ 7 RENK KODU LEJANTI & İNTERAKTİF FİLTRELER */}
      <div className="bg-[#0f172a]/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Renk Kodları ve Durum Filtresi
            </h2>
          </div>
          {selectedStatus !== "all" && (
            <button
              onClick={() => setSelectedStatus("all")}
              className="text-xs text-primary hover:underline font-semibold self-start sm:self-auto cursor-pointer"
            >
              Filtreyi Temizle (Tümünü Göster)
            </button>
          )}
        </div>

        {/* 7 Renk Kartı Grid - Kullanıcının Yüklediği Görseldeki Sıralama & Renkler */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Tümü Butonu */}
          <button
            onClick={() => setSelectedStatus("all")}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedStatus === "all"
                ? "bg-slate-700/90 border-slate-500 shadow-md ring-1 ring-slate-400"
                : "bg-slate-800/60 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-4 h-4 rounded-md bg-gradient-to-tr from-slate-600 to-slate-400 shrink-0 border border-slate-500/50" />
              <span className="text-xs font-bold text-slate-200 truncate">Tümü (Hepsi)</span>
            </div>
            <span className="text-[11px] font-mono font-bold bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 shrink-0 ml-2">
              {groups.length}
            </span>
          </button>

          {/* 7 Durum Butonu */}
          {GROUP_STATUS_LIST.map((cfg) => {
            const isSelected = selectedStatus === cfg.key;
            const count = statusCounts[cfg.key] || 0;

            return (
              <button
                key={cfg.key}
                onClick={() => setSelectedStatus(isSelected ? "all" : cfg.key)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "shadow-md ring-2 ring-white/50"
                    : "hover:brightness-110 opacity-90 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: cfg.hex,
                  borderColor: isSelected ? "#ffffff" : "rgba(0,0,0,0.25)",
                  color: cfg.textColor,
                }}
                title={`${cfg.label} (${count} grup)`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-sm border shrink-0"
                    style={{
                      backgroundColor: cfg.hex,
                      borderColor: cfg.textColor === "#ffffff" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                    }}
                  />
                  <span className="text-xs font-bold truncate leading-tight">
                    {cfg.label}
                  </span>
                </div>
                <span
                  className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                  style={{
                    backgroundColor: cfg.textColor === "#ffffff" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.7)",
                    color: cfg.textColor,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ARAMA VE İL FİLTRELEME ÇUBUĞU */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-xl">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İl, kategori, grup veya takım ara (örn: Bursa, VakıfBank, A Grubu)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* İl Seçici Dropdown */}
          <div className="w-36 sm:w-48 shrink-0">
            <select
              value={cityFilter}
              onChange={(e) => {
                const nextCity = e.target.value;
                setCityFilter(nextCity);
                if (onSelectCity) onSelectCity(nextCity);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">Tüm İller (81 İl)</option>
              {citiesList.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toplu Aç/Kapa Butonları */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold text-slate-400">
          <span>Gösterilen: <strong className="text-white font-mono">{filteredGroups.length}</strong> grup ({cityGroups.length} il)</span>
          <span className="text-slate-600">•</span>
          <button
            onClick={expandAll}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Tümünü Aç
          </button>
          <span>/</span>
          <button
            onClick={collapseAll}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* 4. İLLERE GÖRE LİSTE TABLOLARI */}
      {loadingData ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <RefreshCw size={28} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Grup ve lig durumları taranıyor...</p>
        </div>
      ) : cityGroups.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <AlertCircle size={32} className="text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Kriterlere Uygun Grup Bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Arama metnini veya seçtiğiniz renk/durum filtresini değiştirerek tekrar deneyebilirsiniz.
          </p>
          {(selectedStatus !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus("all");
                setSearchQuery("");
                setCityFilter("all");
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-md"
            >
              Filtreleri Sıfırla
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {cityGroups.map(([cityName, items]) => {
            const isCollapsed = expandedCities[cityName] === false; // Varsayılan olarak açık
            const hasMultipleGroups = items.length > 1;

            return (
              <div
                key={cityName}
                className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md transition-all hover:border-slate-700/80"
              >
                {/* Şehir Başlığı / Akordeon Barı */}
                <div
                  onClick={() => toggleCityExpand(cityName)}
                  className="flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-800/90 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-primary" />
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      {cityName}
                    </h3>
                    <span className="text-[11px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                      {items.length} {items.length === 1 ? "Grup" : "Grup"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Küçük Durum Noktaları Özeti */}
                    <div className="hidden sm:flex items-center gap-1 mr-2">
                      {items.map((it, idx) => (
                        <span
                          key={idx}
                          className="w-2.5 h-2.5 rounded-full shadow-xs"
                          style={{ backgroundColor: it.statusHex }}
                          title={`${it.category} - ${it.group}: ${it.statusLabel}`}
                        />
                      ))}
                    </div>

                    <button className="text-slate-400 hover:text-white p-1">
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                  </div>
                </div>

                {/* Grup Tablosu */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800/80">
                        <tr>
                          <th className="py-2.5 px-3 sm:px-4">Kategori & Grup</th>
                          <th className="py-2.5 px-3 sm:px-4">Takımlar</th>
                          <th className="py-2.5 px-3 sm:px-4 text-center">Maç Durumu</th>
                          <th className="py-2.5 px-3 sm:px-4 text-center">Volleybox</th>
                          <th className="py-2.5 px-3 sm:px-4 text-right">Durum (Renk Kodu)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {items.map((g) => {
                          const config = GROUP_STATUS_CONFIGS[g.statusKey];

                          return (
                            <tr
                              key={g.id}
                              className="hover:bg-slate-800/40 transition-colors"
                            >
                              {/* Kategori ve Grup */}
                              <td className="py-3 px-3 sm:px-4">
                                <div className="font-semibold text-white text-xs sm:text-sm">
                                  {g.group}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <Trophy size={11} className="text-amber-400/80" />
                                  <span>{g.category}</span>
                                </div>
                              </td>

                              {/* Takım Sayısı ve İsimleri */}
                              <td className="py-3 px-3 sm:px-4 max-w-xs">
                                <div className="flex items-center gap-1.5 text-xs text-slate-200">
                                  <Users size={12} className="text-slate-400" />
                                  <span className="font-mono font-bold text-white">
                                    {g.teamsCount > 0 ? `${g.teamsCount} Takım` : "Belirtilmedi"}
                                  </span>
                                </div>
                                {g.teams && g.teams.length > 0 && (
                                  <div className="text-[10px] text-slate-500 truncate mt-0.5" title={g.teams.join(", ")}>
                                    {g.teams.slice(0, 3).join(", ")}
                                    {g.teams.length > 3 && ` +${g.teams.length - 3}`}
                                  </div>
                                )}
                              </td>

                              {/* Maç Durumu */}
                              <td className="py-3 px-3 sm:px-4 text-center">
                                {g.totalMatches > 0 ? (
                                  <div className="inline-flex flex-col items-center">
                                    <div className="font-mono text-xs font-bold text-slate-200">
                                      <span className="text-emerald-400">{g.syncedMatches}</span>
                                      <span className="text-slate-500"> / </span>
                                      <span>{g.totalMatches}</span>
                                      <span className="text-[10px] text-slate-400 font-normal ml-1">maç</span>
                                    </div>
                                    {g.finishedMatches > 0 && (
                                      <span className="text-[10px] text-purple-400 font-mono">
                                        ({g.finishedMatches} bitti)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px] italic">Fikstür yok</span>
                                )}
                              </td>

                              {/* Volleybox Turnuva Linki */}
                              <td className="py-3 px-3 sm:px-4 text-center">
                                {g.tournamentUrl ? (
                                  <a
                                    href={g.tournamentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1f497d]/20 hover:bg-[#1f497d]/40 text-blue-300 hover:text-white border border-[#1f497d]/40 text-[11px] font-semibold transition-all"
                                    title="Volleybox Turnuva Sayfasını Aç"
                                  >
                                    <ExternalLink size={11} />
                                    <span>Turnuva</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-600 text-[11px]">-</span>
                                )}
                              </td>

                              {/* Durum Rozeti (Kullanıcının Görselindeki Renk & Metinle Birebir) */}
                              <td className="py-3 px-3 sm:px-4 text-right">
                                <div className="inline-flex items-center justify-end">
                                  <span
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm border whitespace-nowrap"
                                    style={{
                                      backgroundColor: g.statusHex,
                                      color: g.statusTextColor,
                                      borderColor: g.statusTextColor === "#ffffff" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                                    }}
                                  >
                                    {g.statusLabel}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
