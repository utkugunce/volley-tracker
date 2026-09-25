"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Swords,
  Trophy,
  ArrowRightLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Share2,
  Check,
  AlertCircle,
  Activity,
  ChevronRight,
  Search,
  Sparkles,
} from "lucide-react";
import { Kadinlar2LigData, Kadinlar2LigTeam, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";
import { FormBadge, FormMatchItem } from "@/components/FormBadge";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { triggerHaptic } from "@/utils/haptics";

interface Kadinlar2LigCompareProps {
  data: Kadinlar2LigData;
  initialSlug1?: string;
  initialSlug2?: string;
  onSelectGroup?: (groupNo: number) => void;
}

export const Kadinlar2LigCompare: React.FC<Kadinlar2LigCompareProps> = ({
  data,
  initialSlug1,
  initialSlug2,
  onSelectGroup,
}) => {
  const allTeams = useMemo(() => data.tum_takimlar || [], [data.tum_takimlar]);
  const allMatches = useMemo(() => data.tum_maclar || [], [data.tum_maclar]);

  // Varsayılan takım slug'ları
  const defaultSlug1 = initialSlug1 || (allTeams[0] ? slugify(allTeams[0].takim_adi) : "");
  const defaultSlug2 = initialSlug2 || (allTeams[1] ? slugify(allTeams[1].takim_adi) : "");

  const [slug1, setSlug1] = useState<string>(defaultSlug1);
  const [slug2, setSlug2] = useState<string>(defaultSlug2);
  const [search1, setSearch1] = useState<string>("");
  const [search2, setSearch2] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // URL query parametrelerini kontrol et (sayfa ilk yüklendiğinde)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q1 = params.get("takim1");
      const q2 = params.get("takim2");
      if (q1) setSlug1(q1);
      if (q2) setSlug2(q2);
    }
  }, []);

  const handleApply = (newSlug1: string, newSlug2: string) => {
    triggerHaptic("selection");
    setSlug1(newSlug1);
    setSlug2(newSlug2);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (newSlug1) params.set("takim1", newSlug1);
      if (newSlug2) params.set("takim2", newSlug2);
      const url = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", url);
    }
  };

  const handleSwap = () => {
    triggerHaptic("selection");
    handleApply(slug2, slug1);
  };

  const handleShare = () => {
    triggerHaptic("success");
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Seçili takımlar
  const team1 = useMemo(() => {
    return allTeams.find((t) => slugify(t.takim_adi) === slug1) || allTeams[0];
  }, [allTeams, slug1]);

  const team2 = useMemo(() => {
    return allTeams.find((t) => slugify(t.takim_adi) === slug2) || allTeams[1];
  }, [allTeams, slug2]);

  // Filtrelenmiş takım listeleri
  const filteredTeams1 = useMemo(() => {
    if (!search1.trim()) return allTeams;
    const q = trLower(search1).trim();
    return allTeams.filter((t) => trIncludes(t.takim_adi, q) || trIncludes(t.sehir || "", q));
  }, [allTeams, search1]);

  const filteredTeams2 = useMemo(() => {
    if (!search2.trim()) return allTeams;
    const q = trLower(search2).trim();
    return allTeams.filter((t) => trIncludes(t.takim_adi, q) || trIncludes(t.sehir || "", q));
  }, [allTeams, search2]);

  // Takım maçları
  const getTeamMatches = (teamName?: string) => {
    if (!teamName) return [];
    return allMatches.filter((m) => m.takim_a === teamName || m.takim_b === teamName);
  };

  const team1Matches = useMemo(() => getTeamMatches(team1?.takim_adi), [allMatches, team1]);
  const team2Matches = useMemo(() => getTeamMatches(team2?.takim_adi), [allMatches, team2]);

  // İki takım arasındaki geçmiş maçlar (H2H)
  const headToHeadMatches = useMemo(() => {
    if (!team1 || !team2) return [];
    return allMatches.filter(
      (m) =>
        (m.takim_a === team1.takim_adi && m.takim_b === team2.takim_adi) ||
        (m.takim_a === team2.takim_adi && m.takim_b === team1.takim_adi)
    );
  }, [allMatches, team1, team2]);

  // Form durumu (Son 5 maç)
  const getTeamForm = (matches: Kadinlar2LigMatch[], teamName: string): FormMatchItem[] => {
    const finished = matches.filter(
      (m) =>
        (m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor !== "- : -"))
    );
    return finished.slice(-5).map((m) => {
      const isHome = m.takim_a === teamName;
      const opponent = isHome ? m.takim_b : m.takim_a;
      const parts = m.skor ? m.skor.split("-").map((s) => parseInt(s.trim(), 10)) : [];
      const teamScore = isHome ? parts[0] : parts[1];
      const oppScore = isHome ? parts[1] : parts[0];
      const isWin = teamScore > oppScore;
      return {
        id: m.id,
        result: isWin ? "W" : "L",
        score: m.skor,
        opponent,
        date: m.tarih,
      };
    });
  };

  const team1Form = useMemo(
    () => (team1 ? getTeamForm(team1Matches, team1.takim_adi) : []),
    [team1Matches, team1]
  );
  const team2Form = useMemo(
    () => (team2 ? getTeamForm(team2Matches, team2.takim_adi) : []),
    [team2Matches, team2]
  );

  // Takım istatistikleri
  const getTeamStats = (matches: Kadinlar2LigMatch[], teamName: string) => {
    const total = matches.length;
    const finished = matches.filter(
      (m) => m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor !== "- : -")
    );
    let wins = 0;
    let losses = 0;
    let setsWon = 0;
    let setsLost = 0;

    finished.forEach((m) => {
      const isHome = m.takim_a === teamName;
      const parts = m.skor ? m.skor.split("-").map((s) => parseInt(s.trim(), 10)) : [];
      const tScore = isHome ? parts[0] : parts[1];
      const oScore = isHome ? parts[1] : parts[0];
      if (tScore > oScore) wins++;
      else if (tScore < oScore) losses++;
      if (!isNaN(tScore)) setsWon += tScore;
      if (!isNaN(oScore)) setsLost += oScore;
    });

    const winRate = finished.length > 0 ? Math.round((wins / finished.length) * 100) : 0;
    const setRatio = setsLost > 0 ? (setsWon / setsLost).toFixed(2) : setsWon > 0 ? "MAX" : "0.00";

    return { total, played: finished.length, wins, losses, setsWon, setsLost, winRate, setRatio };
  };

  const stats1 = useMemo(
    () => (team1 ? getTeamStats(team1Matches, team1.takim_adi) : null),
    [team1Matches, team1]
  );
  const stats2 = useMemo(
    () => (team2 ? getTeamStats(team2Matches, team2.takim_adi) : null),
    [team2Matches, team2]
  );

  // H2H Galibiyet sayıları
  const h2hWins1 = useMemo(() => {
    if (!team1 || !team2) return 0;
    return headToHeadMatches.filter((m) => {
      const isHome = m.takim_a === team1.takim_adi;
      const parts = m.skor ? m.skor.split("-").map((s) => parseInt(s.trim(), 10)) : [];
      return isHome ? parts[0] > parts[1] : parts[1] > parts[0];
    }).length;
  }, [headToHeadMatches, team1, team2]);

  const h2hWins2 = useMemo(() => {
    if (!team1 || !team2) return 0;
    return headToHeadMatches.filter((m) => {
      const isHome = m.takim_a === team2.takim_adi;
      const parts = m.skor ? m.skor.split("-").map((s) => parseInt(s.trim(), 10)) : [];
      return isHome ? parts[0] > parts[1] : parts[1] > parts[0];
    }).length;
  }, [headToHeadMatches, team1, team2]);

  // Hızlı 2. Lig Eşleşmeleri
  const quickMatchups = [
    { name1: "Havran Bld.", name2: "Karşıyaka" },
    { name1: "Zeren Spor", name2: "Bozüyük Bld." },
    { name1: "Çukurova Bld.", name2: "Merinos" },
    { name1: "Fethiye Bld.", name2: "Muğla Bld." },
  ];

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* 1. ÜST BAŞLIK VE KONTROL PANELİ */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-xs">
            <Swords size={20} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Kadınlar 2. Ligi Kulüp Karşılaştırması</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 font-bold border border-rose-500/40 font-mono">
                H2H
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              16 gruptaki herhangi iki kulübü seçerek geçmiş maçlarını, form durumlarını ve lig istatistiklerini kafa kafaya kıyaslayın
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Karşılaştırma linkini kopyala"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-300">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Share2 size={13} />
                <span>Paylaş</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. HIZLI EŞLEŞMELER */}
      <div className="glass-panel rounded-2xl p-2.5 sm:p-3 border border-slate-800/90 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles size={12} className="text-amber-400" />
          Öne Çıkanlar:
        </span>
        {quickMatchups.map((m, idx) => (
          <button
            key={idx}
            onClick={() => handleApply(slugify(m.name1), slugify(m.name2))}
            className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
          >
            <span>{m.name1}</span>
            <span className="text-rose-400 font-bold">vs</span>
            <span>{m.name2}</span>
          </button>
        ))}
      </div>

      {/* 3. TAKIM SEÇİCİLERİ VE VS ALANI */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* 1. Takım Seçici */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Takım
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Takım ara..."
                value={search1}
                onChange={(e) => setSearch1(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <select
              value={slug1}
              onChange={(e) => handleApply(e.target.value, slug2)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              {filteredTeams1.map((t) => (
                <option key={t.takim_id} value={slugify(t.takim_adi)}>
                  {t.takim_adi} ({t.grup_adi || `Grup ${t.grup_no}`}{t.sehir ? ` • ${t.sehir}` : ""})
                </option>
              ))}
            </select>
          </div>

          {/* VS & Takas Butonu */}
          <div className="md:col-span-1 flex flex-col items-center justify-center gap-2">
            <button
              onClick={handleSwap}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 group"
              title="Takımların yerini değiştir"
            >
              <ArrowRightLeft size={16} className="group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <span className="text-xs font-black font-mono text-rose-500 tracking-widest uppercase">
              VS
            </span>
          </div>

          {/* 2. Takım Seçici */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider text-right md:text-left">
              2. Takım
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Takım ara..."
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <select
              value={slug2}
              onChange={(e) => handleApply(slug1, e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              {filteredTeams2.map((t) => (
                <option key={t.takim_id} value={slugify(t.takim_adi)}>
                  {t.takim_adi} ({t.grup_adi || `Grup ${t.grup_no}`}{t.sehir ? ` • ${t.sehir}` : ""})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. TAKIM KARTLARI BANNER */}
        {team1 && team2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            {/* Takım 1 Kartı */}
            <div className="glass-panel border border-slate-800/80 bg-slate-900/60 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {team1.logo && !team1.logo.includes("takimlogoyok") ? (
                  <Image
                    src={team1.logo}
                    alt={team1.takim_adi}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain rounded-xl bg-white/5 p-1 shrink-0"
                    unoptimized={team1.logo.startsWith("http")}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-700/50 text-rose-300 font-extrabold flex items-center justify-center text-sm shrink-0">
                    {team1.takim_adi.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/takim/${slugify(team1.takim_adi)}`}
                    className="text-sm font-extrabold text-white hover:text-rose-400 transition-colors truncate block"
                  >
                    {team1.takim_adi}
                  </Link>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{team1.grup_adi || `Grup ${team1.grup_no}`}</span>
                    {team1.sehir && <><span>•</span><span>{team1.sehir}</span></>}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Grup Sırası</span>
                <span className="text-lg font-black font-mono text-emerald-400">#{team1.sira}</span>
              </div>
            </div>

            {/* Takım 2 Kartı */}
            <div className="glass-panel border border-slate-800/80 bg-slate-900/60 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {team2.logo && !team2.logo.includes("takimlogoyok") ? (
                  <Image
                    src={team2.logo}
                    alt={team2.takim_adi}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain rounded-xl bg-white/5 p-1 shrink-0"
                    unoptimized={team2.logo.startsWith("http")}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 font-extrabold flex items-center justify-center text-sm shrink-0">
                    {team2.takim_adi.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/takim/${slugify(team2.takim_adi)}`}
                    className="text-sm font-extrabold text-white hover:text-rose-400 transition-colors truncate block"
                  >
                    {team2.takim_adi}
                  </Link>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{team2.grup_adi || `Grup ${team2.grup_no}`}</span>
                    {team2.sehir && <><span>•</span><span>{team2.sehir}</span></>}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Grup Sırası</span>
                <span className="text-lg font-black font-mono text-emerald-400">#{team2.sira}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. KAFA KAFAYA İSTATİSTİK KIYASLAMASI (H2H Metrics) */}
      {team1 && team2 && stats1 && stats2 && (
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
              <Activity size={14} className="text-rose-400" />
              <span>Sezon Performansı Karşılaştırması</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              TVF Kadınlar 2. Ligi 2026-2027
            </span>
          </div>

          {/* İstatistik Satırları */}
          <div className="space-y-3 text-xs">
            {/* Galibiyet Oranı */}
            <div>
              <div className="flex justify-between font-mono font-bold text-slate-300 mb-1">
                <span className="text-rose-400">%{stats1.winRate}</span>
                <span className="text-slate-400 font-sans font-semibold">Galibiyet Oranı</span>
                <span className="text-cyan-400">%{stats2.winRate}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 flex overflow-hidden border border-slate-800">
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${stats1.winRate}%` }}
                />
                <div
                  className="bg-cyan-500 h-full transition-all duration-500 ml-auto"
                  style={{ width: `${stats2.winRate}%` }}
                />
              </div>
            </div>

            {/* Oynanan / Galibiyet / Mağlubiyet */}
            <div className="grid grid-cols-3 py-2 border-b border-slate-800/60 text-center items-center">
              <span className="font-mono font-bold text-slate-200">
                {stats1.wins}G / {stats1.losses}M
              </span>
              <span className="text-slate-400 text-[11px]">Galibiyet / Mağlubiyet</span>
              <span className="font-mono font-bold text-slate-200">
                {stats2.wins}G / {stats2.losses}M
              </span>
            </div>

            {/* Puan Tablosu Puanı */}
            <div className="grid grid-cols-3 py-2 border-b border-slate-800/60 text-center items-center">
              <span className="font-mono font-black text-rose-400 text-sm">
                {team1.p} P
              </span>
              <span className="text-slate-400 text-[11px]">Toplam Puan</span>
              <span className="font-mono font-black text-cyan-400 text-sm">
                {team2.p} P
              </span>
            </div>

            {/* Setler ve Set Oranı */}
            <div className="grid grid-cols-3 py-2 border-b border-slate-800/60 text-center items-center">
              <span className="font-mono font-bold text-slate-200">
                {team1.as}:{team1.vs} ({team1.sav})
              </span>
              <span className="text-slate-400 text-[11px]">Setler (Alınan / Verilen)</span>
              <span className="font-mono font-bold text-slate-200">
                {team2.as}:{team2.vs} ({team2.sav})
              </span>
            </div>

            {/* Sayılar ve Sayı Oranı */}
            <div className="grid grid-cols-3 py-2 border-b border-slate-800/60 text-center items-center">
              <span className="font-mono font-bold text-slate-200">
                {team1.asp}:{team1.vsp} ({team1.spav})
              </span>
              <span className="text-slate-400 text-[11px]">Sayılar (Alınan / Verilen)</span>
              <span className="font-mono font-bold text-slate-200">
                {team2.asp}:{team2.vsp} ({team2.spav})
              </span>
            </div>

            {/* Form Durumu (Son 5 Maç) */}
            <div className="grid grid-cols-3 py-2 border-b border-slate-800/60 text-center items-center">
              <div className="flex justify-center">
                <FormBadge matches={team1Form} />
              </div>
              <span className="text-slate-400 text-[11px]">Son Form (5 Maç)</span>
              <div className="flex justify-center">
                <FormBadge matches={team2Form} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. İKİ TAKIM ARASINDAKİ GEÇMİŞ MAÇLAR (Head to Head) */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-rose-400" />
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-tight">
              Aralarındaki Karşılaşmalar ({headToHeadMatches.length})
            </h3>
          </div>
          {team1 && team2 && (
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="text-rose-400">{team1.takim_adi}: {h2hWins1}</span>
              <span className="text-slate-600">-</span>
              <span className="text-cyan-400">{team2.takim_adi}: {h2hWins2}</span>
            </div>
          )}
        </div>

        {headToHeadMatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 space-y-1">
            <p className="font-semibold text-slate-300">
              Bu iki takım arasında bu sezon henüz oynanmış veya fikstürde tanımlı bir maç bulunmuyor.
            </p>
            <p className="text-slate-500">
              Takımlar farklı gruplarda yer alıyor olabilir veya maç takvimi TVF tarafından ilerleyen haftalarda planlanacaktır.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {headToHeadMatches.map((m) => {
              const isFinished = m.durum === "BİTTİ";
              return (
                <div
                  key={m.id}
                  className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-300">{m.tarih}</span>
                    {m.saat && <span>• {m.saat}</span>}
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-rose-300 font-bold border border-slate-700">
                      {m.grup_adi}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-semibold text-slate-200">
                    <span className={m.takim_a === team1?.takim_adi ? "text-rose-300 font-bold" : ""}>
                      {m.takim_a}
                    </span>
                    <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-white">
                      {isFinished && m.skor ? m.skor : "vs"}
                    </span>
                    <span className={m.takim_b === team2?.takim_adi ? "text-cyan-300 font-bold" : ""}>
                      {m.takim_b}
                    </span>
                  </div>

                  <div className="text-slate-400 text-[11px] truncate max-w-[200px]" title={m.salon}>
                    {m.salon}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
