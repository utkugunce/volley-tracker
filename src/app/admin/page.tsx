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
import { toErrorLike } from "@/utils/errors";
import { ClubMembersAdmin } from "@/components/club/ClubMembersAdmin";
import type { NotificationHistory } from "@/utils/notificationQueue";

/** /api/admin/users yanıtındaki kullanıcı kaydı. */
interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  created_at?: string;
  last_sign_in_at?: string;
  role_updated_at?: string;
}

/** /api/notifications/queue?action=status yanıtı. */
interface NotificationQueueStatus {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

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
  const [activeTab, setActiveTab] = useState<"matches" | "audit" | "users" | "notifications" | "sync" | "teams" | "clubs">("matches");

  // Filtreler
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterOverriddenOnly, setFilterOverriddenOnly] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [teamCategoryFilter, setTeamCategoryFilter] = useState<"all" | "altyapı" | "2lig">("all");

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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserPassword, setNewUserPassword] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [userOperationLoading, setUserOperationLoading] = useState<boolean>(false);

  // Bildirim Yönetimi
  const [notificationStatus, setNotificationStatus] = useState<NotificationQueueStatus | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);

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
      // Supabase session token'ı Authorization header'ı olarak gönder
      const overrideRes = await fetch("/api/admin/override", {
        headers: { 
          "Authorization": `Bearer ${authToken}`
        },
      });

      if (!overrideRes.ok) {
        if (overrideRes.status === 401) {
          throw new Error("Yetkisiz işlem. Lütfen tekrar giriş yapın.");
        } else if (overrideRes.status === 503) {
          throw new Error("Sunucu yapılandırması eksik.");
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
          headers: { 
            "Authorization": `Bearer ${authToken}`
          },
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
    } catch (err) {
      setAuthError(toErrorLike(err).message || "Giriş başarısız");
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
    } catch (error) {
      setAuthError(toErrorLike(error).message || "Supabase giriş başarısız.");
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
    } catch (err) {
      setSyncLoading(false);
      setSyncStatus({
        inProgress: false,
        message: `Tarama başlatılamadı: ${toErrorLike(err).message}`,
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
    setSetScoresInput(existing?.set_scores ? existing.set_scores.join(", ") : match.set_scores?.join(", ") || "");
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
    } catch (err) {
      setFeedback({ type: "error", message: toErrorLike(err).message || "Kaydedilemedi" });
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
    } catch (err) {
      alert(`Hata: ${toErrorLike(err).message}`);
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
    } catch (err) {
      alert(`Hata: ${toErrorLike(err).message}`);
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
    } catch (err) {
      alert(`Hata: ${toErrorLike(err).message}`);
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
    } catch (err) {
      alert(`Hata: ${toErrorLike(err).message}`);
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

  // 2. Lig takımları listesi (kadinlar_2_lig.json'den çekilen - 166 takım)
  const LIG_TEAMS = useMemo(() => [
    "07 MEGA SPOR", "52 ÇAMLIK SPOR", "ADANA B.ŞEHİR BLD. SPOR", "ADANA SPORCU EĞİTİM SPOR",
    "ADANA T.D.S.", "AHMET HAMDİ TANPINAR ORTAOKULU", "AKÇA GRUP OSMANCIK BLD.", "AKDENİZ BİLGİ SPOR",
    "AKHİSAR GÜCÜ", "AL-KA ALTIN KANATLAR", "ALP SPOR", "ALTAY", "ALTINAY SPOR", "ALTINYURT",
    "ANADOLU MARMARA", "ANKARA BAROSU", "ANKARA DSİ", "ANTALYASPOR", "ANTEPİA", "ARKAS SPOR",
    "ARNAVUTKÖY BLD. SPOR", "ASYA KARTALLARI KAMARİN SPOR", "ATAŞEHİR KARTALLARI", "AVRUPA VOLEYBOL GELİŞİM",
    "AYDIN BÜYÜKŞEHİR BELEDİYE SPOR", "AYVALIK GELİŞİM SPOR", "BAHÇELİEVLER BLD. SPOR",
    "BAHÇEŞEHİR KOLEJİ AYVALIKSPOR", "BAHÇEŞEHİR KOLEJİ DALAMAN BLD.", "BALIKESİR B.ŞEHİR BLD. SPOR",
    "BALIKESİR DSİ", "BANDIRMA ÇELİK SPOR", "BAŞAKŞEHİR VOLEYBOL", "BAŞKENT ARMA", "BAŞKENT ZİRVE",
    "BAYRAKLI BLD. SPOR", "BAYRAMPAŞA BELEDİYE SPOR", "BEŞİKDÜZÜ SPOR", "BEŞİKTAŞ BJK KABATAŞ VAKFI ÖZEL OKULLARI",
    "BEYLİKDÜZÜ BEYKENT", "BOLU ATATÜRK ANADOLU LİSESİ", "BURSA FETHİYE 1973 SPOR", "BÜYÜK KARTEPE SPOR",
    "BÜYÜK REŞİTPAŞA ORTAOKULU", "BÜYÜKÇEKMECE VOLEYBOL AKADEMİ", "CADENCE BOYA GÖLCÜK İHSANİYE",
    "CAN MİLAN ATLETİK", "ÇABA SPOR", "ÇAN KALE SPOR", "ÇANAKKALE ONSEKİZ MART ÜNİVERSİTESİ",
    "ÇATALCA BLD. SPOR", "ÇAYYOLU SPORTSA", "ÇEKMEKÖY İSTANBUL SPOR", "ÇENGELKÖY VOLEYBOL",
    "ÇERKEZKÖY VOLEYBOL AKADEMİ", "ÇORLU BLD. SPOR", "ÇORUM ARENA SPOR", "DENİZLİ B.ŞEHİR BLD. SPOR",
    "DEV ATAŞEHİR", "DİYARBAKIR B.ŞEHİR BLD. SPOR", "DİYARBAKIR VOLEYBOLCULAR", "DOĞU AKADEMİ",
    "DÜZCE 1907 SPOR", "DÜZCE VOLEYBOL", "EFOR GENÇLİK", "EKER SPOR", "ELAZIĞ BLD. SPOR",
    "ELİT AKDENİZ", "ENGLISH TIME SPOR", "EREĞLİ SÜMER SPOR", "ERYAMAN GELİŞİM", "ESKİŞEHİR PEYMAN SPOR",
    "ESKİŞEHİR ŞEHİR KOLEJİ EĞT. KÜLTÜR", "ETİMESGUT BLD. GELİŞİM", "EYÜPSULTAN BLD. SPOR",
    "FENERBAHÇE MEDICANA", "FINDIKLI 1974", "FORLİVA KAYSERİ ATLETİK SPOR", "FORZA SPOR",
    "GALATASARAY", "GAZİANTEP BLD. SPOR", "GAZİEMİR BLD. SPOR", "GEBZE GENÇLİK VE SPOR", "GELİŞİM KOLEJİ",
    "GEMLİK İSTİKLAL SPOR", "GÖLBAŞI İNCEK SPOR", "GÖZTEPE", "GÜNGÖREN VOLEYBOL", "HAKKARİ SPORTİF FAALİYETLER",
    "HATAY VOLEYBOL", "HOPA BELEDİYE", "İBB SPOR KULÜBÜ", "İLBANK", "İSTANBUL ANKA",
    "İSTANBUL ATEŞ SPOR", "İSTANBUL BİZİMKENT SPOR", "KAHRAMANMARAŞ BÜYÜKŞEHİR BLD.", "KARABÜK GENÇLİK SPOR",
    "KARACABEY BELEDİYE", "KARŞIYAKA", "KARTAL ANADOLU", "KARTAL BELEDİYESPOR", "KAVAK SPOR",
    "KAYSERİ CİMNASTİK SPOR", "KAYSERİ VOLEYBOL", "KIRKLARELİ GENÇLİK SPOR", "KOCAELİ NİCOMEDİA AKADEMİ",
    "KOCAELİ VOLEYBOL AKADEMİ", "KOÇ SPOR", "KONELSİS ENERJİ SAMSUNSPOR", "KUZEY YILDIZLARI SPEED",
    "MALATYA VOLEYBOL", "MANİSA BÜYÜKŞEHİR BELEDİYE SPOR", "MARDİN DERİK ROTA", "MARGENÇ",
    "MARMARA AKADEMİ", "MARMARİS BLD. SPOR", "MEGARON İNŞAAT", "MEHMET EGE İNŞAAT İNEGÖL ORHANİYE VOLEYBOL",
    "MERİNOS VOLEYBOL", "MEV TOROS SPOR", "MG SPOR", "MISIROĞLU BEYTEPE", "MSE FİLO ELAZIĞ EKOL SPOR",
    "MUĞLA SPORTİF AKADEMİ", "MUĞLATÜRK FETHİYE ZİRVE", "MUŞ 1071 AKADEMİİ", "NİCER HOTEL VOLEYBOL",
    "NOVA SPOR", "OKURA LOJİSTİK MERSİN İHTİSAS", "PARS AKADEMİ", "POLAT GROUP DİDİM BELEDİYESPOR",
    "PTT", "RİZE DNZ SPOR", "ROBERTEAM", "ROTA KOLEJİ", "SERDİVAN BLD. SPOR", "SİLİVRİ ÇAĞRIBEY",
    "SİLOPİ BLD. SPORTİF FAALİYETLER", "SİLOPİ GELİŞİM FAALİYETLERİ", "SİVEREK BELEDİYE SPOR",
    "SİYAH KUĞULAR VOLEYBOL", "SMAÇ SPOR", "SÖKE BELEDİYE SALDOS VOLEYBOL", "SULTANGAZİ BLD. SPOR",
    "TARSUS AMERİKAN KOLEJİ", "TED ANKARA KOLEJLİLER", "TEK METAL SPORTİF", "TEMİZ ENERJİ BİRLİĞİ",
    "TOROSLAR BLD.", "TOYZZ SHOP DİNAMO SPOR", "TURGUTLU BLD. KÜLTÜR SANAT", "TÜRK HAVA YOLLARI",
    "TVF SPOR LİSESİ", "ÜNSPED", "VEGA ATLETİK", "VENÜS SPOR", "VOLKAN GÜÇ SPOR",
    "YALOVA ÇİFTLİKKÖY BLD. SPOR", "YEDİDAĞ SPOR", "YENİŞEHİR GENÇLERBİRLİĞİ", "YESS POOL ANTALYA AÇI KOLEJİ",
    "YEŞİL BAYRAMİÇ", "YEŞİLYURT", "YUNUSEMRE BLD. SPOR", "ZEUGMA GAZİANTEP SPOR"
  ], []);

  // Altyapı takımları listesi (81 il verilerinden çekilen - 464 takım)
  const ALTYAPI_TEAMS = useMemo(() => [
    "07 Alya Spor U16", "07 Anka Spor Kulübü U16", "07 Mega Spor Kulübü U16", "07 Mega Spor Kulübü U18",
    "07 Zenit Spor Kulübü U16", "07 Zenit Spor Kulübü U18", "19 Mayıs Gençlik Ve Spor U18", "1922 Salihli Spor Kulübü U18",
    "2014 Maltepe Spor Kulübü U18", "23 Nisan Spor Kulübü U16", "23 Nisan Spor Kulübü U18", "35 Yıldız Spor Kulübü U18",
    "AB Voleybol Akademi U16", "Ada Yıldızları Spor Kulübü U18", "Ahmet Hamdi Tanpınar Ortaokulu SK U16",
    "Ahmet Hamdi Tanpınar Ortaokulu SK U16 B", "Ahmet Hamdi Tanpınar Ortaokulu SK U18", "Akademi Atletik Spor U18",
    "Akademi16 Spor Kulübü U16", "Akçakoca Orhan Özdemir Fen Lisesi Spor Kulübü U16", "Akdeniz Bilgi Spor Kulübü U16",
    "Akdeniz Bilgi Spor Kulübü U18", "Akhisar İlçe Spor Kulübü U18", "Akhisar Spor Kulübü U18", "Akhisargücü Spor Kulübü U18",
    "Aktif Nesil Spor Kulübü U16", "Alanya Belediyespor U16", "Alfa Gaziemir Voleybol Spor Kulübü U16",
    "Alfa Karşıyaka Voleybol Spor Kulübü U16", "Alfa Spor Kulübü U18", "Alp Voleybol Kulübü U18",
    "Alsancak Spor Kulübü U18", "Altekma SK U18", "Altın Manşet Spor Kulübü U16", "Altınordu Voleybol - B U18",
    "Altınordu Voleybol U16", "Altınyurt Spor Kulübü U18", "Anadolu Birlik Spor Kulübü U16", "Anadolu Kolej Spor Kulübü U16",
    "Anadolu Kolej Spor Kulübü U18", "Anadolu Marmara SK U18", "Anadolu Smaç Spor U18", "Anadolu Üniversitesi GSK U18",
    "Anadolu Üniversitesi Spor Kulübü U16", "Anadolu Voleybol Akademi SK U18", "Anka Spor Kulübü U18",
    "Ankara Büyükşehir Belediyesi Spor Kulübü U16", "Ankara Büyükşehir Belediyesi Spor Kulübü U18", "Ankara DSİ GSK U16",
    "Ankara DSİ GSK U18", "Antakya Güneş Spor Kulübü - B U18", "Antakya Güneş Spor Kulübü U18",
    "Antalya 1907 Spor Kulübü U16", "Antalya 1907 Spor Kulübü U18", "Antalya Açı Koleji Spor Kulübü U16",
    "Antalya Açı Koleji Spor Kulübü U18", "Antalya DSİ Spor Kulübü U16", "Antalya Şimşek GSK U16",
    "Antalya Şimşek GSK U18", "Antalyaspor U16", "Antalyaspor U18", "Arena Anka Spor Kulübü U18",
    "Arges Voleybol Spor Kulübü U16", "Arkas Spor Kulübü - B U18", "Arkas Spor Kulübü U16", "As Spor Kulübü U16",
    "Atakum Atılım Spor Kulübü U18", "Ataşehir Yıldızları U18", "Atayıldız Spor U18", "Ateş Spor Kulübü - B U18",
    "Ateş Spor Kulübü U18", "Aydın Büyükşehir Belediyespor U18", "Aydın DSİ Spor Kulübü U18",
    "Ayvalık Gelişim Spor Kulübü U18", "Ayvalıkgücü Belediye SK U16", "Ayvalıkspor - B U16", "Ayvalıkspor U16",
    "Bahçelievler Belediyespor ll U18", "Bahçelievler Belediyespor U18", "Bal Spor Kulübü U18",
    "Balıkesir Büyükşehir Belediyespor - B U18", "Balıkesir Büyükşehir Belediyespor U18", "Balıkesir DSİ Spor U18",
    "Balıkesir EKA Spor Kulubü U16", "Balıkesir Voleybol Akademi Spor Kulübü U18", "Balkan Yeşilbağlar Spor U18",
    "Bandırma Bordo Spor Kulübü U16", "Bandırma Çelikspor U18", "Bandırma Voleybol Spor Kulübü U16",
    "Başakşehir Belediyesi SK U18", "Başarır Performans Spor Kulübü U18", "Başkent Arma Spor U16",
    "Bayraklı Belediyesi Spor Kulübü U16", "Bayraklı Belediyesi Spor Kulübü U18", "Bergama Belediyesi Spor Kulübü U18",
    "Beşiktaş U16", "Beşiktaş U18", "Beyhan Rıfat Çıkılıoğlu Anadolu Lisesi Spor Kulübü U16",
    "Beykoz Voleybol Kulübü U18", "Beylerbeyi Spor Kulübü U18", "Beylikdüzü Voleybol 2021 U18",
    "Biga Ada Spor U16", "Biga Ada Spor U18", "Biga Çiçeklidedespor U16", "Biga Gelişim Voleybol Kulübü U16",
    "Bizimkent Voleybol Spor Kulübü U16", "Bizimkent Voleybol Spor Kulübü U16 - B", "Bizimkent Voleybol Spor Kulübü U18",
    "Blok Akademi Spor Kulübü U18", "Blue Wolves Volleyball U18", "Boğaziçi Akademi Spor Kulübü U18",
    "Bor Belediyespor U18", "Bursa Ayyıldız Spor Kulübü U16", "Bursa Ayyıldız Spor Kulübü U18",
    "Bursa Büyükşehir Belediyespor U16", "Bursa Büyükşehir Belediyespor U18", "Bursa Fethiye 1973 Spor Kulübü - A U16",
    "Bursa Fethiye 1973 Spor Kulübü - B U16", "Bursa Fethiye 1973 Spor Kulübü U18", "Bursa Genç Saray Spor Kulübü U16",
    "Bursa Genç Saray Spor Kulübü U18", "Bursa Koç Spor Kulübü - A U18", "Bursa Koç Spor Kulübü - B U18",
    "Bursa Koç Spor Kulübü U16", "Çaba Spor Kulübü - A U18", "Çaba Spor Kulübü U16", "Çağdaş Spor Kulübü - B U16",
    "Çağdaş Spor Kulübü U16", "ÇAĞLAYANCERİT GENÇLİK SK", "Çan Kale Spor Kulübü U16", "Çanakkale Barbarosspor U16",
    "Çanakkale Belediyespor - B U16", "Çanakkale Belediyespor U16", "Çekmeköy İstanbul SK - B U18",
    "Çekmeköy İstanbul SK U18", "Çengelköy Voleybol Kulübü U18", "Çerkezköy Voleybol Akademi Spor Kulübü U16",
    "Çınar Akademi Spor Kulübü - B U16", "Çınar Akademi Spor Kulübü U16", "Çınar Akademi Spor Kulübü U18",
    "ÇOMÜ Spor Kulübü - B U16", "ÇOMÜ Spor Kulübü U16", "Çorlu Belediyesi Spor Kulübü U16", "Çorlu GSB Spor Kulübü U16",
    "Çorlu Yıldırım Spor Kulübü - B U16", "Çorlu Yıldırım Spor Kulübü U16", "Dalton Koleji Spor Kulübü U16",
    "Dalton Koleji Spor Kulübü U18", "Defne Lider Akademi Spor Kulübü U18", "Değerli Zamanlar Spor Kulübü U18",
    "Dev Adım Spor Kulübü U18", "Dev Anadolu Yıldızları U18", "Dev Ataşehir Spor U18", "DHMİ Spor Kulübü U16",
    "Dinamo Spor U18", "Dokuz Eylül Voleybol U16", "Dokuz Eylül Voleybol U18", "Doruk Voleybol Spor Kulübü U16",
    "Doruk Voleybol Spor Kulübü U18", "Dost Spor - C U18", "Dost Spor U16", "Dost Spor U18",
    "Dörtyol Dokuz Ocak Spor Kulübü U18", "DSİ Nilüfer Spor Kulübü U16", "DSİ Nilüfer Spor Kulübü U18",
    "Düzce 1907 Spor Kulübü U16", "Düzce 1907 Spor Kulübü U18", "Düzce Atletik Spor Kulübü U16",
    "Düzce Atletik Spor Kulübü U18", "Düzce Ay Spor U16", "Düzce Can Sportif Spor Kulübü U16",
    "Düzce Gençlik Spor U16", "Düzce UltrAslan Spor Kulübü U16", "Düzce UltrAslan Spor Kulübü U18",
    "Düzce Voleybol SK - A U16", "Düzce Voleybol SK - A U18", "EBA Spor U16", "Eceabat Spor Kulübü U16",
    "Eceabat Spor Kulübü U18", "Eczacıbaşı - A U16", "Eczacıbaşı - B U16", "Eczacıbaşı U18",
    "Edremit Belediyesi Altınoluk Spor Kulübü - B U16", "Edremit Belediyesi Altınoluk Spor Kulübü U18",
    "Efeler Altın Smaç Spor Kulübü U18", "Efor Gençlik Spor Kulübü U18", "Eker Spor Kulübü - A U16",
    "Eker Spor Kulübü - B U16", "Eker Spor Kulübü U18", "Ekol Spor Kulubü U18", "Elit Akdeniz Spor Kulübü U16",
    "Elit Akdeniz Spor Kulübü U18", "Erciyes Aslan Spor Kulübü - B U16", "Ergene Voleybol Spor Kulübü U16",
    "Erse Spor Kulübü U16", "Erse Spor Kulübü U18", "Eryaman Gelişim SK U16", "Eryaman Gelişim SK U18",
    "Es Akademi Spor Kulübü U18", "Es Güneş Spor Kulübü U16", "Es Voleybol Akademi Spor Kulübü - A U16",
    "Es Voleybol Akademi Spor Kulübü - A U18", "Es Voleybol Akademi Spor Kulübü - B U16",
    "Es Voleybol Akademi Spor Kulübü - B U18", "ES Voleybol U16", "ES Voleybol U18",
    "Eskişehir Ata Spor Kulübü - B U16", "Eskişehir Ata Spor Kulübü U16", "Eskişehir Ata Spor Kulübü U18",
    "Eskişehir Çağdaş Kolejliler Spor Kulübü U16", "Eskişehir Çağdaş Kolejliler Spor Kulübü U18",
    "Eskişehir DSİ Bentspor U16", "Eskişehir DSİ Bentspor U18", "Eskişehir Peyman SK U18",
    "Eskişehir Türk Telekom Spor Kulübü - B U16", "Eskişehir Türk Telekom Spor Kulübü U16",
    "Eskişehir Türk Telekom Spor Kulübü U18", "Eskişehir Voleybol Spor Kulübü U16", "Eskişehir Yıldız Spor Kulübü U16",
    "Eskişehir Yıldız Spor Kulübü U18", "Esnova Spor Kulübü U16", "Evola Spor Kulübü - B U16",
    "Evola Spor Kulübü U16", "Evola Spor Kulübü U18", "Eyüpsultan Belediyesi SK - A U16",
    "Eyüpsultan Belediyesi SK - B U16", "Eyüpsultan Belediyesi SK U18", "Fenerbahçe - A U16",
    "Fenerbahçe - B U16", "Fenerbahçe U18", "First Spor Kulübü U16", "FMV Işık Spor Kulübü U18",
    "Galatasaray U16", "Galatasaray U18", "Gazipaşa Gençlerbirliği Spor Kulübü U16",
    "Gazipaşa Gençlerbirliği Spor Kulübü U18", "Geleceğe Dönüş Spor Kulübü U18", "Gelişim Koleji SK U16",
    "Gelişim Koleji SK U18", "GENÇLİK SK", "Gençlik Ve Spor İl Müdürlüğü Spor Kulübü",
    "Genia İz Akademi Spor Kulübü U16", "Gökçeada Spor Kulübü U16", "Göksu Atletik Spor Kulübü U16",
    "Gönen Karşıyakaspor U16", "Gönen Karşıyakaspor U18", "Göztepe SK - A U18", "Göztepe SK - B U16",
    "Göztepe SK - B U18", "Güner Karakaya Spor Kulübü U16", "Güner Karakaya Spor Kulübü U18",
    "Güngören Voleybol Kulübü U18", "Günyaka Spor U16", "Günyaka Spor U18", "Güzelyalı Spor Kulübü U18",
    "Hakan Akışık Spor Kulübü U16", "Hakan Akışık Spor Kulübü U18", "Hatay Voleybol Spor Kulübü U18",
    "Hatay Yıldızlar Spor Kulübü U18", "Hekimoğlu GCT Bursa Voleybol Kulübü U16", "Hürriyet Spor Kulübü U16",
    "İBB Spor Kulübü U16", "İBB Spor Kulübü U18", "İlbank - B U16", "İlbank U16", "İlbank U18",
    "İlkkıvılcım Havza SK U18", "İnegöl Orhaniye Voleybol SK U18", "İskenderun 12 Dev Adam Spor Kulübü U18",
    "İskenderun Tan Spor Kulübü U18", "İskenderun Voleybol Akademi Spor Kulübü U18", "İskenderun Yurdum Spor U18",
    "İstanbul Anadolu Olimpik SK U18", "İstanbul Anka Spor U18", "İstanbul Göztepe Akademi Spor Kulübü U18",
    "İstanbul Marmara Spor Kulübü U18", "İstanbul Vadi Spor Kulübü U18", "İTÜ Geliştirme Vakfı Okulları SK U18",
    "İZEGE Spor Kulübü U18", "İzmir Altınay Spor Kulübü - B U18", "İzmir Altınay Spor Kulübü U16",
    "İzmir DSİ Spor U16", "İzmir DSİ Spor U18", "İzmirspor U16", "İzmirspor U18",
    "İzzet Öksüzkaya Orta Okulu Gençlik ve Spor Kulübü U16", "İzzet Öksüzkaya Orta Okulu Gençlik ve Spor Kulübü U18",
    "Kapaklı Site Spor - B U16", "Kapaklı Site Spor U16", "Karayolları Spor Kulübü U16",
    "Karayolları Spor Kulübü U18", "Karşıyaka SK - B U18", "Kartal Yıldızları Spor Kulübü U18",
    "Kayseri Atletik Spor Kulübü U18", "Kayseri Bahçelievler Spor Kulübü U16", "Kayseri Cimnastik Spor Kulübü - B U16",
    "Kayseri Cimnastik Spor Kulübü U18", "Kemer Sarp Spor Kulübü U16", "Kepez Spor Kulübü U16",
    "Kepez Spor Kulübü U18", "Kestel Belediye 1952 Spor Kulübü U16", "Kestel Belediye 1952 Spor Kulübü U18",
    "Koru Akademi Spor Kulübü - B U18", "Koru Akademi Spor Kulübü U16", "Koru Akademi Spor Kulübü U18",
    "Kuzey Ege Gelişim Spor Kulübü U18", "Kuzey Yıldızları Spor Kulübü - A U18", "Kuzey Yıldızları Spor Kulübü - B U18",
    "KVK Voleybol Kulübü - B U18", "KZY Bornova Spor Kulübü - B U18", "KZY Bornova Spor Kulübü U16",
    "KZY Spor Kulübü U16", "Liva Volley Spor Kulübü U16", "Luna Spor Kulübü U16", "Luna Spor Kulübü U18",
    "Maç Akademi Spor Kulübü U16", "Maç Akademi Spor Kulübü U18", "Maç Sayısı Spor Kulübü U18",
    "Manavgat Belediyespor U16", "Manisa Büyükşehir Belediyespor Kulübü U18", "Marmara Akademi Atletik Spor Kulübü U16",
    "Marmara Akademi Atletik Spor Kulübü U18", "Marmara Elit Spor Kulübü U18", "Mas Smaç Spor Kulübü U18",
    "Mavi Kurtlar GSK - A U16", "Mavi Yıldızlar Spor Kulübü U18", "Mavişehir Koleji Spor Kulübü U18",
    "Mavişehir Spor Kulübü U16", "Mavişehir Spor Kulübü U18", "Mersin İhtisas Spor Kulübü U18",
    "Meryem Boz Spor Kulübü - B U16", "Meryem Boz Spor Kulübü U16", "Meryem Boz Spor Kulübü U18",
    "Mesut Kökel Spor Kulübü U16", "Metin Küçükkenar Fırtına16 Spor Kulübü U16",
    "Metin Küçükkenar Fırtına16 Spor Kulübü U18", "MEV Toros Spor Kulübü U18", "Mezitli Belediyesi Gençlik ve Spor Kulübü U18",
    "MG Spor Kulübü U16", "MG Spor Kulübü U18", "Milan Atletik U16", "Milan Atletik U18",
    "Monza Spor Kulübü - B U18", "Monza Spor Kulübü U16", "Murat Akar Spor Kulübü U18",
    "Muratlı Yıldız 2012 Spor Kulübü U16", "Narlıdere Belediyesi Spor Kulübü U16", "Nehir Spor Kulübü U16",
    "Nehir Spor Kulübü U18", "Net Voleybol Akademi Spor Kulübü U16", "Niğde Sev Voleybol Kulübü U18",
    "Nilüfer Belediye Spor Kulübü U18", "Nilüfer Beşevler Spor Kulübü U16", "Nilüfer Olimpik Spor Kulübü U16",
    "Nilüfer Olimpik Spor Kulübü U18", "Nova Spor Kulübü U18", "ODTÜ GV Niğde Okulları Spor Kulübü U18",
    "Oksijen Spor Kulübü U16", "Oksijen Spor Kulübü U18", "Olimpia 2017 Spor Kulübü U16",
    "Orhangazi Voleybol Ve Dağcılık Spor Kulübü U16", "Öncü Yıldız Spor Kulübü U16", "Özateş SK U18",
    "Özay Voleybol Spor Kulübü U16", "Özay Voleybol Spor Kulübü U18", "Parion Spor Kulübü U16",
    "Parla Voleybol Kulübü - A U16", "Parla Voleybol Kulübü - B U16", "Parla Voleybol Kulübü U18",
    "Pegasus Spor Kulübü U16", "Pegasus Spor Kulübü U18", "Pendik Akademi Voleybol Spor Kulübü U18",
    "Pendik Güzelyalı Voleybol Kulübü U18", "PTT Spor U16", "PTT Spor U18", "Robert Spor Kulübü U16",
    "Salihli Değerli Zamanlar Spor Kulübü U18", "Samandağ Anka Spor Kulübü U18", "Samsun Volley Team U18",
    "Samsunspor U18", "Sarıgöl Akademi Spor Kulübü U18", "Sarıyer Belediyesi Spor Kulübü U16",
    "Sarıyer Konak Spor Kulübü U18", "Serinyol Yıldızlar Spor Kulübü U18", "Set 59 Spor Kulübü U16",
    "SET UP Spor Kulübü U18", "Silivri Çağrıbey SK U16", "Silivri Çağrıbey SK U18",
    "Sistem Eğitim Spor Kulübü U16", "Smaç SK U16", "Smyrna Voleybol Kulübü - B U18",
    "Smyrna Voleybol Kulübü U18", "Soma Belediye Spor Kulübü U18", "Soma İlçe Spor Kulübü U18",
    "Söke Voleybol Spor Kulübü U18", "SUSURLUK GENÇLERBİRLİĞİ EĞİTİM SPOR", "Süleymanpaşa Spor Kulübü - B U16",
    "Süleymanpaşa Spor Kulübü U16", "Süreyyapaşa Gençlik Ve Spor Kulübü U18", "Şehir Koleji Eğitim Kültür SK U16",
    "Şehir Koleji Eğitim Kültür SK U18", "Tarsus Amerikan Koleji U18", "Tarsus Gelecek Spor Kulübü U18",
    "TED Ankara Kolejliler U16", "TED Ankara Kolejliler U18", "TEİAŞ Spor Kulübü U16",
    "Tekirdağ Basket Spor Kulübü U16", "Tekirdağ Marmara Spor Kulübü U16", "Tekirdağ Voleybol Akademi Spor Kulübü U16",
    "Tekirdağ Voleybol İhtisas Kulübü U16", "Temiz Enerji Birliği Spor Kulübü U18",
    "Terme Gençlik Ve Spor İlçe Müdürlüğü SK U18", "Torbalı Gelişim Spor Kulübü U16",
    "Toroslar Belediye Spor Kulübü U18", "Trakya Olimpia Akademi Spor Kulübü U16", "Turgutlu Belediyespor U18",
    "Turuncu Spor Kulübü U18", "Tuzla Mercan Spor Kulübü U18", "Tuzla New Spor Kulübü U18",
    "Tuzla Rekor Spor Kulübü - B U18", "Tuzla Rekor Spor Kulübü U18", "Türk Hava Yolları SK - A U16",
    "Türk Hava Yolları SK - B U16", "Türk Hava Yolları SK U18", "TVF Spor Lisesi - B U16",
    "TVF Spor Lisesi U16", "TVF Spor Lisesi U18", "Ufuk Üniversitesi Üç Pas Spor Kulübü U16",
    "UVM Akademi Spor Kulübü U16", "Uzay 35 Voleybol Kulübü - B U18", "Ümraniye Belediyesi Spor Kulübü U16",
    "Ümraniye Belediyesi Spor Kulübü U18", "Ünsped Spor Kulübü U16", "Ünsped Spor Kulübü U18",
    "VakıfBank - A U16", "VakıfBank - B U16", "Vakıfbank İzmir U16", "VakıfBank U18",
    "Venüs Spor Kulübü U16", "Venüs Spor Kulübü U18", "Vera Spor Kulübü U16", "Vezirköprü Gençlik Spor Kulübü U18",
    "Vipark Gençlik Ve Spor U18", "Volkan Güç Spor Kulübü - B U18", "Volkan Güç Spor Kulübü U16",
    "Yalova Atakent Spor Kulübü U18", "Yalova Elit Akademi Spor Kulübü U16", "Yalova Gençlik ve Spor İl Müdürlüğü SK U16",
    "Yalova Voleybol Spor Kulübü - A U18", "Yalova Voleybol Spor Kulübü - B U18", "Yalova Voleybol Spor Kulübü U16",
    "Yedidağspor - A U18", "Yenişehir Gençlerbirliği Spor Kulübü U18", "Yeşil Bayramiç SK U18",
    "Yeşilyurt Spor Kulübü U16", "Yeşilyurt Spor Kulübü U18", "Yıldızkent Fatih Korgancı Spor Kulübü U16",
    "Yıldızlar Arena", "Yıldızlar Samandağ Spor Kulübü U18", "Yunusemre Belediyespor U18",
    "Yükseliş Akademi Spor Kulübü U18", "Zeren Spor Kulübü U16", "Zeren Spor Kulübü U18", "Zirve 35 Spor Kulübü U18"
  ], []);

  // Takım listesi (A-Z sıralı, kategorili)
  const teamsByCategory = useMemo(() => {
    // Doğrudan tanımlı listeleri kullan (maç verilerine bakmadan)
    const altyapıSet = new Set(ALTYAPI_TEAMS);
    const ligSet = new Set(LIG_TEAMS);

    return {
      altyapı: Array.from(altyapıSet).sort((a, b) => trLower(a).localeCompare(trLower(b))),
      lig: Array.from(ligSet).sort((a, b) => trLower(a).localeCompare(trLower(b))),
    };
  }, [ALTYAPI_TEAMS, LIG_TEAMS]);

  // Filtrelenmiş takımlar
  const filteredTeams = useMemo(() => {
    const allTeams = teamCategoryFilter === "all" 
      ? [...teamsByCategory.altyapı, ...teamsByCategory.lig]
      : teamCategoryFilter === "altyapı" 
      ? teamsByCategory.altyapı
      : teamsByCategory.lig;

    if (!searchQuery.trim()) return allTeams;

    const q = trLower(searchQuery).trim();
    return allTeams.filter(team => trIncludes(team, q));
  }, [teamsByCategory, teamCategoryFilter, searchQuery]);

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
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
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
              className="w-full py-2.5 px-4 rounded-xl bg-done hover:bg-done/90 text-done-fg font-semibold text-sm shadow transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
      </main>
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
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Maçlar ({matches.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "teams"}
            onClick={() => setActiveTab("teams")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "teams"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Users size={13} aria-hidden="true" />
            Takımlar ({teamsByCategory.altyapı.length + teamsByCategory.lig.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "audit"}
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "audit"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
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
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Users size={13} aria-hidden="true" />
            Kullanıcılar ({users.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "notifications"
                ? "bg-selected-strong text-white shadow-sm"
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
                ? "bg-done text-done-fg shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <RefreshCw size={13} />
            Sync Geçmişi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "clubs"}
            onClick={() => setActiveTab("clubs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "clubs"
                ? "bg-done text-done-fg shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Users size={13} />
            Kulüp Hesapları
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-primary text-slate-200 hover:text-primary-fg border border-slate-700 transition-all cursor-pointer"
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
              <History size={18} className="text-ink-2" />
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
        ) : activeTab === "teams" ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-ink-2" />
                Takım Listesi
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={teamCategoryFilter}
                  onChange={(e) => setTeamCategoryFilter(e.target.value as "all" | "altyapı" | "2lig")}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="all">Tümü ({teamsByCategory.altyapı.length + teamsByCategory.lig.length})</option>
                  <option value="altyapı">Altyapı ({teamsByCategory.altyapı.length})</option>
                  <option value="2lig">2. Lig ({teamsByCategory.lig.length})</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
              <div className="relative">
                <Search size={16} aria-hidden="true" className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Takım ara..."
                  aria-label="Takım ara"
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {filteredTeams.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {searchQuery ? "Arama kriterine uygun takım bulunamadı." : "Takım listesi boş."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTeams.map((team, index) => (
                  <div
                    key={`${team}-${index}`}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                        {team.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{team}</div>
                        <div className="text-[10px] text-slate-400">
                          {LIG_TEAMS.includes(team) ? "2. Lig" : "Altyapı"}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {team.length} karakter
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-800 text-center">
              <div className="text-xs text-slate-400">
                Toplam {filteredTeams.length} takım gösteriliyor
              </div>
            </div>
          </div>
        ) : activeTab === "clubs" ? (
          <ClubMembersAdmin token={token} />
        ) : activeTab === "users" ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-ink-2" />
                Kullanıcı Yönetimi
              </h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-fg font-bold rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
                        await fetchNotificationStatus();
                      }
                    } catch (error) {
                      alert(`Hata: ${toErrorLike(error).message}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-fg font-bold rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
                  } catch (error) {
                    alert(`Hata: ${toErrorLike(error).message}`);
                  }
                }}
                className="px-3 py-1.5 bg-done hover:bg-done/90 text-done-fg rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
                  <div className="text-lg font-bold text-warn">
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
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-fg font-bold text-xs font-semibold shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
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
      )}
    </div>
  );
}
