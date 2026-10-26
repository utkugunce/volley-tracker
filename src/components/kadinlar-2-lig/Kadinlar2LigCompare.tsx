"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { TeamBadge } from "@/components/TeamBadge";
import {
  Swords,
  ArrowRightLeft,
  Calendar,
  Share2,
  Check,
  Activity,
  Search,
  Sparkles,
} from "lucide-react";
import { Kadinlar2LigData, Kadinlar2LigTeam, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";
import { getKadinlar2LigTeamName, convertK2MatchToMatch } from "@/utils/kadinlar2LigConverter";
import { FormBadge, FormMatchItem } from "@/components/FormBadge";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { triggerHaptic } from "@/utils/haptics";
import { VolleyMatchRow } from "@/components/match/VolleyMatchRow";

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

  const displayNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of data.tum_takimlar || []) {
      map.set(t.takim_adi, getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name));
    }
    return map;
  }, [data.tum_takimlar]);

  const nameOf = useCallback(
    (tvfName: string) => displayNames.get(tvfName) ?? getKadinlar2LigTeamName(tvfName),
    [displayNames]
  );

  const slugOf = useCallback(
    (t: Kadinlar2LigTeam) => slugify(nameOf(t.takim_adi)),
    [nameOf]
  );

  const teamCityMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of allTeams) {
      if (t.sehir) map.set(t.takim_adi, t.sehir);
    }
    for (const m of allMatches) {
      if (m.takim_a && m.sehir && !map.has(m.takim_a)) {
        map.set(m.takim_a, m.sehir);
      }
    }
    return map;
  }, [allTeams, allMatches]);

  const cityOf = useCallback(
    (t: Kadinlar2LigTeam) => t.sehir || teamCityMap.get(t.takim_adi) || "",
    [teamCityMap]
  );

  const defaultSlug1 = initialSlug1 || (allTeams[0] ? slugOf(allTeams[0]) : "");
  const defaultSlug2 = initialSlug2 || (allTeams[1] ? slugOf(allTeams[1]) : "");

  const [slug1, setSlug1] = useState<string>(defaultSlug1);
  const [slug2, setSlug2] = useState<string>(defaultSlug2);
  const [search1, setSearch1] = useState<string>("");
  const [search2, setSearch2] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialSlug1) setSlug1(initialSlug1);
    if (initialSlug2) setSlug2(initialSlug2);
  }, [initialSlug1, initialSlug2]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q1 = params.get("takim1");
      const q2 = params.get("takim2");
      if (q1) setSlug1(q1);
      if (q2) setSlug2(q2);
    }
  }, []);

  const findTeamBySlug = useCallback(
    (slug: string): Kadinlar2LigTeam | undefined => {
      if (!slug) return undefined;
      const normalized = slugify(slug);
      return allTeams.find(
        (t) =>
          slugOf(t) === normalized ||
          slugify(t.takim_adi) === normalized
      );
    },
    [allTeams, slugOf]
  );

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
    const s1 = team1 ? slugOf(team1) : slug1;
    const s2 = team2 ? slugOf(team2) : slug2;
    handleApply(s2, s1);
  };

  const handleShare = () => {
    triggerHaptic("success");
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const team1 = useMemo(() => {
    return findTeamBySlug(slug1) || allTeams[0];
  }, [allTeams, slug1, findTeamBySlug]);

  const team2 = useMemo(() => {
    const found = findTeamBySlug(slug2);
    if (found) return found;
    return (
      allTeams.find((t) => t.takim_id !== team1?.takim_id && t.grup_no === team1?.grup_no) ||
      allTeams[1] ||
      allTeams[0]
    );
  }, [allTeams, slug2, findTeamBySlug, team1]);

  const filteredTeams1 = useMemo(() => {
    if (!search1.trim()) return allTeams;
    const q = trLower(search1).trim();
    return allTeams.filter(
      (t) =>
        trIncludes(t.takim_adi, q) ||
        trIncludes(nameOf(t.takim_adi), q) ||
        trIncludes(cityOf(t), q)
    );
  }, [allTeams, search1, nameOf, cityOf]);

  const filteredTeams2 = useMemo(() => {
    if (!search2.trim()) return allTeams;
    const q = trLower(search2).trim();
    return allTeams.filter(
      (t) =>
        trIncludes(t.takim_adi, q) ||
        trIncludes(nameOf(t.takim_adi), q) ||
        trIncludes(cityOf(t), q)
    );
  }, [allTeams, search2, nameOf, cityOf]);

  const getTeamMatches = useCallback(
    (teamName?: string) => {
      if (!teamName) return [];
      return allMatches.filter((m) => m.takim_a === teamName || m.takim_b === teamName);
    },
    [allMatches]
  );

  const team1Matches = useMemo(() => getTeamMatches(team1?.takim_adi), [team1, getTeamMatches]);
  const team2Matches = useMemo(() => getTeamMatches(team2?.takim_adi), [team2, getTeamMatches]);

  const headToHeadMatches = useMemo(() => {
    if (!team1 || !team2) return [];
    return allMatches.filter(
      (m) =>
        (m.takim_a === team1.takim_adi && m.takim_b === team2.takim_adi) ||
        (m.takim_a === team2.takim_adi && m.takim_b === team1.takim_adi)
    );
  }, [allMatches, team1, team2]);

  const getTeamForm = (matches: Kadinlar2LigMatch[], teamName: string): FormMatchItem[] => {
    const finished = matches.filter(
      (m) =>
        m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor !== "- : -")
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
        opponent: nameOf(opponent),
        date: m.tarih,
      };
    });
  };

  const team1Form = useMemo(
    () => (team1 ? getTeamForm(team1Matches, team1.takim_adi) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [team1Matches, team1, nameOf]
  );
  const team2Form = useMemo(
    () => (team2 ? getTeamForm(team2Matches, team2.takim_adi) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [team2Matches, team2, nameOf]
  );

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

  const quickMatchups = useMemo(() => {
    const list: { label1: string; label2: string; slug1: string; slug2: string; groupNo: number }[] = [];
    for (const g of data.gruplar || []) {
      const t1 = g.puan_durumu?.[0];
      const t2 = g.puan_durumu?.[1];
      if (t1 && t2) {
        list.push({
          label1: nameOf(t1.takim_adi),
          label2: nameOf(t2.takim_adi),
          slug1: slugOf(t1),
          slug2: slugOf(t2),
          groupNo: g.grup_no,
        });
      }
      if (list.length >= 6) break;
    }
    return list;
  }, [data.gruplar, nameOf, slugOf]);

  return (
    <div className="space-y-4">
      {/* 1. ÜST BAŞLIK VE KONTROL PANELİ */}
      <div className="bg-surface border border-line rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <Swords size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-ink tracking-tight flex items-center gap-2">
              <span>Kadınlar 2. Ligi Kulüp Karşılaştırması</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-muted text-ink-2 font-bold border border-line font-mono">
                H2H
              </span>
            </h2>
            <p className="text-xs text-ink-3 mt-0.5">
              16 gruptaki herhangi iki kulübü seçerek geçmiş maçlarını, form durumlarını ve lig istatistiklerini kafa kafaya kıyaslayın
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line text-xs font-semibold transition-colors cursor-pointer"
            title="Karşılaştırma linkini kopyala"
          >
            {copied ? (
              <>
                <Check size={13} className="text-done" />
                <span className="text-done">Kopyalandı!</span>
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
      {quickMatchups.length > 0 && (
        <div className="bg-surface rounded-xl p-2.5 sm:p-3 border border-line flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] sm:text-[11px] font-bold text-ink-3 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles size={12} className="text-primary" />
            Zirve Yarışı:
          </span>
          {quickMatchups.map((m, idx) => {
            const isSelected =
              team1 &&
              team2 &&
              ((slugOf(team1) === m.slug1 && slugOf(team2) === m.slug2) ||
                (slugOf(team1) === m.slug2 && slugOf(team2) === m.slug1));
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleApply(m.slug1, m.slug2)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? "bg-primary text-primary-fg border-primary font-bold"
                    : "bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border-line"
                }`}
                title={`Grup ${m.groupNo} Liderlik Maçı: ${m.label1} vs ${m.label2}`}
              >
                <span className="text-[10px] font-mono font-bold">G{m.groupNo}</span>
                <span>{m.label1}</span>
                <span className="opacity-70 font-bold">vs</span>
                <span>{m.label2}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. TAKIM SEÇİCİLERİ VE VS ALANI */}
      <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* 1. Takım Seçici */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-ink-3 uppercase tracking-wider">
              1. Takım
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Takım veya şehir ara..."
                value={search1}
                onChange={(e) => setSearch1(e.target.value)}
                className="w-full bg-surface-muted border border-line rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink placeholder-ink-3 focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={team1 ? slugOf(team1) : slug1}
              onChange={(e) => handleApply(e.target.value, team2 ? slugOf(team2) : slug2)}
              className="w-full bg-surface-muted border border-line rounded-lg p-2.5 text-xs sm:text-sm text-ink font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              {filteredTeams1.map((t) => {
                const c = cityOf(t);
                return (
                  <option key={t.takim_id} value={slugOf(t)}>
                    {nameOf(t.takim_adi)} ({t.grup_adi || `Grup ${t.grup_no}`}{c ? ` • ${c}` : ""})
                  </option>
                );
              })}
            </select>
          </div>

          {/* VS & Takas Butonu */}
          <div className="md:col-span-1 flex flex-col items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={handleSwap}
              className="w-9 h-9 rounded-lg bg-surface-muted hover:bg-surface-raised border border-line text-ink-2 hover:text-ink flex items-center justify-center transition-colors cursor-pointer group"
              title="Takımların yerini değiştir"
            >
              <ArrowRightLeft size={15} className="group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <span className="text-[11px] font-bold font-mono text-ink-3 tracking-widest uppercase">
              VS
            </span>
          </div>

          {/* 2. Takım Seçici */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-ink-3 uppercase tracking-wider text-right md:text-left">
              2. Takım
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Takım veya şehir ara..."
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
                className="w-full bg-surface-muted border border-line rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink placeholder-ink-3 focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={team2 ? slugOf(team2) : slug2}
              onChange={(e) => handleApply(team1 ? slugOf(team1) : slug1, e.target.value)}
              className="w-full bg-surface-muted border border-line rounded-lg p-2.5 text-xs sm:text-sm text-ink font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              {filteredTeams2.map((t) => {
                const c = cityOf(t);
                return (
                  <option key={t.takim_id} value={slugOf(t)}>
                    {nameOf(t.takim_adi)} ({t.grup_adi || `Grup ${t.grup_no}`}{c ? ` • ${c}` : ""})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* 4. TAKIM KARTLARI BANNER */}
        {team1 && team2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4 border-t border-line">
            <div className="bg-surface-muted border border-line rounded-xl p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <TeamBadge name={nameOf(team1.takim_adi)} size="md" />
                <div className="min-w-0">
                  <Link
                    prefetch={false}
                    href={`/takim/${slugOf(team1)}`}
                    className="text-sm font-bold text-ink hover:text-primary transition-colors truncate block"
                  >
                    {nameOf(team1.takim_adi)}
                  </Link>
                  <div className="text-[11px] text-ink-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectGroup?.(team1.grup_no)}
                      className="hover:text-ink transition-colors cursor-pointer"
                    >
                      {team1.grup_adi || `Grup ${team1.grup_no}`}
                    </button>
                    {cityOf(team1) && (
                      <>
                        <span>•</span>
                        <span>{cityOf(team1)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-ink-3 uppercase block">Grup Sırası</span>
                <span className="text-lg font-black font-mono tabular-nums text-primary">#{team1.sira}</span>
              </div>
            </div>

            <div className="bg-surface-muted border border-line rounded-xl p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <TeamBadge name={nameOf(team2.takim_adi)} size="md" />
                <div className="min-w-0">
                  <Link
                    prefetch={false}
                    href={`/takim/${slugOf(team2)}`}
                    className="text-sm font-bold text-ink hover:text-primary transition-colors truncate block"
                  >
                    {nameOf(team2.takim_adi)}
                  </Link>
                  <div className="text-[11px] text-ink-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectGroup?.(team2.grup_no)}
                      className="hover:text-ink transition-colors cursor-pointer"
                    >
                      {team2.grup_adi || `Grup ${team2.grup_no}`}
                    </button>
                    {cityOf(team2) && (
                      <>
                        <span>•</span>
                        <span>{cityOf(team2)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-ink-3 uppercase block">Grup Sırası</span>
                <span className="text-lg font-black font-mono tabular-nums text-done">#{team2.sira}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. KAFA KAFAYA İSTATİSTİK KIYASLAMASI (H2H Metrics) */}
      {team1 && team2 && stats1 && stats2 && (
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-tight flex items-center gap-2">
              <Activity size={14} className="text-primary" />
              <span>Sezon Performansı Karşılaştırması</span>
            </h3>
            <span className="text-[11px] text-ink-3 font-mono">
              TVF Kadınlar 2. Ligi 2026-2027
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Galibiyet Oranı */}
            <div>
              <div className="flex justify-between font-mono tabular-nums font-bold text-ink-2 mb-1">
                <span className="text-primary">%{stats1.winRate}</span>
                <span className="text-ink-3 font-sans font-semibold">Galibiyet Oranı</span>
                <span className="text-done">%{stats2.winRate}</span>
              </div>
              <div className="w-full bg-surface-muted rounded-full h-1.5 flex overflow-hidden border border-line">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${stats1.winRate}%` }}
                />
                <div
                  className="bg-done h-full transition-all duration-500 ml-auto"
                  style={{ width: `${stats2.winRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 py-2 border-b border-line text-center items-center">
              <span className="font-mono tabular-nums font-bold text-ink">
                {stats1.wins}G / {stats1.losses}M
              </span>
              <span className="text-ink-3 text-[11px]">Galibiyet / Mağlubiyet</span>
              <span className="font-mono tabular-nums font-bold text-ink">
                {stats2.wins}G / {stats2.losses}M
              </span>
            </div>

            <div className="grid grid-cols-3 py-2 border-b border-line text-center items-center">
              <span className="font-mono font-black tabular-nums text-primary text-sm">
                {team1.p} P
              </span>
              <span className="text-ink-3 text-[11px]">Toplam Puan</span>
              <span className="font-mono font-black tabular-nums text-done text-sm">
                {team2.p} P
              </span>
            </div>

            <div className="grid grid-cols-3 py-2 border-b border-line text-center items-center">
              <span className="font-mono tabular-nums font-bold text-ink">
                {team1.as}:{team1.vs} ({team1.sav})
              </span>
              <span className="text-ink-3 text-[11px]">Setler (Alınan / Verilen)</span>
              <span className="font-mono tabular-nums font-bold text-ink">
                {team2.as}:{team2.vs} ({team2.sav})
              </span>
            </div>

            <div className="grid grid-cols-3 py-2 border-b border-line text-center items-center">
              <span className="font-mono tabular-nums font-bold text-ink">
                {team1.asp}:{team1.vsp} ({team1.spav})
              </span>
              <span className="text-ink-3 text-[11px]">Sayılar (Alınan / Verilen)</span>
              <span className="font-mono tabular-nums font-bold text-ink">
                {team2.asp}:{team2.vsp} ({team2.spav})
              </span>
            </div>

            <div className="grid grid-cols-3 py-2 text-center items-center">
              <div className="flex justify-center">
                <FormBadge matches={team1Form} />
              </div>
              <span className="text-ink-3 text-[11px]">Son Form (5 Maç)</span>
              <div className="flex justify-center">
                <FormBadge matches={team2Form} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. İKİ TAKIM ARASINDAKİ GEÇMİŞ MAÇLAR */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-surface-muted">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-tight">
              Aralarındaki Karşılaşmalar ({headToHeadMatches.length})
            </h3>
          </div>
          {team1 && team2 && (
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums font-bold">
              <span className="text-primary">{nameOf(team1.takim_adi)}: {h2hWins1}</span>
              <span className="text-ink-3">-</span>
              <span className="text-done">{nameOf(team2.takim_adi)}: {h2hWins2}</span>
            </div>
          )}
        </div>

        {headToHeadMatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-3 space-y-1">
            <p className="font-semibold text-ink-2">
              Bu iki takım arasında bu sezon henüz oynanmış veya fikstürde tanımlı bir maç bulunmuyor.
            </p>
            <p>
              Takımlar farklı gruplarda yer alıyor olabilir veya maç takvimi TVF tarafından ilerleyen haftalarda planlanacaktır.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {headToHeadMatches.map((m) => {
              const converted = convertK2MatchToMatch(m);
              return (
                <VolleyMatchRow
                  key={m.id}
                  match={converted}
                  city={m.sehir || "Kadınlar 2. Ligi"}
                  showDate={true}
                  showGroupBadge={true}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
