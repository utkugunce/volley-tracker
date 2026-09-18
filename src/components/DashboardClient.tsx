"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { DateRibbon } from "@/components/DateRibbon";
import { FilterBar } from "@/components/FilterBar";
import { FixtureTable } from "@/components/FixtureTable";
import { StandingsTable } from "@/components/StandingsTable";
import { CityTabBar } from "@/components/CityTabBar";
import { TodayMatchesView } from "@/components/TodayMatchesView";
import { NotificationBanner } from "@/components/NotificationBanner";
import { Match, FixturesData } from "@/types/fixture";
import { SearchX, AlertCircle, Star, CheckCircle2, Calendar, History } from "lucide-react";
import { isMatchPassed, formatDateTurkish, compareMatchTimes, compareMatchDateTime } from "@/utils/calendar";
import { checkAndTriggerMatchReminders } from "@/utils/notifications";

// Bir maçın skoru / sonucu olup olmadığını belirleyen yardımcı fonksiyon
export const isMatchScored = (m: Match): boolean => {
  if (m.status === "finished") return true;
  if (m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined) return true;
  if (m.score && m.score.trim() !== "" && m.score.trim() !== "- : -" && m.score.toLowerCase() !== "vs") return true;
  if (m.volleybox?.has_score && m.volleybox?.score) return true;
  return false;
};

interface DashboardClientProps {
  initialData: FixturesData;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({ initialData }) => {
  const [data, setData] = useState<FixturesData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sekmeler: "results" (Sonuçlar), "home" (Günün Maçları / Anasayfa), "fixtures" (Fikstür) ve "standings" (Puan Durumu)
  const [activeMainTab, setActiveMainTab] = useState<"results" | "home" | "fixtures" | "standings">("home");

  // Sonuçlar Alt Sekmesi: "all" (Tüm Sonuçlar) veya "yesterday" (Dünün Sonuçları)
  const [resultsSubTab, setResultsSubTab] = useState<"all" | "yesterday">("all");

  // Fikstür Filtre Durumları
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [selectedDate, setSelectedDate] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "upcoming" | "finished"
  const [selectedHall, setSelectedHall] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [volleyboxFilter, setVolleyboxFilter] = useState<"all" | "synced" | "scored" | "unscored" | "unsynced" | "discrepancy">("all");

  // 81 İl Desteği - Varsayılan olarak "all" (Tüm İller) seçili başlar
  const [currentCitySlug, setCurrentCitySlug] = useState("all");
  const [citiesList, setCitiesList] = useState<any[]>([]);

  // Favoriler (Flashscore Yıldız İmzası - LocalStorage ile kaydedilir)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Çift Ekran / Maç Giriş Modu (Volleybox'a maç girerken skorları ve takımları öne çıkarır)
  const [splitScreenMode, setSplitScreenMode] = useState<boolean>(false);

  // Canlı Senkronizasyon Durum Bildirimi
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "warning" | "error" | "info";
    message: string;
    link?: { url: string; label: string };
    inProgress?: boolean;
    step?: string;
    remainingSeconds?: number;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tvf_favorites");
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }

