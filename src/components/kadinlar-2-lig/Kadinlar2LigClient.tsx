"use client";

import React, { useState, useTransition } from "react";
import { Kadinlar2LigData } from "@/types/kadinlar2Lig";
import { Kadinlar2LigHeader } from "./Kadinlar2LigHeader";
import { Kadinlar2LigGroupBar } from "./Kadinlar2LigGroupBar";
import { Kadinlar2LigStandings } from "./Kadinlar2LigStandings";
import { Kadinlar2LigFixtures } from "./Kadinlar2LigFixtures";
import { Kadinlar2LigLeaders } from "./Kadinlar2LigLeaders";
import { Kadinlar2LigTeams } from "./Kadinlar2LigTeams";

interface Kadinlar2LigClientProps {
  initialData: Kadinlar2LigData;
}

export const Kadinlar2LigClient: React.FC<Kadinlar2LigClientProps> = ({
  initialData,
}) => {
  const [data, setData] = useState<Kadinlar2LigData>(initialData);
  const [activeTab, setActiveTab] = useState<"standings" | "fixtures" | "leaders" | "teams">("standings");
  const [selectedGroup, setSelectedGroup] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);

  const currentGroupData = data.gruplar.find((g) => g.grup_no === selectedGroup) || data.gruplar[0];

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

  const handleSelectGroupFromAnywhere = (gNo: number) => {
    setSelectedGroup(gNo);
    setActiveTab("standings");
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {activeTab === "standings" && (
          <Kadinlar2LigStandings
            group={currentGroupData}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === "fixtures" && (
          <Kadinlar2LigFixtures
            group={currentGroupData}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === "leaders" && (
          <Kadinlar2LigLeaders
            groups={data.gruplar}
            onSelectGroup={handleSelectGroupFromAnywhere}
          />
        )}

        {activeTab === "teams" && (
          <Kadinlar2LigTeams
            teams={data.tum_takimlar}
            onSelectGroup={handleSelectGroupFromAnywhere}
            searchQuery={searchQuery}
          />
        )}
      </main>

      {/* 4. Özel Kadınlar 2. Ligi Footer'ı */}
      <footer className="bg-[#0b0816] border-t border-purple-900/40 py-6 text-center text-xs text-purple-300/60">
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
