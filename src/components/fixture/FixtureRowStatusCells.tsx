import React from "react";
import { CalendarPlus, Copy, Check, ChevronRight, ExternalLink, AlertTriangle } from "lucide-react";
import type { DiscrepancyInfo, Match } from "@/types/fixture";
import { isMatchOverdueForScore } from "@/utils/calendar";
import type { FixtureCellBaseProps } from "./FixtureRowCells";

interface FixtureVolleyboxCellProps extends FixtureCellBaseProps {
  match: Match;
  hasDiff: boolean;
  disc: DiscrepancyInfo | null | undefined;
}

/** 8. Volleybox Senkronizasyon ve Skor Durumu Rozeti */
export function FixtureVolleyboxCell({ match, hasDiff, disc, cardBorderClass }: FixtureVolleyboxCellProps) {
  return (
    <td className={`py-2.5 px-2 text-center whitespace-nowrap border-y ${cardBorderClass}`}>
      {match.volleybox?.synced ? (
        hasDiff ? (
          <a
            href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700 hover:bg-amber-900/80 hover:border-amber-600 transition-all shadow-sm group/vb"
            title={`DİKKAT: İl bülteninde değişiklik var! (${disc?.details || "Tarih/Saat/Yer farklı"}) - Volleybox'ta güncellemek için tıklayın`}
          >
            <AlertTriangle size={10} className="text-amber-400 shrink-0 animate-bounce" />
            <span>VB: Değişti</span>
            <ExternalLink size={9} className="text-amber-500 group-hover/vb:translate-x-0.5 transition-transform" />
          </a>
        ) : match.volleybox.has_score ? (
          <a
            href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/70 hover:border-emerald-600 transition-all shadow-sm group/vb"
            title={`Volleybox'ta Kayıtlı ve Skoru Girilmiş (Maç ID: #${match.volleybox.match_id} | Skor: ${match.volleybox.score}) - Tıklayarak profili açın`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>VB: {match.volleybox.score || "Skorlu"}</span>
            <ExternalLink size={9} className="text-emerald-400 group-hover/vb:translate-x-0.5 transition-transform" />
          </a>
        ) : isMatchOverdueForScore(match.volleybox?.vb_date || match.date) ? (
          <a
            href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-700 hover:bg-amber-900/60 hover:border-amber-600 transition-all shadow-sm group/vb"
            title={`Maç tarihi geçmesine rağmen Volleybox'a skor henüz girilmemiş! (Maç ID: #${match.volleybox.match_id}) - Skoru girmek için tıklayın`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>VB: Skorsuz</span>
            <ExternalLink size={9} className="text-amber-400 group-hover/vb:translate-x-0.5 transition-transform" />
          </a>
        ) : (
          <a
            href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all group/vb shadow-2xs"
            title={`Volleybox'ta Kayıtlı Gelecek Maç (Maç ID: #${match.volleybox.match_id}) - Maç sayfasını açmak için tıklayın`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>VB: Kayıtlı</span>
            <ExternalLink size={9} className="text-slate-500 group-hover/vb:translate-x-0.5 transition-transform" />
          </a>
        )
      ) : (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] text-slate-500 bg-slate-900/50 border border-slate-700/50 font-medium"
          title="Bu maç henüz Volleybox veritabanına girilmemiş"
        >
          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
          <span>Girilmedi</span>
        </span>
      )}
    </td>
  );
}

interface FixtureActionsCellProps extends FixtureCellBaseProps {
  match: Match;
  isFinished: boolean;
  isCopied: boolean;
  onSelectMatch?: (match: Match) => void;
  handleDownloadIcs: (e: React.MouseEvent, match: Match) => void;
  handleCopy: (e: React.MouseEvent, match: Match) => void;
}

/** 9. İşlemler */
export function FixtureActionsCell({
  match,
  isFinished,
  isCopied,
  onSelectMatch,
  handleDownloadIcs,
  handleCopy,
  cardBorderClass,
}: FixtureActionsCellProps) {
  return (
    <td className={`py-2.5 px-2 text-center whitespace-nowrap no-print rounded-r-xl border-r border-y ${cardBorderClass}`}>
        <div className="flex items-center justify-center gap-0.5">
          {!isFinished && match.date !== "TBD" && (
            <button
              onClick={(e) => handleDownloadIcs(e, match)}
              className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors cursor-pointer"
              title="Takvime Ekle (.ics)"
            >
              <CalendarPlus size={12} />
            </button>
          )}
          <button
            onClick={(e) => handleCopy(e, match)}
            className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors cursor-pointer"
            title="Maç Detayını Kopyala"
          >
            {isCopied ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Copy size={12} />
            )}
          </button>
          {onSelectMatch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectMatch(match);
              }}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Maç Merkezi & Setler"
              aria-label="Maç Detayı"
            >
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </td>
  );
}
