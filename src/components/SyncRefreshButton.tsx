"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Lock, X, CheckCircle2, AlertTriangle, Square, Clock } from "lucide-react";

export interface SyncRefreshButtonProps {
  onRefreshComplete?: () => void;
}

type SyncPhase = "idle" | "password" | "running" | "completed" | "cancelled" | "error";

export const SyncRefreshButton: React.FC<SyncRefreshButtonProps> = ({ onRefreshComplete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phase, setPhase] = useState<SyncPhase>("idle");
  const [password, setPassword] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [activeStep, setActiveStep] = useState<string>("");
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

        if (data.activeStep) {
          setActiveStep(data.activeStep);
        }

        if (data.status === "completed") {
          stopPolling();
          if (data.conclusion === "cancelled") {
            setPhase("cancelled");
            setStatusMessage("Çekim işlemi iptal edildi.");
          } else if (data.conclusion === "failure") {
            setPhase("error");
            setStatusMessage(data.activeStep || "Çekim sırasında bir hata oluştu.");
          } else {
            setPhase("completed");
            setStatusMessage("81 İl Altyapı ve Kadınlar 2. Ligi verileri başarıyla güncellendi!");
            onRefreshComplete?.();
          }
        }
      } catch {
        // geçici ağ hatalarını yoksay, sonraki turda tekrar dene
      }
    }, 3000);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-refresh-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !isCancelling) {
          handleCloseModal();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-white">
        {/* Modal Üst Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
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
              <h2 id="sync-refresh-modal-title" className="text-sm font-bold text-white">
                Verileri Yenile (81 İl &amp; 2. Lig)
              </h2>
              <p className="text-[11px] text-slate-400">
                TVF Altyapı Bültenleri, 2. Lig ve Volleybox Senkronizasyonu
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
        <div className="p-5">
          {phase === "password" && (
            <form onSubmit={handleStartSync} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                81 ilin tamamı, Kadınlar 2. Ligi (16 Grup) ve Volleybox maç eşleştirmeleri baştan çekilecektir. İşlemi başlatmak için yetkili şifreyi girin:
              </p>

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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
              <div className="p-4 rounded-xl bg-sky-950/50 border border-sky-800/70 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300">
                    <RefreshCw size={13} className="animate-spin text-sky-400" />
                    Çekim İşlemi Devam Ediyor
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-sky-200 bg-sky-900/60 px-2 py-0.5 rounded-full border border-sky-700/60">
                    <Clock size={11} />
                    {formatDuration(elapsedSeconds)}
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-medium">
                  {activeStep || "81 İl ve Kadınlar 2. Ligi verileri çekiliyor..."}
                </p>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full animate-pulse w-2/3" />
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

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
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
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">Çekim Tamamlandı</div>
                  <p>{statusMessage}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}

          {phase === "cancelled" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">İşlem İptal Edildi</div>
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
                <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">Çekim Hatası</div>
                  <p>{statusMessage || errorMessage || "İşlem sırasında bir hata oluştu."}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setPhase("password");
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
            ? "bg-sky-600/90 hover:bg-sky-500 text-white border-sky-400/60 shadow-sm"
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
