"use client";

import React from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, ChevronRight, Layers, Star, Trophy, Users } from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Kadinlar2LigTabType } from "./Kadinlar2LigHeader";

interface Kadinlar2LigSidebarProps {
  groups: Kadinlar2LigGroup[];
  selectedGroup: number;
  activeTab: Kadinlar2LigTabType;
  favoritesCount: number;
  onSelectGroup: (groupNo: number) => void;
  onSelectTab: (tab: Kadinlar2LigTabType) => void;
}

export const Kadinlar2LigSidebar: React.FC<Kadinlar2LigSidebarProps> = ({
  groups,
  selectedGroup,
  activeTab,
  favoritesCount,
  onSelectGroup,
  onSelectTab,
}) => {
  const totalMatches = groups.reduce((sum, group) => sum + group.mac_sayisi, 0);

  return (
    <div className="flex h-full flex-col bg-[#1E222D] text-xs select-none">
      <div className="sticky top-0 z-10 border-b border-[#2A2E3D] bg-[#1E222D]/95 px-3.5 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/15 text-rose-300">
              <Trophy size={14} />
            </div>
            <div>
              <h2 className="font-bold leading-tight tracking-wide text-white">Kadınlar 2. Lig</h2>
              <p className="text-[10px] text-[#94A3B8]">16 grup merkezi</p>
            </div>
          </div>
          <span className="rounded border border-[#2A2E3D] bg-[#121212] px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300">
            {totalMatches} maç
          </span>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-2">
        <div className="space-y-1 rounded-xl border border-[#2A2E3D] bg-[#181A20] p-2">
          <div className="flex items-center justify-between px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
            <span className="flex items-center gap-1.5"><Star size={12} className="text-amber-400" /> Hızlı erişim</span>
            <span className="font-mono text-[#64748B]">{favoritesCount} yıldız</span>
          </div>
          <button type="button" onClick={() => onSelectTab("leaders")} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[#CBD5E1] transition hover:bg-[#1E222D] hover:text-white">
            <span className="flex items-center gap-2"><Layers size={13} className="text-rose-300" /> Grup durumu</span>
            <ChevronRight size={13} className="text-[#64748B]" />
          </button>
          <button type="button" onClick={() => onSelectTab("teams")} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[#CBD5E1] transition hover:bg-[#1E222D] hover:text-white">
            <span className="flex items-center gap-2"><Users size={13} className="text-blue-300" /> Kulüpler</span>
            <ChevronRight size={13} className="text-[#64748B]" />
          </button>
        </div>

        <div className="space-y-1 rounded-xl border border-[#2A2E3D] bg-[#181A20] p-2">
          <div className="flex items-center gap-1.5 px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]"><BarChart3 size={12} className="text-blue-300" /> Grup seçimi</div>
          {groups.map((group) => {
            const isActive = selectedGroup === group.grup_no && (activeTab === "standings" || activeTab === "fixtures");
            return (
              <div key={group.grup_no} className="flex items-center gap-1">
                <button type="button" onClick={() => { onSelectGroup(group.grup_no); onSelectTab("standings"); }} className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-2.5 py-2 text-left transition ${isActive ? "border-l-2 border-rose-400 bg-rose-500/10 text-white" : "text-[#94A3B8] hover:bg-[#1E222D] hover:text-white"}`}>
                  <span className="truncate font-semibold">Grup {group.grup_no}</span>
                  <span className="font-mono text-[10px] text-[#64748B]">{group.takim_sayisi}</span>
                </button>
                <Link href={`/kadinlar-2-ligi/fikstur${group.grup_no > 1 ? `/grup-${group.grup_no}` : ""}`} onClick={() => { onSelectGroup(group.grup_no); onSelectTab("fixtures"); }} className="rounded-lg p-2 text-[#64748B] transition hover:bg-[#1E222D] hover:text-rose-300" title={`Grup ${group.grup_no} fikstürü`} aria-label={`Grup ${group.grup_no} fikstürü`}>
                  <CalendarDays size={13} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};