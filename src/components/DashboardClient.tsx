"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { DateNavigationRibbon } from "@/components/match/DateNavigationRibbon";
import { FilterBar } from "@/components/FilterBar";
import type { StandingsTeamContext } from "@/components/StandingsTable";
import { CityTabBar } from "@/components/CityTabBar";
import { LeagueSection } from "@/components/match/LeagueSection";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PrimaryTeamWidget } from "@/components/PrimaryTeamWidget";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { MatchInspectorPanel } from "@/components/match/MatchInspectorPanel";
import { MatchSelectionProvider, findDefaultSelectedMatch } from "@/context/MatchSelectionContext";
import dynamic from "next/dynamic";
import { Virtuoso } from "react-virtuoso";
import { Match, FixturesData, StandingItem } from "@/types/fixture";
import { isMatchScored } from "@/utils/matchScoring";

export { isMatchScored };

import { TabViewSkeleton } from "@/components/common/SkeletonLoaders";

const TabViewLoading = () => (
  <TabViewSkeleton />
);

const HomePortalView = dynamic(
  () => import("@/components/HomePortalView").then((mod) => mod.HomePortalView),
  { loading: TabViewLoading }
);
const CompactMatchFeed = dynamic(
  () => import("@/components/match/CompactMatchFeed").then((mod) => mod.CompactMatchFeed),
  { loading: TabViewLoading }
);
const StandingsTable = dynamic(
  () => import("@/components/StandingsTable").then((mod) => mod.StandingsTable),
  { loading: TabViewLoading }
);
const TeamInspectorPanel = dynamic(
  () => import("@/components/TeamInspectorPanel").then((mod) => mod.TeamInspectorPanel),
  { loading: TabViewLoading }
);
const GroupStatusView = dynamic(
  () => import("@/components/GroupStatusView").then((mod) => mod.GroupStatusView),
  { loading: TabViewLoading }
);
const MobileMatchDrawer = dynamic(
  () => import("@/components/MobileMatchDrawer").then((mod) => mod.MobileMatchDrawer),
  { loading: TabViewLoading }
);

const NotificationBanner = dynamic(
  () => import("@/components/NotificationBanner").then((mod) => mod.NotificationBanner),
  { ssr: false }
);
const SpotlightSearchModal = dynamic(
  () => import("@/components/SpotlightSearchModal").then((mod) => mod.SpotlightSearchModal),
  { ssr: false }
);
import { SearchX, AlertCircle, Star, CheckCircle2, Calendar, History, MapPin, ChevronDown, ChevronUp, Layers, X, Wifi, WifiOff } from "lucide-react";
import { isMatchPassed, isMatchOverdueForScore, formatDateTurkish, compareMatchTimes, compareMatchDateTime } from "@/utils/calendar";
import { checkAndTriggerMatchReminders } from "@/utils/notifications";
import { formatGroupName, groupResultsByCityAndLeague, CityResultGroup } from "@/utils/grouping";
import { AGE_CATEGORIES, classifyAgeCategory } from "@/utils/leagueHierarchy";
import { slugify } from "@/utils/slugify";
import { trLower, trIncludes } from "@/utils/turkishLocale";

export type AppMainTab = "home" | "results" | "today" | "fixtures" | "standings" | "group-status";

export const getAppRoute = (
  tab: AppMainTab,
  citySlug?: string
): string => {
  const isCity = citySlug && citySlug !== "all" && citySlug !== "Tüm İller";
  const slug = isCity ? citySlug.toLowerCase() : "";

  switch (tab) {
    case "group-status":
      return slug ? `/grup-durumu/${slug}` : "/grup-durumu";
    case "standings":
      return slug ? `/puan-durumu/${slug}` : "/puan-durumu";
    case "fixtures":
      return slug ? `/fikstur/${slug}` : "/fikstur";
    case "results":
      return slug ? `/sonuclar/${slug}` : "/sonuclar";
    case "today":
      return slug ? `/gunun-maclari/${slug}` : "/gunun-maclari";
    case "home":
    default:
      return slug ? `/${slug}` : "/";
  }
};

export const parseAppRoute = (
  pathname: string
): { tab: AppMainTab; city: string } => {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");
  if (!cleanPath) {
    return { tab: "home", city: "all" };
  }

  const parts = cleanPath.split("/").filter(Boolean);
  const first = parts[0]?.toLowerCase();
  const second = parts[1]?.toLowerCase();

  // Pattern 1: /grup-durumu/[city]
  if (first === "grup-durumu") {
    return { tab: "group-status", city: second || "all" };
  }
  if (first === "puan-durumu") {
    return { tab: "standings", city: second || "all" };
  }
  if (first === "fikstur") {
    return { tab: "fixtures", city: second || "all" };
  }
  if (first === "sonuclar") {
    return { tab: "results", city: second || "all" };
  }
  if (first === "gunun-maclari") {
    return { tab: "today", city: second || "all" };
  }

  // Pattern 2: /[city]/grup-durumu
  if (second === "grup-durumu") {
    return { tab: "group-status", city: first };
  }
  if (second === "puan-durumu") {
    return { tab: "standings", city: first };
  }
  if (second === "fikstur") {
    return { tab: "fixtures", city: first };
  }
  if (second === "sonuclar") {
    return { tab: "results", city: first };
  }
  if (second === "gunun-maclari") {
    return { tab: "today", city: first };
  }

  // Pattern 3: /[city] (direct city slug like /istanbul)
  return { tab: "home", city: first };
};

// İstemci tarafı şehir verisi önbelleği (Tekrar tıklanan iller 0ms anında açılır)
const clientCityCache = new Map<string, FixturesData>();

function matchesLeagueFilter(match: Match, filter: string): boolean {
  if (filter === "Tümü") return true;
  const category = AGE_CATEGORIES.find((item) => filter.startsWith(item.label));
  if (category) {
    if (classifyAgeCategory(match) !== category.key) return false;
    const groupFilter = filter.slice(category.label.length).trim();
    return !groupFilter || trIncludes(formatGroupName(match.group), groupFilter);
  }

  return [match.category || "", match.age_group || "", match.group || ""].some((value) => trIncludes(value, filter));
}

