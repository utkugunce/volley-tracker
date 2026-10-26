"use client";

import React, { useState, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import {
  GROUP_STATUS_LIST,
  GroupStatusKey,
  GroupStatusItem,
} from "@/utils/groupStatus";
import {
  ExternalLink,
  Search,
  Filter,
  AlertCircle,
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
}) => {
  const [groups, setGroups] = useState<GroupStatusItem[]>(initialGroups);
  const [loadingData, setLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<GroupStatusKey | "all">("all");
  const [cityFilter, setCityFilter] = useState(selectedCity || "all");
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setCityFilter(selectedCity || "all");
  }, [selectedCity]);

  React.useEffect(() => {
    let isMounted = true;
    const loadGroupStatuses = async () => {
      setLoadingData(true);
      setFetchError(null);
      try {
        const query = cityFilter && cityFilter !== "all" ? `?city=${cityFilter}` : "";
        const res = await fetch(`/api/group-status${query}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (isMounted && json.groups) {
          setGroups(json.groups);
        }
      } catch (err) {
        console.error("Grup durumları yüklenirken hata oluştu:", err);
        if (isMounted) {
          setFetchError("Grup durum verileri yüklenirken bir bağlantı hatası oluştu.");
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadGroupStatuses();
    return () => {
      isMounted = false;
    };
  }, [cityFilter, retryKey]);

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

  const filteredGroups = useMemo(() => {
    return groups.filter((item) => {
      if (selectedStatus !== "all" && item.statusKey !== selectedStatus) {
        return false;
      }

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
      [cityName]: prev[cityName] === false ? true : false,
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
    const next: Record<string, boolean> = {};
    for (const [cityName] of cityGroups) {
      next[cityName] = false;
    }
    setExpandedCities(next);
  };

  return (
    <div className="space-y-4">
      {/* 1. ÜST BİLGİ VE BAŞLIK KARTI */}
      <div className="bg-surface border border-line/70 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-muted text-ink-2 border border-line/60">
                <Layers size={11} className="text-primary" />
                Volleybox Veri Entegrasyonu
              </span>
              <span className="text-xs text-ink-3 font-mono">• Canlı Takip</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Grup & Fikstür Giriş Durumu
            </h1>
            <p className="text-xs text-ink-3 mt-1 max-w-2xl">
              Türkiye genelinde 81 ilin voleybol altyapı liglerinde (Genç & Yıldız Kızlar) hangi grupların
              Volleybox platformuna girildiğini, kısmi durumlarını ve lig sonuçlarını takip edin.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="px-3.5 py-2 rounded-xl bg-surface-muted/60 border border-line/60 text-center">
              <div className="text-[10px] uppercase font-semibold text-ink-3">Toplam Grup</div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">{groups.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RESMİ 7 RENK KODU LEJANTI & İNTERAKTİF FİLTRELER */}
      <div className="bg-surface border border-line/70 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-primary" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedStatus === "all"
                ? "bg-surface-muted border-primary text-white"
                : "bg-surface-muted/50 border-line/60 hover:bg-surface-muted text-ink-2"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3.5 h-3.5 rounded-sm bg-primary shrink-0" />
              <span className="text-xs font-semibold truncate">Tümü (Hepsi)</span>
            </div>
            <span className="text-[11px] font-mono font-bold tabular-nums text-ink-2 shrink-0 ml-2">
              {groups.length}
            </span>
          </button>

          {GROUP_STATUS_LIST.map((cfg) => {
            const isSelected = selectedStatus === cfg.key;
            const count = statusCounts[cfg.key] || 0;

            return (
              <button
                key={cfg.key}
                onClick={() => setSelectedStatus(isSelected ? "all" : cfg.key)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected ? "ring-2 ring-ink/70" : "hover:brightness-105"
                }`}
                style={{
                  backgroundColor: cfg.hex,
                  borderColor: isSelected ? "#EAF6FA" : "rgba(7,19,31,0.45)",
                  color: cfg.textColor,
                }}
                title={`${cfg.label} (${count} grup)`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-sm border shrink-0"
                    style={{
                      backgroundColor: cfg.hex,
                      borderColor: cfg.textColor,
                    }}
                  />
                  <span className="text-xs font-bold truncate leading-tight">
                    {cfg.label}
                  </span>
                </div>
                <span
                  className="text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.45)",
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-line/70 p-3 rounded-xl">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İl, kategori, grup veya takım ara (örn: Bursa, VakıfBank, A Grubu)..."
              className="w-full bg-surface-muted/80 border border-line/70 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-ink-3 focus:outline-none focus:border-primary/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-3 hover:text-white cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          <div className="w-36 sm:w-48 shrink-0">
            <select
              aria-label="İl filtresi"
              value={cityFilter}
              onChange={(e) => {
                const nextCity = e.target.value;
                setCityFilter(nextCity);
                if (onSelectCity) onSelectCity(nextCity);
              }}
              className="w-full bg-surface-muted border border-line/70 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
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

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-medium text-ink-3">
          <span>
            Gösterilen: <strong className="text-white font-mono tabular-nums">{filteredGroups.length}</strong> grup ({cityGroups.length} il)
          </span>
          <span>•</span>
          <button onClick={expandAll} className="hover:text-white transition-colors cursor-pointer">
            Tümünü Aç
          </button>
          <span>/</span>
          <button onClick={collapseAll} className="hover:text-white transition-colors cursor-pointer">
            Kapat
          </button>
        </div>
      </div>

      {/* 4. İLLERE GÖRE LİSTE TABLOLARI */}
      {loadingData ? (
        <div className="text-center py-16 bg-surface border border-line/70 rounded-2xl">
          <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-xs font-semibold text-ink-2">Grup ve lig durumları taranıyor...</p>
        </div>
      ) : fetchError ? (
        <div className="text-center py-16 bg-surface border border-line/70 rounded-2xl p-6">
          <AlertCircle size={28} className="text-live mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">Veri Yüklenemedi</h3>
          <p className="text-xs text-ink-3 max-w-sm mx-auto mb-4">{fetchError}</p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-fg text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Tekrar Dene</span>
          </button>
        </div>
      ) : cityGroups.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-line/70 rounded-2xl p-6">
          <AlertCircle size={28} className="text-ink-3 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">Kriterlere Uygun Grup Bulunamadı</h3>
          <p className="text-xs text-ink-3 max-w-sm mx-auto">
            Arama metnini veya seçtiğiniz renk/durum filtresini değiştirerek tekrar deneyebilirsiniz.
          </p>
          {(selectedStatus !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus("all");
                setSearchQuery("");
                setCityFilter("all");
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-fg text-xs font-semibold transition-all cursor-pointer"
            >
              Filtreleri Sıfırla
            </button>
          )}
        </div>
      ) : (
        <Virtuoso
          useWindowScroll
          data={cityGroups}
          computeItemKey={(_, [cityName]) => cityName}
          increaseViewportBy={{ top: 600, bottom: 900 }}
          itemContent={(_, [cityName, items]) => {
            const isCollapsed = expandedCities[cityName] === false;

            return (
              <div className="pb-3">
                <div className="bg-surface border border-line/70 rounded-xl overflow-hidden transition-colors">
                  {/* Şehir Başlığı / Akordeon Barı */}
                  <div
                    onClick={() => toggleCityExpand(cityName)}
                    className="flex items-center justify-between px-4 py-2.5 bg-surface-muted/60 hover:bg-surface-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin size={15} className="text-primary" />
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {cityName}
                      </h3>
                      <span className="text-[11px] font-mono tabular-nums font-medium text-ink-3">
                        {items.length} Grup
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-1 mr-2">
                        {items.map((it, idx) => (
                          <span
                            key={idx}
                            className="w-2.5 h-2.5 rounded-full ring-1 ring-canvas/60"
                            style={{ backgroundColor: it.statusHex }}
                            title={`${it.category} - ${it.group}: ${it.statusLabel}`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        aria-label={isCollapsed ? "Grupları göster" : "Grupları gizle"}
                        aria-expanded={!isCollapsed}
                        className="text-ink-3 hover:text-white p-1"
                      >
                        {isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                      </button>
                    </div>
                  </div>

                  {/* Grup Tablosu */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`${cityName} grup durum tablosu`}>
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-muted/30 text-ink-3 uppercase text-[10px] font-semibold border-b border-line/60">
                          <tr>
                            <th className="py-2 px-3 sm:px-4">Kategori & Grup</th>
                            <th className="py-2 px-3 sm:px-4">Takımlar</th>
                            <th className="py-2 px-3 sm:px-4 text-center">Maç Durumu</th>
                            <th className="py-2 px-3 sm:px-4 text-center">Volleybox</th>
                            <th className="py-2 px-3 sm:px-4 text-right">Durum (Renk Kodu)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/40 text-ink-2">
                          {items.map((g) => {
                            const syncPct =
                              g.totalMatches > 0
                                ? Math.min(100, Math.round((g.syncedMatches / g.totalMatches) * 100))
                                : 0;

                            return (
                              <tr key={g.id} className="hover:bg-surface-muted/30 transition-colors">
                                {/* Kategori ve Grup */}
                                <td className="py-2.5 px-3 sm:px-4">
                                  <div className="font-semibold text-white text-xs">
                                    {g.group}
                                  </div>
                                  <div className="text-[11px] text-ink-3 flex items-center gap-1.5 mt-0.5">
                                    <Trophy size={11} className="text-primary" />
                                    <span>{g.category}</span>
                                  </div>
                                </td>

                                {/* Takım Sayısı ve İsimleri */}
                                <td className="py-2.5 px-3 sm:px-4 max-w-xs">
                                  <div className="flex items-center gap-1.5 text-xs text-ink">
                                    <Users size={12} className="text-ink-3" />
                                    <span className="font-mono tabular-nums font-semibold text-white">
                                      {g.teamsCount > 0 ? `${g.teamsCount} Takım` : "Belirtilmedi"}
                                    </span>
                                  </div>
                                  {g.teams && g.teams.length > 0 && (
                                    <div className="text-[10px] text-ink-3 truncate mt-0.5" title={g.teams.join(", ")}>
                                      {g.teams.slice(0, 3).join(", ")}
                                      {g.teams.length > 3 && ` +${g.teams.length - 3}`}
                                    </div>
                                  )}
                                </td>

                                {/* Maç Durumu & İlerleme Çubuğu */}
                                <td className="py-2.5 px-3 sm:px-4 text-center">
                                  {g.totalMatches > 0 ? (
                                    <div className="inline-flex flex-col items-center min-w-[100px]">
                                      <div className="font-mono tabular-nums text-xs font-semibold text-ink">
                                        <span className="text-done">{g.syncedMatches}</span>
                                        <span className="text-ink-3"> / </span>
                                        <span>{g.totalMatches}</span>
                                        <span className="text-[10px] text-ink-3 font-normal ml-1">maç</span>
                                      </div>
                                      <div className="w-20 h-1 bg-surface-muted rounded-full overflow-hidden mt-1">
                                        <div
                                          className="h-full bg-done rounded-full"
                                          style={{ width: `${syncPct}%` }}
                                        />
                                      </div>
                                      {g.finishedMatches > 0 && (
                                        <span className="text-[10px] text-ink-3 font-mono tabular-nums mt-0.5">
                                          ({g.finishedMatches} bitti)
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-ink-3 text-[11px]">Fikstür yok</span>
                                  )}
                                </td>

                                {/* Volleybox Turnuva Linki */}
                                <td className="py-2.5 px-3 sm:px-4 text-center">
                                  {g.tournamentUrl ? (
                                    <a
                                      href={g.tournamentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-muted hover:bg-panel text-ink hover:text-white border border-line/70 text-[11px] font-semibold transition-colors"
                                      title="Volleybox Turnuva Sayfasını Aç"
                                    >
                                      <ExternalLink size={11} />
                                      <span>Turnuva</span>
                                    </a>
                                  ) : (
                                    <span className="text-ink-3 text-[11px]">-</span>
                                  )}
                                </td>

                                {/* Durum Rozeti */}
                                <td className="py-2.5 px-3 sm:px-4 text-right">
                                  <div className="inline-flex items-center justify-end">
                                    <span
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border whitespace-nowrap"
                                      style={{
                                        backgroundColor: g.statusHex,
                                        color: g.statusTextColor,
                                        borderColor: "rgba(7,19,31,0.35)",
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
              </div>
            );
          }}
        />
      )}
    </div>
  );
};
