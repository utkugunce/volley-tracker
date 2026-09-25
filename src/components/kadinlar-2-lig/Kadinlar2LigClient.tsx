"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Kadinlar2LigData } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { MatchCenterDrawer } from "@/components/MatchCenterDrawer";
import { SpotlightSearchModal } from "@/components/SpotlightSearchModal";
import { useFavorites } from "@/utils/useFavorites";
import { slugify } from "@/utils/slugify";
import { Kadinlar2LigHeader, Kadinlar2LigTabType } from "./Kadinlar2LigHeader";
import { Kadinlar2LigGroupBar } from "./Kadinlar2LigGroupBar";
import { Kadinlar2LigStandings } from "./Kadinlar2LigStandings";
import { Kadinlar2LigFixtures } from "./Kadinlar2LigFixtures";
import { Kadinlar2LigLeaders } from "./Kadinlar2LigLeaders";
import { Kadinlar2LigTeams } from "./Kadinlar2LigTeams";
import { Kadinlar2LigTodayMatches } from "./Kadinlar2LigTodayMatches";
import { Kadinlar2LigResults } from "./Kadinlar2LigResults";
import { Kadinlar2LigMobileNav } from "./Kadinlar2LigMobileNav";
import { Kadinlar2LigStatuView } from "./Kadinlar2LigStatuView";
import { Kadinlar2LigHomePortal } from "./Kadinlar2LigHomePortal";
import { Kadinlar2LigCompare } from "./Kadinlar2LigCompare";
import {
  getKadinlar2LigRoute,
  parseKadinlar2LigRoute,
} from "@/utils/kadinlar2LigRoutes";

interface Kadinlar2LigClientProps {
  initialData: Kadinlar2LigData;
  initialTab?: Kadinlar2LigTabType;
  initialGroup?: number;
}

