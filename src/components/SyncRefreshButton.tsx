"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  RefreshCw,
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  Square,
  Clock,
  ExternalLink,
  Check,
  Circle,
} from "lucide-react";

export interface SyncRefreshButtonProps {
  onRefreshComplete?: () => void;
}

export interface SyncStageItem {
  id: string;
  label: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

const DEFAULT_STAGES: SyncStageItem[] = [
  { id: "prep", label: "Sistem Hazırlığı", description: "Ortam ve scraper motoru başlatılıyor", status: "pending" },
  { id: "provinces", label: "81 İl Altyapı", description: "TVF yerel il bültenleri taranıyor", status: "pending" },
  { id: "k2lig", label: "Kadınlar 2. Ligi", description: "16 grup fikstür ve puan durumları çekiliyor", status: "pending" },
  { id: "volleybox", label: "Volleybox Eşleştirme", description: "Kadrolar, maçlar ve skorlar senkronize ediliyor", status: "pending" },
  { id: "finalize", label: "Kayıt & Canlıya Alma", description: "Veri doğrulama, Supabase ve site güncellemesi", status: "pending" },
];

type SyncPhase = "idle" | "password" | "running" | "completed" | "cancelled" | "error";

export const SyncRefreshButton: React.FC<SyncRefreshButtonProps> = ({ onRefreshComplete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phase, setPhase] = useState<SyncPhase>("idle");
  const [password, setPassword] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [activeStep, setActiveStep] = useState<string>("");
  const [stages, setStages] = useState<SyncStageItem[]>(DEFAULT_STAGES);
  const [htmlUrl, setHtmlUrl] = useState<string | undefined>(undefined);
  const [runId, setRunId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerTimestampRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    if (isModalOpen && phase === "password") {
      const id = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(id);
    }
  }, [isModalOpen, phase]);