    try {
      const savedSplit = localStorage.getItem("tvf_split_screen");
      if (savedSplit !== null) {
        setSplitScreenMode(savedSplit === "true");
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

  const toggleSplitScreen = () => {
    setSplitScreenMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tvf_split_screen", String(next));
      } catch (e) {}
      return next;
    });
  };

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
    setSyncFeedback(null);
    try {
      const res = await fetch(`/api/fixtures?city=${currentCitySlug}&refresh=1`);
      if (!res.ok) {
        throw new Error("Bülten verisi yüklenemedi.");
      }
      const json: FixturesData = await res.json();
      setData(json);

      if (json.sync?.mode === "github_actions_dispatch") {
        let currentRemaining = 75;

        setSyncFeedback({
          type: "info",
          message: "Canlı tarama GitHub Actions üzerinde başlatıldı! TVF bülteni ve Volleybox taranıyor...",
          link: {
            url: "https://github.com/utkugunce/volley-tracker/actions",
            label: "GitHub'da Canlı İzle ↗",
          },
          inProgress: true,
          remainingSeconds: currentRemaining,
        });

        // 1 saniyelik pürüzsüz geri sayım sayacı
        const countdownTimer = setInterval(() => {
          setSyncFeedback((prev) => {
            if (!prev || !prev.inProgress || typeof prev.remainingSeconds !== "number") {
              return prev;
            }
            const nextSec = Math.max(5, prev.remainingSeconds - 1);
            return {
              ...prev,
              remainingSeconds: nextSec,
            };
          });
        }, 1000);

        // Canlı durum takibi (Polling - her 4 saniyede bir GitHub'dan senkronize et)
        let pollCount = 0;
        const maxPolls = 35; // ~2.5 dakika
        const intervalId = setInterval(async () => {
          pollCount++;
          try {
            const sRes = await fetch("/api/sync/status");
            if (sRes.ok) {
              const sData = await sRes.json();
              if (sData.available) {
                const runUrl = sData.htmlUrl || "https://github.com/utkugunce/volley-tracker/actions";
                if (sData.status === "in_progress" || sData.status === "queued") {
                  const stepText = sData.activeStep ? `: ${sData.activeStep}` : "...";
                  const serverRemaining =
                    typeof sData.remainingSeconds === "number"
                      ? sData.remainingSeconds
                      : currentRemaining;
                  setSyncFeedback((prev) => ({
                    type: "info",
                    message: `Canlı tarama devam ediyor${stepText}`,
                    link: { url: runUrl, label: "GitHub'da Canlı İzle ↗" },
                    inProgress: true,
                    remainingSeconds: serverRemaining,
                  }));
                } else if (sData.status === "completed") {
                  clearInterval(intervalId);
                  clearInterval(countdownTimer);
                  if (sData.conclusion === "success") {
                    setSyncFeedback({
                      type: "success",
                      message: "Canlı senkronizasyon tamamlandı! Güncel fikstür ve skorlar yüklendi.",
                      link: { url: runUrl, label: "İşlem Özeti ↗" },
                      inProgress: false,
                      remainingSeconds: 0,
                    });
                    // Verileri otomatik olarak ekrana yeniden çek
                    try {
                      const reloadRes = await fetch(`/api/fixtures?city=${currentCitySlug}`);
                      if (reloadRes.ok) {
                        const reloadJson = await reloadRes.json();
                        setData(reloadJson);
                      }
                    } catch {}
                  } else {
                    setSyncFeedback({
                      type: "error",
                      message: "Canlı tarama sırasında bir hata oluştu.",
                      link: { url: runUrl, label: "Hata Günlüğünü Gör ↗" },
                      inProgress: false,
                    });
                  }
                }
              }
            }
          } catch {}

          if (pollCount >= maxPolls) {
            clearInterval(intervalId);
            clearInterval(countdownTimer);
          }
        }, 4000);
      } else if (json.sync?.attempted) {
        if (json.sync.success) {
          setSyncFeedback({
            type: "success",
            message: json.sync.message || "Veriler resmi siteden canlı olarak güncellendi.",
          });
        } else {
          setSyncFeedback({
            type: "warning",
            message:
              json.sync.message ||
              "Bulut ortamında Python motoru bulunmadığı için en güncel önbellek sunulmuştur. Fikstürler periyodik GitHub Actions cron ile taranmaktadır.",
            link: {
              url: "https://github.com/utkugunce/volley-tracker/actions",
              label: "GitHub Actions ↗",
            },
          });
        }
      } else {
        setSyncFeedback({
          type: "success",
          message: "En güncel fikstür verileri başarıyla yüklendi.",
        });
      }
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
      setSyncFeedback({
        type: "error",
        message: `Yenileme sırasında hata oluştu: ${err.message || "Bilinmeyen hata"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = async (slug: string) => {
    setCurrentCitySlug(slug);
    setLoading(true);
    setError(null);
    setSelectedCategory("Tümü");
    setSelectedDate("all");
    setSelectedHall("Tümü");
    setStatusFilter("all");
    setVolleyboxFilter("all");
    setSearchQuery("");
    try {
      const res = await fetch(`/api/fixtures?city=${slug}`);
      if (!res.ok) throw new Error("İl verisi alınamadı.");
      const json: FixturesData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "İl fikstürü yüklenirken hata oluştu.");
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

  // Tarih bazlı maç sayıları
  const dateCounts = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    (data?.matches || []).forEach((m) => {
      counts[m.date] = (counts[m.date] || 0) + 1;
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
    // Skorsuz: SADECE maç tarihi geçmesine rağmen Volleybox'a skoru henüz girilmemiş olanlar!
    const unscored = syncedMatches.filter(
      (m) => !m.volleybox?.has_score && isMatchPassed(m.volleybox?.vb_date || m.date, m.time, m.status)
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
        if (!cat.toLowerCase().includes(selectedCategory.toLowerCase())) {
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
        const q = searchQuery.toLowerCase();
        const matchText = `${m.home_team} ${m.away_team} ${m.hall} ${m.category} ${m.match_no} ${m.city || ""}`.toLowerCase();
        if (!matchText.includes(q)) {
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
      // Skorsuz: Maç tarihi geçmesine rağmen Volleybox'a skor girilmemiş olanlar
      if (
        volleyboxFilter === "unscored" &&
        (!m.volleybox?.synced || m.volleybox?.has_score || !isMatchPassed(m.volleybox?.vb_date || m.date, m.time, m.status))
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

  // Sadece skoru/sonucu olan maçlar için filtrelenmiş liste
  const filteredResultMatches = useMemo(() => {
    return (data?.matches || []).filter((m) => {
      if (!isMatchScored(m)) return false;

      // Sonuçlar alt sekme filtresi: "yesterday" seçildiyse sadece dünün maçlarını göster
      if (resultsSubTab === "yesterday" && m.date !== yesterdayStr) {
        return false;
      }

      if (showOnlyFavorites && !favorites.includes(m.id)) {
        return false;
      }

      if (selectedCategory !== "Tümü") {
        const cat = m.category || m.age_group || "";
        if (!cat.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }

      if (selectedHall !== "Tümü" && m.hall !== selectedHall) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${m.home_team} ${m.away_team} ${m.hall} ${m.category} ${m.match_no} ${m.city || ""}`.toLowerCase();
        if (!matchText.includes(q)) {
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
  }, [data, resultsSubTab, yesterdayStr, showOnlyFavorites, favorites, selectedCategory, selectedHall, searchQuery, volleyboxFilter]);

  // Sonuçlar için gruplama: En son oynanan maçlar en üstte (tarihe göre azalan sıralama)
  const resultsGroupedSections = useMemo(() => {
    const sections: {
      [key: string]: {
        title: string;
        subTitle: string;
        city?: string;
        matches: Match[];
      };
    } = {};

    filteredResultMatches.forEach((m) => {
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

    // Sonuçlarda en son oynanan maç günleri en üstte, aynı gün içinde ERKEN SAAT İLK
    Object.values(sections).forEach((sec) => {
      sec.matches.sort((m1, m2) => compareMatchDateTime(m1, m2, "desc"));
    });

    // Grupları sırala: Tüm iller modunda önce Şehir, sonra Kategori ve Grup
    return Object.values(sections).sort((a, b) => {
      if (isAllCities) {
        const cityComp = (a.city || "").localeCompare(b.city || "", "tr");
        if (cityComp !== 0) return cityComp;
      }
      const catComp = (a.title || "").localeCompare(b.title || "", "tr", { numeric: true });
      if (catComp !== 0) return catComp;
      return (a.subTitle || "").localeCompare(b.subTitle || "", "tr", { numeric: true });
    });
  }, [filteredResultMatches, isAllCities, data?.city]);

  const resetFilters = () => {
    setSelectedCategory("Tümü");
    setSelectedDate("all");
    setStatusFilter("all");
    setSelectedHall("Tümü");
    setVolleyboxFilter("all");
    setSearchQuery("");
    setShowOnlyFavorites(false);
    setResultsSubTab("all");
  };

  const isFiltered =
    selectedCategory !== "Tümü" ||
    selectedDate !== "all" ||
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
        splitScreenMode={splitScreenMode}
        onToggleSplitScreen={toggleSplitScreen}
        activeTab={activeMainTab}
        onSelectTab={setActiveMainTab}
        onRefresh={fetchData}
        isLoading={loading}
        syncFeedback={syncFeedback}
        onDismissSyncFeedback={() => setSyncFeedback(null)}
      />

      {/* 2. Üst İl Sekmeleri (CityTabBar: Tüm İller, İstanbul, İzmir, Yalova, Niğde vb.) */}
      <CityTabBar
        currentCitySlug={currentCitySlug}
        onSelectCity={handleSelectCity}
        cities={citiesList}
        totalMatchesAcrossAll={totalMatchesAcrossAll}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-1.5 sm:px-2 md:px-4 py-3 sm:py-4">
        {/* Hata Durumu */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2 mb-4 text-xs font-semibold shadow-md">
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. SEÇİLEN SEKME GÖRÜNÜMÜ */}
        {activeMainTab === "results" ? (
          /* ==================== SONUÇLAR SEKMESİ (SADECE BİTEN / SKORLU MAÇLAR) ==================== */
          <div>
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
                onSelectResultsSubTab={setResultsSubTab}
                yesterdayCount={yesterdayResultsCount}
              />
            )}

            {/* Dünün Sonuçları Bilgi ve Kolay Geçiş Rozeti */}
            {resultsSubTab === "yesterday" && (
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-3.5 py-2.5 mb-4 text-xs text-emerald-300 shadow-sm max-w-6xl mx-auto flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-emerald-400 shrink-0" />
                  <span>
                    <strong>Dünün Sonuçları:</strong> {formatDateTurkish(yesterdayStr)}
                  </span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
                    {filteredResultMatches.length} Maç
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setResultsSubTab("all")}
                  className="text-xs text-emerald-400 hover:text-emerald-200 font-semibold underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                >
                  <span>Tüm Sonuçları Göster ({resultsCount})</span>
                </button>
              </div>
            )}

            {/* Sonuçlar Tablosu: Tarih - Yer - Saat - A Takımı - B Takımı - Skor - Set Skorları */}
            {resultsGroupedSections.length > 0 && (
              <div className="space-y-4">
                {resultsGroupedSections.map((sec, idx) => (
                  <FixtureTable
                    key={idx}
                    title={sec.title}
                    subTitle={sec.subTitle}
                    matches={sec.matches}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                    city={sec.city || data?.city}
                    showCityBadge={isAllCities}
                    splitScreenMode={splitScreenMode}
                  />
                ))}
              </div>
            )}

            {/* Sonuç Bulunamadı */}
            {resultsGroupedSections.length === 0 && (
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
                      {showOnlyFavorites ? "Favori Maçlarınız Arasında Biten Maç Bulunmuyor" : "Kriterlere Uygun Sonuçlanan Maç Bulunamadı"}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {showOnlyFavorites
                        ? "Favoriye aldığınız maçlar tamamlandığında skorları burada görüntülenecektir."
                        : "Seçtiğiniz lig veya arama filtresine uygun sonuçlanan maç kaydı bulunmamaktadır."}
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
        ) : activeMainTab === "home" ? (
          /* ==================== GÜNÜN MAÇLARI (ANASAYFA DASHBOARD) ==================== */
          <TodayMatchesView
            matches={data?.matches || []}
            city={data?.city}
            currentCitySlug={currentCitySlug}
            onSelectCity={handleSelectCity}
            citiesList={citiesList}
            todayStr={todayStr}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            splitScreenMode={splitScreenMode}
            onNavigateToFullFixtures={() => setActiveMainTab("fixtures")}
          />
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

            {/* Resmi Fikstür Tablosu: Tarih - Saat - A Takımı - B Takımı - Skor - Set Skorları - Yer */}
            {groupedSections.length > 0 && (
              <div className="space-y-4">
                {groupedSections.map((sec, idx) => (
                  <FixtureTable
                    key={idx}
                    title={sec.title}
                    subTitle={sec.subTitle}
                    matches={sec.matches}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                    city={sec.city || data?.city}
                    showCityBadge={isAllCities}
                    splitScreenMode={splitScreenMode}
                  />
                ))}
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
        ) : (
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
        )}
      </main>

      {/* Altbilgi */}
      <footer className="border-t border-slate-800 bg-[#0b1325] mt-auto py-4 text-center text-xs text-slate-500 no-print">
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
    </div>
  );
};
