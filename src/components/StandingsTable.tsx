"use client";

import React, { useState, useMemo, useEffect } from "react";
import { StandingItem } from "@/types/fixture";
import { Trophy, HelpCircle, MapPin, Layers, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TeamVolleyboxLink } from "./TeamVolleyboxLink";
import { LeagueVolleyboxLink } from "./LeagueVolleyboxLink";
import { slugify } from "@/utils/slugify";

const TURKISH_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
  "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale",
  "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum",
  "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin",
  "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli",
  "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
  "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat",
  "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak",
  "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

interface ParsedStandingContext {
  rawKey: string;
  city: string;
  ageGroup: string; // "Genç (U18)", "Yıldız (U16)", "Küçük (U14)", "Genel"
  leagueTier: string; // "Süper Lig", "1. Lig", etc.
  leagueFullName: string; // e.g. "Genç Kızlar Süper Lig"
  rawGroup: string; // e.g. "Genç Kızlar Süper Lig 1. Grup" or "A Grubu"
  displayGroup: string; // e.g. "1. Grup" or "A Grubu"
}

function parseStandingKey(rawKey: string, defaultCity?: string): ParsedStandingContext {
  let rem = rawKey.trim();
  let city = defaultCity && defaultCity !== "Tüm İller" ? defaultCity : "";

  // 1. İl Tespiti
  for (const c of TURKISH_CITIES) {
    const prefix = `${c} - `;
    if (rem.startsWith(prefix)) {
      city = c;
      rem = rem.slice(prefix.length).trim();
      break;
    }
  }

  // 2. Yaş Grubu / Kategori Tespiti (Genç U18, Yıldız U16, vb.)
  const lowerRem = rem.toLocaleLowerCase("tr-TR");
  let ageGroup = "Genel";
  if (lowerRem.includes("genç") || lowerRem.includes("genc") || lowerRem.includes("u18")) {
    ageGroup = "Genç (U18)";
  } else if (lowerRem.includes("yıldız") || lowerRem.includes("yildiz") || lowerRem.includes("u16")) {
    ageGroup = "Yıldız (U16)";
  } else if (lowerRem.includes("küçük") || lowerRem.includes("kucuk") || lowerRem.includes("u14")) {
    ageGroup = "Küçük (U14)";
  } else if (lowerRem.includes("midi") || lowerRem.includes("u12")) {
    ageGroup = "Midi (U12)";
  }

  // 3. Lig ve Grup Ayrımı
  const dashIdx = rem.indexOf(" - ");
  let leaguePart = "";
  let groupPart = "";

  if (dashIdx !== -1) {
    leaguePart = rem.slice(0, dashIdx).trim();
    groupPart = rem.slice(dashIdx + 3).trim();
  } else {
    leaguePart = rem.trim();
    groupPart = "Genel";
  }

  // 4. Lig Seviyesi (Süper Lig / 1. Lig)
  let leagueTier = "Süper Lig";
  if (/1\.\s*Lig/i.test(leaguePart)) {
    leagueTier = "1. Lig";
  } else if (/Süper\s*Lig/i.test(leaguePart)) {
    leagueTier = "Süper Lig";
  } else {
    leagueTier = leaguePart;
  }

  // 5. Temiz Grup Adı
  let displayGroup = groupPart;
  const stripPrefixRegex = /^(?:(?:Genç|Yıldız)\s+Kızlar\s+(?:Süper\s+Lig[iıİI]?|1\.\s*Lig[iıİI]?)|(?:Süper\s+Lig|1\.\s*Lig)\s+(?:Genç|Yıldız)\s+Kız(?:lar)?)\s*[-–—:\s]*/i;
  let cleaned = displayGroup.replace(stripPrefixRegex, "").trim();

  if (/^[A-Z]$/i.test(cleaned)) {
    cleaned = `${cleaned.toUpperCase()} Grubu`;
  } else if (/\b[A-Z]\s+Gr\b/i.test(cleaned)) {
    cleaned = cleaned.replace(/\b([A-Z])\s+Gr\b/i, "$1 Grubu");
  } else if (/^\d+\.?(?:\s*Grup)?$/i.test(cleaned)) {
    const numMatch = cleaned.match(/^(\d+)/);
    if (numMatch) {
      cleaned = `${numMatch[1]}. Grup`;
    }
  }

  if (!cleaned || cleaned.toLocaleLowerCase("tr-TR") === leaguePart.toLocaleLowerCase("tr-TR")) {
    cleaned = groupPart === "Genel" ? "Genel" : groupPart;
  } else {
    displayGroup = cleaned;
  }

  return {
    rawKey,
    city,
    ageGroup,
    leagueTier,
    leagueFullName: leaguePart || rem,
    rawGroup: groupPart,
    displayGroup,
  };
}

