"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { StandingItem, Match } from "@/types/fixture";
import {
  Trophy,
  HelpCircle,
  MapPin,
  Download,
  ChevronDown,
  ChevronRight,
  Search,
  Check,
  X,
} from "lucide-react";
import { TeamVolleyboxLink } from "./TeamVolleyboxLink";
import { LeagueVolleyboxLink } from "./LeagueVolleyboxLink";
import { slugify } from "@/utils/slugify";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { formatGroupName } from "@/utils/grouping";

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

export interface StandingsTeamContext {
  rawKey: string;
  city: string;
  leagueName: string;
  groupName: string;
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

/* ──────────────────────────── Form Helpers ──────────────────────────── */

export type FormResult = "W" | "L";

interface TeamMatchSummary {
  form: FormResult[];
  formSource: "matches" | "standings" | "none";
  last: Match | null;
  next: Match | null;
}

function hasScore(m: Match): boolean {
  return (m.home_score != null && m.away_score != null) || !!m.score;
}

const normGroup = (g: string) => trLower(g).replace(/[^a-z0-9ğüşıöç]/gi, "");

/** Maç grubu ile puan durumu grubu aynı mı? ("A Grubu" ≈ "Genç Kızlar Süper Lig - A Gr") */
function sameGroup(matchGroup: string, standingGroup: string): boolean {
  const a = normGroup(formatGroupName(matchGroup));
  const b = normGroup(formatGroupName(standingGroup));
  if (!a || !b) return true;
  return a === b || a.includes(b) || b.includes(a);
}

export function summarizeTeam(
  row: StandingItem,
  ctx: { city: string; leagueName: string; groupName: string } | null,
  matches?: Match[]
): TeamMatchSummary {
  const fallback = (row.form || []).slice(-5) as FormResult[];
  const empty: TeamMatchSummary = {
    form: fallback,
    formSource: fallback.length ? "standings" : "none",
    last: null,
    next: null,
  };
  if (!matches?.length) return empty;

  const name = trLower(row.team.trim());

  const mine = matches.filter((m) => {
    const home = trLower(m.home_team.trim());
    const away = trLower(m.away_team.trim());
    if (!trIncludes(home, name) && !trIncludes(away, name) && !trIncludes(name, home) && !trIncludes(name, away))
      return false;
    if (ctx) {
      if (ctx.city && m.city && trLower(m.city) !== trLower(ctx.city)) return false;
      if (ctx.leagueName && m.category && !trIncludes(trLower(m.category), trLower(ctx.leagueName)) && !trIncludes(trLower(ctx.leagueName), trLower(m.category)))
        return false;
      if (ctx.groupName && m.group && !sameGroup(m.group, ctx.groupName)) return false;
    }
    return true;
  });

  if (!mine.length) return empty;

  const key = (m: Match) => `${m.date} ${m.time || ""}`;
  const finished = mine
    .filter((m) => m.status === "finished" && hasScore(m))
    .sort((a, b) => key(a).localeCompare(key(b)));
  const upcoming = mine
    .filter((m) => m.status === "upcoming" || m.status === "live")
    .sort((a, b) => key(a).localeCompare(key(b)));

  const form: FormResult[] = finished.slice(-5).map((m) => {
    const home = trLower(m.home_team.trim());
    const isHome = trIncludes(home, name) || trIncludes(name, home);
    const myScore = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
    const theirScore = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
    return myScore > theirScore ? "W" : "L";
  });

  return {
    form: form.length ? form : fallback,
    formSource: form.length ? "matches" : fallback.length ? "standings" : "none",
    last: finished.at(-1) ?? null,
    next: upcoming[0] ?? null,
  };
}

export const FormDots = ({ form, source }: { form: FormResult[]; source?: TeamMatchSummary["formSource"] }) => {
  const padded: (FormResult | null)[] = [...form.slice(-5)];
  while (padded.length < 5) padded.push(null);
  return (
    <div
      className="flex items-center justify-center gap-1"
      role="img"
      aria-label={form.length ? `Son ${form.length} maç: ${form.map((f) => (f === "W" ? "G" : "M")).join(" ")}` : "Form verisi yok"}
      title={source === "standings" ? "Form: TVF puan tablosundan (yalnız oynanan maçlar)" : undefined}
    >
      {padded.map((f, i) =>
        f === null ? (
          <span key={i} className="h-[18px] w-[18px] rounded-full border border-dashed border-line" aria-hidden="true" />
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] font-display text-[9px] font-bold leading-none ${
              f === "W" ? "border-done text-done" : "border-form-loss text-form-loss"
            }`}
          >
            {f === "W" ? "G" : "M"}
          </span>
        )
      )}
    </div>
  );
};

/* ──────────────────────────── Detail Row ──────────────────────────── */

function MatchMiniCard({ match, label }: { match: Match | null; label: string }) {
  if (!match) {
    return (
      <div className="text-ink-3 text-[11px]">
        <span className="font-semibold text-ink-2">{label}:</span> Veri yok
      </div>
    );
  }
  return (
    <div className="text-[11px]">
      <span className="font-semibold text-ink-2">{label}:</span>{" "}
      <span className="text-ink">
        {match.home_team} vs {match.away_team}
      </span>{" "}
      <span className="text-ink-3">
        ({match.date}{match.time ? ` ${match.time}` : ""})
      </span>
      {match.score && <span className="ml-1 font-scoreboard tabular-nums text-ink font-bold">{match.score}</span>}
    </div>
  );
}

/* ──────────────────────────── Main Component ──────────────────────────── */

interface StandingsTableProps {
  standingsData: {
    [category: string]: StandingItem[];
  };
  city?: string;
  matches?: Match[];
  onSelectTeam?: (team: StandingItem, context: StandingsTeamContext) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standingsData, city, matches, onSelectTeam }) => {
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

  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState<boolean>(false);
  const [citySearchTerm, setCitySearchTerm] = useState<string>("");
  const [isCategoryGroupOpen, setIsCategoryGroupOpen] = useState<boolean>(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
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

  // İl arama filtresi (Türkçe karakter duyarlı)
  const filteredCities = useMemo(() => {
    if (!citySearchTerm.trim()) return distinctCities;
    const q = trLower(citySearchTerm).trim();
    return distinctCities.filter((c) => trIncludes(c, q));
  }, [distinctCities, citySearchTerm]);

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setIsCityDropdownOpen(false);
    setCitySearchTerm("");
    setIsCategoryGroupOpen(true); // "ili seçince altındaki kategori grup kısmı da açılsın"
  };

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

  // Satır açılır/kapanır
  const toggleDetail = useCallback(
    (row: StandingItem) => {
      const teamKey = `${row.rank}-${row.team}`;
      setExpandedTeam((prev) => (prev === teamKey ? null : teamKey));
      if (onSelectTeam && activeContext) {
        onSelectTeam(row, {
          rawKey: activeContext.rawKey || "",
          city: activeContext.city || city || "",
          leagueName: activeContext.leagueFullName || "",
          groupName: activeContext.displayGroup || "",
        });
      }
    },
    [onSelectTeam, activeContext, city]
  );

  if (allKeys.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-3 text-ink-3 border border-line">
          <HelpCircle size={22} />
        </div>
        <h3 className="text-sm font-bold text-ink mb-1">
          Puan Durumu Verisi Henüz Açıklanmadı
        </h3>
        <p className="text-xs text-ink-3 max-w-sm mx-auto">
          Bu il veya kategori için resmi puan cetveli TVF tarafından sisteme girildiğinde burada görüntülenecektir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Kategori, Lig ve Grup Seçici Barı */}
      <div
        className={`rounded-2xl border border-line bg-surface p-3 sm:p-4 no-print space-y-3 relative ${
          isCityDropdownOpen ? "z-30" : "z-10"
        }`}
      >
        
        {/* 1. İL SEÇİMİ (Açılır Menü / Dropdown) */}
        {distinctCities.length > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold text-ink-2 uppercase flex items-center gap-1.5 shrink-0">
                <MapPin size={13} className="text-ink-2 shrink-0" />
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
                  className="flex items-center justify-between gap-2.5 bg-surface-raised hover:bg-surface-raised/80 text-ink text-xs font-bold px-3.5 py-2 rounded-xl border border-line hover:border-ink-3 transition-all shadow-sm active:scale-95 cursor-pointer min-w-[210px] sm:min-w-[240px] focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-2xs" />
                    <span className="text-ink font-extrabold truncate text-[13px]">
                      {selectedCity || "İl Seçiniz"}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 text-ink-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-canvas border border-line text-ink-2">
                      {distinctCities.length} İl
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 text-ink-2 ${
                        isCityDropdownOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Dropdown Açılır Menü */}
                {isCityDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-canvas border border-line rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Arama Inputu */}
                    <div className="p-2.5 border-b border-line bg-surface-muted">
                      <div className="relative">
                        <Search
                          size={13}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
                        />
                        <input
                          type="text"
                          placeholder="İl ara (örn: Ankara, İstanbul, İzmir)..."
                          value={citySearchTerm}
                          onChange={(e) => setCitySearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setIsCityDropdownOpen(false);
                            } else if (e.key === "Enter" && filteredCities.length === 1) {
                              handleCitySelect(filteredCities[0]);
                            }
                          }}
                          className="w-full bg-surface-raised border border-line text-ink text-xs rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-ink-3"
                          autoFocus
                        />
                        {citySearchTerm && (
                          <button
                            type="button"
                            onClick={() => setCitySearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-0.5 rounded cursor-pointer"
                            title="Temizle"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-ink-3 px-1 pt-1.5">
                        <span>Kayıtlı İller</span>
                        <span className="font-mono text-ink-3">
                          {filteredCities.length} / {distinctCities.length} İl
                        </span>
                      </div>
                    </div>

                    {/* Şehirler Listesi */}
                    <div
                      className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar"
                      role="listbox"
                    >
                      {filteredCities.length === 0 ? (
                        <div className="p-4 text-center text-xs text-ink-3">
                          Eşleşen il bulunamadı.
                        </div>
                      ) : (
                        filteredCities.map((cityName) => {
                          const isSelected = selectedCity === cityName;
                          return (
                            <button
                              key={cityName}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleCitySelect(cityName)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-primary/20 text-primary font-bold border border-primary/40"
                                  : "text-ink-2 hover:text-ink hover:bg-surface-raised"
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isSelected
                                      ? "bg-primary shadow-glow-primary"
                                      : "bg-ink-3"
                                  }`}
                                />
                                <span className="truncate">{cityName}</span>
                              </span>
                              {isSelected && (
                                <Check
                                  size={14}
                                  className="text-primary shrink-0"
                                />
                              )}
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
              <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-ink-2">
                <span className="text-[11px] font-medium text-ink-2">
                  Seçili İl: <strong className="text-ink font-bold">{selectedCity}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCategoryGroupOpen(!isCategoryGroupOpen)}
                  className="text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 cursor-pointer bg-surface-raised px-2.5 py-1 rounded-lg border border-line"
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
        )}

