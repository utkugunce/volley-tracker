"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  KeyRound,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit3,
  History,
  X,
  Save,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import { compareMatchDateTime } from "@/utils/calendar";
import { Match } from "@/types/fixture";
import { MatchOverride, AuditLogEntry } from "@/utils/overrides";

export default function AdminPage() {
  const [token, setToken] = useState<string>("");
  const [inputToken, setInputToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Veriler
  const [matches, setMatches] = useState<Match[]>([]);
  const [overrides, setOverrides] = useState<Record<string, MatchOverride>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"matches" | "audit">("matches");

  // Filtreler
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterOverriddenOnly, setFilterOverriddenOnly] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>("all");

  // Düzenleme Modalı
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [setScoresInput, setSetScoresInput] = useState<string>("");
  const [statusInput, setStatusInput] = useState<"upcoming" | "finished" | "postponed" | "live">("finished");
  const [reasonInput, setReasonInput] = useState<string>("");
  const [authorInput, setAuthorInput] = useState<string>("Admin");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Oturum açma kontrolü
  useEffect(() => {
    try {
      const savedToken = sessionStorage.getItem("volley_admin_token");
      if (savedToken) {
        setToken(savedToken);
        verifyAndFetchData(savedToken);
      }
    } catch {
      // ignore
    }
  }, []);

  const verifyAndFetchData = async (authToken: string) => {
    setLoading(true);
    setAuthError(null);

    try {
      // 1. Override verilerini ve audit logunu çek
      const overrideRes = await fetch("/api/admin/override", {
        headers: { "x-admin-token": authToken },
      });

      if (!overrideRes.ok) {
        if (overrideRes.status === 401) {
          throw new Error("Geçersiz ADMIN_TOKEN. Lütfen token bilginizi kontrol edin.");
        } else if (overrideRes.status === 503) {
          throw new Error("Sunucuda ADMIN_TOKEN ortam değişkeni tanımlı değil.");
        } else {
          throw new Error(`Yetkilendirme hatası: HTTP ${overrideRes.status}`);
        }
      }

      const overrideData = await overrideRes.json();
      setOverrides(overrideData.overrides || {});
      setAuditLogs(overrideData.audit_log || []);

      // 2. Tüm maçları çek
      const fixturesRes = await fetch("/api/fixtures?city=all");
      if (fixturesRes.ok) {
        const fixJson = await fixturesRes.json();
        setMatches(fixJson.matches || []);
      }

      setIsAuthenticated(true);
      try {
        sessionStorage.setItem("volley_admin_token", authToken);
      } catch {}
    } catch (err: any) {
      setAuthError(err.message || "Giriş başarısız");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setToken(inputToken.trim());
    verifyAndFetchData(inputToken.trim());
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken("");
    setInputToken("");
    try {
      sessionStorage.removeItem("volley_admin_token");
    } catch {}
  };

  // Düzenleme başlat
  const startEdit = (match: Match) => {
    const existing = overrides[match.id];
    setEditingMatch(match);
    setHomeScore(existing?.home_score !== undefined && existing?.home_score !== null ? String(existing.home_score) : (match.home_score !== undefined ? String(match.home_score) : ""));
    setAwayScore(existing?.away_score !== undefined && existing?.away_score !== null ? String(existing.away_score) : (match.away_score !== undefined ? String(match.away_score) : ""));
    setSetScoresInput(existing?.set_scores ? existing.set_scores.join(", ") : (match as any).set_scores?.join(", ") || "");
    setStatusInput(existing?.status || match.status || "finished");
    setReasonInput(existing?.reason || "TVF bülteni skor düzeltmesi");
    setAuthorInput(existing?.updated_by || "Admin");
    setFeedback(null);
  };

  // Kaydet
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    if (!reasonInput.trim()) {
      setFeedback({ type: "error", message: "Lütfen bir düzeltme gerekçesi belirtin." });
      return;
    }

    setSaveLoading(true);
    setFeedback(null);

    try {
      const setScoresArr = setScoresInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        match_id: editingMatch.id,
        home_score: homeScore !== "" ? Number(homeScore) : null,
        away_score: awayScore !== "" ? Number(awayScore) : null,
        set_scores: setScoresArr.length > 0 ? setScoresArr : undefined,
        status: statusInput,
        reason: reasonInput.trim(),
        updated_by: authorInput.trim() || "Admin",
      };

      const res = await fetch("/api/admin/override", {
        method: "POST",
        headers: {
          "Content-Transferred": "application/json",
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Kaydetme hatası");
      }

      // State güncelle
      setOverrides((prev) => ({
        ...prev,
        [editingMatch.id]: resJson.override,
      }));

      if (resJson.audit_entry) {
        setAuditLogs((prev) => [resJson.audit_entry, ...prev]);
      }

      // Maç listesindeki skoru anında güncelle
      setMatches((prev) =>
        prev.map((m) =>
          m.id === editingMatch.id
            ? {
                ...m,
                home_score: payload.home_score ?? undefined,
                away_score: payload.away_score ?? undefined,
                status: payload.status,
                set_scores: payload.set_scores,
                manual_override: true,
              }
            : m
        )
      );

      setFeedback({ type: "success", message: "Skor override başarıyla kaydedildi!" });
      setTimeout(() => {
        setEditingMatch(null);
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Kaydedilemedi" });
    } finally {
      setSaveLoading(false);
    }
  };

  // Override'ı Sil
  const handleDeleteOverride = async (matchId: string) => {
    if (!confirm("Bu maç için girilen manuel override'ı silmek istediğinize emin misiniz?")) return;

    setSaveLoading(true);
    try {
      const res = await fetch(`/api/admin/override?match_id=${encodeURIComponent(matchId)}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Silme hatası");
      }

      // State güncelle
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });

      // Maçı yeniden çek
      const fixturesRes = await fetch("/api/fixtures?city=all");
      if (fixturesRes.ok) {
        const fixJson = await fixturesRes.json();
        setMatches(fixJson.matches || []);
      }

      setEditingMatch(null);
      alert("Override başarıyla kaldırıldı.");
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Şehir listesi
  const cities = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (m.city) set.add(m.city);
    });
    return Array.from(set).sort();
  }, [matches]);

  // Filtrelenmiş maçlar
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filterOverriddenOnly && !overrides[m.id]) return false;
      if (selectedCity !== "all" && m.city !== selectedCity) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const home = (m.home_team || "").toLowerCase();
        const away = (m.away_team || "").toLowerCase();
        const id = (m.id || "").toLowerCase();
        const cat = (m.category || "").toLowerCase();
        const hall = (m.hall || "").toLowerCase();
        return home.includes(q) || away.includes(q) || id.includes(q) || cat.includes(q) || hall.includes(q);
      }
      return true;
    }).sort((a, b) => compareMatchDateTime(a, b, "asc"));
  }, [matches, overrides, filterOverriddenOnly, selectedCity, searchQuery]);

  // 1. Giriş Yapılmamışsa Token Formunu Göster
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Yönetim Paneli</h1>
              <p className="text-xs text-slate-400">ADMIN_TOKEN Doğrulaması</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            Maç skorlarını ve durumlarını manuel olarak düzeltmek için lütfen yönetici token bilginizi girin.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                ADMIN TOKEN
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Gizli admin token'ı..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  required
                />
                <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Doğrulanıyor..." : "Panele Giriş Yap"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Giriş Yapılmışsa Admin Paneli Arayüzünü Göster
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Üst Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
            title="Ana Sayfaya Dön"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-base tracking-tight">Altyapı Voleybol</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MANUEL DÜZELTME
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Veri Geçersiz Kılma ve Denetim Kaydı</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "matches"
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Maçlar ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <History size={13} />
            Denetim Günlüğü ({auditLogs.length})
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors text-xs"
            title="Oturumu Kapat"
          >
            Çıkış
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === "matches" ? (
          <div>
            {/* Filtre ve Arama Alanı */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 min-w-[240px] relative">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Takım adı, salon, lig veya maç ID ile ara..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="all">Tüm İller ({cities.length})</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setFilterOverriddenOnly(!filterOverriddenOnly)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    filterOverriddenOnly
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  Sadece Düzenlenenler ({Object.keys(overrides).length})
                </button>
              </div>
            </div>

            {/* Maç Tablosu */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700 uppercase font-mono text-[11px]">
                      <th className="py-3 px-3">İl / Lig / Kategori</th>
                      <th className="py-3 px-3">Tarih & Saat</th>
                      <th className="py-3 px-4">Ev Sahibi Takım</th>
                      <th className="py-3 px-2 text-center">Skor</th>
                      <th className="py-3 px-4">Deplasman Takım</th>
                      <th className="py-3 px-3 text-center">Durum</th>
                      <th className="py-3 px-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredMatches.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Aranan kritere uygun maç bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredMatches.map((m) => {
                        const hasOverride = !!overrides[m.id];
                        const ov = overrides[m.id];

                        return (
                          <tr
                            key={m.id}
                            className={`hover:bg-slate-800/50 transition-colors ${
                              hasOverride ? "bg-amber-950/20" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-white">{m.city}</div>
                              <div className="text-[10px] text-slate-400">{m.category}</div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-mono text-slate-300">{m.date}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{m.time}</div>
                            </td>
                            <td className="py-2.5 px-4 font-medium text-slate-200">
                              {m.home_team}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold text-sm">
                                {m.home_score !== undefined && m.home_score !== null ? m.home_score : "-"} :{" "}
                                {m.away_score !== undefined && m.away_score !== null ? m.away_score : "-"}
                              </span>
                              {hasOverride && (
                                <div className="text-[9px] text-amber-400 mt-0.5 font-sans font-bold">
                                  Override
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-slate-200">
                              {m.away_team}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  m.status === "finished"
                                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                                    : m.status === "live"
                                    ? "bg-red-950/80 text-red-400 border border-red-800 animate-pulse"
                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                                }`}
                              >
                                {m.status === "finished" ? "Bitti" : m.status === "live" ? "Canlı" : "Gelecek"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => startEdit(m)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-primary text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer"
                              >
                                <Edit3 size={12} />
                                Düzenle
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Denetim Günlüğü (Audit Log) */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <History size={18} className="text-primary" />
              Manuel Düzenleme Geçmişi (Audit Log)
            </h2>

            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Henüz kaydedilmiş bir manuel düzeltme bulunmuyor.
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.action === "create"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : log.action === "update"
                              ? "bg-blue-950 text-blue-400 border border-blue-800"
                              : "bg-red-950 text-red-400 border border-red-800"
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="font-mono text-slate-300 font-bold">
                          Maç #{log.match_id}
                        </span>
                        <span className="text-slate-400">({log.updated_by})</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString("tr-TR")}
                      </span>
                    </div>

                    <p className="text-slate-300">
                      <strong>Gerekçe:</strong> {log.reason}
                    </p>

                    {log.new_value && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        Yeni Değer: Skor {log.new_value.home_score} - {log.new_value.away_score} | Durum: {log.new_value.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* DÜZENLEME MODALI */}
      {editingMatch && (
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ev Sahibi Skor
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    placeholder="Örn: 3"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Deplasman Skor
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    placeholder="Örn: 1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary text-center font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Set Skorları (Virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={setScoresInput}
                  onChange={(e) => setSetScoresInput(e.target.value)}
                  placeholder="Örn: 25-18, 22-25, 25-20, 25-19"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Maç Durumu
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="finished">Bitti (finished)</option>
                    <option value="upcoming">Gelecek (upcoming)</option>
                    <option value="live">Canlı (live)</option>
                    <option value="postponed">Ertelendi (postponed)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Düzenleyen Kişi
                  </label>
                  <input
                    type="text"
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Düzeltme Gerekçesi (Audit Log) *
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Bu düzeltme neden yapıldı? (Örn: TVF bülteninde skor ters yazılmıştı)"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-primary resize-none"
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
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    {saveLoading ? "Kaydediliyor..." : "Kaydet (Override)"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
