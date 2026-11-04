"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Square,
  RefreshCw,
  KeyRound,
  Eye,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Trash2,
  ArrowRight,
  Activity,
  Check,
} from "lucide-react";
import { toErrorLike } from "@/utils/errors";
import type {
  VolleyboxBotJobState,
  TournamentMissingSummary,
} from "@/app/api/admin/volleybox-bot/route";

export interface VolleyboxBotTabProps {
  token: string;
}

interface BotStatusResponse extends VolleyboxBotJobState {
  hasScreenshot?: boolean;
  screenshotMtime?: number;
  hasSavedAuth?: boolean;
  isLocalRuntime?: boolean;
}

interface CandidateSuggestion {
  team_id: string;
  name: string;
  url: string;
  city: string;
  score: number;
}

interface MissingTeamItem {
  team_name: string;
  city: string;
  city_slug: string;
  category: string;
  match_count: number;
  blocked_matches: string[];
  suggestions: CandidateSuggestion[];
}

interface QuarantinedMatchItem {
  id: string;
  city: string;
  city_slug: string;
  category: string;
  home_team: string;
  away_team: string;
  date: string;
  time: string;
  tournament_url: string;
  reason: string;
  failed_at: string;
  attempts: number;
}

interface BotHealthReport {
  generated_at: string;
  city_filter: string;
  total_candidates: number;
  ready_count: number;
  quarantined_count: number;
  missing_teams_count: number;
  blocked_by_missing_teams: number;
  health_score_pct: number;
  missing_teams: MissingTeamItem[];
  quarantined_matches: QuarantinedMatchItem[];
}