export const Kadinlar2LigClient: React.FC<Kadinlar2LigClientProps> = ({
  initialData,
  initialTab,
  initialGroup,
}) => {
  const [data, setData] = useState<Kadinlar2LigData>(initialData);
  const [activeTab, setActiveTab] = useState<Kadinlar2LigTabType>(
    initialTab || "home"
  );
  const [selectedGroup, setSelectedGroup] = useState<number>(initialGroup || 1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const { count: favoritesCount } = useFavorites();

  const currentGroupData = data.gruplar.find((g) => g.grup_no === selectedGroup) || data.gruplar[0];

  // Günün maçları sayısı & Sonuçlar sayısı
  const todayStr = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  const todayMatchesCount = useMemo(() => {
    return (data.tum_maclar || []).filter((m) => m.tarih === todayStr).length;
  }, [data.tum_maclar, todayStr]);

  const resultsCount = useMemo(() => {
    return (data.tum_maclar || []).filter(
      (m) => m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor.trim() !== "-")
    ).length;
  }, [data.tum_maclar]);

  // Spotlight Arama Verileri
  const searchableTeams = useMemo(() => {
    return (data.tum_takimlar || []).map((t) => t.takim_adi);
  }, [data.tum_takimlar]);

  const searchableHalls = useMemo(() => {
    return Array.from(new Set((data.tum_maclar || []).map((m) => m.salon).filter(Boolean)));
  }, [data.tum_maclar]);

  const searchableCities = useMemo(() => {
    const unique = Array.from(new Set((data.tum_maclar || []).map((m) => m.sehir).filter(Boolean)));
    return unique.map((c) => ({ name: c, slug: slugify(c) }));
  }, [data.tum_maclar]);

  const searchableCategories = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => `Grup ${i + 1}`);
  }, []);

  // Spotlight Klavye Kısayolu (Ctrl+K / Cmd+K)
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

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/kadinlar-2-ligi?refresh=1");
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 3000);
      }
    } catch (err) {
      console.error("Yenileme hatası:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTab = (tab: Kadinlar2LigTabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const targetPath = getKadinlar2LigRoute(tab, selectedGroup);
      const currentPath = window.location.pathname;
      if (currentPath !== targetPath) {
        window.history.pushState({ tab, group: selectedGroup }, "", targetPath);
      }
    }
  };

  const handleSelectGroup = (gNo: number) => {
    setSelectedGroup(gNo);
    if (typeof window !== "undefined") {
      const targetPath = getKadinlar2LigRoute(activeTab, gNo);
      const currentPath = window.location.pathname;
      if (currentPath !== targetPath) {
        window.history.pushState({ tab: activeTab, group: gNo }, "", targetPath);
      }
    }
  };

  const handleSelectGroupFromAnywhere = (
    gNo: number,
    tab?: "standings" | "fixtures"
  ) => {
    const targetTab = tab || "standings";
    setSelectedGroup(gNo);
    setActiveTab(targetTab);
    if (typeof window !== "undefined") {
      const targetPath = getKadinlar2LigRoute(targetTab, gNo);
      const currentPath = window.location.pathname;
      if (currentPath !== targetPath) {
        window.history.pushState({ tab: targetTab, group: gNo }, "", targetPath);
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tarayıcı Geri/İleri butonları (popstate) dinleyicisi
  useEffect(() => {
    const handlePopState = () => {
      const { tab, groupNo } = parseKadinlar2LigRoute(window.location.pathname);
      setActiveTab(tab);
      if (groupNo) {
        setSelectedGroup(groupNo);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sayfa ilk yüklendiğinde tarayıcı URL'ini kontrol et
  useEffect(() => {
    if (typeof window !== "undefined") {
      const { tab, groupNo } = parseKadinlar2LigRoute(window.location.pathname);
      if (tab && !initialTab) {
        setActiveTab(tab);
      }
      if (groupNo && !initialGroup) {
        setSelectedGroup(groupNo);
      }
    }
  }, [initialTab, initialGroup]);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* 1. Altyapı ile Birebir Header */}
      <Kadinlar2LigHeader
        metadata={data.metadata}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        justUpdated={justUpdated}
        todayMatchesCount={todayMatchesCount}
        resultsCount={resultsCount}
        favoritesCount={favoritesCount}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavoritesOnly={() => setShowOnlyFavorites((prev) => !prev)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 3. Ana İçerik Alanı (Altyapı max-w-6xl ile Birebir) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-2 sm:px-4 py-3 sm:py-4 pb-20 sm:pb-8 flex flex-col space-y-3 sm:space-y-4">
        {/* 2. Gruplar & İl Seçici Barı (Puan Cetveli veya Fikstür açıkken) */}
        {(activeTab === "standings" || activeTab === "fixtures") && (
          <Kadinlar2LigGroupBar
            groups={data.gruplar}
            allMatches={data.tum_maclar}
            selectedGroup={selectedGroup}
            onSelectGroup={handleSelectGroup}
          />
        )}
        {/* ANASAYFA / CANLI HUB TABI */}
        {activeTab === "home" && (
          <Kadinlar2LigHomePortal
            data={data}
            onNavigateTab={setActiveTab}
            onSelectGroup={handleSelectGroupFromAnywhere}
            onSelectMatch={setSelectedMatch}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
          />
        )}

        {/* GÜNÜN MAÇLARI TABI */}
        {activeTab === "today" && (
          <Kadinlar2LigTodayMatches
            allMatches={data.tum_maclar || []}
            groups={data.gruplar}
            onSelectMatch={setSelectedMatch}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
            onToggleFavoritesOnly={() => setShowOnlyFavorites((prev) => !prev)}
          />
        )}

        {/* SONUÇLAR TABI */}
        {activeTab === "results" && (
          <Kadinlar2LigResults
            allMatches={data.tum_maclar || []}
            groups={data.gruplar}
            onSelectMatch={setSelectedMatch}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
            onToggleFavoritesOnly={() => setShowOnlyFavorites((prev) => !prev)}
          />
        )}

        {/* PUAN CETVELİ TABI */}
        {activeTab === "standings" && (
          <Kadinlar2LigStandings
            group={currentGroupData}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
          />
        )}

        {/* FİKSTÜR TABI */}
        {activeTab === "fixtures" && (
          <Kadinlar2LigFixtures
            group={currentGroupData}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
            onSelectMatch={setSelectedMatch}
          />
        )}

        {/* 16 GRUP DURUMU TABI */}
        {activeTab === "leaders" && (
          <Kadinlar2LigLeaders
            groups={data.gruplar}
            onSelectGroup={handleSelectGroupFromAnywhere}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
          />
        )}

        {/* KULÜPLER TABI */}
        {activeTab === "teams" && (
          <Kadinlar2LigTeams
            teams={data.tum_takimlar}
            onSelectGroup={handleSelectGroupFromAnywhere}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
          />
        )}

        {/* H2H KARŞILAŞTIR TABI */}
        {activeTab === "karsilastir" && (
          <Kadinlar2LigCompare
            data={data}
            onSelectGroup={handleSelectGroupFromAnywhere}
          />
        )}

        {/* RESMİ STATÜ & REHBER TABI */}
        {activeTab === "statu" && <Kadinlar2LigStatuView />}
      </main>

      {/* 4. Maç Detay ve Salon Çekmecesi */}
      <MatchCenterDrawer
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        city="Türkiye"
      />

      {/* 5. Spotlight Hızlı Arama Modalı (Ctrl+K) */}
      <SpotlightSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        teams={searchableTeams}
        halls={searchableHalls}
        cities={searchableCities}
        categories={searchableCategories}
        onSelectCategory={(cat) => {
          const num = parseInt(cat.replace(/\D/g, ""), 10);
          if (num >= 1 && num <= 16) {
            handleSelectGroupFromAnywhere(num, "standings");
          }
        }}
        onSelectHall={(hall) => {
          setSearchQuery(hall);
          setActiveTab("fixtures");
        }}
      />

      {/* 6. Mobil Alt Menü Barı (Sticky Bottom Navigation) */}
      <Kadinlar2LigMobileNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavorites={() => setShowOnlyFavorites((prev) => !prev)}
        favoriteCount={favoritesCount}
        todayMatchesCount={todayMatchesCount}
        resultsCount={resultsCount}
      />

      {/* 7. Footer */}
      <footer className="bg-[#080c14] border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 hidden sm:block">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">
              TVF Uzman Posta Kadınlar Voleybol 2. Ligi
            </span>
            <span>•</span>
            <span className="text-slate-500">16 Grup • 167 Kulüp</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <a
              href="https://tvf.org.tr"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              tvf.org.tr
            </a>
            <span>•</span>
            <a
              href="https://women.volleybox.net"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-white transition-colors"
            >
              volleybox.net
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
