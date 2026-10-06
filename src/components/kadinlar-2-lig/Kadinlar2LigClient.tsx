"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Kadinlar2LigData } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { useFavorites } from "@/utils/useFavorites";

const MatchCenterDrawer = dynamic(
  () => import("@/components/MatchCenterDrawer").then((mod) => mod.MatchCenterDrawer),
  { ssr: false }
);
const SpotlightSearchModal = dynamic(
  () => import("@/components/SpotlightSearchModal").then((mod) => mod.SpotlightSearchModal),
  { ssr: false }
);
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
import { Kadinlar2LigSidebar } from "./Kadinlar2LigSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { MatchInspectorPanel } from "@/components/match/MatchInspectorPanel";
import { convertK2MatchToMatch, getKadinlar2LigTeamName } from "@/utils/kadinlar2LigConverter";
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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const { count: favoritesCount } = useFavorites();

  const currentGroupData = data.gruplar.find((g) => g.grup_no === selectedGroup) || data.gruplar[0];
  const standardMatches = useMemo(
    () => (data.tum_maclar || []).map(convertK2MatchToMatch),
    [data.tum_maclar]
  );

  // Bugün tarihi — yalnızca client tarafında hesaplanır (hydration error #418 önleme)
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    setTodayStr(`${day}.${month}.${year}`);
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
    return (data.tum_takimlar || []).map((t) => getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name));
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
    <AppShell
      section="kadinlar-2-lig"
      header={
        <Kadinlar2LigHeader
        metadata={data.metadata}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
        todayMatchesCount={todayMatchesCount}
        resultsCount={resultsCount}
        favoritesCount={favoritesCount}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavoritesOnly={() => setShowOnlyFavorites((prev) => !prev)}
        onOpenSearch={() => setIsSearchOpen(true)}
        />
      }
      leftSidebar={
        <Kadinlar2LigSidebar
          groups={data.gruplar}
          selectedGroup={selectedGroup}
          activeTab={activeTab}
          favoritesCount={favoritesCount}
          onSelectGroup={handleSelectGroup}
          onSelectTab={handleSelectTab}
        />
      }
      rightSidebar={<MatchInspectorPanel match={selectedMatch} allMatches={standardMatches} />}
      footer={
        <footer className="px-4 py-4 text-center text-xs text-slate-500 sm:flex sm:items-center sm:justify-between">
          <span className="font-semibold text-slate-400">TVF Uzman Posta Kadınlar Voleybol 2. Ligi</span>
          <span className="mt-1 block sm:mt-0">16 Grup • {data.metadata?.toplam_takim_sayisi || 0} Kulüp</span>
        </footer>
      }
    >

      <div className="flex flex-col space-y-3 px-1 pb-20 sm:space-y-4 sm:px-2 sm:pb-8 lg:px-0">
        {/* Sayfa Semantik H1 Başlığı */}
        <div className="flex items-center justify-between pb-1 border-b border-line">
          <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
            <span>TVF Kadınlar 2. Ligi — Canlı Puan Durumu & Fikstür</span>
          </h1>
          <span className="text-[11px] font-display tabular-nums text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/40">
            16 Grup · {data.tum_maclar?.length || 0} Maç
          </span>
        </div>
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
            selectedMatchId={selectedMatch?.id || null}
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
            selectedMatchId={selectedMatch?.id || null}
          />
        )}

        {/* PUAN CETVELİ TABI */}
        {activeTab === "standings" && (
          <div className="space-y-8">
            <Kadinlar2LigStandings
              group={currentGroupData}
              searchQuery={searchQuery}
              showOnlyFavorites={showOnlyFavorites}
            />

            {/* PUAN CETVELİ ALTINDA: GRUBA AİT MAÇLAR & FİKSTÜR */}
            <div className="space-y-4 pt-6 border-t border-slate-800/80">
              <Kadinlar2LigFixtures
                group={currentGroupData}
                searchQuery={searchQuery}
                showOnlyFavorites={showOnlyFavorites}
                onSelectMatch={setSelectedMatch}
                selectedMatchId={selectedMatch?.id || null}
              />
            </div>
          </div>
        )}

        {/* FİKSTÜR TABI */}
        {activeTab === "fixtures" && (
          <Kadinlar2LigFixtures
            group={currentGroupData}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
            onSelectMatch={setSelectedMatch}
            selectedMatchId={selectedMatch?.id || null}
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
      </div>

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

    </AppShell>
  );
};
