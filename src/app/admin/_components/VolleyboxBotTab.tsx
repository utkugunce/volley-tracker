"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, RefreshCw, KeyRound, Eye, Terminal, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
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

export function VolleyboxBotTab({ token }: VolleyboxBotTabProps) {
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [limit, setLimit] = useState<number>(10);
  const [delay, setDelay] = useState<number>(8);
  const [headless, setHeadless] = useState<boolean>(false);

  const [tournaments, setTournaments] = useState<TournamentMissingSummary[]>([]);
  const [totalMissing, setTotalMissing] = useState<number>(0);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const [botStatus, setBotStatus] = useState<BotStatusResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<boolean>(false);

  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScreenshotError(false);
  }, [botStatus?.screenshotMtime]);

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
  }, [fetchPreview, fetchStatus]);

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

  const isRunning = botStatus?.status === "running";
  const visibleTournaments =
    selectedCity === "all"
      ? tournaments
      : tournaments.filter((t) => t.city_slug === selectedCity);

  // Benzersiz il listesi
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
  );

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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => triggerBotAction("login")}
              disabled={isRunning || actionLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Volleybox hesabınıza tarayıcıda giriş yapıp oturumu kaydeder"
            >
              <KeyRound size={14} className="text-amber-400" />
              {botStatus?.hasSavedAuth ? "Oturumu Yenile" : "Volleybox Girişi Aç"}
            </button>

            <button
              type="button"
              onClick={() => triggerBotAction("dry-run")}
              disabled={isRunning || actionLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
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
                disabled={actionLoading || totalMissing === 0}
                className="px-4 py-2 rounded-xl bg-done hover:bg-done/90 text-done-fg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play size={14} />
                Botu Başlat (Maçları Ekle)
              </button>
            )}
          </div>
        </div>

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
              <option value="all">Tüm İller ({totalMissing} Eksik Maç)</option>
              {cityOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.count} Eksik Maç)
                </option>
              ))}
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
              botStatus.logs.map((log) => (
                <div
                  key={log.id}
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
            {visibleTournaments.map((t) => (
              <div
                key={t.tournament_url}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white">
                      🏆 {t.city} — {t.category}
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

                  <button
                    type="button"
                    disabled={isRunning || actionLoading}
                    onClick={() => triggerBotAction("push", t.city_slug)}
                    className="px-3 py-1.5 rounded-lg bg-done hover:bg-done/90 text-done-fg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Play size={12} />
                    Sadece {t.city} Maçlarını Ekle ({t.missing_count})
                  </button>
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
                        <th className="py-2 pl-3">Saha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {t.matches.slice(0, 15).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-900/60">
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
                          <td className="py-2 pl-3 text-slate-400">{m.hall}</td>
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
