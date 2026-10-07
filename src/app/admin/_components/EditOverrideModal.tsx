"use client";

import React from "react";
import { X, CheckCircle2, AlertTriangle, Trash2, Save } from "lucide-react";
import { Match } from "@/types/fixture";
import { MatchOverride } from "@/utils/overrides";

export interface EditOverrideModalProps {
  authorInput: string;
  awayScore: string;
  editingMatch: Match;
  feedback: { type: "success" | "error"; message: string; } | null;
  handleDeleteOverride: (matchId: string) => Promise<void>;
  handleSaveOverride: (e: React.FormEvent<Element>) => Promise<void>;
  homeScore: string;
  overrides: Record<string, MatchOverride>;
  reasonInput: string;
  saveLoading: boolean;
  setAuthorInput: React.Dispatch<React.SetStateAction<string>>;
  setAwayScore: React.Dispatch<React.SetStateAction<string>>;
  setEditingMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  setHomeScore: React.Dispatch<React.SetStateAction<string>>;
  setReasonInput: React.Dispatch<React.SetStateAction<string>>;
  setScoresInput: string;
  setSetScoresInput: React.Dispatch<React.SetStateAction<string>>;
  setStatusInput: React.Dispatch<React.SetStateAction<"upcoming" | "finished" | "postponed" | "live">>;
  statusInput: "upcoming" | "finished" | "postponed" | "live";
}

export function EditOverrideModal({ authorInput, awayScore, editingMatch, feedback, handleDeleteOverride, handleSaveOverride, homeScore, overrides, reasonInput, saveLoading, setAuthorInput, setAwayScore, setEditingMatch, setHomeScore, setReasonInput, setScoresInput, setSetScoresInput, setStatusInput, statusInput }: EditOverrideModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Maç Skorunu Düzelt (Override)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingMatch.city} • {editingMatch.category} • {editingMatch.date}
            </p>
          </div>
          <button
            onClick={() => setEditingMatch(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-3 mb-4 text-center border border-slate-700/80">
          <div className="text-xs text-slate-400 mb-1">Karşılaşma</div>
          <div className="text-sm font-black text-white flex items-center justify-center gap-2">
            <span>{editingMatch.home_team}</span>
            <span className="text-slate-500">vs</span>
            <span>{editingMatch.away_team}</span>
          </div>
        </div>

        <form onSubmit={handleSaveOverride} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="override-home-score" className="block text-xs font-semibold text-slate-300 mb-1">
                Ev Sahibi Skor
              </label>
              <input
                id="override-home-score"
                type="number"
                min="0"
                max="3"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                placeholder="Örn: 3"
                aria-label="Ev Sahibi Skor"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary text-center font-mono font-bold"
              />
            </div>
            <div>
              <label htmlFor="override-away-score" className="block text-xs font-semibold text-slate-300 mb-1">
                Deplasman Skor
              </label>
              <input
                id="override-away-score"
                type="number"
                min="0"
                max="3"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                placeholder="Örn: 1"
                aria-label="Deplasman Skor"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary text-center font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label htmlFor="override-set-scores" className="block text-xs font-semibold text-slate-300 mb-1">
              Set Skorları (Virgülle ayırın)
            </label>
            <input
              id="override-set-scores"
              type="text"
              value={setScoresInput}
              onChange={(e) => setSetScoresInput(e.target.value)}
              placeholder="Örn: 25-18, 22-25, 25-20, 25-19"
              aria-label="Set Skorları"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="override-status" className="block text-xs font-semibold text-slate-300 mb-1">
                Maç Durumu
              </label>
              <select
                id="override-status"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as Match["status"])}
                aria-label="Maç Durumu"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="finished">Bitti (finished)</option>
                <option value="upcoming">Gelecek (upcoming)</option>
                <option value="live">Canlı (live)</option>
                <option value="postponed">Ertelendi (postponed)</option>
              </select>
            </div>
            <div>
              <label htmlFor="override-author" className="block text-xs font-semibold text-slate-300 mb-1">
                Düzenleyen Kişi
              </label>
              <input
                id="override-author"
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                aria-label="Düzenleyen Kişi"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="override-reason" className="block text-xs font-semibold text-slate-300 mb-1">
              Düzeltme Gerekçesi (Audit Log) *
            </label>
            <textarea
              id="override-reason"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Bu düzeltme neden yapıldı? (Örn: TVF bülteninde skor ters yazılmıştı)"
              aria-label="Düzeltme Gerekçesi"
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary resize-none"
              required
            />
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                  : "bg-red-950/80 border border-red-800 text-red-300"
              }`}
            >
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            {overrides[editingMatch.id] ? (
              <button
                type="button"
                onClick={() => handleDeleteOverride(editingMatch.id)}
                disabled={saveLoading}
                className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={13} />
                Override&apos;ı Kaldır
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-fg font-bold text-xs font-semibold shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                {saveLoading ? "Kaydediliyor..." : "Kaydet (Override)"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
