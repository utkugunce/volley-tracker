"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { MemberRole, MemberStatus } from "@/utils/club/permissions";

interface MemberRow {
  id: string;
  email: string | null;
  club_slug: string;
  member_role: MemberRole;
  status: MemberStatus;
  note: string | null;
  requested_at: string;
}

const STATUS_LABEL: Record<MemberStatus, string> = {
  pending: "Bekleyen",
  approved: "Onaylı",
  rejected: "Reddedilen",
  revoked: "İptal edilen",
};

const FILTERS: (MemberStatus | "all")[] = ["pending", "approved", "rejected", "revoked", "all"];

/** Yönetici ekranı: kulüp/antrenör başvurularını onayla, reddet, iptal et veya doğrudan kulübe bağla. */
export function ClubMembersAdmin({ token }: { token: string }) {
  const [filter, setFilter] = useState<MemberStatus | "all">("pending");
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; kind: "ok" | "err" } | null>(null);
  const [link, setLink] = useState({ email: "", club_slug: "", member_role: "coach" as MemberRole });

  const call = useCallback(
    async (method: string, url: string, body?: unknown) => {
      const res = await fetch(url, {
        method,
        cache: "no-store",
        headers: { "x-admin-token": token, ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    },
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await call("GET", `/api/admin/club-members${filter === "all" ? "" : `?status=${filter}`}`);
      if (r.ok) {
        setRows(r.data.members ?? []);
        setMsg(null);
      } else if (r.status === 503) {
        setRows([]);
        setMsg({
          text: r.data.code === "setup_required"
            ? "Kurulum gerekli: 006_club_panel.sql migration'ı henüz uygulanmamış (docs/club-panel.md)."
            : "Supabase yapılandırılmamış (ortam değişkenleri eksik).",
          kind: "err",
        });
      } else {
        setMsg({ text: r.data.error || "Liste alınamadı.", kind: "err" });
      }
    } catch {
      setMsg({ text: "Bağlantı hatası.", kind: "err" });
    } finally {
      setLoading(false);
    }
  }, [call, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (id: string, patch: Record<string, unknown>) => {
    const r = await call("PATCH", "/api/admin/club-members", { id, ...patch });
    setMsg(r.ok ? { text: "Güncellendi.", kind: "ok" } : { text: r.data.error || "Güncellenemedi.", kind: "err" });
    if (r.ok) await load();
  };

  const submitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await call("POST", "/api/admin/club-members", link);
    setMsg(r.ok ? { text: "Kullanıcı kulübe bağlandı.", kind: "ok" } : { text: r.data.error || "Bağlanamadı.", kind: "err" });
    if (r.ok) {
      setLink({ email: "", club_slug: "", member_role: "coach" });
      await load();
    }
  };

  const field = "rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white";
  const btn = "px-2 py-1 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <h2 className="text-base font-bold text-white">Kulüp / Antrenör Hesapları</h2>

      <form onSubmit={submitLink} className="flex flex-wrap items-end gap-2">
        <input className={field} type="email" required aria-label="Kullanıcı e-posta adresi" placeholder="kullanici@eposta.com" value={link.email} onChange={(e) => setLink({ ...link, email: e.target.value })} />
        <input className={field} required aria-label="Kulüp kısa adı (slug)" placeholder="kulüp slug (ör. fenerbahce)" value={link.club_slug} onChange={(e) => setLink({ ...link, club_slug: e.target.value.trim().toLowerCase() })} />
        <select className={field} aria-label="Kulüp yetki rolü" value={link.member_role} onChange={(e) => setLink({ ...link, member_role: e.target.value as MemberRole })}>
          <option value="coach">Antrenör</option>
          <option value="manager">Yönetici</option>
        </select>
        <button type="submit" className={btn}>Doğrudan bağla</button>
      </form>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Durum filtresi">
        {FILTERS.map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`${btn} ${filter === f ? "!bg-primary !text-primary-fg" : ""}`}>
            {f === "all" ? "Tümü" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {msg && (
        <p role={msg.kind === "err" ? "alert" : "status"} className={`text-xs font-bold ${msg.kind === "err" ? "text-red-400" : "text-emerald-400"}`}>
          {msg.text}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Yükleniyor…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400">Kayıt yok.</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {rows.map((m) => (
            <li key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-200">
              <div className="min-w-0">
                <p className="font-bold truncate">{m.email || "(e-posta yok)"}</p>
                <p className="text-xs text-slate-400">
                  {m.club_slug} · {m.member_role === "manager" ? "Yönetici" : "Antrenör"} · {STATUS_LABEL[m.status]}
                  {m.note ? ` · “${m.note}”` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {(m.status === "pending" || m.status === "rejected" || m.status === "revoked") && (
                  <button className={btn} onClick={() => update(m.id, { status: "approved" })}>Onayla</button>
                )}
                {m.status === "pending" && <button className={btn} onClick={() => update(m.id, { status: "rejected" })}>Reddet</button>}
                {m.status === "approved" && (
                  <>
                    <button className={btn} onClick={() => update(m.id, { member_role: m.member_role === "manager" ? "coach" : "manager" })}>
                      Rolü {m.member_role === "manager" ? "Antrenör" : "Yönetici"} yap
                    </button>
                    <button className={btn} onClick={() => update(m.id, { status: "revoked" })}>Yetkiyi kaldır</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
