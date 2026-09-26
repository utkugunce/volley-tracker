"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { DateRibbon } from "@/components/DateRibbon";
import { FilterBar } from "@/components/FilterBar";
import { FixtureTable } from "@/components/FixtureTable";
import { StandingsTable } from "@/components/StandingsTable";
import { CityTabBar } from "@/components/CityTabBar";
import { TodayMatchesView } from "@/components/TodayMatchesView";
import { FeaturedMatchHero } from "@/components/FeaturedMatchHero";
import { HomePortalView } from "@/components/HomePortalView";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PrimaryTeamWidget } from "@/components/PrimaryTeamWidget";
import { GroupStatusView } from "@/components/GroupStatusView";
import dynamic from "next/dynamic";
import { Match, FixturesData } from "@/types/fixture";

const NotificationBanner = dynamic(
  () => import("@/components/NotificationBanner").then((mod) => mod.NotificationBanner),
  { ssr: false }
);
const MatchCenterDrawer = dynamic(
  () => import("@/components/MatchCenterDrawer").then((mod) => mod.MatchCenterDrawer),
  { ssr: false }
);
const SpotlightSearchModal = dynamic(
  () => import("@/components/SpotlightSearchModal").then((mod) => mod.SpotlightSearchModal),
  { ssr: false }
);
import { SearchX, AlertCircle, Star, CheckCircle2, Calendar, History, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { isMatchPassed, isMatchOverdueForScore, formatDateTurkish, compareMatchTimes, compareMatchDateTime } from "@/utils/calendar";
import { checkAndTriggerMatchReminders } from "@/utils/notifications";
import { groupResultsByCityAndLeague, CityResultGroup } from "@/utils/grouping";
import { slugify } from "@/utils/slugify";
import { trLower, trIncludes } from "@/utils/turkishLocale";

// Bir maçın skoru / sonucu olup olmadığını belirleyen yardımcı fonksiyon
export const isMatchScored = (m: Match): boolean => {
  if (m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined) return true;
  if (m.score && m.score.trim() !== "" && m.score.trim() !== "- : -" && m.score.toLowerCase() !== "vs") return true;
  if (m.volleybox?.has_score && m.volleybox?.score) return true;
  return false;
};

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

interface DashboardClientProps {
  initialData: FixturesData;
  initialTab?: AppMainTab;
  initialCity?: string;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  initialData,
  initialTab = "home",
  initialCity = "all",
}) => {
  const [data, setData] = useState<FixturesData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // İlk veriyi istemci önbelleğine yaz
  useEffect(() => {
    if (initialData) {
      clientCityCache.set(initialCity || "all", initialData);
      if (initialData.city && initialData.city !== "Tüm İller") {
        clientCityCache.set(initialData.city.toLowerCase(), initialData);
      }
    }
  }, [initialData, initialCity]);

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

  // Sekme değiştiğinde tarayıcı URL'ini senkronize et (Şehir seçiliyse şehri korur: /grup-durumu/istanbul, /puan-durumu/istanbul vb.)
  const handleSelectTab = (tab: AppMainTab) => {
    setActiveMainTab(tab);
    if (typeof window !== "undefined") {
      const targetPath = getAppRoute(tab, currentCitySlug);
      const currentPath = window.location.pathname;
      if (
        currentPath !== targetPath &&
        !(tab === "home" && currentCitySlug === "all" && currentPath === "/")
      ) {
        window.history.pushState({ tab, city: currentCitySlug }, "", targetPath);
      }
    }
  };

  const handleSelectCity = useCallback(async (slug: string, skipPushState = false) => {
    setCurrentCitySlug(slug);
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

  // Favoriler (Flashscore Yıldız İmzası - LocalStorage ile kaydedilir)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Premium Özellikler: Maç Detay Çekmecesi & Spotlight Arama
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };


  // Bugün tarihi
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Dün tarihi
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Bugün oynanacak maç sayısı (Header rozeti için)
  const todayMatchesCount = useMemo(() => {
    return (data?.matches || []).filter((m) => m.date === todayStr).length;
  }, [data, todayStr]);

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
  }, [data]);

  // Filtrelenmiş Maç Listesi
  const filteredMatches = useMemo(() => {
    return (data?.matches || []).filter((m) => {
      // 1. Favoriler
      if (showOnlyFavorites && !favorites.includes(m.id)) {
        return false;
      }

      // 2. Kategori / Lig
      if (selectedCategory !== "Tümü") {
        const cat = m.category || m.age_group || "";
        if (!trIncludes(cat, selectedCategory)) {
          return false;
        }
      }

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
  }, [data, showOnlyFavorites, favorites, selectedCategory, selectedDate, statusFilter, selectedHall, searchQuery, volleyboxFilter]);

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

      if (selectedCategory !== "Tümü") {
        const cat = m.category || m.age_group || "";
        if (!trIncludes(cat, selectedCategory)) {
          return false;
        }
      }

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      {/* 0. Favori Maç Hatırlatma Banner'ı (GÖREV 2) */}
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

      {/* 2. Üst İl Sekmeleri (Fikstür, Sonuçlar ve Puan Durumu sayfalarında gösterilir) */}
      {activeMainTab !== "home" && (
        <CityTabBar
          currentCitySlug={currentCitySlug}
          onSelectCity={handleSelectCity}
          cities={citiesList}
          totalMatchesAcrossAll={totalMatchesAcrossAll}
        />
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-1.5 sm:px-2 md:px-4 py-3 sm:py-4 space-y-4">
        {/* Desteklenen Kulüp (Primary Team VIP Widget) */}
        <PrimaryTeamWidget
          matches={data?.matches || []}
          city={data?.city}
          onSelectMatch={setSelectedMatch}
          availableTeams={allTeamNames}
        />

        {/* Hata Durumu */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2 mb-4 text-xs font-semibold shadow-md">
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Shimmer Parıltılı Yükleme Efekti (Filtre / İl Değişimlerinde) */}
        {loading && (
          <div className="space-y-4 animate-pulse mb-6">
            <div className="h-44 rounded-3xl bg-slate-800/40 border border-slate-700/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="h-32 rounded-2xl bg-slate-800/30 border border-slate-700/40" />
              <div className="h-32 rounded-2xl bg-slate-800/30 border border-slate-700/40" />
            </div>
          </div>
        )}

        {/* 3. SEÇİLEN SEKME GÖRÜNÜMÜ */}
        {activeMainTab === "results" ? (
          /* ==================== SONUÇLAR SEKMESİ (SADECE BİTEN / SKORLU MAÇLAR) ==================== */
          <div>
            {/* Flashscore Yatay Tarih Şeridi (Sonuçlar Modunda - Zümrüt Yeşili Temalı) */}
            <DateRibbon
              dates={uniqueResultDates}
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
              dateCounts={resultDateCounts}
              todayStr={todayStr}
              yesterdayStr={yesterdayStr}
              variant="emerald"
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

            {/* Toplu İl Gizleme / Gösterme Kontrol Çubuğu */}
            {resultsByCityAndLeague.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3.5 sm:px-4 py-2 mb-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Toplam <strong className="text-white font-mono">{resultsByCityAndLeague.length}</strong> İl Listeleniyor
                  </span>
                  {areAllResultCitiesCollapsed && (
                    <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-normal">
                      (Tümü Gizli)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
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
                </div>
              </div>
            )}

            {/* Sonuçlar Tablosu: Şehir Başlığı Altında Ligler (U18/U16) ve Gruplar (A Grubu, B Grubu) */}
            {resultsByCityAndLeague.length > 0 && (
              <div className="space-y-6">
                {resultsByCityAndLeague.map((cityGroup) => {
                  const isCityCollapsed = Boolean(collapsedResultCities[cityGroup.city]);

                  return (
                    <div key={cityGroup.city} className="space-y-3">
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
                          {cityGroup.leagues.map((sec, idx) => (
                            <FixtureTable
                              key={`${cityGroup.city}-${sec.categoryKey}-${idx}`}
                              title={sec.title}
                              subTitle={sec.subTitle}
                              matches={sec.matches}
                              favorites={favorites}
                              onToggleFavorite={toggleFavorite}
                              city={sec.city || data?.city}
                              showCityBadge={false}
                              onSelectMatch={setSelectedMatch}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
            onSelectMatch={setSelectedMatch}
            onNavigateTab={handleSelectTab}
            todayStr={todayStr}
            yesterdayStr={yesterdayStr}
          />
        ) : activeMainTab === "today" ? (
          /* ==================== GÜNÜN MAÇLARI ==================== */
          <div className="space-y-4">
            {data?.matches && data.matches.length > 0 && (
              <FeaturedMatchHero
                matches={data.matches}
                city={data?.city}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onSelectMatch={setSelectedMatch}
              />
            )}
            <TodayMatchesView
              matches={data?.matches || []}
              city={data?.city}
              currentCitySlug={currentCitySlug}
              onSelectCity={handleSelectCity}
              citiesList={citiesList}
              todayStr={todayStr}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onNavigateToFullFixtures={() => handleSelectTab("fixtures")}
              onSelectMatch={setSelectedMatch}
            />
          </div>
        ) : activeMainTab === "fixtures" ? (
          /* ==================== FİKSTÜR SEKMESİ ==================== */
          <div>
            {/* Flashscore Yatay Tarih Şeridi (Date Ribbon) */}
            <DateRibbon
              dates={uniqueDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              dateCounts={dateCounts}
              todayStr={todayStr}
              yesterdayStr={yesterdayStr}
              variant="red"
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

            {/* Toplu İl Gizleme / Gösterme Kontrol Çubuğu */}
            {fixturesByCity.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3.5 sm:px-4 py-2 mb-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span>
                    Toplam <strong className="text-white font-mono">{fixturesByCity.length}</strong> İl Listeleniyor
                  </span>
                  {areAllFixtureCitiesCollapsed && (
                    <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-normal">
                      (Tümü Gizli)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
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
                </div>
              </div>
            )}

            {/* Resmi Fikstür Tablosu: İllere Göre Gruplanmış ve Açılır/Kapanır */}
            {fixturesByCity.length > 0 && (
              <div className="space-y-6">
                {fixturesByCity.map((cityGroup) => {
                  const isCityCollapsed = Boolean(collapsedFixtureCities[cityGroup.city]);

                  return (
                    <div key={cityGroup.city} className="space-y-3">
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
                          {cityGroup.sections.map((sec, idx) => (
                            <FixtureTable
                              key={`${cityGroup.city}-${sec.title}-${sec.subTitle}-${idx}`}
                              title={sec.title}
                              subTitle={sec.subTitle}
                              matches={sec.matches}
                              favorites={favorites}
                              onToggleFavorite={toggleFavorite}
                              city={sec.city || data?.city}
                              showCityBadge={false}
                              onSelectMatch={setSelectedMatch}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
            {data?.standings && Object.keys(data.standings).length > 0 ? (
              <StandingsTable standingsData={data.standings} city={data?.city} />
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
      </main>

      {/* Altbilgi */}
      <footer className="border-t border-slate-800 bg-[#0b1325] mt-auto py-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-300">
            Altyapı Voleybol • {data?.city || "Türkiye"} Genç & Yıldız Kızlar Süper Lig
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Fikstür & Puan Durumu</span>
            <span>•</span>
            <span>Resmi TVF Bülten Sistemi</span>
          </div>
        </div>
      </footer>

      {/* 4. Mobil Sabit Alt Menü (Thumb-friendly Navigation) */}
      <MobileBottomNav
        activeTab={
          showOnlyFavorites
            ? "favorites"
            : activeMainTab === "today"
            ? "today"
            : activeMainTab === "results"
            ? "results"
            : activeMainTab === "fixtures"
            ? "fixtures"
            : activeMainTab === "standings"
            ? "standings"
            : "today"
        }
        onSelectTab={(tab) => {
          if (tab === "today") {
            setShowOnlyFavorites(false);
            handleSelectTab("today");
          } else if (tab === "results") {
            setShowOnlyFavorites(false);
            handleSelectTab("results");
          } else if (tab === "fixtures") {
            setShowOnlyFavorites(false);
            handleSelectTab("fixtures");
          } else if (tab === "standings") {
            setShowOnlyFavorites(false);
            handleSelectTab("standings");
          } else if (tab === "favorites") {
            setShowOnlyFavorites(true);
            handleSelectTab("fixtures");
          }
        }}
        favoriteCount={favorites.length}
        todayMatchesCount={todayMatchesCount}
        resultsCount={resultsCount}
      />

      {/* 5. Maç Detay Çekmecesi (Match Center Drawer) */}
      <MatchCenterDrawer
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        city={data?.city}
        onToggleFavorite={toggleFavorite}
        isFavorite={selectedMatch ? favorites.includes(selectedMatch.id) : false}
      />

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
    </div>
  );
};