  const handleOpenButton = () => {
    setErrorMessage(null);
    if (phase === "idle" || phase === "completed" || phase === "cancelled" || phase === "error") {
      setPhase("password");
      setPassword("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrorMessage(null);
    if (phase !== "running") {
      setPhase("idle");
      setPassword("");
    }
  };

  const startPollingStatus = (pwd: string, initialRunId?: number) => {
    stopPolling();
    const startMs = Date.now();
    triggerTimestampRef.current = startMs;
    setElapsedSeconds(0);

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/sync/status", {
          headers: { "x-sync-password": pwd },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.available) return;

        // GitHub Actions modunda yeni işin kuyruğa girmesi birkaç saniye sürebilir;
        // tetiklemeden çok önce bitmiş eski bir çalışmayı yeni tamamlanmış sanma.
        if (data.mode === "github_actions" && data.createdAt) {
          const runCreatedMs = new Date(data.createdAt).getTime();
          const waitedMs = Date.now() - triggerTimestampRef.current;
          if (runCreatedMs < triggerTimestampRef.current - 15000 && waitedMs < 25000) {
            return;
          }
        }

        if (typeof data.runId === "number") {
          setRunId(data.runId);
        } else if (initialRunId) {
          setRunId(initialRunId);
        }

        if (data.htmlUrl) {
          setHtmlUrl(data.htmlUrl);
        }

        if (data.activeStep) {
          setActiveStep(data.activeStep);
        }

        if (Array.isArray(data.stages) && data.stages.length > 0) {
          setStages(data.stages);
        }

        if (data.status === "completed") {
          stopPolling();
          if (data.conclusion === "cancelled") {
            setPhase("cancelled");
            setStatusMessage("Çekim işlemi kullanıcı tarafından iptal edildi.");
          } else if (data.conclusion === "failure") {
            setPhase("error");
            setStatusMessage(data.activeStep || "Çekim sırasında bir hata oluştu.");
          } else {
            setPhase("completed");
            setStatusMessage("81 İl Altyapı ve Kadınlar 2. Ligi verileri başarıyla güncellendi!");
            setStages((prev) => prev.map((s) => ({ ...s, status: "completed" })));
            onRefreshComplete?.();
          }
        }
      } catch {
        // geçici ağ hatalarını yoksay, sonraki turda tekrar dene
      }
    }, 2500);
  };

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/sync/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sync-password": trimmed,
        },
        body: JSON.stringify({ password: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Hatalı şifre! Lütfen tekrar deneyin.");
        setIsSubmitting(false);
        return;
      }

      setVerifiedPassword(trimmed);
      setRunId(typeof data.runId === "number" ? data.runId : undefined);
      setActiveStep(data.activeStep || "81 İl ve Kadınlar 2. Ligi verileri çekiliyor...");
      setStatusMessage(data.message || "Çekim işlemi başlatıldı.");
      setStages(DEFAULT_STAGES.map((s, idx) => ({ ...s, status: idx === 0 ? "in_progress" : "pending" })));
      setPhase("running");
      setIsSubmitting(false);

      startPollingStatus(trimmed, typeof data.runId === "number" ? data.runId : undefined);
    } catch {
      setErrorMessage("Sunucuya bağlanırken bir hata oluştu. Lütfen tekrar deneyin.");
      setIsSubmitting(false);
    }
  };

  const handleCancelSync = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    setErrorMessage(null);

    try {
      const pwd = verifiedPassword || password.trim();
      const res = await fetch("/api/sync/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sync-password": pwd,
        },
        body: JSON.stringify({ password: pwd, runId }),
      });

      const data = await res.json();
      stopPolling();

      if (res.ok && data.ok) {
        setPhase("cancelled");
        setStatusMessage(data.message || "Çekim işlemi iptal edildi.");
        setStages((prev) =>
          prev.map((s) => (s.status === "in_progress" ? { ...s, status: "failed" } : s))
        );
      } else {
        setErrorMessage(data.error || "İptal işlemi sırasında bir hata oluştu.");
      }
    } catch {
      setErrorMessage("İptal isteği gönderilemedi.");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  const isRunning = phase === "running";

  const modalContent = isModalOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-refresh-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !isCancelling) {
          handleCloseModal();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Modal Üst Başlık */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isRunning
                  ? "bg-sky-500/15 border-sky-500/30 text-sky-400"
                  : phase === "completed"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : phase === "cancelled"
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-primary/15 border-primary/30 text-primary"
              }`}
            >
              <RefreshCw size={16} className={isRunning ? "animate-spin" : ""} />
            </div>
            <div>
              <h2 id="sync-refresh-modal-title" className="text-sm font-bold text-white flex items-center gap-2">
                <span>Verileri Yenile (81 İl &amp; 2. Lig)</span>
                {isRunning && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse">
                    CANLI
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                TVF Altyapı Bültenleri, 2. Lig ve Volleybox Eşleştirmeleri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="Pencereyi kapat"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-5 overflow-y-auto space-y-4">
          {phase === "password" && (
            <form onSubmit={handleStartSync} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs text-slate-300 leading-relaxed">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>⚡ Çekim Kapsamı:</span>
                </div>
                <ul className="space-y-1 text-slate-400 list-disc list-inside">
                  <li>81 İlin tamamındaki TVF altyapı kulüp bültenleri</li>
                  <li>TVF Kadınlar 2. Ligi (16 Grup, 160+ takım puan durumu &amp; fikstür)</li>
                  <li>Volleybox maç sonuçları ve kadro eşleştirmeleri</li>
                </ul>
              </div>

              <div>
                <label htmlFor="sync-password-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  İşlem Şifresi
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    ref={inputRef}
                    id="sync-password-input"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Şifreyi girin..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono tracking-wider"
                  />
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs font-medium"
                >
                  <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={!password.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <RefreshCw size={13} className={isSubmitting ? "animate-spin" : ""} />
                  <span>{isSubmitting ? "Doğrulanıyor..." : "Çekimi Başlat"}</span>
                </button>
              </div>
            </form>
          )}

          {phase === "running" && (
            <div className="space-y-4">
              {/* Canlı Sayaç & Durum Kartı */}
              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Çekim İşlemi Devam Ediyor</div>
                    <div className="text-[11px] text-sky-300 font-medium line-clamp-1">
                      {activeStep || "İşlemler yürütülüyor..."}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-sky-200 bg-sky-900/60 px-2.5 py-1 rounded-lg border border-sky-700/60 shrink-0">
                  <Clock size={12} />
                  <span>{formatDuration(elapsedSeconds)}</span>
                </div>
              </div>

              {/* CANLI AŞAMA AKIŞI (Pipeline Progress Flow) */}
              <div className="space-y-2 rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Canlı Çekim Akışı
                </div>

                <div className="space-y-2.5">
                  {stages.map((stage, idx) => {
                    const isDone = stage.status === "completed";
                    const isCur = stage.status === "in_progress";
                    const isFail = stage.status === "failed";

                    return (
                      <div
                        key={stage.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                          isCur
                            ? "bg-sky-950/40 border-sky-500/50 shadow-sm shadow-sky-500/10 ring-1 ring-sky-500/20"
                            : isDone
                            ? "bg-slate-900/60 border-emerald-900/40 text-slate-300"
                            : isFail
                            ? "bg-rose-950/40 border-rose-800/60"
                            : "bg-slate-900/30 border-slate-800/60 opacity-60"
                        }`}
                      >
                        {/* Sol İkon */}
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : isCur ? (
                            <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center animate-spin">
                              <RefreshCw size={11} />
                            </div>
                          ) : isFail ? (
                            <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                              <AlertTriangle size={11} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center text-[10px] font-mono">
                              {idx + 1}
                            </div>
                          )}
                        </div>

                        {/* Metinler */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs font-semibold truncate ${
                                isCur ? "text-sky-200 font-bold" : isDone ? "text-slate-200" : "text-slate-400"
                              }`}
                            >
                              {stage.label}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium shrink-0 ${
                                isDone
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                  : isCur
                                  ? "bg-sky-950 text-sky-300 border border-sky-700/60 animate-pulse"
                                  : isFail
                                  ? "bg-rose-950 text-rose-300 border border-rose-800/60"
                                  : "bg-slate-800 text-slate-500 border border-slate-700/50"
                              }`}
                            >
                              {isDone
                                ? "Tamamlandı"
                                : isCur
                                ? "Çalışıyor"
                                : isFail
                                ? "Hata"
                                : "Bekliyor"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {isCur && activeStep ? activeStep : stage.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GitHub Actions Terminal Linki */}
              {htmlUrl && (
                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
                  <span>Detaylı terminal logları:</span>
                  <a
                    href={htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    <span>GitHub Actions'ta İzle</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs font-medium"
                >
                  <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Alt Butonlar: Arka Planda Çalıştır & İptal Et */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Pencereyi kapatır, çekim arka planda devam eder"
                >
                  Arka Planda Çalıştır
                </button>
                <button
                  type="button"
                  onClick={handleCancelSync}
                  disabled={isCancelling}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Square size={12} className="fill-current" />
                  <span>{isCancelling ? "İptal Ediliyor..." : "Çekimi İptal Et"}</span>
                </button>
              </div>
            </div>
          )}

          {phase === "completed" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white text-sm">Çekim Başarıyla Tamamlandı!</div>
                  <p>{statusMessage}</p>
                  <div className="text-[11px] text-emerald-300/80 font-mono pt-1">
                    Toplam Süre: {formatDuration(elapsedSeconds)}
                  </div>
                </div>
              </div>

              {/* Tamamlanan Aşamalar Listesi */}
              <div className="space-y-1.5 rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between text-xs text-slate-300 py-1 px-1.5"
                  >
                    <span className="flex items-center gap-2">
                      <Check size={13} className="text-emerald-400" />
                      <span>{stage.label}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Hazır</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Tamam
                </button>
              </div>
            </div>
          )}

          {phase === "cancelled" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200">
                <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white text-sm">İşlem İptal Edildi</div>
                  <p>{statusMessage || "Çekim işlemi kullanıcı tarafından durduruldu."}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setPhase("password");
                    setPassword("");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Yeniden Başlat
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200">
                <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white text-sm">Çekim Hatası</div>
                  <p>{statusMessage || errorMessage || "İşlem sırasında bir hata oluştu."}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setPhase("password");
                    setPassword("");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tekrar Dene
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpenButton}
        aria-label="Verileri Yenile"
        title={isRunning ? "Çekim devam ediyor (Durumu gör / İptal et)" : "Tüm verileri yenile (Şifreli)"}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer border no-print ${
          isRunning
            ? "bg-sky-600/90 hover:bg-sky-500 text-white border-sky-400/60 shadow-sm animate-pulse"
            : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border-slate-700/60"
        }`}
      >
        <RefreshCw size={13} className={isRunning ? "animate-spin text-white" : "text-emerald-400"} aria-hidden="true" />
        <span className="hidden sm:inline">{isRunning ? "Çekiliyor..." : "Yenile"}</span>
      </button>

      {isModalOpen && (typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent)}
    </>
  );
};