        {/* 2. KATEGORİ, LİG VE GRUP SEÇİCİ BÖLÜMÜ (İl seçilince açılır) */}
        {!distinctCities || distinctCities.length <= 1 || (selectedCity && isCategoryGroupOpen) ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Kategori / Yaş Grubu Seçimi — segmented kontrol */}
            {availableAgeGroups.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-ink-2 uppercase min-w-[55px] sm:min-w-[65px] flex items-center gap-1">
                  Kategori:
                </span>
                <div className="inline-flex rounded-xl border border-line bg-canvas p-0.5">
                  {availableAgeGroups.map((age) => {
                    const isActive = selectedAgeGroup === age;
                    return (
                      <button
                        key={age}
                        onClick={() => setSelectedAgeGroup(age)}
                        title={age}
                        aria-pressed={isActive}
                        className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "bg-primary text-primary-fg font-bold shadow-glow-primary"
                            : "text-ink-2 hover:text-ink"
                        }`}
                      >
                        <span>{age}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lig Seçimi (Birden çok lig varsa) */}
            {availableLeagues.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-line">
                <span className="text-[10px] sm:text-[11px] font-bold text-ink-2 uppercase min-w-[55px] sm:min-w-[65px]">
                  Lig:
                </span>
                <div className="inline-flex rounded-xl border border-line bg-canvas p-0.5">
                  {availableLeagues.map((lg) => {
                    const isActive = selectedLeagueTier === lg;
                    return (
                      <button
                        key={lg}
                        onClick={() => setSelectedLeagueTier(lg)}
                        title={lg}
                        className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "bg-surface-raised text-ink font-bold"
                            : "text-ink-2 hover:text-ink"
                        }`}
                      >
                        {lg}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grup Seçimi — alt çizgili sekmeler */}
            {availableGroups.length > 0 && (
              <div className="border-b border-line" role="tablist">
                <div className="flex flex-wrap items-center gap-0">
                  {availableGroups.map((grp) => {
                    const isActive = selectedGroupKey === grp.rawKey;
                    return (
                      <button
                        key={grp.rawKey}
                        onClick={() => setSelectedGroupKey(grp.rawKey)}
                        title={grp.rawGroup || grp.displayGroup}
                        aria-current={isActive ? "true" : undefined}
                        className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "border-selected text-selected-text font-bold"
                            : "border-transparent text-ink-2 hover:text-ink"
                        }`}
                      >
                        {grp.displayGroup}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-ink-3 bg-canvas rounded-xl border border-dashed border-line">
            Lütfen kategori ve grupları listelemek için yukarıdaki açılır menüden bir il seçiniz.
          </div>
        )}
      </div>

      {/* Puan Durumu Tablosu veya Boş Durum */}
      <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
        {/* Başlık Şeridi */}
        <div className="bg-surface text-ink px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 border-b border-line">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <Trophy size={15} className="text-warn shrink-0" />
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
                className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-line bg-surface-raised text-ink-2 hover:text-ink transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Puan durumunu Türkçe Excel uyumlu (.csv) olarak indir"
                aria-label="Puan durumunu CSV olarak indir"
              >
                <Download size={12} className="text-done" />
                <span>CSV İndir</span>
              </button>
            )}
            <span className="text-[10px] sm:text-xs text-ink-2 font-mono font-bold bg-canvas px-1.5 sm:px-2 py-0.5 rounded-lg border border-line">
              {items.length} Takım
            </span>
          </div>
        </div>

        {/* Tablo veya Boş Durum (Empty State) */}
        {items.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center mx-auto mb-3 text-ink-3 border border-line">
              <HelpCircle size={22} />
            </div>
            <h3 className="text-sm font-bold text-ink mb-1">
              Bu grup için puan durumu verisi henüz mevcut değil.
            </h3>
            <p className="text-xs text-ink-3 max-w-sm mx-auto">
              Seçtiğiniz {activeContext?.leagueFullName} - {activeContext?.displayGroup} kategorisine ait resmi puan cetveli TVF il temsilciliği tarafından sisteme girildiğinde burada görüntülenecektir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left border-collapse text-xs">
              <caption className="sr-only">
                {activeContext?.city || ""} {activeContext?.leagueFullName || ""} {activeContext?.rawGroup || ""} Puan Durumu
              </caption>
              <thead>
                <tr className="bg-surface text-ink-2 font-bold uppercase text-[10px] sm:text-[11px] tracking-wider sticky top-[var(--app-header-h,0px)] z-20 shadow-[0_1px_0_var(--line)]">
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-3 text-center w-12 sm:w-14">#</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-4">Takım</th>
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-8 sm:w-12" title="Oynanan Maç">O</th>
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-8 sm:w-12" title="Galibiyet">G</th>
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-8 sm:w-12" title="Mağlubiyet">M</th>
                  <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center hidden sm:table-cell w-16" title="Set (Aldığı-Verdiği)">Set</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center w-12 sm:w-14 font-black text-ink" title="Puan">Puan</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-center w-24 sm:w-28" title="Son 5 Maç Formu">Form</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const isTop4 = row.rank <= 4;
                  const isPlayoff = row.rank <= 2;
                  const isKlasman = row.rank > 2 && row.rank <= 8;
                  const teamKey = `${row.rank}-${row.team}`;
                  const isExpanded = expandedTeam === teamKey;

                  const summary = summarizeTeam(
                    row,
                    activeContext
                      ? { city: activeContext.city || city || "", leagueName: activeContext.leagueFullName, groupName: activeContext.displayGroup }
                      : null,
                    matches
                  );

                  return (
                    <React.Fragment key={teamKey}>
                      <tr
                        className={`border-t border-line/70 transition-colors duration-150 cursor-pointer ${
                          isExpanded ? "bg-surface-raised" : "hover:bg-surface-raised/70"
                        }`}
                        onClick={(e) => {
                          // Bağlantılara tıklama satırı açmaz
                          const target = e.target as HTMLElement;
                          if (target.closest("a")) return;
                          toggleDetail(row);
                        }}
                      >
                        {/* Sıra & Final Etabı / Klasman Çizgisi */}
                        <td className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center font-bold text-xs relative">
                          <span
                            className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r ${
                              isPlayoff
                                ? "bg-primary shadow-[0_0_8px_rgb(var(--primary-rgb)/0.5)]"
                                : isKlasman
                                ? "bg-rank-mid shadow-[0_0_6px_rgb(var(--rank-mid-rgb)/0.4)]"
                                : ""
                            }`}
                          />
                          <span
                            className={`font-display font-scoreboard tabular-nums ${
                              isPlayoff
                                ? "text-primary font-black text-xs sm:text-sm"
                                : isKlasman
                                ? "text-rank-mid font-bold text-xs sm:text-sm"
                                : "text-ink-2 font-medium text-xs sm:text-sm"
                            }`}
                          >
                            {row.rank}
                          </span>
                        </td>

                        {/* Takım Adı */}
                        <td className="py-2.5 sm:py-3 px-2 sm:px-4 font-bold text-ink whitespace-nowrap text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5">
                            <TeamVolleyboxLink
                              teamName={row.team}
                              category={activeContext?.leagueFullName}
                              city={activeContext?.city || city}
                              className={`transition-colors ${
                                isTop4
                                  ? "font-bold text-ink"
                                  : "font-semibold text-ink-2 hover:text-ink"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDetail(row);
                              }}
                              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-3 transition-all hover:bg-surface-raised hover:text-ink ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                              aria-expanded={isExpanded}
                              aria-label={`${row.team} takımını incele`}
                              title="Takımı incele"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </td>

                        {/* O */}
                        <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-center text-ink-2 font-medium font-display font-scoreboard tabular-nums text-[11px] sm:text-xs">
                          {row.played}
                        </td>

                        {/* G */}
                        <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-center text-ink font-bold font-display font-scoreboard tabular-nums text-[11px] sm:text-xs">
                          {row.won}
                        </td>

                        {/* M */}
                        <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-center text-ink font-medium font-display font-scoreboard tabular-nums text-[11px] sm:text-xs">
                          {row.lost}
                        </td>

                        {/* Set (combined, sm: only) */}
                        <td className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center hidden sm:table-cell font-display font-scoreboard tabular-nums text-ink-2 text-[11px] sm:text-xs">
                          {row.sets_won}-{row.sets_lost}
                        </td>

                        {/* Puan */}
                        <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-display font-scoreboard tabular-nums text-sm font-bold text-ink">
                          {row.points}
                        </td>

                        {/* Form */}
                        <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-center">
                          <FormDots form={summary.form} source={summary.formSource} />
                        </td>
                      </tr>

                      {/* Satır içi detay */}
                      {isExpanded && (
                        <tr data-detail-for={row.team}>
                          <td colSpan={8} className="p-0">
                            <div className="bg-surface-raised border-t border-line relative">
                              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                              <div className="pl-6 pr-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                <div className="space-y-1">
                                  <div>
                                    <span className="font-semibold text-ink-2">Set Oranı:</span>{" "}
                                    <span className="font-scoreboard tabular-nums text-ink">{row.set_ratio}</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-ink-2">Sayı Oranı:</span>{" "}
                                    <span className="font-scoreboard tabular-nums text-ink">{row.point_ratio}</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-ink-2">Set:</span>{" "}
                                    <span className="font-scoreboard tabular-nums text-done">{row.sets_won}</span>
                                    <span className="text-ink-3"> - </span>
                                    <span className="font-scoreboard tabular-nums text-form-loss">{row.sets_lost}</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-ink-2">Sayı:</span>{" "}
                                    <span className="font-scoreboard tabular-nums text-ink">{row.points_won}</span>
                                    <span className="text-ink-3"> - </span>
                                    <span className="font-scoreboard tabular-nums text-ink">{row.points_lost}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <MatchMiniCard match={summary.last} label="Son Maç" />
                                  <MatchMiniCard match={summary.next} label="Sıradaki Maç" />
                                  {summary.formSource === "none" && (
                                    <p className="text-ink-3 text-[10px] italic">
                                      Form verisi mevcut değil — henüz oynanan maç bulunmuyor.
                                    </p>
                                  )}
                                  {summary.formSource === "standings" && (
                                    <p className="text-ink-3 text-[10px] italic">
                                      Form: TVF puan tablosundan (yalnız oynanan maçlar).
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Alt Açıklama / Legend */}
        <div className="border-t border-line px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-ink-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-[3px] h-3 rounded bg-primary" />
              <span className="font-bold text-ink-2">1-2: Final Etabı (Play-Off)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-[3px] h-3 rounded bg-rank-mid" />
              <span className="font-bold text-ink-2">3-8: Klasman Etabı</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-[3px] h-3 rounded bg-line" />
              <span>9+: Normal Sezon</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Form:</span>
            <span className="flex items-center gap-1">
              <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border-[1.5px] border-done text-done text-[8px] font-bold">G</span>
              <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border-[1.5px] border-form-loss text-form-loss text-[8px] font-bold">M</span>
              <span className="h-[14px] w-[14px] rounded-full border border-dashed border-line" />
              <span className="ml-0.5">oynanmadı</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