interface DashboardClientProps {
  initialData: FixturesData;
  initialTab?: AppMainTab;
  initialCity?: string;
  initialDataPartial?: boolean;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  initialData,
  initialTab = "home",
  initialCity = "all",
  initialDataPartial = false,
}) => {
  const [data, setData] = useState<FixturesData>(initialData);
  const [isPartialData, setIsPartialData] = useState(initialDataPartial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fullDataRequestRef = useRef<Promise<boolean> | null>(null);

  // İlk veriyi istemci önbelleğine yaz
  useEffect(() => {
    if (initialData && !initialDataPartial) {
      clientCityCache.set(initialCity || "all", initialData);
      if (initialData.city && initialData.city !== "Tüm İller") {
        clientCityCache.set(initialData.city.toLowerCase(), initialData);
      }
    }
  }, [initialData, initialCity, initialDataPartial]);

  // Ana Sekmeler: "home" (Anasayfa Portalı), "results" (Sonuçlar), "today" (Günün Maçları), "fixtures" (Fikstür), "standings" (Puan Durumu) ve "group-status" (Grup Durumu)
  const [activeMainTab, setActiveMainTab] = useState<AppMainTab>(initialTab);

  // 81 İl Desteği - URL'den veya prop'tan gelen şehir ile başlar
  const [currentCitySlug, setCurrentCitySlug] = useState(initialCity || "all");

  // Sonuçlar Alt Sekmesi: "all" (Tüm Sonuçlar) veya "yesterday" (Dünün Sonuçları)
  const [resultsSubTab, setResultsSubTab] = useState<"all" | "yesterday">("all");
  const [selectedResultDate, setSelectedResultDate] = useState("all");

  // Fikstür Filtre Durumları
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [selectedDate, setSelectedDate] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "upcoming" | "finished"
  const [selectedHall, setSelectedHall] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [volleyboxFilter, setVolleyboxFilter] = useState<"all" | "synced" | "scored" | "unscored" | "unsynced" | "discrepancy">("all");

  const [citiesList, setCitiesList] = useState<any[]>([]);

  const ensureFullData = () => {
    if (!isPartialData) return Promise.resolve(true);
    if (fullDataRequestRef.current) return fullDataRequestRef.current;

    setLoading(true);
    setError(null);
    const request = (async () => {
      try {
        const res = await fetch(`/api/fixtures?city=${currentCitySlug}`);
        if (!res.ok) throw new Error("Tam il verisi alınamadı.");
        const json: FixturesData = await res.json();
        clientCityCache.set(currentCitySlug, json);
        setData(json);
        setIsPartialData(false);
        return true;
      } catch (err: any) {
        setError(err.message || "Tam il verisi yüklenirken hata oluştu.");
        return false;
      } finally {
        setLoading(false);
        fullDataRequestRef.current = null;
      }
    })();
    fullDataRequestRef.current = request;
    return request;
  };

  // Sekme değiştiğinde tarayıcı URL'ini senkronize et (Şehir seçiliyse şehri korur: /grup-durumu/istanbul, /puan-durumu/istanbul vb.)
  const handleSelectTab = (tab: AppMainTab) => {
    const syncTabUrl = () => {
      if (typeof window === "undefined") return;
      const targetPath = getAppRoute(tab, currentCitySlug);
      const currentPath = window.location.pathname;
      if (
        currentPath !== targetPath &&
        !(tab === "home" && currentCitySlug === "all" && currentPath === "/")
      ) {
        window.history.pushState({ tab, city: currentCitySlug }, "", targetPath);
      }
    };

    if (isPartialData && tab !== "results") {
      void ensureFullData().then((loaded) => {
        if (loaded) {
          setActiveMainTab(tab);
          syncTabUrl();
        }
      });
    } else {
      setActiveMainTab(tab);
      syncTabUrl();
    }
  };

  const handleSelectCity = useCallback(async (slug: string, skipPushState = false) => {
    setCurrentCitySlug(slug);
    setSelectedStandingTeam(null);
    setError(null);
    setSelectedCategory("Tümü");
    setSelectedDate("all");
    setSelectedResultDate("all");
    setSelectedHall("Tümü");
    setStatusFilter("all");
    setVolleyboxFilter("all");
    setSearchQuery("");
    setResultsSubTab("all");

    // Tarayıcı URL'ini güncelle: Örneğin /puan-durumu -> /puan-durumu/istanbul
    if (!skipPushState && typeof window !== "undefined") {
      const targetPath = getAppRoute(activeMainTab, slug);
      const currentPath = window.location.pathname;
      if (currentPath !== targetPath) {
        window.history.pushState({ tab: activeMainTab, city: slug }, "", targetPath);
      }
    }

    // 1. Önbellekte varsa anında 0ms aç (Loading beklemeden)
    const cached = clientCityCache.get(slug);
    if (cached) {
      setData(cached);
      setIsPartialData(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/fixtures?city=${slug}`);
      if (!res.ok) throw new Error("İl verisi alınamadı.");
      const json: FixturesData = await res.json();
      clientCityCache.set(slug, json);
      setData(json);
      setIsPartialData(false);
    } catch (err: any) {
      setError(err.message || "İl fikstürü yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [activeMainTab]);

  // Tarayıcı Geri/İleri butonları (popstate) dinleyicisi
  useEffect(() => {
    const handlePopState = () => {
      const { tab, city } = parseAppRoute(window.location.pathname);
      setActiveMainTab(tab);
      if (city !== currentCitySlug) {
        handleSelectCity(city, true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentCitySlug, handleSelectCity]);

  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialCity) {
      setCurrentCitySlug((prev) => (prev !== initialCity ? initialCity : prev));
    }
  }, [initialCity]);

  // Şehir bazlı gizleme / daraltma durumları (Collapse / Accordion)
  const [collapsedResultCities, setCollapsedResultCities] = useState<Record<string, boolean>>({});
  const [collapsedFixtureCities, setCollapsedFixtureCities] = useState<Record<string, boolean>>({});

  // Lig bazlı gizleme / daraltma durumları (Collapse / Accordion)
  const [collapsedResultLeagues, setCollapsedResultLeagues] = useState<Record<string, boolean>>({});
  const [collapsedFixtureLeagues, setCollapsedFixtureLeagues] = useState<Record<string, boolean>>({});

  const toggleResultCityCollapse = (cityName: string) => {
    setCollapsedResultCities((prev) => ({
      ...prev,
      [cityName]: !prev[cityName],
    }));
  };

  const toggleFixtureCityCollapse = (cityName: string) => {
    setCollapsedFixtureCities((prev) => ({
      ...prev,
      [cityName]: !prev[cityName],
    }));
  };

  const toggleResultLeagueCollapse = (leagueKey: string) => {
    setCollapsedResultLeagues((prev) => ({
      ...prev,
      [leagueKey]: !prev[leagueKey],
    }));
  };

  const toggleFixtureLeagueCollapse = (leagueKey: string) => {
    setCollapsedFixtureLeagues((prev) => ({
      ...prev,
      [leagueKey]: !prev[leagueKey],
    }));
  };

  // Favoriler (Flashscore Yıldız İmzası - LocalStorage ile kaydedilir)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Premium Özellikler: Maç Detay Çekmecesi & Spotlight Arama
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedStandingTeam, setSelectedStandingTeam] = useState<{
    team: StandingItem;
    context: StandingsTeamContext;
  } | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLeaguesMenuOpen, setIsLeaguesMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // URL ?match=id senkronizasyonu ve maç seçimi
  const handleSelectMatch = useCallback((match: Match | null) => {
    setSelectedMatch(match);
    if (match) {
      setIsMobileDrawerOpen(true);
    }
    if (typeof window !== "undefined" && match) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("match", match.id);
        window.history.replaceState({}, "", url.toString());
      } catch {
        // fallback
      }
    }
  }, []);

  // Sayfa ilk açıldığında veya maçlar değiştiğinde:
  // Varsa o günün ilk canlı maçı, yoksa ilk biten maçı varsayılan olarak seçili getir
  useEffect(() => {
    if (!data?.matches || data.matches.length === 0) return;

    let urlMatchId: string | null = null;
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        urlMatchId = params.get("match");
      } catch {
        // fallback
      }
    }

    setSelectedMatch((prev) => {
      if (prev && data.matches.some((m) => m.id === prev.id)) {
        return prev;
      }
      return findDefaultSelectedMatch(data.matches, urlMatchId);
    });
  }, [data?.matches]);

  // Ctrl+K / Cmd+K ile hızlı arama açma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Tüm benzersiz takım isimleri (Spotlight Arama ve Kulübüm widget'ı için)
  const allTeamNames = useMemo(() => {
    const set = new Set<string>();
    (data?.matches || []).forEach((m) => {
      if (m.home_team) set.add(m.home_team);
      if (m.away_team) set.add(m.away_team);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [data?.matches]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tvf_favorites");
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }

    // 81 İl listesini yükle
    fetch("/api/cities")
      .then((res) => res.json())
      .then((json) => {
        if (json?.cities) {
          setCitiesList(json.cities);
        }
      })
      .catch((e) => console.error("Cities load error:", e));
  }, []);

  // Favori maçlar için 30 dakika kala tarayıcı hatırlatma kontrolü (GÖREV 2)
  useEffect(() => {
    if (favorites.length === 0 || !data?.matches || data.matches.length === 0) return;

    // Sayfa açıldığında veya favori değiştiğinde hemen kontrol et
    checkAndTriggerMatchReminders(data.matches, favorites);

    // Sekme açıkken her 60 saniyede bir düzenli kontrol et
    const timer = setInterval(() => {
      checkAndTriggerMatchReminders(data.matches, favorites);
    }, 60000);

    return () => clearInterval(timer);
  }, [favorites, data?.matches]);

  const toggleFavorite = (matchId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId];
      try {
        localStorage.setItem("tvf_favorites", JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fixtures?city=${currentCitySlug}`);
      if (!res.ok) {
        throw new Error("Bülten verisi yüklenemedi.");
      }
      const json: FixturesData = await res.json();
      clientCityCache.set(currentCitySlug, json);
      setData(json);
      setIsPartialData(false);
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };


  // Bugün & Dün tarihleri — sadece client tarafında hesaplanır.
  // useMemo yerine useEffect kullanılır: SSR (UTC) vs istemci (UTC+3) timezone farkından
  // kaynaklanan React hydration error #418 (metin uyuşmazlığı) önlenir.
  const [todayStr, setTodayStr] = useState("");
  const [yesterdayStr, setYesterdayStr] = useState("");

  useEffect(() => {
    const computeDate = (offsetDays = 0) => {
      const d = new Date();
      d.setDate(d.getDate() - offsetDays);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    setTodayStr(computeDate(0));
    setYesterdayStr(computeDate(1));
  }, []);

  // Bugün oynanacak veya dünden skoru henüz girilmemiş maç sayısı (Header rozeti için)
  const todayMatchesCount = useMemo(() => {
    return (data?.matches || []).filter(
      (m) => m.date === todayStr || (m.date === yesterdayStr && !isMatchScored(m))
    ).length;
  }, [data, todayStr, yesterdayStr]);

  // Türkiye genelindeki toplam maç sayısı
  const totalMatchesAcrossAll = useMemo(() => {
    return citiesList.reduce((acc, c) => acc + (c.matches_count || 0), 0);
  }, [citiesList]);

  // Tüm benzersiz takvim tarihleri (TBD hariç)
  const uniqueDates = useMemo(() => {
    if (!data?.matches) return [];
    const set = new Set(data.matches.map((m) => m.date).filter((d) => d && d !== "TBD"));
    return Array.from(set).sort();
  }, [data]);

  // Sonuçlanan maçların benzersiz tarihleri (En yeni tarihten geriye doğru sıralı)
  const uniqueResultDates = useMemo(() => {
    if (!data?.matches) return [];
    const set = new Set(
      data.matches
        .filter(isMatchScored)
        .map((m) => m.date)
        .filter((d) => d && d !== "TBD")
    );
    return Array.from(set).sort().reverse();
  }, [data]);

  // Tarih bazlı maç sayıları
  const dateCounts = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    (data?.matches || []).forEach((m) => {
      counts[m.date] = (counts[m.date] || 0) + 1;
    });
    return counts;
  }, [data]);

  // Sonuçlanan maçların tarih bazlı sayıları
  const resultDateCounts = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    (data?.matches || []).forEach((m) => {
      if (isMatchScored(m) && m.date && m.date !== "TBD") {
        counts[m.date] = (counts[m.date] || 0) + 1;
      }
    });
    return counts;
  }, [data]);

  // Durum bazlı toplamlar (Sadece tarihi açıklanan maçlar)
  const counts = useMemo(() => {
    const validMatches = (data?.matches || []).filter((m) => m.date && m.date !== "TBD");
    const all = validMatches.length;
    const upcoming = validMatches.filter((m) => m.status === "upcoming").length;
    const finished = validMatches.filter((m) => m.status === "finished").length;
    return { all, upcoming, finished };
  }, [data]);

  // Sonuçlanan toplam maç sayısı (Header rozeti ve Sonuçlar sekmesi için)
  const resultsCount = useMemo(() => {
    return (data?.matches || []).filter(isMatchScored).length;
  }, [data]);

  // Canlı maç sayısı
  const liveMatchesCount = useMemo(() => {
    return (data?.matches || []).filter((m) => m.status === "live").length;
  }, [data]);

  // Dünün sonuçlanan maç sayısı
  const yesterdayResultsCount = useMemo(() => {
    return (data?.matches || []).filter((m) => isMatchScored(m) && m.date === yesterdayStr).length;
  }, [data, yesterdayStr]);

  // Tüm İller seçili mi?
  const isAllCities = currentCitySlug === "all" || data?.city === "Tüm İller";

  // Türkiye genelindeki toplam biten / sonuçlanan maç sayısı
  const totalResultsAcrossAll = useMemo(() => {
    if (currentCitySlug === "all") return resultsCount;
    return citiesList.reduce((acc, c) => acc + (c.finished_count || c.scored_matches || 0), resultsCount);
  }, [citiesList, currentCitySlug, resultsCount]);

  // Volleybox senkronizasyon ve skor istatistikleri
  const volleyboxStats = useMemo(() => {
    const validMatches = (data?.matches || []).filter((m) => m.date && m.date !== "TBD");
    const total = validMatches.length;
    const syncedMatches = validMatches.filter((m) => m.volleybox?.synced);
    const synced = syncedMatches.length;
    const scored = syncedMatches.filter((m) => m.volleybox?.has_score).length;
    // Skorsuz: SADECE maç günü geçmiş (dün veya daha eski) ve Volleybox'a skoru henüz girilmemiş olanlar!
    // Kullanıcı skorları genelde maçtan bir gün sonra girdiği için maç günü (o gün) olan maçlar skorsuz sayılmaz.
    const unscored = syncedMatches.filter(
      (m) => !m.volleybox?.has_score && isMatchOverdueForScore(m.volleybox?.vb_date || m.date, todayStr)
    ).length;
    // Değişenler: İl bülteninde tarihi, saati veya salonu değişen maçlar
    const discrepancy = syncedMatches.filter(
      (m) => m.volleybox?.discrepancy?.has_diff
    ).length;
    const unsynced = total - synced;
    const percent = total > 0 ? Math.round((synced / total) * 100) : 0;
    return { total, synced, scored, unscored, unsynced, discrepancy, percent };
  }, [data, todayStr]);

  // Filtrelenmiş Maç Listesi
  const filteredMatches = useMemo(() => {
    return (data?.matches || []).filter((m) => {
      // 1. Favoriler
      if (showOnlyFavorites && !favorites.includes(m.id)) {
        return false;
      }

      // 2. Kategori / Lig
      if (!matchesLeagueFilter(m, selectedCategory)) return false;

      // 3. Tarih
      if (selectedDate !== "all" && m.date !== selectedDate) {
        return false;
      }

      // 4. Durum (HEPSİ / OYNANACAK / BİTENLER)
      if (statusFilter === "upcoming" && m.status === "finished") return false;
      if (statusFilter === "finished" && m.status !== "finished") return false;

      // 5. Salon
      if (selectedHall !== "Tümü" && m.hall !== selectedHall) {
        return false;
      }

      // 6. Arama
      if (searchQuery.trim()) {
        const q = trLower(searchQuery).trim();
        const matchText = `${m.home_team} ${m.away_team} ${m.hall} ${m.category} ${m.match_no} ${m.city || ""}`;
        if (!trIncludes(matchText, q)) {
          return false;
        }
      }

      // 7. Volleybox Senkronizasyon ve Skor Filtresi
      if (volleyboxFilter === "synced" && !m.volleybox?.synced) {
        return false;
      }
      if (volleyboxFilter === "scored" && (!m.volleybox?.synced || !m.volleybox?.has_score)) {
        return false;
      }
      // Skorsuz: Maç günü geçmiş olmasına rağmen Volleybox'a skor girilmemiş olanlar (O gün olan maçlar hariç)
      if (
        volleyboxFilter === "unscored" &&
        (!m.volleybox?.synced || m.volleybox?.has_score || !isMatchOverdueForScore(m.volleybox?.vb_date || m.date, todayStr))
      ) {
        return false;
      }
      // Değişenler: İl temsilciliği bülteninde tarih, saat veya salonu değişenler
      if (
        volleyboxFilter === "discrepancy" &&
        (!m.volleybox?.synced || !m.volleybox?.discrepancy?.has_diff)
      ) {
        return false;
      }
      if (volleyboxFilter === "unsynced" && m.volleybox?.synced) {
        return false;
      }

      return true;
    });
  }, [data, showOnlyFavorites, favorites, selectedCategory, selectedDate, statusFilter, selectedHall, searchQuery, volleyboxFilter, todayStr]);

  // Lig & Gruba göre grupla (Genç Kızlar Süper Lig - A Grubu, B Grubu vb.)
  // Tüm İller seçildiğinde görseldeki yere il adı yazılır ve iller ayrılır
  const groupedSections = useMemo(() => {
    const sections: {
      [key: string]: {
        title: string;
        subTitle: string;
        city?: string;
        matches: Match[];
      };
    } = {};

    filteredMatches.forEach((m) => {
      const matchCity = m.city || data?.city || "Genel";
      const groupKey = isAllCities
        ? `${matchCity}::${m.category} - ${m.group}`
        : `${m.category} - ${m.group}`;

      if (!sections[groupKey]) {
        sections[groupKey] = {
          title: m.category,
          subTitle: m.group,
          city: matchCity,
          matches: [],
        };
      }
      sections[groupKey].matches.push(m);
    });

    // Her bölümün maçlarını tarih ve saat sırasına göre diz (Erken saatteki maç her zaman ilk)
    Object.values(sections).forEach((sec) => {
      sec.matches.sort((m1, m2) => compareMatchDateTime(m1, m2, "asc"));
    });

    // Grupları her zaman kesin sırala: Tüm iller modunda önce Şehir, sonra Kategori ve Grup
    return Object.values(sections).sort((a, b) => {
      if (isAllCities) {
        const cityComp = (a.city || "").localeCompare(b.city || "", "tr");
        if (cityComp !== 0) return cityComp;
      }
      // 1. Kategori / Lig sıralaması
      const catComp = (a.title || "").localeCompare(b.title || "", "tr", { numeric: true });
      if (catComp !== 0) return catComp;

      // 2. Grup adı sıralaması: A Grubu, B Grubu, C Grubu... (Türkçe ve nümerik duyarlı)
      return (a.subTitle || "").localeCompare(b.subTitle || "", "tr", { numeric: true });
    });
  }, [filteredMatches, isAllCities, data?.city]);

  // Fikstür maçlarını illere göre grupla (Her ilin altında lig ve grup tabloları)
  const fixturesByCity = useMemo(() => {
    const map = new Map<
      string,
      {
        city: string;
        totalMatches: number;
        sections: typeof groupedSections;
      }
    >();

    groupedSections.forEach((sec) => {
      const cityName = sec.city || data?.city || "Genel";
      if (!map.has(cityName)) {
        map.set(cityName, {
          city: cityName,
          totalMatches: 0,
          sections: [],
        });
      }
      const group = map.get(cityName)!;
      group.totalMatches += sec.matches.length;
      group.sections.push(sec);
    });

    return Array.from(map.values()).sort((a, b) => a.city.localeCompare(b.city, "tr"));
  }, [groupedSections, data?.city]);

  // Sadece skoru/sonucu olan maçlar için filtrelenmiş liste
  const filteredResultMatches = useMemo(() => {
    return (data?.matches || []).filter((m) => {
      if (!isMatchScored(m)) return false;

      // Sonuçlar seçilen tarih filtresi
      if (selectedResultDate !== "all" && m.date !== selectedResultDate) {
        return false;
      }

      // Sonuçlar alt sekme filtresi: "yesterday" seçildiyse sadece dünün maçlarını göster
      if (resultsSubTab === "yesterday" && m.date !== yesterdayStr) {
        return false;
      }

      if (showOnlyFavorites && !favorites.includes(m.id)) {
        return false;
      }

      if (!matchesLeagueFilter(m, selectedCategory)) return false;

      if (selectedHall !== "Tümü" && m.hall !== selectedHall) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = trLower(searchQuery).trim();
        const matchText = `${m.home_team} ${m.away_team} ${m.hall} ${m.category} ${m.match_no} ${m.city || ""}`;
        if (!trIncludes(matchText, q)) {
          return false;
        }
      }

      if (volleyboxFilter === "synced" && !m.volleybox?.synced) {
        return false;
      }
      if (volleyboxFilter === "scored" && (!m.volleybox?.synced || !m.volleybox?.has_score)) {
        return false;
      }
      if (volleyboxFilter === "unsynced" && m.volleybox?.synced) {
        return false;
      }
      if (volleyboxFilter === "discrepancy" && (!m.volleybox?.synced || !m.volleybox?.discrepancy?.has_diff)) {
        return false;
      }

      return true;
    });
  }, [data, selectedResultDate, resultsSubTab, yesterdayStr, showOnlyFavorites, favorites, selectedCategory, selectedHall, searchQuery, volleyboxFilter]);

  // Sonuçlar için Şehir ve Lig bazlı hiyerarşik gruplama (İzmir başlığı altında U18 / U16 ve A Grubu / B Grubu)
  const resultsByCityAndLeague = useMemo<CityResultGroup[]>(() => {
    return groupResultsByCityAndLeague(filteredResultMatches, data?.city);
  }, [filteredResultMatches, data?.city]);

  // Sonuçlar sekmesi toplu il gizleme / gösterme durumları
  const areAllResultCitiesCollapsed = useMemo(() => {
    if (resultsByCityAndLeague.length === 0) return false;
    return resultsByCityAndLeague.every((c) => Boolean(collapsedResultCities[c.city]));
  }, [resultsByCityAndLeague, collapsedResultCities]);

  const expandAllResultCities = () => {
    setCollapsedResultCities({});
  };

  const collapseAllResultCities = () => {
    const next: Record<string, boolean> = {};
    resultsByCityAndLeague.forEach((c) => {
      next[c.city] = true;
    });
    setCollapsedResultCities(next);
  };

  // Sonuçlar sekmesi lig anahtarları ve toplu lig gizleme / gösterme durumları
  const allResultLeagueKeys = useMemo(() => {
    const keys: string[] = [];
    resultsByCityAndLeague.forEach((c) => {
      c.leagues.forEach((l) => {
        keys.push(`${c.city}::${l.categoryKey}`);
      });
    });
    return keys;
  }, [resultsByCityAndLeague]);

  const areAllResultLeaguesCollapsed = useMemo(() => {
    if (allResultLeagueKeys.length === 0) return false;
    return allResultLeagueKeys.every((k) => Boolean(collapsedResultLeagues[k]));
  }, [allResultLeagueKeys, collapsedResultLeagues]);

  const expandAllResultLeagues = () => {
    setCollapsedResultLeagues({});
  };

  const collapseAllResultLeagues = () => {
    const next: Record<string, boolean> = {};
    allResultLeagueKeys.forEach((k) => {
      next[k] = true;
    });
    setCollapsedResultLeagues(next);
  };

  // Fikstür sekmesi toplu il gizleme / gösterme durumları
  const areAllFixtureCitiesCollapsed = useMemo(() => {
    if (fixturesByCity.length === 0) return false;
    return fixturesByCity.every((c) => Boolean(collapsedFixtureCities[c.city]));
  }, [fixturesByCity, collapsedFixtureCities]);

  const expandAllFixtureCities = () => {
    setCollapsedFixtureCities({});
  };

  const collapseAllFixtureCities = () => {
    const next: Record<string, boolean> = {};
    fixturesByCity.forEach((c) => {
      next[c.city] = true;
    });
    setCollapsedFixtureCities(next);
  };

  // Fikstür sekmesi lig anahtarları ve toplu lig gizleme / gösterme durumları
  const allFixtureLeagueKeys = useMemo(() => {
    const keys: string[] = [];
    fixturesByCity.forEach((c) => {
      c.sections.forEach((sec) => {
        keys.push(`${c.city}::${sec.title}::${sec.subTitle || ""}`);
      });
    });
    return keys;
  }, [fixturesByCity]);

  const areAllFixtureLeaguesCollapsed = useMemo(() => {
    if (allFixtureLeagueKeys.length === 0) return false;
    return allFixtureLeagueKeys.every((k) => Boolean(collapsedFixtureLeagues[k]));
  }, [allFixtureLeagueKeys, collapsedFixtureLeagues]);

  const expandAllFixtureLeagues = () => {
    setCollapsedFixtureLeagues({});
  };

  const collapseAllFixtureLeagues = () => {
    const next: Record<string, boolean> = {};
    allFixtureLeagueKeys.forEach((k) => {
      next[k] = true;
    });
    setCollapsedFixtureLeagues(next);
  };

  const handleSelectResultsSubTab = (subTab: "all" | "yesterday") => {
    setResultsSubTab(subTab);
    if (subTab === "yesterday") {
      setSelectedResultDate(yesterdayStr);
    } else {
      setSelectedResultDate("all");
    }
  };

  const resetFilters = () => {
    setSelectedCategory("Tümü");
    setSelectedDate("all");
    setSelectedResultDate("all");
    setStatusFilter("all");
    setSelectedHall("Tümü");
    setVolleyboxFilter("all");
    setSearchQuery("");
    setShowOnlyFavorites(false);
    setResultsSubTab("all");
  };

  const isFiltered =
    selectedCategory !== "Tümü" ||
    (activeMainTab === "results" ? selectedResultDate !== "all" : selectedDate !== "all") ||
    statusFilter !== "all" ||
    selectedHall !== "Tümü" ||
    searchQuery.trim().length > 0 ||
    volleyboxFilter !== "all" ||
    showOnlyFavorites ||
    resultsSubTab !== "all";

  const activeStandings = useMemo(() => {
    const entries = Object.entries(data?.standings || {});
    if (selectedCategory === "Tümü") return Object.fromEntries(entries);
    const category = AGE_CATEGORIES.find((item) => selectedCategory.startsWith(item.label));
    return Object.fromEntries(entries.filter(([key]) => {
      if (!category) return trIncludes(key, selectedCategory);
      const categoryTerms: Record<string, string> = {
        genc: "genç",
        yildiz: "yıldız",
        kucuk: "küçük",
        midi: "midi",
        erkek: "erkek",
        diger: "",
      };
      if (category.key === "diger" && ["genç", "yıldız", "küçük", "midi", "erkek"].some((term) => trIncludes(key, term))) {
        return false;
      }
      if (categoryTerms[category.key] && !trIncludes(key, categoryTerms[category.key])) return false;
      const groupFilter = selectedCategory.slice(category.label.length).trim();
      return !groupFilter || trIncludes(key, groupFilter);
    }));
  }, [data?.standings, selectedCategory]);

  return (
    <MatchSelectionProvider matches={data?.matches || []} initialMatchId={selectedMatch?.id}>
      <AppShell
        header={
          <>
            {/* 0. Favori Maç Hatırlatma Banner'ı */}
            <NotificationBanner favoritesCount={favorites.length} />

            {/* 1. Header (SONUÇLAR, GÜNÜN MAÇLARI, FİKSTÜR ve PUAN DURUMU Sekmeleriyle) */}
            <Header
              city={data?.city}
              currentCitySlug={currentCitySlug}
              onSelectCity={handleSelectCity}
              cities={citiesList}
              title={data?.title}
              updatedAt={data?.updated_at}
              totalMatches={data?.total_matches || 0}
              todayMatchesCount={todayMatchesCount}
              resultsCount={resultsCount}
              favoritesCount={favorites.length}
              showOnlyFavorites={showOnlyFavorites}
              onToggleFavoritesOnly={() => setShowOnlyFavorites(!showOnlyFavorites)}
              activeTab={activeMainTab}
              onSelectTab={handleSelectTab}
              onRefresh={fetchData}
              isLoading={loading}
              onOpenSearch={() => setIsSearchOpen(true)}
            />

            {/* Canlı Skor Göstergesi */}
            {liveMatchesCount > 0 && (
              <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-red-950/80 border border-red-800 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-red-400">
                  {liveMatchesCount} Canlı Maç
                </span>
                <Wifi size={12} className="text-red-400" />
              </div>
            )}

            {/* 2. Üst İl Sekmeleri (Fikstür, Sonuçlar ve Puan Durumu sayfalarında gösterilir) */}
            {activeMainTab !== "home" && (
              <CityTabBar
                currentCitySlug={currentCitySlug}
                onSelectCity={handleSelectCity}
                cities={citiesList}
                totalMatchesAcrossAll={totalMatchesAcrossAll}
              />
            )}
          </>
        }
        leftSidebar={
          <SidebarNavigation
            cities={citiesList}
            currentCity={currentCitySlug}
            onSelectCity={handleSelectCity}
            matches={data?.matches || []}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            favoritesCount={favorites.length}
            totalMatches={totalMatchesAcrossAll}
          />
        }
        rightSidebar={
          activeMainTab === "standings" ? (
            <TeamInspectorPanel
              team={selectedStandingTeam?.team || null}
              context={selectedStandingTeam?.context || null}
              matches={data?.matches || []}
              onClose={() => setSelectedStandingTeam(null)}
            />
          ) : (
            <MatchInspectorPanel
              match={selectedMatch}
              allMatches={data?.matches || []}
              standings={data?.standings}
              isLoading={loading}
              onClose={() => setSelectedMatch(null)}
              onToggleFavorite={toggleFavorite}
              isFavorite={selectedMatch ? favorites.includes(selectedMatch.id) : false}
            />
          )
        }
        footer={
          <footer className="py-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-4 text-center text-xs text-[#94A3B8] no-print">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="font-semibold text-[#F1F5F9]">
                Altyapı Voleybol • {data?.city || "Türkiye"} Genç & Yıldız Kızlar Süper Lig
              </p>
              <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
                <span>Fikstür & Puan Durumu</span>
                <span className="text-[#94A3B8]">•</span>
                <span>Sofascore Voleybol Arayüz Mimarisi</span>
              </div>
            </div>
          </footer>
        }
      >
        <div className="space-y-4">
          {/* Desteklenen Kulüp (Primary Team VIP Widget) */}
          <PrimaryTeamWidget
            matches={data?.matches || []}
            city={data?.city}
            onSelectMatch={handleSelectMatch}
            availableTeams={allTeamNames}
          />

        {/* Hata Durumu */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2 mb-4 text-xs font-semibold shadow-md">
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. SEÇİLEN SEKME GÖRÜNÜMÜ VEYA İSKELET YÜKLEYİCİ (SIFIR CLS) */}
        {loading ? (
          <TabViewSkeleton tab={activeMainTab} />
        ) : activeMainTab === "results" ? (
          /* ==================== SONUÇLAR SEKMESİ (SADECE BİTEN / SKORLU MAÇLAR) ==================== */
          <div>
            {/* Flashscore Yatay Tarih Şeridi (Sonuçlar Modunda - Zümrüt Yeşili Temalı) */}
            <DateNavigationRibbon
              selectedDate={selectedResultDate}
              onSelectDate={(d) => {
                setSelectedResultDate(d);
                if (d === "all") {
                  setResultsSubTab("all");
                } else if (d === yesterdayStr) {
                  setResultsSubTab("yesterday");
                } else {
                  setResultsSubTab("all");
                }
              }}
              todayStr={todayStr}
              availableDates={uniqueResultDates}
              showStatusFilters={false}
              statusFilter="finished"
              onSelectStatusFilter={() => {}}
              counts={{ all: resultsCount, live: 0, finished: resultsCount, upcoming: 0 }}
            />

            {/* Flashscore Filtre Barı (Sonuçlar Modunda) */}
            {data?.filters && (
              <FilterBar
                categories={data.filters.categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                statusFilter="finished"
                onSelectStatusFilter={() => {}}
                counts={{
                  all: resultsCount,
                  upcoming: 0,
                  finished: resultsCount,
                }}
                halls={data.filters.halls}
                selectedHall={selectedHall}
                onSelectHall={setSelectedHall}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                volleyboxFilter={volleyboxFilter}
                onSelectVolleyboxFilter={setVolleyboxFilter}
                volleyboxStats={volleyboxStats}
                onReset={resetFilters}
                isFiltered={isFiltered}
                isResultsTab={true}
                resultsSubTab={resultsSubTab}
                onSelectResultsSubTab={handleSelectResultsSubTab}
                yesterdayCount={yesterdayResultsCount}
              />
            )}

            {/* Seçilen Tarihin Sonuçları Bilgi ve Kolay Geçiş Rozeti */}
            {selectedResultDate !== "all" && (
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-3.5 py-2.5 mb-4 text-xs text-emerald-300 shadow-sm max-w-6xl mx-auto flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-emerald-400 shrink-0" />
                  <span>
                    <strong>
                      {selectedResultDate === yesterdayStr
                        ? "Dünün Sonuçları:"
                        : `${formatDateTurkish(selectedResultDate)} Sonuçları:`}
                    </strong>{" "}
                    {formatDateTurkish(selectedResultDate)}
                  </span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
                    {filteredResultMatches.length} Maç
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResultDate("all");
                    setResultsSubTab("all");
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-200 font-semibold underline underline-offset-2 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Tüm Sonuçları Göster ({resultsCount})</span>
                </button>
              </div>
            )}

            {/* Toplu İl ve Lig Gizleme / Gösterme Kontrol Çubuğu */}
            {resultsByCityAndLeague.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3.5 sm:px-4 py-2 mb-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Toplam <strong className="text-white font-mono">{resultsByCityAndLeague.length}</strong> İl, <strong className="text-white font-mono">{allResultLeagueKeys.length}</strong> Lig Listeleniyor
                  </span>
                  {areAllResultLeaguesCollapsed && (
                    <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-normal">
                      (Ligler Gizli)
                    </span>
                  )}
                  {areAllResultCitiesCollapsed && (
                    <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-normal">
                      (İller Gizli)
                    </span>
                  )}
                </div>

                <details className="relative">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/80">
                    Görünüm
                    <ChevronDown size={13} aria-hidden="true" />
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 flex min-w-max flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
                  {/* İl Kontrolleri (Birden çok il listeleniyorsa) */}
                  {resultsByCityAndLeague.length > 1 && (
                    <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
                      <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:inline">İller:</span>
                      <button
                        type="button"
                        onClick={expandAllResultCities}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !areAllResultCitiesCollapsed
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Tüm illeri aç ve sonuçları göster"
                      >
                        <ChevronDown size={13} className="text-emerald-400" />
                        <span>Tümünü Göster</span>
                      </button>
                      <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
                      <button
                        type="button"
                        onClick={collapseAllResultCities}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          areAllResultCitiesCollapsed
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Tüm illeri gizle"
                      >
                        <ChevronUp size={13} className="text-amber-400" />
                        <span>Tümünü Gizle</span>
                      </button>
                    </div>
                  )}

                  {/* Lig Kontrolleri */}
                  {allResultLeagueKeys.length > 0 && (
                    <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
                      <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:inline">Ligler:</span>
                      <button
                        type="button"
                        onClick={expandAllResultLeagues}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !areAllResultLeaguesCollapsed
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Tüm ligleri aç ve maçları göster"
                      >
                        <ChevronDown size={13} className="text-emerald-400" />
                        <span>Ligleri Aç</span>
                      </button>
                      <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
                      <button
                        type="button"
                        onClick={collapseAllResultLeagues}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          areAllResultLeaguesCollapsed
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Tüm ligleri gizle"
                      >
                        <ChevronUp size={13} className="text-amber-400" />
                        <span>Ligleri Gizle</span>
                      </button>
                    </div>
                  )}
                  </div>
                </details>
              </div>
            )}

            {/* Sonuçlar Tablosu: Şehir Başlığı Altında Ligler (U18/U16) ve Gruplar (A Grubu, B Grubu) */}
            {resultsByCityAndLeague.length > 0 && (
              <Virtuoso
                useWindowScroll
                data={resultsByCityAndLeague}
                increaseViewportBy={{ top: 600, bottom: 900 }}
                itemContent={(_, cityGroup) => {
                  const isCityCollapsed = Boolean(collapsedResultCities[cityGroup.city]);

                  return (
                    <div className="space-y-3 pb-6">
                      {/* Şehir Başlık Banner'ı: Tıklandığında o ilin maçlarını gizler/açar */}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={!isCityCollapsed}
                        onClick={() => toggleResultCityCollapse(cityGroup.city)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleResultCityCollapse(cityGroup.city);
                          }
                        }}
                        className="flex items-center justify-between bg-gradient-to-r from-slate-900/95 via-[#0d172a] to-slate-900/95 border border-sky-500/30 hover:border-sky-400/60 rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-md transition-all cursor-pointer select-none group/city active:scale-[0.99]"
                        title={isCityCollapsed ? `${cityGroup.city} maçlarını göster` : `${cityGroup.city} maçlarını gizle`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-500/20 group-hover/city:bg-sky-500/30 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black shadow-xs transition-colors">
                            <MapPin size={15} className="text-sky-300" />
                          </div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xs sm:text-sm md:text-base font-black text-white tracking-wide uppercase flex items-center gap-1.5 group-hover/city:text-sky-200 transition-colors">
                              <span>{cityGroup.city}</span>
                              <span className="text-slate-400 font-normal text-xs">• TVF İl Temsilciliği</span>
                            </h2>
                            <span className="text-[10px] sm:text-[11px] font-bold text-sky-400 bg-sky-950/80 border border-sky-700/60 px-2 py-0.5 rounded-full font-mono">
                              {cityGroup.totalMatches} Maç
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCityCollapsed ? (
                            <span className="text-[11px] text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <span>Gizlendi (Göster)</span>
                              <ChevronDown size={13} className="text-amber-400" />
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium group-hover/city:text-slate-200 flex items-center gap-1">
                              <span className="hidden sm:inline">Gizle</span>
                              <ChevronUp size={13} className="text-slate-400 group-hover/city:text-white transition-colors" />
                            </span>
                          )}

                          {isAllCities && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCity(slugify(cityGroup.city));
                              }}
                              className="text-[11px] text-sky-400 hover:text-sky-200 font-semibold underline underline-offset-2 transition-colors cursor-pointer hidden sm:inline-flex ml-2"
                              title={`${cityGroup.city} sayfasına git`}
                            >
                              {cityGroup.city} Sayfası →
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bu Şehirdeki Ligler (Örn: Genç Kızlar Süper Lig (U18), Yıldız Kızlar Süper Lig (U16)) */}
                      {!isCityCollapsed && (
                        <div className="space-y-3 animate-in fade-in-50 duration-200">
                          {cityGroup.leagues.map((sec, idx) => {
                            const leagueKey = `${cityGroup.city}::${sec.categoryKey}`;
                            return (
                              <LeagueSection
                                key={`${cityGroup.city}-${sec.categoryKey}-${idx}`}
                                leagueTitle={`${sec.title} · ${sec.subTitle}`}
                                cityName={cityGroup.city}
                                matches={sec.matches}
                                favorites={favorites}
                                onToggleFavorite={toggleFavorite}
                                onSelectMatch={handleSelectMatch}
                                isCollapsed={Boolean(collapsedResultLeagues[leagueKey])}
                                onToggleCollapse={() => toggleResultLeagueCollapse(leagueKey)}
                                mode="results"
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            )}

            {/* Sonuç Bulunamadı */}
            {resultsByCityAndLeague.length === 0 && (
              <div className="text-center py-12 bg-gradient-to-br from-[#0f172a] via-[#0b1325] to-[#1e293b] border border-slate-800 rounded-2xl p-6 max-w-lg mx-auto my-8 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-emerald-400 border border-slate-700">
                  {resultsSubTab === "yesterday" ? <History size={22} /> : <CheckCircle2 size={22} />}
                </div>

                {resultsSubTab === "yesterday" ? (
                  <>
                    <h3 className="text-sm font-bold text-white mb-1">
                      {data?.city && data?.city !== "Tüm İller"
                        ? `TVF ${data.city} İçin Dün (${formatDateTurkish(yesterdayStr)}) Oynanan Maç Bulunmuyor`
                        : `Dün (${formatDateTurkish(yesterdayStr)}) Oynanan Maç Bulunmuyor`}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                      Dün bu ilde oynanmış maç kaydı bulunmuyor. Önceki tüm maç sonuçlarını görüntülemek için Tüm Sonuçlar sekmesine geçebilirsiniz.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setResultsSubTab("all")}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-md inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>Tüm Sonuçları Görüntüle ({resultsCount})</span>
                      </button>
                      {data?.city !== "Tüm İller" && (
                        <button
                          type="button"
                          onClick={() => handleSelectCity("all")}
                          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition-colors shadow-md"
                        >
                          Tüm İllerin Dünkü Sonuçları
                        </button>
                      )}
                    </div>
                  </>
                ) : filteredResultMatches.length === 0 && !isFiltered ? (
                  <>
                    <h3 className="text-sm font-bold text-white mb-1">
                      {data?.city && data?.city !== "Tüm İller"
                        ? `TVF ${data.city} İçin Henüz Biten Maç Bulunmuyor`
                        : "Henüz Tamamlanan Maç Kaydı Bulunmuyor"}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                      {data?.city && data?.city !== "Tüm İller"
                        ? `TVF ${data.city} fikstüründeki maçlar oynanıp skorlar açıklandığında sonuçlar anında burada listelenecektir.`
                        : "Fikstür maçları oynandıkça skor ve set sonuçları otomatik olarak burada listelenir."}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setActiveMainTab("fixtures")}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-md"
                      >
                        Fikstürü Görüntüle
                      </button>
                      {data?.city !== "Tüm İller" && (
                        <button
                          onClick={() => handleSelectCity("all")}
                          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition-colors shadow-md"
                        >
                          Tüm İllerin Sonuçlarını Gör ({totalResultsAcrossAll})
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-bold text-white mb-1">
                      {selectedResultDate !== "all"
                        ? `${formatDateTurkish(selectedResultDate)} Tarihinde Sonuçlanan Maç Bulunamadı`
                        : showOnlyFavorites
                        ? "Favori Maçlarınız Arasında Biten Maç Bulunmuyor"
                        : "Kriterlere Uygun Sonuçlanan Maç Bulunamadı"}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {selectedResultDate !== "all"
                        ? "Seçilen tarihte oynanmış veya sonucu sisteme girilmiş bir maç kaydı bulunmuyor."
                        : showOnlyFavorites
                        ? "Favoriye aldığınız maçlar tamamlandığında skorları burada görüntülenecektir."
                        : "Seçtiğiniz lig veya arama filtresine uygun sonuçlanan maç kaydı bulunmamaktadır."}
                    </p>
                    {isFiltered && (
                      <button
                        onClick={resetFilters}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-md cursor-pointer"
                      >
                        Filtreleri Sıfırla
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : activeMainTab === "home" ? (
          /* ==================== ANASAYFA PORTAL & DASHBOARD ==================== */
          <HomePortalView
            matches={data?.matches || []}
            city={data?.city}
            currentCitySlug={currentCitySlug}
            onSelectCity={handleSelectCity}
            citiesList={citiesList}
            standings={data?.standings || {}}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectMatch={handleSelectMatch}
            onNavigateTab={handleSelectTab}
            todayStr={todayStr}
            yesterdayStr={yesterdayStr}
          />
        ) : activeMainTab === "today" ? (
          /* ==================== GÜNÜN MAÇLARI — Sofascore Kompakt Maç Akışı ==================== */
          <CompactMatchFeed
            matches={data?.matches || []}
            selectedMatchId={selectedMatch?.id || null}
            onSelectMatch={(m) => handleSelectMatch(m)}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            todayStr={todayStr}
            yesterdayStr={yesterdayStr}
            city={data?.city}
          />
        ) : activeMainTab === "fixtures" ? (
          /* ==================== FİKSTÜR SEKMESİ ==================== */
          <div>
            {/* Sonuçlar sayfasıyla aynı hızlı tarih şeridi */}
            <DateNavigationRibbon
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              todayStr={todayStr}
              statusFilter={statusFilter as "all" | "upcoming" | "finished"}
              onSelectStatusFilter={() => {}}
              counts={{
                all: counts.all,
                live: liveMatchesCount,
                finished: counts.finished,
                upcoming: counts.upcoming,
              }}
              showStatusFilters={false}
            />

            {/* Flashscore Filtre Barı (HEPSİ / OYNANACAK / BİTENLER) */}
            {data?.filters && (
              <FilterBar
                categories={data.filters.categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                statusFilter={statusFilter}
                onSelectStatusFilter={setStatusFilter}
                counts={counts}
                halls={data.filters.halls}
                selectedHall={selectedHall}
                onSelectHall={setSelectedHall}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                volleyboxFilter={volleyboxFilter}
                onSelectVolleyboxFilter={setVolleyboxFilter}
                volleyboxStats={volleyboxStats}
                onReset={resetFilters}
                isFiltered={isFiltered}
              />
            )}

            {/* Toplu İl ve Lig Gizleme / Gösterme Kontrol Çubuğu */}
            {fixturesByCity.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3.5 sm:px-4 py-2 mb-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span>
                    Toplam <strong className="text-white font-mono">{fixturesByCity.length}</strong> İl, <strong className="text-white font-mono">{allFixtureLeagueKeys.length}</strong> Lig Listeleniyor
                  </span>
                  {areAllFixtureLeaguesCollapsed && (
                    <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-normal">
                      (Ligler Gizli)
                    </span>
                  )}
                  {areAllFixtureCitiesCollapsed && (
                    <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-normal">
                      (İller Gizli)
                    </span>
                  )}
                </div>

                <details className="relative">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/80">
                    Görünüm
                    <ChevronDown size={13} aria-hidden="true" />
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 flex min-w-max flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
                  {/* İl Kontrolleri (Birden çok il listeleniyorsa) */}
                  {fixturesByCity.length > 1 && (
                    <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
                      <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:inline">İller:</span>
                      <button
                        type="button"
                        onClick={expandAllFixtureCities}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !areAllFixtureCitiesCollapsed
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-xs"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Tüm illeri aç ve fikstür maçlarını göster"
                      >
                        <ChevronDown size={13} className="text-sky-400" />
                        <span>Tümünü Göster</span>
                      </button>
                      <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
                      <button
                        type="button"
                        onClick={collapseAllFixtureCities}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          areAllFixtureCitiesCollapsed
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Tüm illeri gizle"
                      >
                        <ChevronUp size={13} className="text-amber-400" />
                        <span>Tümünü Gizle</span>
                      </button>
                    </div>
                  )}

                  {/* Lig Kontrolleri */}
                  {allFixtureLeagueKeys.length > 0 && (
                    <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
                      <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:inline">Ligler:</span>
                      <button
                        type="button"
                        onClick={expandAllFixtureLeagues}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !areAllFixtureLeaguesCollapsed
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-xs"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Tüm ligleri aç ve fikstür maçlarını göster"
                      >
                        <ChevronDown size={13} className="text-sky-400" />
                        <span>Ligleri Aç</span>
                      </button>
                      <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
                      <button
                        type="button"
                        onClick={collapseAllFixtureLeagues}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          areAllFixtureLeaguesCollapsed
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                            : "text-slate-400 hover:text-white"
                        }`}
                        title="Tüm ligleri gizle"
                      >
                        <ChevronUp size={13} className="text-amber-400" />
                        <span>Ligleri Gizle</span>
                      </button>
                    </div>
                  )}
                  </div>
                </details>
              </div>
            )}

            {/* Resmi Fikstür Tablosu: İllere Göre Gruplanmış ve Açılır/Kapanır */}
            {fixturesByCity.length > 0 && (
              <Virtuoso
                useWindowScroll
                data={fixturesByCity}
                increaseViewportBy={{ top: 600, bottom: 900 }}
                itemContent={(_, cityGroup) => {
                  const isCityCollapsed = Boolean(collapsedFixtureCities[cityGroup.city]);

                  return (
                    <div className="space-y-3 pb-6">
                      {/* Şehir Başlık Banner'ı: Tıklandığında o ilin maçlarını gizler/açar */}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={!isCityCollapsed}
                        onClick={() => toggleFixtureCityCollapse(cityGroup.city)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleFixtureCityCollapse(cityGroup.city);
                          }
                        }}
                        className="flex items-center justify-between bg-gradient-to-r from-slate-900/95 via-[#0d172a] to-slate-900/95 border border-sky-500/30 hover:border-sky-400/60 rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-md transition-all cursor-pointer select-none group/city active:scale-[0.99]"
                        title={isCityCollapsed ? `${cityGroup.city} fikstürünü göster` : `${cityGroup.city} fikstürünü gizle`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-500/20 group-hover/city:bg-sky-500/30 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black shadow-xs transition-colors">
                            <MapPin size={15} className="text-sky-300" />
                          </div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xs sm:text-sm md:text-base font-black text-white tracking-wide uppercase flex items-center gap-1.5 group-hover/city:text-sky-200 transition-colors">
                              <span>{cityGroup.city}</span>
                              <span className="text-slate-400 font-normal text-xs">• TVF İl Temsilciliği</span>
                            </h2>
                            <span className="text-[10px] sm:text-[11px] font-bold text-sky-400 bg-sky-950/80 border border-sky-700/60 px-2 py-0.5 rounded-full font-mono">
                              {cityGroup.totalMatches} Maç
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCityCollapsed ? (
                            <span className="text-[11px] text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <span>Gizlendi (Göster)</span>
                              <ChevronDown size={13} className="text-amber-400" />
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium group-hover/city:text-slate-200 flex items-center gap-1">
                              <span className="hidden sm:inline">Gizle</span>
                              <ChevronUp size={13} className="text-slate-400 group-hover/city:text-white transition-colors" />
                            </span>
                          )}

                          {isAllCities && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCity(slugify(cityGroup.city));
                              }}
                              className="text-[11px] text-sky-400 hover:text-sky-200 font-semibold underline underline-offset-2 transition-colors cursor-pointer hidden sm:inline-flex ml-2"
                              title={`${cityGroup.city} sayfasına git`}
                            >
                              {cityGroup.city} Sayfası →
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bu Şehirdeki Fikstür Tabloları */}
                      {!isCityCollapsed && (
                        <div className="space-y-4 animate-in fade-in-50 duration-200">
                          {cityGroup.sections.map((sec, idx) => {
                            const leagueKey = `${cityGroup.city}::${sec.title}::${sec.subTitle || ""}`;
                            return (
                              <LeagueSection
                                key={`${cityGroup.city}-${sec.title}-${sec.subTitle}-${idx}`}
                                leagueTitle={`${sec.title} · ${sec.subTitle}`}
                                cityName={cityGroup.city}
                                matches={sec.matches}
                                favorites={favorites}
                                onToggleFavorite={toggleFavorite}
                                onSelectMatch={handleSelectMatch}
                                isCollapsed={Boolean(collapsedFixtureLeagues[leagueKey])}
                                onToggleCollapse={() => toggleFixtureLeagueCollapse(leagueKey)}
                                mode="fixtures"
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            )}

            {/* Sonuç Bulunamadı / İl Sezon Takvimi Bekleniyor */}
            {groupedSections.length === 0 && (
              <div className="text-center py-12 bg-gradient-to-br from-[#0f172a] via-[#0b1325] to-[#1e293b] border border-slate-800 rounded-2xl p-6 max-w-lg mx-auto my-8 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400 border border-slate-700">
                  {showOnlyFavorites ? (
                    <Star size={22} className="text-amber-400" />
                  ) : (
                    <SearchX size={22} />
                  )}
                </div>

                {(data?.matches || []).length === 0 ? (
                  <>
                    <h3 className="text-sm font-bold text-white mb-1">
                      TVF {data?.city || "Bu İl"} Fikstür Takvimi Henüz Açıklanmadı
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                      TVF {data?.city} İl Temsilciliği 2026-2027 sezonu için Genç ve Yıldız Kızlar Süper Lig bültenini sisteme girdiğinde maçlar otomatik olarak burada listelenecektir.
                    </p>
                    <button
                      onClick={() => handleSelectCity("istanbul")}
                      className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-md"
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
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-md"
                      >
                        Filtreleri Sıfırla
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : activeMainTab === "standings" ? (
          /* ==================== PUAN DURUMU SEKMESİ ==================== */
          <div>
            {Object.keys(activeStandings).length > 0 ? (
              <StandingsTable
                standingsData={activeStandings}
                city={data?.city}
                onSelectTeam={(team, context) => setSelectedStandingTeam({ team, context })}
              />
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-[#0f172a] via-[#0b1325] to-[#1e293b] border border-slate-800 rounded-2xl p-6 max-w-md mx-auto my-8 shadow-xl">
                <p className="text-sm font-semibold text-slate-300">
                  TVF {data?.city || "Bu İl"} için henüz puan durumu tablosu oluşturulmamıştır.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ==================== GRUP DURUMU SEKMESİ (VOLLEYBOX) ==================== */
          <div>
            <GroupStatusView
              selectedCity={currentCitySlug}
              onSelectCity={handleSelectCity}
              citiesList={citiesList}
              onRefresh={fetchData}
              isLoading={loading}
            />
          </div>
        )}
        </div>
      </AppShell>

      {/* 4. Mobil Sabit Alt Menü (Sofascore Standardı) */}
      <MobileBottomNav
        activeTab={
          showOnlyFavorites
            ? "favorites"
            : statusFilter === "live"
            ? "live"
            : activeMainTab === "standings"
            ? "standings"
            : isLeaguesMenuOpen
            ? "leagues"
            : "matches"
        }
        onSelectTab={(tab) => {
          if (tab === "matches") {
            setIsLeaguesMenuOpen(false);
            setShowOnlyFavorites(false);
            setStatusFilter("all");
            handleSelectTab("today");
          } else if (tab === "live") {
            setIsLeaguesMenuOpen(false);
            setShowOnlyFavorites(false);
            setStatusFilter("live");
            handleSelectTab("today");
          } else if (tab === "standings") {
            setIsLeaguesMenuOpen(false);
            setShowOnlyFavorites(false);
            handleSelectTab("standings");
          } else if (tab === "leagues") {
            setIsLeaguesMenuOpen(true);
          } else if (tab === "favorites") {
            setIsLeaguesMenuOpen(false);
            setShowOnlyFavorites(true);
            handleSelectTab("fixtures");
          }
        }}
        favoriteCount={favorites.length}
        liveCount={liveMatchesCount}
        todayMatchesCount={todayMatchesCount}
        resultsCount={resultsCount}
      />

      {/* 5. Mobil Maç Detayı: Alttan Açılan Çekmece (MobileMatchDrawer) */}
      {isMobileDrawerOpen && selectedMatch && (
        <MobileMatchDrawer
          isOpen
          match={selectedMatch}
          onClose={() => setIsMobileDrawerOpen(false)}
          allMatches={data?.matches || []}
          standings={data?.standings}
          onToggleFavorite={toggleFavorite}
          isFavorite={favorites.includes(selectedMatch.id)}
        />
      )}

      {/* 6. Mobil Tam Ekran Ligler Menüsü (Sol Panel Ağacı) */}
      {isLeaguesMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1E222D] border-b border-[#2A2E3D]">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-blue-400" />
              <h2 className="text-sm font-bold text-white">Lig Navigasyonu</h2>
            </div>
            <button
              onClick={() => setIsLeaguesMenuOpen(false)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#181A20] transition-colors"
              aria-label="Kapat"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 bg-[#121212]">
            <SidebarNavigation
              cities={citiesList}
              currentCity={currentCitySlug}
              onSelectCity={(city) => {
                handleSelectCity(city);
                setIsLeaguesMenuOpen(false);
              }}
              matches={data?.matches || []}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setIsLeaguesMenuOpen(false);
              }}
              favoritesCount={favorites.length}
              totalMatches={totalMatchesAcrossAll}
            />
          </div>
        </div>
      )}

      {/* 6. Spotlight Hızlı Arama Modalı (Cmd + K) */}
      <SpotlightSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        teams={allTeamNames}
        halls={data?.filters?.halls || []}
        cities={citiesList}
        categories={data?.filters?.categories || []}
        onSelectCity={handleSelectCity}
        onSelectCategory={setSelectedCategory}
        onSelectHall={setSelectedHall}
      />
    </MatchSelectionProvider>
  );
};
