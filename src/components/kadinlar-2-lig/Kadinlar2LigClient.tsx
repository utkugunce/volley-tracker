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

interface Kadinlar2LigClientProps {
  initialData: Kadinlar2LigData;
}

export const Kadinlar2LigClient: React.FC<Kadinlar2LigClientProps> = ({
  initialData,
}) => {
  const [data, setData] = useState<Kadinlar2LigData>(initialData);
  const [activeTab, setActiveTab] = useState<Kadinlar2LigTabType>("standings");
  const [selectedGroup, setSelectedGroup] = useState<number>(1);
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

  const handleSelectGroupFromAnywhere = (gNo: number, tab?: "standings" | "fixtures") => {
    setSelectedGroup(gNo);
    setActiveTab(tab || "standings");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#090714] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* 1. Özel Kadınlar 2. Ligi Header'ı */}
      <Kadinlar2LigHeader
        metadata={data.metadata}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
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

      {/* 2. Gruplar Seçim Barı (Puan Cetveli veya Fikstür açıkken) */}
      {(activeTab === "standings" || activeTab === "fixtures") && (
        <Kadinlar2LigGroupBar
          groups={data.gruplar}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
        />
      )}

      {/* 3. Ana İçerik Alanı */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-8">
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

        {/* 16 GRUP STATÜSÜ TABI */}
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
        onSelectTab={setActiveTab}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavorites={() => setShowOnlyFavorites((prev) => !prev)}
        favoriteCount={favoritesCount}
        todayMatchesCount={todayMatchesCount}
        resultsCount={resultsCount}
      />

      {/* 7. Özel Kadınlar 2. Ligi Footer'ı */}
      <footer className="bg-[#0b0816] border-t border-purple-900/40 py-6 text-center text-xs text-purple-300/60 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
              2L
            </div>
            <span className="font-semibold text-purple-200">
              TVF Uzman Posta Kadınlar Voleybol 2. Ligi Takip Sistemi
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>16 Grup • 167 Takım • 289 Maç</span>
            <span>•</span>
            <a
              href="https://tvf.org.tr"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:text-white transition-colors"
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
