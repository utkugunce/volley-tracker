"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SetupNotice } from "./ClubShell";
import { ApplyForm } from "./ApplyForm";
import { RosterTab } from "./RosterTab";
import { AnnouncementsTab } from "./AnnouncementsTab";
import { NotesTab } from "./NotesTab";
import { btnGhost } from "./fields";
import { clubApi } from "./useClubResource";
import { canPerform, type MemberRole, type MemberStatus } from "@/utils/club/permissions";

interface Membership {
  id: string;
  club_slug: string;
  member_role: MemberRole;
  status: MemberStatus;
}

type MeState =
  | { state: "loading" }
  | { state: "not_configured" }
  | { state: "setup_required" }
  | { state: "unauthenticated" }
  | { state: "ready"; memberships: Membership[] }
  | { state: "error" };

const STATUS_TEXT: Record<MemberStatus, string> = {
  pending: "Onay bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  revoked: "Yetki kaldırıldı",
};

const TABS = [
  { key: "roster", label: "Kadro" },
  { key: "announcements", label: "Duyurular" },
  { key: "notes", label: "Maç notları" },
] as const;

export function PanelClient({ email }: { email: string }) {
  const [me, setMe] = useState<MeState>({ state: "loading" });
  const [club, setClub] = useState<string>("");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("roster");
  const [showApply, setShowApply] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await clubApi<{ state: string; memberships?: Membership[] }>("GET", "/api/panel/me");
      const s = r.data.state;
      if (s === "ready") {
        const memberships = r.data.memberships ?? [];
        setMe({ state: "ready", memberships });
        setClub((cur) => cur || memberships.find((m) => m.status === "approved")?.club_slug || "");
      } else if (s === "not_configured" || s === "setup_required" || s === "unauthenticated") {
        setMe({ state: s });
      } else {
        setMe({ state: "error" });
      }
    } catch {
      setMe({ state: "error" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await clubApi("POST", "/api/auth/logout", {}).catch(() => undefined);
    // Çıkışta oturum durumunun tamamen sıfırlanması için bilinçli olarak tam sayfa yönlendirme.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/giris";
  };

  if (me.state === "loading") return <p className="text-sm text-ink-3">Yükleniyor…</p>;
  if (me.state === "not_configured" || me.state === "setup_required") return <SetupNotice kind={me.state} />;
  if (me.state === "unauthenticated") {
    return (
      <p className="text-sm">
        Oturumunuz sona erdi. <Link className="underline font-bold" href="/giris?sonraki=/panel">Yeniden giriş yapın</Link>.
      </p>
    );
  }
  if (me.state === "error") return <p role="alert" className="text-sm text-live font-bold">Panel yüklenemedi. Lütfen sayfayı yenileyin.</p>;

  if (me.state !== "ready") return null;
  const approved = me.memberships.filter((m) => m.status === "approved");
  const active = approved.find((m) => m.club_slug === club);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-2">
        <span>Giriş: <strong>{email}</strong></span>
        <div className="flex gap-2">
          <Link href="/admin" className={btnGhost}>Yönetici</Link>
          <button className={btnGhost} onClick={logout}>Çıkış yap</button>
        </div>
      </div>

      {me.memberships.length > 0 && (
        <ul className="rounded-2xl border border-line bg-panel divide-y divide-line text-sm">
          {me.memberships.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 p-3">
              <span className="font-bold">
                {m.club_slug} <span className="text-xs text-ink-3">· {m.member_role === "manager" ? "Yönetici" : "Antrenör"}</span>
              </span>
              <span className={`text-xs font-bold ${m.status === "approved" ? "text-done" : "text-ink-3"}`}>{STATUS_TEXT[m.status]}</span>
            </li>
          ))}
        </ul>
      )}

      {approved.length === 0 || showApply ? (
        <ApplyForm onDone={() => { setShowApply(false); void load(); }} />
      ) : (
        <button className={btnGhost} onClick={() => setShowApply(true)}>Başka bir kulüp için başvur</button>
      )}

      {approved.length === 0 && me.memberships.some((m) => m.status === "pending") && (
        <p role="status" className="text-sm text-ink-2">
          Başvurunuz alındı. Site yöneticisi onayladığında bu sayfayı yenileyerek panele erişebilirsiniz.
        </p>
      )}

      {active && (
        <div className="space-y-4">
          {approved.length > 1 && (
            <select
              aria-label="Kulüp seç"
              className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm"
              value={club}
              onChange={(e) => setClub(e.target.value)}
            >
              {approved.map((m) => (
                <option key={m.id} value={m.club_slug}>{m.club_slug}</option>
              ))}
            </select>
          )}
          <p className="text-xs text-ink-3">
            Kulüp sayfası: <Link className="underline" href={`/takim/${active.club_slug}`}>/takim/{active.club_slug}</Link>
          </p>
          <div role="tablist" className="flex gap-2 border-b border-line">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-sm font-bold border-b-2 -mb-px ${tab === t.key ? "border-primary text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "roster" && <RosterTab key={club} club={club} />}
          {tab === "announcements" && (
            <AnnouncementsTab key={club} club={club} canWrite={canPerform(active, club, "announcement:write")} />
          )}
          {tab === "notes" && <NotesTab key={club} club={club} />}
        </div>
      )}
    </div>
  );
}
