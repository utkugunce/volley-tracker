"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
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
  RefreshCw,
  Clock,
  Users,
  UserPlus,
  Play,
} from "lucide-react";
import { compareMatchDateTime } from "@/utils/calendar";
import { Match } from "@/types/fixture";
import { MatchOverride, AuditLogEntry } from "@/utils/overrides";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { getSupabaseClient } from "@/utils/supabaseClient";

export default function AdminPage() {
  const [token, setToken] = useState<string>("");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Veriler
  const [matches, setMatches] = useState<Match[]>([]);
  const [overrides, setOverrides] = useState<Record<string, MatchOverride>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"matches" | "audit" | "users" | "live" | "notifications" | "sync">("matches");

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

  // Canlı Tarama (GitHub Actions / Local Scraper) Durumu
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    inProgress: boolean;
    message: string;
    type: "info" | "success" | "error";
    step?: string;
    remainingSeconds?: number;
  } | null>(null);

  // Kullanıcı Yönetimi
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserPassword, setNewUserPassword] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [userOperationLoading, setUserOperationLoading] = useState<boolean>(false);

  // Bildirim Yönetimi
  const [notificationStatus, setNotificationStatus] = useState<any>(null);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);

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

  // Bildirim durumu ve geçmişi yükle
  const fetchNotificationStatus = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      const token = session.data.session.access_token;

      const [statusRes, historyRes] = await Promise.all([
        fetch("/api/notifications/queue?action=status", {
          headers: { "x-admin-token": token },
        }),
        fetch("/api/notifications/queue?action=history&limit=10", {
          headers: { "x-admin-token": token },
        }),
      ]);

      const statusData = await statusRes.json();
      const historyData = await historyRes.json();

      setNotificationStatus(statusData);
      setNotificationHistory(historyData.history || []);
    } catch (error) {
      console.error("Bildirim durumu yükleme hatası:", error);
    }
  };

  useEffect(() => {
    if (token && activeTab === "notifications") {
      fetchNotificationStatus();
    }
  }, [token, activeTab]);

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

      // 3. Kullanıcı listesini çek
      try {
        const usersRes = await fetch("/api/admin/users", {
          headers: { "x-admin-token": authToken },
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch {
        // User endpoint might not be available yet
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

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase yapılandırılmamış");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error || !data.session) throw new Error(error?.message || "Supabase giriş başarısız.");
      setToken(data.session.access_token);
      await verifyAndFetchData(data.session.access_token);
    } catch (error: any) {
      setAuthError(error.message || "Supabase giriş başarısız.");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setToken("");
    try {
      sessionStorage.removeItem("volley_admin_token");
      // Also sign out from Supabase if session exists
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {}
  };

  // Yönetici Canlı Taramayı Tetikler (81 İl + Volleybox)
  const handleTriggerLiveSync = async () => {
    if (syncLoading || !token) return;
    setSyncLoading(true);
    setSyncStatus({
      inProgress: true,
      message: "Canlı tarama başlatılıyor...",
      type: "info",
      remainingSeconds: 75,
    });

    try {
      const res = await fetch("/api/fixtures?city=all&refresh=1", {
        headers: { "x-admin-token": token },
      });
      const json = await res.json();

      if (json.sync?.mode === "github_actions_dispatch") {
        setSyncStatus({
          inProgress: true,
          message: "GitHub Actions taraması başlatıldı. Canlı ilerleme takip ediliyor...",
          type: "info",
          remainingSeconds: 75,
        });

        let pollCount = 0;
        const maxPolls = 30;
        const intervalId = setInterval(async () => {
          pollCount++;
          try {
            const statusRes = await fetch("/api/sync/status", {
              headers: { "x-admin-token": token },
              cache: "no-store",
            });
            if (statusRes.ok) {
              const st = await statusRes.json();
              if (st.status === "completed") {
                clearInterval(intervalId);
                setSyncLoading(false);
                setSyncStatus({
                  inProgress: false,
                  message: "Canlı tarama başarıyla tamamlandı! Güncel veriler yüklendi.",
                  type: "success",
                });
                verifyAndFetchData(token);
                return;
              } else if (st.status === "in_progress") {
                setSyncStatus({
                  inProgress: true,
                  message: st.activeStep || "Veriler taranıyor...",
                  type: "info",
                  step: st.activeStep,
                  remainingSeconds: st.remainingSeconds,
                });
              }
            }
          } catch {}

          if (pollCount >= maxPolls) {
            clearInterval(intervalId);
            setSyncLoading(false);
            setSyncStatus({
              inProgress: false,
              message: "Tarama arka planda tamamlandı.",
              type: "info",
            });
            verifyAndFetchData(token);
          }
        }, 4000);
      } else {
        setSyncLoading(false);
        setSyncStatus({
          inProgress: false,
          message: json.sync?.message || "Fikstür verileri başarıyla yenilendi.",
          type: json.sync?.success ? "success" : "info",
        });
        verifyAndFetchData(token);
      }
    } catch (err: any) {
      setSyncLoading(false);
      setSyncStatus({
        inProgress: false,
        message: `Tarama başlatılamadı: ${err.message}`,
        type: "error",
      });
    }
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

  // Kullanıcı Yönetimi Fonksiyonları
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserOperationLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kullanıcı oluşturma hatası");
      }

      // Kullanıcı listesini güncelle
      const usersRes = await fetch("/api/admin/users", {
        headers: { "x-admin-token": token },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      setShowAddUserModal(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("viewer");
      alert("Kullanıcı başarıyla oluşturuldu.");
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setUserOperationLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: "admin" | "editor" | "viewer") => {
    if (!confirm(`Kullanıcının rolünü ${newRole} olarak değiştirmek istediğinize emin misiniz?`)) return;

    setUserOperationLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Rol güncelleme hatası");
      }

      // Kullanıcı listesini güncelle
      const usersRes = await fetch("/api/admin/users", {
        headers: { "x-admin-token": token },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      alert("Rol başarıyla güncellendi.");
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setUserOperationLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`${userEmail} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;

    setUserOperationLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kullanıcı silme hatası");
      }

      // Kullanıcı listesini güncelle
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("Kullanıcı başarıyla silindi.");
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setUserOperationLoading(false);
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
        const q = trLower(searchQuery).trim();
        const home = m.home_team || "";
        const away = m.away_team || "";
        const id = m.id || "";
        const cat = m.category || "";
        const hall = m.hall || "";
        return trIncludes(home, q) || trIncludes(away, q) || trIncludes(id, q) || trIncludes(cat, q) || trIncludes(hall, q);
      }
      return true;
    }).sort((a, b) => compareMatchDateTime(a, b, "asc"));
  }, [matches, overrides, filterOverriddenOnly, selectedCity, searchQuery]);

  // 1. Giriş Yapılmamışsa Supabase Login Formunu Göster
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Yönetim Paneli</h1>
              <p className="text-xs text-slate-400">Supabase Authentication</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            Maç skorlarını ve durumlarını manuel olarak düzeltmek için Supabase hesabınızla giriş yapın.
          </p>

          <form onSubmit={handleSupabaseLogin} className="space-y-4">
            <div>
              <label htmlFor="supabase-email" className="block text-xs font-semibold text-slate-400 mb-1.5">
                E-POSTA
              </label>
              <input
                id="supabase-email"
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="admin@example.com"
                aria-label="Supabase e-posta"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="supabase-password" className="block text-xs font-semibold text-slate-400 mb-1.5">
                ŞİFRE
              </label>
              <input
                id="supabase-password"
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="••••••••"
                aria-label="Supabase şifre"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                required
              />
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
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Giriş Yapılıyor..." : "Supabase ile Giriş Yap"}
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

        <div className="flex items-center gap-2" role="tablist" aria-label="Yönetim sekmeleri">
          <button
            type="button"
            onClick={handleTriggerLiveSync}
            disabled={syncLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            title="81 il bültenini ve Volleybox verilerini canlı tara"
          >
            <RefreshCw size={13} className={syncLoading ? "animate-spin" : ""} />
            <span>{syncLoading ? "Taranıyor..." : "Canlı Tara"}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "matches"}
            onClick={() => setActiveTab("matches")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "matches"
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Maçlar ({matches.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "audit"}
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "audit"
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <History size={13} aria-hidden="true" />
            Denetim Günlüğü ({auditLogs.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "users"
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Users size={13} aria-hidden="true" />
            Kullanıcılar ({users.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "live"}
            onClick={() => setActiveTab("live")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "live"
                ? "bg-red-500 text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Canlı Skor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "notifications"
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            📢 Bildirimler
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "sync"}
            onClick={() => setActiveTab("sync")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "sync"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <RefreshCw size={13} />
            Sync Geçmişi
          </button>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Yönetici oturumunu kapat"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            title="Oturumu Kapat"
          >
            Çıkış
          </button>
        </div>
      </header>

      {/* Canlı Senkronizasyon Durum Bildirimi (Yalnızca Admin Panelinde) */}
      {syncStatus && (
        <div
          className={`px-4 py-2 text-xs font-medium border-b animate-in fade-in duration-150 ${
            syncStatus.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-800"
              : syncStatus.type === "info"
              ? "bg-sky-950/90 text-sky-300 border-sky-800"
              : "bg-rose-950/90 text-rose-300 border-rose-800"
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {syncStatus.inProgress ? (
                <RefreshCw size={13} className="animate-spin text-sky-400 shrink-0" />
              ) : syncStatus.type === "success" ? (
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-rose-400 shrink-0" />
              )}
              <span>{syncStatus.message}</span>
              {syncStatus.inProgress && typeof syncStatus.remainingSeconds === "number" && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-sky-500/20 text-sky-200 border border-sky-400/40 px-2 py-0.5 rounded-full">
                  <Clock size={10} className="text-sky-300 shrink-0" />
                  <span>~{syncStatus.remainingSeconds} sn kaldı</span>
                </span>
              )}
            </div>
            <button
              onClick={() => setSyncStatus(null)}
              className="text-xs opacity-70 hover:opacity-100 transition-opacity px-1 cursor-pointer"
              title="Bildirimi Kapat"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === "matches" ? (
          <div>
            {/* Filtre ve Arama Alanı */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 min-w-[240px] relative">
                <Search size={16} aria-hidden="true" className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Takım adı, salon, lig veya maç ID ile ara..."
                  aria-label="Takım adı, salon, lig veya maç ID ile ara"
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  aria-label="Şehir filtrele"
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
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
        ) : activeTab === "audit" ? (
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
        ) : activeTab === "users" ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Kullanıcı Yönetimi
              </h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <UserPlus size={13} />
                Kullanıcı Ekle
              </button>
            </div>

            {users.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Henüz kayıtlı kullanıcı bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 font-semibold">Email</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-semibold">Rol</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-semibold">Kayıt Tarihi</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-semibold">Son Giriş</th>
                      <th className="text-right py-2 px-3 text-slate-400 font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-2 px-3 text-white">{user.email}</td>
                        <td className="py-2 px-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value as "admin" | "editor" | "viewer")}
                            disabled={userOperationLoading}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-primary"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString("tr-TR") : "-"}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("tr-TR") : "-"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={userOperationLoading}
                            className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === "live" ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Canlı Skor Yönetimi
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  Maçları düzenlemek için "Maçlar" tab'ına gidin
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Play size={32} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    Canlı Skor Sistemi
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Supabase Realtime ile anlık skor güncellemeleri aktif
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                    Realtime Bağlantı: Aktif
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                    Otomatik Güncelleme: Açık
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-slate-800/30 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">
                Nasıl Kullanılır?
              </h4>
              <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                <li>"Maçlar" tab'ına gidin</li>
                <li>Düzenlemek istediğiniz maçı bulun</li>
                <li>"Düzenle" butonuna tıklayın</li>
                <li>Skorları güncelleyin ve "Canlı" durumunu seçin</li>
                <li>Kaydedin - değişiklikler anında tüm kullanıcılara yansır</li>
              </ol>
            </div>
          </div>
        ) : activeTab === "notifications" ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                📢 Bildirim Yönetimi
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/notifications/queue?action=process", {
                        method: "POST",
                        headers: { "x-admin-token": token },
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert(`${data.processed} bildirim işlendi`);
                        setNotificationStatus(await fetchNotificationStatus());
                      }
                    } catch (error: any) {
                      alert(`Hata: ${error.message}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={13} />
                  İşle
                </button>
              </div>
            </div>

            {/* Kuyruk Durumu */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{notificationStatus?.pending || 0}</div>
                <div className="text-xs text-slate-400">Bekleyen</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{notificationStatus?.processing || 0}</div>
                <div className="text-xs text-slate-400">İşleniyor</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{notificationStatus?.sent || 0}</div>
                <div className="text-xs text-slate-400">Gönderildi</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{notificationStatus?.failed || 0}</div>
                <div className="text-xs text-slate-400">Başarısız</div>
              </div>
            </div>

            {/* Son Bildirimler */}
            <div className="bg-slate-800/30 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-3">Son Bildirimler</h4>
              {notificationHistory.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-4">
                  Henüz bildirim geçmişi yok
                </div>
              ) : (
                <div className="space-y-2">
                  {notificationHistory.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {item.payload.title}
                        </div>
                        <div className="text-slate-400 truncate">
                          {item.subscription_endpoint.substring(0, 30)}...
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-medium ${
                            item.status === "sent"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {item.status === "sent" ? "Gönderildi" : "Başarısız"}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(item.created_at).toLocaleTimeString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "sync" ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw size={18} className="text-emerald-400" />
                Sync Geçmişi
              </h2>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/sync/status");
                    const data = await res.json();
                    alert(`Son sync: ${data.lastSync ? new Date(data.lastSync).toLocaleString("tr-TR") : "Henüz sync yok"}`);
                  } catch (error: any) {
                    alert(`Hata: ${error.message}`);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} />
                Durum Sorgula
              </button>
            </div>

            <div className="bg-slate-800/30 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-3">Son Sync İşlemleri</h4>
              {auditLogs.filter(log => log.action.includes("sync") || log.action.includes("import")).length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-4">
                  Henüz sync geçmişi yok
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs
                    .filter(log => log.action.includes("sync") || log.action.includes("import"))
                    .slice(0, 10)
                    .map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {log.action}
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            {log.updated_by} • {new Date(log.timestamp).toLocaleString("tr-TR")}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                          log.action.includes("success") || log.action.includes("tamamlandı")
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {log.action.includes("success") || log.action.includes("tamamlandı") ? "Başarılı" : "Hata"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-4 bg-slate-800/30 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Veri Sağlığı İstatistikleri</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{matches.length}</div>
                  <div className="text-xs text-slate-400">Toplam Maç</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-400">
                    {matches.filter(m => m.status === "finished").length}
                  </div>
                  <div className="text-xs text-slate-400">Tamamlanan</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-400">
                    {matches.filter(m => m.status === "upcoming").length}
                  </div>
                  <div className="text-xs text-slate-400">Yaklaşan</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-400">
                    {matches.filter(m => m.status === "live").length}
                  </div>
                  <div className="text-xs text-slate-400">Canlı</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{auditLogs.length}</div>
                  <div className="text-xs text-slate-400">Audit Log</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{users.length}</div>
                  <div className="text-xs text-slate-400">Kullanıcı</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-400">
                    {Object.keys(overrides).length}
                  </div>
                  <div className="text-xs text-slate-400">Override</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* KULLANICI EKLEME MODALI */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Yeni Kullanıcı Ekle</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supabase Auth ile yeni kullanıcı oluştur
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label htmlFor="new-user-email" className="block text-xs font-semibold text-slate-300 mb-1">
                  Email
                </label>
                <input
                  id="new-user-email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="new-user-password" className="block text-xs font-semibold text-slate-300 mb-1">
                  Şifre
                </label>
                <input
                  id="new-user-password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 6 karakter"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="new-user-role" className="block text-xs font-semibold text-slate-300 mb-1">
                  Rol
                </label>
                <select
                  id="new-user-role"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "admin" | "editor" | "viewer")}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="viewer">Viewer (Sadece görüntüleme)</option>
                  <option value="editor">Editor (Düzenleme yapabilir)</option>
                  <option value="admin">Admin (Tam yetki)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={userOperationLoading}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  {userOperationLoading ? "Ekleniyor..." : "Kullanıcı Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    onChange={(e) => setStatusInput(e.target.value as any)}
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