/**
 * Puan durumu verilerini Türkçe Excel uyumlu UTF-8 BOM ve ';' ayırıcılı CSV'ye çevirir.
 */
export function generateStandingsCsv(items: StandingItem[]): string {
  const BOM = "\uFEFF";
  const header = [
    "Sıra",
    "Takım",
    "Oynadığı",
    "Galibiyet",
    "Mağlubiyet",
    "Puan",
    "Aldığı Set",
    "Verdiği Set",
    "Set Oranı",
    "Aldığı Sayı",
    "Verdiği Sayı",
    "Sayı Oranı",
  ].join(";");

  const rows = items.map((row) => {
    const escapedTeam =
      row.team.includes(";") || row.team.includes('"')
        ? `"${row.team.replace(/"/g, '""')}"`
        : row.team;

    return [
      row.rank,
      escapedTeam,
      row.played,
      row.won,
      row.lost,
      row.points,
      row.sets_won,
      row.sets_lost,
      row.set_ratio,
      row.points_won,
      row.points_lost,
      row.point_ratio,
    ].join(";");
  });

  return BOM + [header, ...rows].join("\r\n");
}

export function downloadStandingsCsv(items: StandingItem[], groupName?: string): void {
  if (typeof window === "undefined" || items.length === 0) return;

  const csv = generateStandingsCsv(items);
  const groupSlug = slugify(groupName || "puan-durumu");
  const todayStr = new Date().toISOString().slice(0, 10);
  const filename = `puan-durumu-${groupSlug}-${todayStr}.csv`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface StandingsTableProps {
  standingsData: {
    [category: string]: StandingItem[];
  };
  city?: string;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standingsData, city }) => {
  const allKeys = Object.keys(standingsData);

  // Tüm anahtarları ayrıştır
  const parsedContexts = useMemo(() => {
    return allKeys.map((k) => parseStandingKey(k, city));
  }, [allKeys, city]);

  // 1. İller Listesi (Eğer birden fazla il varsa İL seçici gösterilir)
  const distinctCities = useMemo(() => {
    const set = new Set<string>();
    parsedContexts.forEach((ctx) => {
      if (ctx.city) set.add(ctx.city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr", { numeric: true }));
  }, [parsedContexts]);

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (city && distinctCities.includes(city)) return city;
    return distinctCities[0] || "";
  });

  useEffect(() => {
    if (city && distinctCities.includes(city)) {
      setSelectedCity(city);
    } else if (distinctCities.length > 0 && !distinctCities.includes(selectedCity)) {
      setSelectedCity(distinctCities[0]);
    }
  }, [city, distinctCities, selectedCity]);

  // Seçili ile ait bağlamlar (Eğer il seçici yoksa hepsi)
  const cityFilteredContexts = useMemo(() => {
    if (distinctCities.length <= 1 || !selectedCity) {
      return parsedContexts;
    }
    return parsedContexts.filter((ctx) => ctx.city === selectedCity);
  }, [parsedContexts, distinctCities, selectedCity]);

  // 2. Yaş Grubu / Kategori Seçimi (Genç U18, Yıldız U16)
  const availableAgeGroups = useMemo(() => {
    const set = new Set<string>();
    cityFilteredContexts.forEach((ctx) => {
      set.add(ctx.ageGroup);
    });
    const order = ["Genç (U18)", "Yıldız (U16)", "Küçük (U14)", "Genel"];
    return Array.from(set).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, "tr");
    });
  }, [cityFilteredContexts]);

  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>(
    availableAgeGroups[0] || "Genç (U18)"
  );

  useEffect(() => {
    if (availableAgeGroups.length > 0 && !availableAgeGroups.includes(selectedAgeGroup)) {
      setSelectedAgeGroup(availableAgeGroups[0]);
    }
  }, [availableAgeGroups, selectedAgeGroup]);

  // Seçili yaş grubuna ait bağlamlar
  const ageFilteredContexts = useMemo(() => {
    return cityFilteredContexts.filter((ctx) => ctx.ageGroup === selectedAgeGroup);
  }, [cityFilteredContexts, selectedAgeGroup]);

  // 3. Lig Kademesi (Süper Lig / 1. Lig) - Birden fazla varsa lig seçici gösterilir
  const availableLeagues = useMemo(() => {
    const set = new Set<string>();
    ageFilteredContexts.forEach((ctx) => {
      set.add(ctx.leagueTier);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [ageFilteredContexts]);

  const [selectedLeagueTier, setSelectedLeagueTier] = useState<string>(
    availableLeagues[0] || "Süper Lig"
  );

  useEffect(() => {
    if (availableLeagues.length > 0 && !availableLeagues.includes(selectedLeagueTier)) {
      setSelectedLeagueTier(availableLeagues[0]);
    }
  }, [availableLeagues, selectedLeagueTier]);

  // 4. Grup Seçimi
  const availableGroups = useMemo(() => {
    const filtered = ageFilteredContexts.filter((ctx) => {
      if (availableLeagues.length > 1) {
        return ctx.leagueTier === selectedLeagueTier;
      }
      return true;
    });

    // Grupları sırala: Sayısal (1. Bölge A Grubu, 1. Bölge B Grubu...) veya Alfabetik (A Grubu, B Grubu)
    return filtered.sort((a, b) => {
      const numA = parseInt(a.displayGroup);
      const numB = parseInt(b.displayGroup);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
      return a.displayGroup.localeCompare(b.displayGroup, "tr", { numeric: true });
    });
  }, [ageFilteredContexts, availableLeagues, selectedLeagueTier]);

  const [selectedGroupKey, setSelectedGroupKey] = useState<string>(
    availableGroups[0]?.rawKey || allKeys[0] || ""
  );

  useEffect(() => {
    if (availableGroups.length > 0) {
      const exists = availableGroups.some((g) => g.rawKey === selectedGroupKey);
      if (!exists) {
        setSelectedGroupKey(availableGroups[0].rawKey);
      }
    }
  }, [availableGroups, selectedGroupKey]);

  // Seçili bağlam ve kesin puan tablosu verisi (sessiz fallback yok!)
  const activeContext = useMemo(() => {
    return parsedContexts.find((c) => c.rawKey === selectedGroupKey) || parsedContexts[0];
  }, [parsedContexts, selectedGroupKey]);

  const items = useMemo(() => {
    if (selectedGroupKey && standingsData[selectedGroupKey]) {
      return standingsData[selectedGroupKey];
    }
    return [];
  }, [selectedGroupKey, standingsData]);

  if (allKeys.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#0f172a] via-[#0b1325] to-[#1e293b] border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-500 border border-slate-700">
          <HelpCircle size={22} />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">
          Puan Durumu Verisi Henüz Açıklanmadı
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Bu il veya kategori için resmi puan cetveli TVF tarafından sisteme girildiğinde burada görüntülenecektir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Kategori, Lig ve Grup Seçici Barı */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 shadow-card no-print space-y-3">
        
        {/* 1. İL SEÇİMİ (Yalnızca "Tüm İller" modunda veya birden fazla il varsa gösterilir) */}
        {distinctCities.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-slate-800/80">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase min-w-[55px] sm:min-w-[65px] flex items-center gap-1">
              <MapPin size={12} className="text-rose-400 shrink-0" />
              İL:
            </span>
            {distinctCities.map((cityName) => {
              const isActive = selectedCity === cityName;
              return (
                <button
                  key={cityName}
                  onClick={() => setSelectedCity(cityName)}
                  title={cityName}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red ring-2 ring-red-500/30 font-bold"
                      : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60"
                  }`}
                >
                  {cityName}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. KATEGORİ / YAŞ GRUBU SEÇİMİ (Genç / Yıldız vb.) */}
        {availableAgeGroups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase min-w-[55px] sm:min-w-[65px] flex items-center gap-1">
              <Layers size={12} className="text-amber-400 shrink-0" />
              Kategori:
            </span>
            {availableAgeGroups.map((age) => {
              const isActive = selectedAgeGroup === age;
              return (
                <button
                  key={age}
                  onClick={() => setSelectedAgeGroup(age)}
                  title={age}
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red ring-2 ring-red-500/30"
                      : "glass-panel text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-700/60"
                  }`}
                >
                  <span>{age}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. LİG SEÇİMİ (Yalnızca o kategoride birden çok lig varsa, örn: Süper Lig vs 1. Lig) */}
        {availableLeagues.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-800/80">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase min-w-[55px] sm:min-w-[65px]">
              Lig:
            </span>
            {availableLeagues.map((lg) => {
              const isActive = selectedLeagueTier === lg;
              return (
                <button
                  key={lg}
                  onClick={() => setSelectedLeagueTier(lg)}
                  title={lg}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xs font-bold ring-2 ring-indigo-500/30"
                      : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50"
                  }`}
                >
                  {lg}
                </button>
              );
            })}
          </div>
        )}

        {/* 4. GRUP SEÇİMİ */}
        {availableGroups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-800/80">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase min-w-[55px] sm:min-w-[65px]">
              Grup:
            </span>
            {availableGroups.map((grp) => {
              const isActive = selectedGroupKey === grp.rawKey;
              return (
                <button
                  key={grp.rawKey}
                  onClick={() => setSelectedGroupKey(grp.rawKey)}
                  title={grp.rawGroup || grp.displayGroup}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs font-bold ring-1 ring-red-500/40"
                      : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50"
                  }`}
                >
                  {grp.displayGroup}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Puan Durumu Tablosu veya Boş Durum */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl shadow-card overflow-hidden">
        {/* Başlık Şeridi */}
        <div className="bg-gradient-to-r from-slate-900/90 via-[#0d1424]/90 to-slate-900/90 text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
              <Trophy size={13} className="text-amber-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
              <LeagueVolleyboxLink
                league={activeContext?.leagueFullName || ""}
                city={activeContext?.city || city}
              >
                {activeContext?.city ? `${activeContext.city.toLocaleUpperCase("tr-TR")} • ` : ""}
                {(activeContext?.leagueFullName || "").toLocaleUpperCase("tr-TR")}
              </LeagueVolleyboxLink>
              {activeContext?.rawGroup ? ` • ${activeContext.rawGroup.toLocaleUpperCase("tr-TR")}` : ""} - PUAN DURUMU
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {items.length > 0 && (
              <button
                onClick={() =>
                  downloadStandingsCsv(
                    items,
                    `${activeContext?.city || city || ""}-${activeContext?.leagueFullName || ""}-${activeContext?.rawGroup || ""}`
                  )
                }
                className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Puan durumunu Türkçe Excel uyumlu (.csv) olarak indir"
                aria-label="Puan durumunu CSV olarak indir"
              >
                <Download size={12} className="text-emerald-400" />
                <span>CSV İndir</span>
              </button>
            )}
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono font-bold bg-slate-900/80 px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-800">
              {items.length} Takım
            </span>
          </div>
        </div>

        {/* Tablo veya Boş Durum (Empty State) */}
        {items.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-500 border border-slate-700/60">
              <HelpCircle size={22} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Bu grup için puan durumu verisi henüz mevcut değil.
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Seçtiğiniz {activeContext?.leagueFullName} - {activeContext?.displayGroup} kategorisine ait resmi puan cetveli TVF il temsilciliği tarafından sisteme girildiğinde burada görüntülenecektir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] sm:text-[11px] tracking-wider">
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-3 text-center w-8 sm:w-12">#</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-4">Takım</th>
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-8 sm:w-12" title="Oynanan Maç">O</th>
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-8 sm:w-12" title="Galibiyet">G</th>
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-8 sm:w-12" title="Mağlubiyet">M</th>
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-3 text-center w-16 sm:w-24" title="Aldığı Set - Verdiği Set">Setler</th>
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-12 sm:w-16 hidden md:table-cell" title="Set Oranı">Set Oran</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center w-20 sm:w-28 hidden lg:table-cell" title="Aldığı Sayı - Verdiği Sayı">Sayılar</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center w-12 sm:w-16 bg-slate-900/80 font-black text-white" title="Puan">P</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-center w-28 sm:w-36 hidden sm:table-cell" title="Son 5 Maç Formu">Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((row) => {
                  const isTop1 = row.rank === 1;
                  const isTop4 = row.rank <= 4;
                  const isPlayoff = row.rank <= 4;
                  const isKlasman = row.rank > 4 && row.rank <= 8;

                  const totalSets = (row.sets_won || 0) + (row.sets_lost || 0);
                  const setWinPct = totalSets > 0 ? Math.round(((row.sets_won || 0) / totalSets) * 100) : 0;

                  // Trend: son maça göre
                  const lastForm = row.form && row.form.length > 0 ? row.form[row.form.length - 1] : null;

                  return (
                    <tr
                      key={row.rank}
                      className={`transition-colors duration-150 ${
                        isTop1
                          ? "bg-amber-500/10 hover:bg-amber-500/15"
                          : isPlayoff
                          ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                          : isKlasman
                          ? "bg-amber-500/5 hover:bg-amber-500/10"
                          : row.rank % 2 === 1
                          ? "bg-transparent hover:bg-slate-800/50"
                          : "bg-slate-900/25 hover:bg-slate-800/60"
                      }`}
                    >
                      {/* Sıra & Final Etabı / Klasman Çizgisi & Trend Oku */}
                      <td className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center font-bold text-xs relative">
                        <span
                          className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r ${
                            isTop1
                              ? "bg-amber-400 shadow-glow-amber"
                              : isPlayoff
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              : isKlasman
                              ? "bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                              : "bg-slate-700/40"
                          }`}
                        />
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                          <span
                            className={`font-mono ${
                              isTop1
                                ? "text-amber-300 font-black text-xs sm:text-sm"
                                : isPlayoff
                                ? "text-emerald-400 font-black text-xs sm:text-sm"
                                : isKlasman
                                ? "text-amber-400 font-bold text-xs sm:text-sm"
                                : "text-slate-400 font-medium text-xs sm:text-sm"
                            }`}
                          >
                            {row.rank}
                          </span>
                          {/* Trend Oku */}
                          <span className="shrink-0" title={lastForm === "W" ? "Son maç galibiyet" : lastForm === "L" ? "Son maç mağlubiyet" : "Durum sabit"}>
                            {lastForm === "W" ? (
                              <TrendingUp size={11} className="text-emerald-400 stroke-[2.5]" />
                            ) : lastForm === "L" ? (
                              <TrendingDown size={11} className="text-rose-400 stroke-[2.5]" />
                            ) : (
                              <Minus size={9} className="text-slate-600" />
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Takım Adı */}
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 font-bold text-white whitespace-nowrap text-xs sm:text-sm">
                        <TeamVolleyboxLink
                          teamName={row.team}
                          category={activeContext?.leagueFullName}
                          city={activeContext?.city || city}
                          className={`transition-colors ${
                            isTop1
                              ? "font-black text-white"
                              : isTop4
                              ? "font-bold text-white"
                              : "font-semibold text-slate-200 hover:text-white"
                          }`}
                        />
                      </td>

                      {/* O */}
                      <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-center text-slate-300 font-medium font-mono text-[11px] sm:text-xs">
                        {row.played}
                      </td>

                      {/* G */}
                      <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-center text-emerald-400 font-bold font-mono text-[11px] sm:text-xs">
                        {row.won}
                      </td>

                      {/* M */}
                      <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-center text-rose-400 font-medium font-mono text-[11px] sm:text-xs">
                        {row.lost}
                      </td>

                      {/* Setler (AS - VS) + Mini Oran Çubuğu */}
                      <td className="py-2.5 sm:py-3 px-1.5 sm:px-3 text-center font-mono text-slate-200 whitespace-nowrap text-[11px] sm:text-xs">
                        <div className="flex flex-col items-center">
                          <div>
                            <span className="font-bold text-white">{row.sets_won}</span>
                            <span className="text-slate-500 mx-0.5 sm:mx-1">:</span>
                            <span className="text-slate-400">{row.sets_lost}</span>
                          </div>
                          {totalSets > 0 && (
                            <div className="w-8 sm:w-12 h-1 bg-slate-800 rounded-full overflow-hidden mt-1 flex" title={`Set Kazanma: %${setWinPct}`}>
                              <div
                                style={{ width: `${setWinPct}%` }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Set Oranı */}
                      <td className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center font-mono text-slate-400 hidden md:table-cell text-[11px] sm:text-xs">
                        {row.set_ratio}
                      </td>

                      {/* Sayılar (AP - VP) */}
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono text-slate-400 text-[10px] sm:text-[11px] hidden lg:table-cell whitespace-nowrap">
                        {row.points_won}:{row.points_lost}
                      </td>

                      {/* Puan (P) */}
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center bg-slate-900/80 font-mono font-black text-xs sm:text-sm text-white border-x border-slate-800/60 shadow-inner">
                        {row.points}
                      </td>

                      {/* Form */}
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {(row.form || []).map((f, fIdx) => (
                            <span
                              key={fIdx}
                              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white leading-none shadow-2xs ${
                                f === "W"
                                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                  : "bg-gradient-to-br from-rose-500 to-rose-600"
                              }`}
                              title={f === "W" ? "Galibiyet (3 veya 2 puan)" : "Mağlubiyet"}
                            >
                              {f === "W" ? "G" : "M"}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Alt Açıklama / Legend */}
        <div className="glass-panel border-t border-slate-800/80 px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-emerald-500 shadow-xs" />
              <span className="font-bold text-slate-200">1 - 4: Final Etabı (Play-Off)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-amber-500 shadow-xs" />
              <span className="font-bold text-slate-300">5 - 8: Klasman Etabı</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-slate-700" />
              <span>9+: Normal Sezon</span>
            </div>
          </div>

          <div className="text-slate-400 font-mono text-[9px] sm:text-[10px] flex items-center gap-1.5 sm:gap-2">
            <span>▲ Galibiyet trendi</span>
            <span>•</span>
            <span>▼ Mağlubiyet trendi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
