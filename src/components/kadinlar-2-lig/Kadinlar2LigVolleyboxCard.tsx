"use client";

import React from "react";
import Link from "next/link";
import {
  Landmark,
  Star,
  ExternalLink,
  CalendarPlus,
  AlertTriangle,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import {
  convertK2MatchToMatch,
  getKadinlar2LigMatchTeamNames,
} from "@/utils/kadinlar2LigConverter";
import { slugify } from "@/utils/slugify";
import { downloadIcsFile, generateMatchIcs } from "@/utils/ics";

interface Kadinlar2LigVolleyboxCardProps {
  match: Kadinlar2LigMatch;
  isSelected?: boolean;
  onSelect?: (match: Match) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (matchId: string) => void;
}

export const Kadinlar2LigVolleyboxCard: React.FC<Kadinlar2LigVolleyboxCardProps> = ({
  match,
  isSelected = false,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { home: homeName, away: awayName } = getKadinlar2LigMatchTeamNames(match);
  const convertedMatch = convertK2MatchToMatch(match);

  const homeSets = match.set_a !== "" ? Number(match.set_a) : null;
  const awaySets = match.set_b !== "" ? Number(match.set_b) : null;
  const isFinished =
    match.durum === "BİTTİ" ||
    (homeSets !== null && awaySets !== null && (homeSets > 0 || awaySets > 0));

  const homeWon = isFinished && homeSets !== null && awaySets !== null && homeSets > awaySets;
  const awayWon = isFinished && homeSets !== null && awaySets !== null && awaySets > homeSets;

  const vbUrl =
    match.volleybox?.url ||
    match.volleybox?.match_url ||
    match.volleybox_url ||
    (match.volleybox?.match_id
      ? `https://women.volleybox.net/m${match.volleybox.match_id}`
      : null);

  const discrepancy = match.volleybox?.discrepancy || match.discrepancy;
  const hasDiscrepancy = Boolean(discrepancy?.has_diff);

  // Set sonuçları ayrıştırma: "(25-20) (22-25) (25-18)" -> ["25-20", "22-25", "25-18"]
  const setScoreList = Array.from(
    match.set_sonuclari?.matchAll(/\d{1,2}\s*[-:]\s*\d{1,2}/g) || [],
    ([s]) => s.trim().replace(":", "-")
  );

  const handleCardClick = () => {
    onSelect?.(convertedMatch);
  };

  const handleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ics = generateMatchIcs(convertedMatch);
    if (ics) {
      downloadIcsFile(
        `mac-${convertedMatch.home_team}-${convertedMatch.away_team}-${convertedMatch.date}.ics`,
        ics
      );
    }
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(match.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`relative group rounded-2xl p-3.5 sm:p-4 transition-all cursor-pointer border select-none ${
        isSelected
          ? "bg-slate-900 border-primary ring-2 ring-primary/40 shadow-card"
          : hasDiscrepancy
          ? "bg-slate-900/90 hover:bg-slate-850 border-amber-500/40 hover:border-amber-500/70 shadow-xs"
          : "bg-slate-900/75 hover:bg-slate-850/90 border-slate-800/80 hover:border-slate-700 shadow-xs hover:shadow-card"
      }`}
    >
      {/* 1. Üst Bilgi Satırı (Saat • Grup • Salon) */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/70 text-xs">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {/* Saat */}
          <span className="font-mono font-bold text-[11px] sm:text-xs text-slate-100 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/60 shrink-0">
            {match.saat || "—:—"}
          </span>

          {/* Grup Bilgisi */}
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25 shrink-0">
            {match.grup_adi || `${match.grup_no}. Grup`}
          </span>

          {match.hafta && (
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
              {match.hafta}. Hafta
            </span>
          )}

          {/* Salon & Şehir Bilgisi */}
          {(match.salon || match.sehir) && (
            <div
              className="flex items-center gap-1 text-[11px] text-slate-400 truncate min-w-0"
              title={`${match.salon || ""}${match.sehir ? `, ${match.sehir}` : ""}`}
            >
              <Landmark size={12} className="text-slate-500 shrink-0" />
              <span className="truncate">
                {match.salon || "Salon Belirtilmemiş"}
                {match.sehir ? `, ${match.sehir}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Sağ: Durum / Fark Uyarısı / Favori */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasDiscrepancy && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md"
              title={
                discrepancy?.details ||
                "TVF ile Volleybox arasında saat/tarih/salon farkı tespit edildi"
              }
            >
              <AlertTriangle size={10} className="text-amber-400" />
              <span className="hidden sm:inline">Saat/Salon Farkı</span>
            </span>
          )}

          {isFinished ? (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              BİTTİ
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded-md">
              {match.durum || "OYNANACAK"}
            </span>
          )}

          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFav}
              className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFavorite ? "Favorilerden çıkar" : "Kulübü favorilere ekle"}
            >
              <Star
                size={13}
                className={isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-400"}
              />
            </button>
          )}
        </div>
      </div>

      {/* 2. Orta Gövde: Volleybox 3 Parçalı Takım & Skor Düzeni */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 my-2">
        {/* EV SAHİBİ (Sol taraf, sağa yaslı) */}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-2 sm:gap-3 text-right">
          <div className="min-w-0 flex-1 flex flex-col items-end">
            <Link
              prefetch={false}
              href={`/takim/${slugify(homeName)}`}
              onClick={(e) => e.stopPropagation()}
              className={`text-xs sm:text-sm font-bold truncate max-w-full transition-colors hover:underline underline-offset-2 ${
                homeWon ? "text-white font-extrabold" : "text-slate-200 hover:text-white"
              }`}
              title={homeName !== match.takim_a ? `${homeName} (TVF: ${match.takim_a})` : homeName}
            >
              {homeName}
            </Link>
            {homeWon && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <Trophy size={10} /> Kazandı
              </span>
            )}
          </div>

          <Link
            prefetch={false}
            href={`/takim/${slugify(homeName)}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 hover:opacity-85 transition-opacity"
            title={`${homeName} Profili`}
          >
            <TeamBadge name={homeName} size="md" />
          </Link>
        </div>

        {/* SKOR KUTUSU (Ortada büyük skor) */}
        <div className="shrink-0 flex flex-col items-center justify-center min-w-[76px] sm:min-w-[96px] px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
          {isFinished ? (
            <div className="font-scoreboard font-black text-xl sm:text-2xl tracking-wider text-emerald-400 tabular-nums leading-none">
              {homeSets ?? 0} : {awaySets ?? 0}
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
              VS
            </div>
          )}

          {/* Set Skorları Özeti */}
          {setScoreList.length > 0 && (
            <div
              className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-[130px] sm:max-w-[180px] text-center"
              title={setScoreList.join(", ")}
            >
              ({setScoreList.join(", ")})
            </div>
          )}
        </div>

        {/* DEPLASMAN (Sağ taraf, sola yaslı) */}
        <div className="flex-1 min-w-0 flex items-center justify-start gap-2 sm:gap-3 text-left">
          <Link
            prefetch={false}
            href={`/takim/${slugify(awayName)}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 hover:opacity-85 transition-opacity"
            title={`${awayName} Profili`}
          >
            <TeamBadge name={awayName} size="md" />
          </Link>

          <div className="min-w-0 flex-1 flex flex-col items-start">
            <Link
              prefetch={false}
              href={`/takim/${slugify(awayName)}`}
              onClick={(e) => e.stopPropagation()}
              className={`text-xs sm:text-sm font-bold truncate max-w-full transition-colors hover:underline underline-offset-2 ${
                awayWon ? "text-white font-extrabold" : "text-slate-200 hover:text-white"
              }`}
              title={awayName !== match.takim_b ? `${awayName} (TVF: ${match.takim_b})` : awayName}
            >
              {awayName}
            </Link>
            {awayWon && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <Trophy size={10} /> Kazandı
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Alt Eylemler & Volleybox Butonları */}
      <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-800/60 text-xs">
        {/* Sol: Set Dağılım Rozetleri */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {setScoreList.map((setScore, sIdx) => (
            <span
              key={sIdx}
              className="font-mono text-[10px] text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50 shrink-0"
              title={`${sIdx + 1}. Set Skoru`}
            >
              {setScore}
            </span>
          ))}
        </div>

        {/* Sağ: Volleybox Linki & Maç Detayı Butonu */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCalendar}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Takvime Ekle (.ics)"
          >
            <CalendarPlus size={13} />
          </button>

          {vbUrl && (
            <a
              href={vbUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
              title="Volleybox maç detay sayfasını aç"
            >
              <ExternalLink size={10} />
              <span>Volleybox</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleCardClick}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <span>Daha Fazla Göster</span>
            <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};
