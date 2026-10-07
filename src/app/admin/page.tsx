"use client";

import React, { useState, useEffect, useMemo } from "react";
import { compareMatchDateTime } from "@/utils/calendar";
import { Match } from "@/types/fixture";
import { MatchOverride, AuditLogEntry } from "@/utils/overrides";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { getSupabaseClient } from "@/utils/supabaseClient";
import { toErrorLike } from "@/utils/errors";
import { ClubMembersAdmin } from "@/components/club/ClubMembersAdmin";
import type { NotificationHistory } from "@/utils/notificationQueue";
import type { AdminSyncStatus, AdminTab, AdminUser, NotificationQueueStatus } from "./_components/types";
import { TEAMS_BY_CATEGORY } from "./_components/teamLists";
import { AdminLoginForm } from "./_components/AdminLoginForm";
import { AdminHeader } from "./_components/AdminHeader";
import { SyncStatusBanner } from "./_components/SyncStatusBanner";
import { MatchesTab } from "./_components/MatchesTab";
import { AuditLogTab } from "./_components/AuditLogTab";
import { TeamsTab } from "./_components/TeamsTab";
import { UsersTab } from "./_components/UsersTab";
import { NotificationsTab } from "./_components/NotificationsTab";
import { SyncTab } from "./_components/SyncTab";
import { AddUserModal } from "./_components/AddUserModal";
import { EditOverrideModal } from "./_components/EditOverrideModal";

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
  const [activeTab, setActiveTab] = useState<AdminTab>("matches");

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
  const [syncStatus, setSyncStatus] = useState<AdminSyncStatus | null>(null);

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

  // Takım listesi (A-Z sıralı, kategorili) — sabit listelerden modül düzeyinde hesaplanır
  const teamsByCategory = TEAMS_BY_CATEGORY;

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
      <AdminLoginForm
        authEmail={authEmail}
        authError={authError}
        authPassword={authPassword}
        handleSupabaseLogin={handleSupabaseLogin}
        loading={loading}
        setAuthEmail={setAuthEmail}
        setAuthPassword={setAuthPassword}
      />
    );
  }

  // 2. Giriş Yapılmışsa Admin Paneli Arayüzünü Göster
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Üst Bar */}
      <AdminHeader
        activeTab={activeTab}
        auditLogs={auditLogs}
        handleLogout={handleLogout}
        handleTriggerLiveSync={handleTriggerLiveSync}
        matches={matches}
        setActiveTab={setActiveTab}
        syncLoading={syncLoading}
        teamsByCategory={teamsByCategory}
        users={users}
      />

      {/* Canlı Senkronizasyon Durum Bildirimi (Yalnızca Admin Panelinde) */}
      {syncStatus && (
        <SyncStatusBanner setSyncStatus={setSyncStatus} syncStatus={syncStatus} />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === "matches" ? (
          <MatchesTab
            cities={cities}
            filteredMatches={filteredMatches}
            filterOverriddenOnly={filterOverriddenOnly}
            overrides={overrides}
            searchQuery={searchQuery}
            selectedCity={selectedCity}
            setFilterOverriddenOnly={setFilterOverriddenOnly}
            setSearchQuery={setSearchQuery}
            setSelectedCity={setSelectedCity}
            startEdit={startEdit}
          />
        ) : activeTab === "audit" ? (
          <AuditLogTab auditLogs={auditLogs} />
        ) : activeTab === "teams" ? (
          <TeamsTab
            filteredTeams={filteredTeams}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setTeamCategoryFilter={setTeamCategoryFilter}
            teamCategoryFilter={teamCategoryFilter}
            teamsByCategory={teamsByCategory}
          />
        ) : activeTab === "clubs" ? (
          <ClubMembersAdmin token={token} />
        ) : activeTab === "users" ? (
          <UsersTab
            handleDeleteUser={handleDeleteUser}
            handleUpdateUserRole={handleUpdateUserRole}
            setShowAddUserModal={setShowAddUserModal}
            userOperationLoading={userOperationLoading}
            users={users}
          />
        ) : activeTab === "notifications" ? (
          <NotificationsTab
            fetchNotificationStatus={fetchNotificationStatus}
            notificationHistory={notificationHistory}
            notificationStatus={notificationStatus}
            token={token}
          />
        ) : activeTab === "sync" ? (
          <SyncTab
            auditLogs={auditLogs}
            matches={matches}
            overrides={overrides}
            users={users}
          />
        ) : null}
      </main>

      {/* KULLANICI EKLEME MODALI */}
      {showAddUserModal && (
        <AddUserModal
          handleAddUser={handleAddUser}
          newUserEmail={newUserEmail}
          newUserPassword={newUserPassword}
          newUserRole={newUserRole}
          setNewUserEmail={setNewUserEmail}
          setNewUserPassword={setNewUserPassword}
          setNewUserRole={setNewUserRole}
          setShowAddUserModal={setShowAddUserModal}
          userOperationLoading={userOperationLoading}
        />
      )}

      {/* DÜZENLEME MODALI */}
      {editingMatch && (
        <EditOverrideModal
          authorInput={authorInput}
          awayScore={awayScore}
          editingMatch={editingMatch}
          feedback={feedback}
          handleDeleteOverride={handleDeleteOverride}
          handleSaveOverride={handleSaveOverride}
          homeScore={homeScore}
          overrides={overrides}
          reasonInput={reasonInput}
          saveLoading={saveLoading}
          setAuthorInput={setAuthorInput}
          setAwayScore={setAwayScore}
          setEditingMatch={setEditingMatch}
          setHomeScore={setHomeScore}
          setReasonInput={setReasonInput}
          setScoresInput={setScoresInput}
          setSetScoresInput={setSetScoresInput}
          setStatusInput={setStatusInput}
          statusInput={statusInput}
        />
      )}
    </div>
  );
}
