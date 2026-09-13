"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { DateRibbon } from "@/components/DateRibbon";
import { FilterBar } from "@/components/FilterBar";
import { FixtureTable } from "@/components/FixtureTable";
import { StandingsTable } from "@/components/StandingsTable";
import { Match, FixturesData } from "@/types/fixture";
import { SearchX, AlertCircle, Star } from "lucide-react";

interface DashboardClientProps {
  initialData: FixturesData;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({ initialData }) => {
  const [data, setData] = useState<FixturesData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sekmeler: Yalnızca "fixtures" (Fikstür) ve "standings" (Puan Durumu)
  const [activeMainTab, setActiveMainTab] = useState<"fixtures" | "standings">("fixtures");

  // Fikstür Filtre Durumları
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [selectedDate, setSelectedDate] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "upcoming" | "finished"
  const [selectedHall, setSelectedHall] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");

  // 81 İl Desteği
  const [currentCitySlug, setCurrentCitySlug] = useState("istanbul");
  const [citiesList, setCitiesList] = useState<any[]>([]);

  // Favoriler (Flashscore Yıldız İmzası - LocalStorage ile kaydedilir)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Canlı Senkronizasyon Durum Bildirimi
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
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

    // 81 İl listesini yükle
    fetch("/api/cities")
      .then((res) => res.json())
      .then((json) => {
        if (json?.cities) {
          setCitiesList(json.cities);
        }
      })
      .catch((err) => console.warn("Cities fetch error:", err));
  }, []);

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

      if (json.sync?.attempted) {
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
    return d.toISOString().split("T")[0];
  }, []);

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

  // Filtrelenmiş maçlar
  const filteredMatches = useMemo(() => {
    if (!data?.matches) return [];

    return data.matches.filter((m) => {
      // 0. Sadece tarihi açıklanan maçlar gözüksün
      if (!m.date || m.date === "TBD") {
        return false;
      }

      // 1. Favoriler modu
      if (showOnlyFavorites && !favorites.includes(m.id)) {
        return false;
      }

      // 2. Kategori
      if (selectedCategory !== "Tümü" && m.category !== selectedCategory) {
        return false;
      }

      // 3. Tarih
      if (selectedDate !== "all" && m.date !== selectedDate) {
        return false;
      }

      // 4. Durum (upcoming / finished)
      if (statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }

      // 5. Salon
      if (selectedHall !== "Tümü" && m.hall !== selectedHall) {
        return false;
      }

      // 6. Arama
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${m.home_team} ${m.away_team} ${m.hall} ${m.category} ${m.match_no}`.toLowerCase();
        if (!matchText.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [data, showOnlyFavorites, favorites, selectedCategory, selectedDate, statusFilter, selectedHall, searchQuery]);

  // Lig & Gruba göre grupla (Genç Kızlar Süper Lig - A Grubu, B Grubu vb.)
  const groupedSections = useMemo(() => {
    const sections: {
      [key: string]: {
        title: string;
        subTitle: string;
        matches: Match[];
      };
    } = {};

    filteredMatches.forEach((m) => {
      const groupKey = `${m.category} - ${m.group}`;
      if (!sections[groupKey]) {
        sections[groupKey] = {
          title: m.category,
          subTitle: m.group,
          matches: [],
        };
      }
      sections[groupKey].matches.push(m);
    });

    return Object.values(sections);
  }, [filteredMatches]);

  const resetFilters = () => {
    setSelectedCategory("Tümü");
    setSelectedDate("all");
    setStatusFilter("all");
    setSelectedHall("Tümü");
    setSearchQuery("");
    setShowOnlyFavorites(false);
  };

  const isFiltered =
    selectedCategory !== "Tümü" ||
    selectedDate !== "all" ||
    statusFilter !== "all" ||
    selectedHall !== "Tümü" ||
    searchQuery.trim().length > 0 ||
    showOnlyFavorites;

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] text-slate-900 font-sans">
      {/* 1. Header (FİKSTÜR ve PUAN DURUMU Sekmeleriyle + 81 İl Seçici) */}
      <Header
        city={data?.city}
        currentCitySlug={currentCitySlug}
        onSelectCity={handleSelectCity}
        cities={citiesList}
        title={data?.title}
        updatedAt={data?.updated_at}
        totalMatches={data?.total_matches || 0}
        favoritesCount={favorites.length}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavoritesOnly={() => setShowOnlyFavorites(!showOnlyFavorites)}
        activeTab={activeMainTab}
        onSelectTab={setActiveMainTab}
        onRefresh={fetchData}
        isLoading={loading}
        syncFeedback={syncFeedback}
        onDismissSyncFeedback={() => setSyncFeedback(null)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-2 sm:px-4 py-4">
        {/* Hata Durumu */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 mb-4 text-xs font-semibold">
            <AlertCircle size={15} className="text-primary shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2. SEÇİLEN SEKME GÖRÜNÜMÜ */}
        {activeMainTab === "fixtures" ? (
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
                onReset={resetFilters}
                isFiltered={isFiltered}
              />
            )}

            {/* Resmi Fikstür Tablosu: Tarih - Saat - Yer - A Takımı - B Takımı - Skor - Set Skorları */}
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
                  />
                ))}
              </div>
            )}

            {/* Sonuç Bulunamadı / İl Sezon Takvimi Bekleniyor */}
            {groupedSections.length === 0 && (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-xl p-6 max-w-lg mx-auto my-8 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  {showOnlyFavorites ? (
                    <Star size={22} className="text-amber-400" />
                  ) : (
                    <SearchX size={22} />
                  )}
                </div>

                {(data?.matches || []).length === 0 ? (
                  <>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      TVF {data?.city || "Bu İl"} Fikstür Takvimi Henüz Açıklanmadı
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                      TVF {data?.city} İl Temsilciliği 2026-2027 sezonu için Genç ve Yıldız Kızlar Süper Lig bültenini sisteme girdiğinde maçlar otomatik olarak burada listelenecektir.
                    </p>
                    <button
                      onClick={() => handleSelectCity("istanbul")}
                      className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm"
                    >
                      İstanbul Fikstürünü Görüntüle (24 Maç)
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {showOnlyFavorites ? "Favori Maçınız Bulunmuyor" : "Kriterlere Uygun Maç Bulunamadı"}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {showOnlyFavorites
                        ? "Maçların yanındaki yıldız ikonuna basarak favorilerinize ekleyebilirsiniz."
                        : "Seçtiğiniz tarih, lig veya filtreye ait bültende maç kaydı bulunmamaktadır."}
                    </p>
                    {isFiltered && (
                      <button
                        onClick={resetFilters}
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
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
              <StandingsTable standingsData={data.standings} />
            ) : (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-xl p-6 max-w-md mx-auto my-8 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">
                  TVF {data?.city || "Bu İl"} için henüz puan durumu tablosu oluşturulmamıştır.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Altbilgi */}
      <footer className="border-t border-slate-200 bg-white mt-auto py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            TVFSCORE • {data?.city || "Türkiye"} Genç & Yıldız Kızlar Süper Lig
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Fikstür & Puan Durumu</span>
            <span>•</span>
            <span>Resmi TVF Bülten Sistemi</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