export function VolleyboxBotTab({ token }: VolleyboxBotTabProps) {
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [limit, setLimit] = useState<number>(25);
  const [delay, setDelay] = useState<number>(8);
  const [headless, setHeadless] = useState<boolean>(false);

  const [tournaments, setTournaments] = useState<TournamentMissingSummary[]>([]);
  const [totalMissing, setTotalMissing] = useState<number>(0);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const [botStatus, setBotStatus] = useState<BotStatusResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<boolean>(false);

  // Bot Sağlık & Ön Teşhis State'leri
  const [healthReport, setHealthReport] = useState<BotHealthReport | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [targetTeamIdInput, setTargetTeamIdInput] = useState<Record<string, string>>({});
  const [aliasSubmitting, setAliasSubmitting] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScreenshotError(false);
  }, [botStatus?.screenshotMtime]);

  const fetchHealthReport = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/volleybox-bot?action=health", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setHealthReport(data.report);
        }
      }
    } catch (err) {
      console.error("Sağlık raporu alınamadı:", err);
    }
  }, [token]);

  const runHealthCheck = async () => {
    if (!token || healthLoading) return;
    setHealthLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/volleybox-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "health_check" }),
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setHealthReport(data.report);
        setSuccessToast("Sağlık denetimi başarıyla tamamlandı!");
        setTimeout(() => setSuccessToast(null), 4000);
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg(`Sağlık denetimi hatası: ${toErrorLike(err).message}`);
    } finally {
      setHealthLoading(false);
    }
  };

  const handleQuickAlias = async (teamName: string, targetId: string) => {
    if (!token || !teamName || !targetId) return;
    setAliasSubmitting((prev) => ({ ...prev, [teamName]: true }));
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/volleybox-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "add_alias",
          team_name: teamName,
          target_team_id: targetId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.report) {
          setHealthReport(data.report);
        }
        setSuccessToast(data.message || `"${teamName}" başarıyla eşleştirildi!`);
        setTimeout(() => setSuccessToast(null), 4000);
        fetchPreview();
      } else {
        setErrorMsg(data.error || "Eşleştirme yapılamadı.");
      }
    } catch (err) {
      setErrorMsg(`Eşleştirme hatası: ${toErrorLike(err).message}`);
    } finally {
      setAliasSubmitting((prev) => ({ ...prev, [teamName]: false }));
    }
  };

  const handleRemoveFromQuarantine = async (matchId: string) => {
    if (!token || !matchId) return;
    try {
      const res = await fetch("/api/admin/volleybox-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "quarantine_remove", match_id: matchId }),
      });
      if (res.ok) {
        setSuccessToast("Maç karantinadan çıkarıldı.");
        setTimeout(() => setSuccessToast(null), 3000);
        fetchHealthReport();
        fetchPreview();
      }
    } catch (err) {
      setErrorMsg(`Karantina hatası: ${toErrorLike(err).message}`);
    }
  };

  const handleClearQuarantine = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/volleybox-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "quarantine_clear" }),
      });
      if (res.ok) {
        setSuccessToast("Tüm karantina listesi temizlendi.");
        setTimeout(() => setSuccessToast(null), 3000);
        fetchHealthReport();
        fetchPreview();
      }
    } catch (err) {
      setErrorMsg(`Karantina temizleme hatası: ${toErrorLike(err).message}`);
    }
  };

  const fetchPreview = useCallback(async () => {
    if (!token) return;
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/admin/volleybox-bot?action=preview&city=all", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments || []);
        setTotalMissing(data.total_missing || 0);
      }
    } catch (err) {
      console.error("Eksik maç önizlemesi alınamadı:", err);
    } finally {
      setPreviewLoading(false);
    }
  }, [token]);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/volleybox-bot?action=status", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data: BotStatusResponse = await res.json();
        setBotStatus(data);
      }
    } catch {
      // ignore transient poll errors
    }
  }, [token]);

  useEffect(() => {
    fetchPreview();
    fetchStatus();
    fetchHealthReport();
  }, [fetchPreview, fetchStatus, fetchHealthReport]);

  // Bot çalışırken her 1.2 saniyede bir, boşta iken her 5 saniyede bir durumu güncelle
  useEffect(() => {
    const isRunning = botStatus?.status === "running";
    const intervalMs = isRunning ? 1200 : 5000;
    const timer = setInterval(() => {
      fetchStatus();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [botStatus?.status, fetchStatus]);



  // Yeni log geldiğinde terminal kutusunu otomatik en alta kaydır
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [botStatus?.logs?.length]);

  const triggerBotAction = async (
    mode: "push" | "dry-run" | "login",
    overrideCity?: string
  ) => {
    if (!token || actionLoading) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const targetCity = overrideCity ?? selectedCity;
      if (overrideCity) {
        setSelectedCity(overrideCity);
      }
      const res = await fetch("/api/admin/volleybox-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "start",
          mode,
          city: targetCity,
          limit,
          delay,
          headless,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bot başlatılamadı.");
      }
      setBotStatus((prev) => ({ ...(prev || {}), ...data.state }));
      setTimeout(fetchStatus, 500);
    } catch (err) {
      setErrorMsg(toErrorLike(err).message || "İşlem başarısız");
    } finally {
      setActionLoading(false);
    }
  };

  const stopBot = async () => {
    if (!token || actionLoading) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/volleybox-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "stop" }),
      });
      const data = await res.json();
      if (data.state) {
        setBotStatus((prev) => ({ ...(prev || {}), ...data.state }));
      }
      fetchPreview();
    } catch (err) {
      setErrorMsg(toErrorLike(err).message || "İşlem başarısız");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSynced = async (citySlug: string, tournamentUrl?: string, matchId?: string) => {
    if (!token || actionLoading) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/volleybox-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "mark_synced",
          city_slug: citySlug,
          tournament_url: tournamentUrl,
          match_id: matchId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "İşlem başarısız.");
      }
      if (data.tournaments) {
        setTournaments(data.tournaments);
        setTotalMissing(data.tournaments.reduce((acc: number, t: TournamentMissingSummary) => acc + t.missing_count, 0));
      } else {
        fetchPreview();
      }
    } catch (err) {
      setErrorMsg(toErrorLike(err).message || "İşlem başarısız");
    } finally {
      setActionLoading(false);
    }
  };

  const isRunning = botStatus?.status === "running";
  const isLocalBlocked = botStatus?.isLocalRuntime === false;

  const visibleTournaments =
    selectedCity === "all"
      ? tournaments
      : tournaments.filter((t) => t.city_slug === selectedCity);

  // Benzersiz il listesi (Altyapı illeri)
  const cityOptions = Array.from(
    new Map(
      tournaments.map((t) => [
        t.city_slug,
        {
          slug: t.city_slug,
          name: t.city,
          count: tournaments
            .filter((x) => x.city_slug === t.city_slug)
            .reduce((acc, x) => acc + x.missing_count, 0),
        },
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, "tr"));

  const screenshotUrl =
    botStatus?.hasScreenshot && botStatus?.screenshotMtime
      ? `/api/admin/volleybox-bot?action=screenshot&token=${encodeURIComponent(token)}&t=${botStatus.screenshotMtime}`
      : null;

  return (
    <div className="space-y-5">
      {/* ÜST KONTROL VE KONFİGÜRASYON KARTI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              🤖 Volleybox Otomatik Maç Ekleme Botu
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isRunning
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                    : botStatus?.status === "completed"
                      ? "bg-done/20 text-done border-done/40"
                      : botStatus?.status === "failed"
                        ? "bg-red-950/80 text-red-300 border-red-500/40"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {isRunning
                  ? "🟢 ÇALIŞIYOR"
                  : botStatus?.status === "completed"
                    ? "✅ TAMAMLANDI"
                    : botStatus?.status === "stopped"
                      ? "⏹️ DURDURULDU"
                      : botStatus?.status === "failed"
                        ? "❌ HATA"
                        : "⏸️ HAZIR"}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sitemizde yer alan ancak Volleybox&apos;ta henüz bulunmayan maçları seçilen turnuvanın formuna otomatik doldurup ekler.
            </p>
            <p className="text-[11px] text-amber-400/90 font-medium mt-1 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Volleybox kuralı: Geçmiş tarihli maçlar yalnızca skoru girilmişse kuyruğa dahil edilir; skorsuz geçmiş maçlar atlanır.</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => triggerBotAction("login")}
              disabled={isRunning || actionLoading || isLocalBlocked}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title={
                isLocalBlocked
                  ? "Bot sadece yerel ortamda (localhost) çalışır"
                  : "Volleybox hesabınıza tarayıcıda giriş yapıp oturumu kaydeder"
              }
            >
              <KeyRound size={14} className="text-amber-400" />
              {botStatus?.hasSavedAuth ? "Oturumu Yenile" : "Volleybox Girişi Aç"}
            </button>

            <button
              type="button"
              onClick={() => triggerBotAction("dry-run")}
              disabled={isRunning || actionLoading || isLocalBlocked}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title={isLocalBlocked ? "Bot sadece yerel ortamda (localhost) çalışır" : undefined}
            >
              <Eye size={14} className="text-sky-400" />
              Önizleme Çalıştır (--dry-run)
            </button>

            {isRunning ? (
              <button
                type="button"
                onClick={stopBot}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Square size={14} />
                Botu Durdur
              </button>
            ) : (
              <button
                type="button"
                onClick={() => triggerBotAction("push")}
                disabled={actionLoading || totalMissing === 0 || isLocalBlocked}
                className="px-4 py-2 rounded-xl bg-done hover:bg-done/90 text-done-fg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                title={isLocalBlocked ? "Bot sadece yerel ortamda (localhost) çalışır" : undefined}
              >
                <Play size={14} />
                Botu Başlat (Maçları Ekle)
              </button>
            )}
          </div>
        </div>

        {isLocalBlocked && (
          <div className="mb-4 p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-xs flex items-start gap-2.5">
            <span className="text-base shrink-0">💻</span>
            <div>
              <p className="font-bold text-white">Yerel Çalışma Modu (Localhost)</p>
              <p className="mt-0.5 text-sky-300/90 leading-relaxed">
                Volleybox botu Playwright tarayıcı otomasyonu kullandığı için canlı sunucuda (Render) çalıştırılamaz. Botu çalıştırmak için projeyi yerel bilgisayarınızda açabilir (<code className="px-1.5 py-0.5 rounded bg-sky-900/60 font-mono text-white">npm run dev</code> ardından <code className="px-1.5 py-0.5 rounded bg-sky-900/60 font-mono text-white">http://localhost:3000/admin</code>) veya doğrudan terminalinizden <code className="px-1.5 py-0.5 rounded bg-sky-900/60 font-mono text-white">npm run push:volleybox</code> komutunu verebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-2"
          >
            <AlertTriangle size={15} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FİLTRE VE PARAMETRE SEÇİCİLER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div>
            <label
              htmlFor="vb-bot-city"
              className="block text-[11px] font-bold text-slate-400 uppercase mb-1"
            >
              Hedef İl / Turnuva
            </label>
            <select
              id="vb-bot-city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="all">Tüm Altyapı İlleri ({totalMissing} Eksik Maç)</option>
              {cityOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.count} Eksik Maç)
                </option>
              ))}
              <optgroup label="🏙️ Altyapı İlleri (81 İl)">
                {cityOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} ({c.count} Eksik Maç)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label
              htmlFor="vb-bot-limit"
              className="block text-[11px] font-bold text-slate-400 uppercase mb-1"
            >
              Tek Seferde Maksimum Maç
            </label>
            <select
              id="vb-bot-limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              disabled={isRunning}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value={1}>1 Maç (Hızlı Test)</option>
              <option value={5}>5 Maç</option>
              <option value={10}>10 Maç</option>
              <option value={25}>25 Maç (Önerilen)</option>
              <option value={50}>50 Maç</option>
              <option value={100}>100 Maç</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="vb-bot-delay"
              className="block text-[11px] font-bold text-slate-400 uppercase mb-1"
            >
              Maçlar Arası Bekleme Süresi
            </label>
            <select
              id="vb-bot-delay"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              disabled={isRunning}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value={5}>5 Saniye (Hızlı)</option>
              <option value={8}>8 Saniye (Önerilen - Güvenli)</option>
              <option value={12}>12 Saniye (Yavaş)</option>
              <option value={15}>15 Saniye (Maksimum Koruma)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="vb-bot-headless"
              className="block text-[11px] font-bold text-slate-400 uppercase mb-1"
            >
              Tarayıcı Penceresi Modu
            </label>
            <select
              id="vb-bot-headless"
              value={headless ? "headless" : "headed"}
              onChange={(e) => setHeadless(e.target.value === "headless")}
              disabled={isRunning}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="headed">Görünür Pencere + Panel Canlı Ekranı</option>
              <option value="headless">Arka Plan (Sadece Panel Canlı Ekranı)</option>
            </select>
          </div>
        </div>

        {/* HIZLI KAPSAM & LİG FİLTRESİ (PILLS) */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Filtre:</span>
          <button
            type="button"
            onClick={() => setSelectedCity("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCity === "all"
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            Tümü ({totalMissing})
          </button>
        </div>

        {/* ANLIK İŞLEM VE SAYAÇLAR */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Kuyruktaki Eksik Maç</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">{totalMissing}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Bu Çalışmada Eklenen</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {botStatus?.addedCount ?? 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Atlanan / Mevcut</div>
            <div className="text-lg font-black text-sky-400 mt-0.5">
              {botStatus?.skippedCount ?? 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Volleybox Oturumu</div>
            <div className="text-xs font-bold mt-1.5 flex items-center gap-1.5">
              {botStatus?.hasSavedAuth ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Kayıtlı Profil Mevcut
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1">
                  <AlertTriangle size={14} /> Giriş Yapılması Önerilir
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ŞU ANKİ İŞLEM BANDI */}
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-400 shrink-0">Anlık Durum:</span>
            <span className="text-xs font-semibold text-emerald-300 truncate">
              {botStatus?.currentStep || "Hazır"}
            </span>
          </div>
          {botStatus?.updatedAt && (
            <span className="text-[10px] text-slate-500 shrink-0">
              Son güncelleme: {new Date(botStatus.updatedAt).toLocaleTimeString("tr-TR")}
            </span>
          )}
        </div>
      </div>

      {/* BAŞARI BİLDİRİMİ (TOAST) */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🩺 BOT SAĞLIK & ÖN TEŞHİS PANELİ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              Bot Sağlık &amp; Ön Teşhis Merkezi
              {healthReport && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Sağlık Skoru: %{healthReport.health_score_pct}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tarayıcıyı açmadan saniyeler içinde tüm maçları denetler; eksik takımları tespit eder ve hatalı eşleşmeleri karantinaya alır.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {healthReport && healthReport.quarantined_count > 0 && (
              <button
                type="button"
                onClick={handleClearQuarantine}
                className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Karantinaya alınmış tüm maç kayıtlarını sıfırlar"
              >
                <Trash2 size={13} />
                Karantinayı Temizle ({healthReport.quarantined_count})
              </button>
            )}

            <button
              type="button"
              onClick={runHealthCheck}
              disabled={healthLoading}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow"
            >
              <RefreshCw size={13} className={healthLoading ? "animate-spin" : ""} />
              {healthLoading ? "Denetleniyor..." : "Hızlı Sağlık Taraması Yap"}
            </button>
          </div>
        </div>

        {/* SAĞLIK METRİKLERİ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              Gönderime %100 Hazır
            </div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {healthReport ? healthReport.ready_count : "—"}
              {healthReport && healthReport.total_candidates > 0 && (
                <span className="text-xs text-slate-400 font-normal ml-1">
                  (%{healthReport.health_score_pct})
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              Eksik Takım Eşleşmesi
            </div>
            <div className="text-lg font-black text-amber-400 mt-0.5">
              {healthReport ? healthReport.missing_teams_count : "—"}
              <span className="text-xs text-slate-400 font-normal ml-1">
                ({healthReport ? healthReport.blocked_by_missing_teams : 0} maç bekliyor)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-red-500/30 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
              Karantinadaki Maçlar
            </div>
            <div className="text-lg font-black text-red-400 mt-0.5">
              {healthReport ? healthReport.quarantined_count : 0}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Son Denetim Zamanı</div>
            <div className="text-xs font-semibold text-slate-300 mt-1 truncate">
              {healthReport?.generated_at
                ? new Date(healthReport.generated_at).toLocaleTimeString("tr-TR")
                : "Henüz yapılmadı"}
            </div>
          </div>
        </div>

        {/* EKSİK TAKIMLAR VE HIZLI EŞLEŞTİRME TABLOSU */}
        {healthReport && healthReport.missing_teams && healthReport.missing_teams.length > 0 && (
          <div className="mt-5 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Eşleştirilmesi Gereken Takımlar ({healthReport.missing_teams.length} Takım)
              </h4>
              <span className="text-[11px] text-slate-400">
                Aşağıdaki önerilerden birine tıklayarak veya ID girerek tek tıkla eşleştirebilirsiniz.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                    <th className="py-2 pr-3">Sitedeki Takım Adı</th>
                    <th className="py-2 px-3">İl / Kategori</th>
                    <th className="py-2 px-2 text-center">Engellenen Maç</th>
                    <th className="py-2 px-3">Önerilen Volleybox Takımları</th>
                    <th className="py-2 px-3">Hedef Takım ID</th>
                    <th className="py-2 pl-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {healthReport.missing_teams.slice(0, 20).map((t) => {
                    const currentTargetId =
                      targetTeamIdInput[t.team_name] ?? (t.suggestions[0]?.team_id || "");
                    const isSubmitting = aliasSubmitting[t.team_name] || false;

                    return (
                      <tr key={t.team_name} className="hover:bg-slate-800/30">
                        <td className="py-2.5 pr-3 font-semibold text-white">
                          <span className="text-amber-400 mr-1.5">🚩</span>
                          {t.team_name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {t.city} • <span className="text-slate-500">{t.category}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                            {t.match_count} maç
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {t.suggestions.length > 0 ? (
                              t.suggestions.map((s) => (
                                <button
                                  key={s.team_id || s.name}
                                  type="button"
                                  onClick={() =>
                                    setTargetTeamIdInput((prev) => ({
                                      ...prev,
                                      [t.team_name]: s.team_id,
                                    }))
                                  }
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all cursor-pointer ${
                                    currentTargetId === s.team_id
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                                  }`}
                                  title={`${s.name} (${s.city || "Türkiye"}) - Tıkla ve seç`}
                                >
                                  <span>{s.name}</span>
                                  <span className="text-[9px] text-slate-400">
                                    (ID: {s.team_id})
                                  </span>
                                  {currentTargetId === s.team_id && (
                                    <Check size={11} className="text-emerald-400 shrink-0" />
                                  )}
                                </button>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">
                                Otomatik öneri bulunamadı
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={currentTargetId}
                            onChange={(e) =>
                              setTargetTeamIdInput((prev) => ({
                                ...prev,
                                [t.team_name]: e.target.value.trim(),
                              }))
                            }
                            placeholder="Örn: 40248"
                            className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <button
                            type="button"
                            disabled={!currentTargetId || isSubmitting}
                            onClick={() => handleQuickAlias(t.team_name, currentTargetId)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer shadow"
                            title="Bu takımı Volleybox eşleştirmelerine ekler"
                          >
                            <Sparkles size={11} />
                            {isSubmitting ? "Ekleniyor..." : "Eşleştir"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {healthReport.missing_teams.length > 20 && (
                <div className="p-2 text-center text-xs text-slate-500 border-t border-slate-800">
                  ... ve {healthReport.missing_teams.length - 20} eksik takım daha.
                </div>
              )}
            </div>
          </div>
        )}

        {/* KARANTİNA YÖNETİMİ */}
        {healthReport && healthReport.quarantined_matches && healthReport.quarantined_matches.length > 0 && (
          <div className="mt-5 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} />
                Karantinaya Alınan Maçlar ({healthReport.quarantined_matches.length} Maç)
              </h4>
              <span className="text-[11px] text-slate-400">
                Form hatası veya takım uyuşmazlığı nedeniyle atlanan maçlar.
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {healthReport.quarantined_matches.map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-950/80 border border-red-500/20 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span className="text-slate-400">[{q.city}]</span>
                      <span>
                        {q.home_team} vs {q.away_team}
                      </span>
                      <span className="text-slate-500 text-[11px]">({q.date})</span>
                    </div>
                    <div className="text-[11px] text-red-300/90 mt-0.5 truncate">
                      Gerekçe: {q.reason} (Deneme: {q.attempts})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFromQuarantine(q.id)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    title="Bu maçı karantinadan çıkarır ve bir sonraki bot çalışmasında yeniden denenmesini sağlar"
                  >
                    <ArrowRight size={11} />
                    Karantinadan Çıkar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CANLI İZLEME PANELİ: TERMİNAL GÜNLÜĞÜ + CANLI TARAYICI EKRANI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SOL: CANLI KONSOL / LOG AKIŞI */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal size={15} className="text-emerald-400" />
              Canlı İşlem Günlüğü (Adım Adım Bot Hareketleri)
            </h3>
            <span className="text-[11px] text-slate-400">
              {botStatus?.logs?.length || 0} satır
            </span>
          </div>

          <div
            ref={logContainerRef}
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs h-80 overflow-y-auto space-y-1.5"
          >
            {!botStatus?.logs || botStatus.logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4">
                <Terminal size={24} className="mb-2 opacity-50" />
                <p>Bot başlatıldığında hangi turnuvaya girdiği, hangi takımları ve skorları seçtiği burada saniye saniye listelenir.</p>
              </div>
            ) : (
              botStatus.logs.map((log, lIdx) => (
                <div
                  key={`${log.id}-${lIdx}`}
                  className={`leading-relaxed break-words ${
                    log.level === "success"
                      ? "text-emerald-300 font-semibold"
                      : log.level === "warn"
                        ? "text-amber-300"
                        : log.level === "error"
                          ? "text-red-300 font-semibold"
                          : "text-slate-300"
                  }`}
                >
                  <span className="text-slate-500 mr-2 select-none">[{log.timestamp}]</span>
                  <span>{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SAĞ: CANLI TARAYICI EKRAN GÖRÜNTÜSÜ */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Eye size={15} className="text-sky-400" />
              Canlı Tarayıcı Görünümü (Volleybox Form Ekranı)
            </h3>
            {isRunning && (
              <span className="text-[10px] font-bold text-emerald-400 animate-pulse">
                ● Canlı Güncelleniyor
              </span>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl h-80 flex items-center justify-center overflow-hidden relative">
            {screenshotUrl && !screenshotError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={screenshotUrl}
                alt="Volleybox Bot Canlı Tarayıcı Görünümü"
                className="w-full h-full object-contain"
                onError={() => setScreenshotError(true)}
              />
            ) : (
              <div className="text-slate-500 text-xs text-center px-6">
                <Eye size={24} className="mx-auto mb-2 opacity-50" />
                <p>
                  Bot çalışmaya başladığında Volleybox üzerinde açtığı sayfa ve doldurduğu maç ekleme formu canlı olarak burada görüntülenir.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALT BÖLÜM: VOLLEYBOX'TA EKSİK MAÇ KUYRUĞU */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              📋 Volleybox&apos;ta Eksik Olan Maçlar Kuyruğu ({visibleTournaments.reduce((a, t) => a + t.missing_count, 0)} Maç)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              İstediğiniz ilin yanındaki &quot;Bu İli Gönder&quot; butonuna basarak sadece o turnuvanın eksik maçlarını ekleyebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchPreview}
            disabled={previewLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={previewLoading ? "animate-spin" : ""} />
            Listeyi Yenile
          </button>
        </div>

        {visibleTournaments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            🎉 Seçilen kapsamda Volleybox&apos;ta eksik olan hiçbir maç bulunmuyor!
          </div>
        ) : (
          <div className="space-y-4">
            {visibleTournaments.map((t, tIdx) => (
              <div
                key={`${t.tournament_url}-${t.category}-${tIdx}`}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white">
                      🏆 {t.city === t.category ? t.category : `${t.city} — ${t.category}`}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {t.missing_count} Eksik Maç
                    </span>
                    <a
                      href={t.tournament_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                    >
                      Volleybox Sayfası <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={actionLoading || isRunning}
                      onClick={() => handleMarkSynced(t.city_slug, t.tournament_url)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                      title="Bu turnuvanın maçlarını Volleybox'a eklenmiş olarak işaretler ve kuyruktan çıkarır"
                    >
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      Tümünü Eklendi Say
                    </button>

                    <button
                      type="button"
                      disabled={isRunning || actionLoading || isLocalBlocked}
                      onClick={() => triggerBotAction("push", t.city_slug)}
                      className="px-3 py-1.5 rounded-lg bg-done hover:bg-done/90 text-done-fg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      title={isLocalBlocked ? "Bot sadece yerel ortamda (localhost) çalışır" : undefined}
                    >
                      <Play size={12} />
                      Sadece {t.city} Maçlarını Ekle ({t.missing_count})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                        <th className="py-2 pr-3">Tarih / Saat</th>
                        <th className="py-2 px-3">Ev Sahibi</th>
                        <th className="py-2 px-2 text-center">Set</th>
                        <th className="py-2 px-3">Deplasman</th>
                        <th className="py-2 px-3">Tur / Grup</th>
                        <th className="py-2 px-3">Saha</th>
                        <th className="py-2 pl-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {t.matches.slice(0, 15).map((m, mIdx) => (
                        <tr key={`${t.tournament_slug}-${m.id}-${mIdx}`} className="hover:bg-slate-900/60">
                          <td className="py-2 pr-3 font-mono text-slate-300 whitespace-nowrap">
                            {m.date} <span className="text-slate-500">{m.time}</span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-white">{m.home_team}</td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                m.score !== "0-0"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {m.score}
                            </span>
                            {m.forfeit && (
                              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                Hükmen
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-white">{m.away_team}</td>
                          <td className="py-2 px-3 text-slate-300">{m.group}</td>
                          <td className="py-2 px-3 text-slate-400">{m.hall}</td>
                          <td className="py-2 pl-3 text-right">
                            <button
                              type="button"
                              disabled={actionLoading || isRunning}
                              onClick={() => handleMarkSynced(t.city_slug, t.tournament_url, m.id)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-400 border border-slate-700 hover:border-emerald-500/40 text-[11px] font-medium transition-colors cursor-pointer"
                              title="Bu maçı eklendi olarak işaretleyip kuyruktan çıkar"
                            >
                              ✓ Eklendi Say
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {t.matches.length > 15 && (
                    <div className="text-[11px] text-slate-500 mt-2">
                      ... ve bu turnuvada {t.matches.length - 15} eksik maç daha bulunuyor.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
