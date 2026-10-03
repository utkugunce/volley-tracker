"use client";

import React, { useState } from "react";
import { useClubResource } from "./useClubResource";
import { btnGhost, btnPrimary, Field, inputCls } from "./fields";

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  expires_at: string | null;
  created_at: string;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const EMPTY = { title: "", body: "", pinned: false, expires_at: "" };

export function AnnouncementsTab({ club, canWrite }: { club: string; canWrite: boolean }) {
  const { items, loading, error, save, remove } = useClubResource<Announcement>("announcements", club);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | undefined>();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const err = await save(
      { ...form, expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null },
      editingId
    );
    setBusy(false);
    if (err) setMsg(err);
    else {
      setForm({ ...EMPTY });
      setEditingId(undefined);
    }
  };

  return (
    <section aria-label="Duyurular" className="space-y-4">
      {canWrite ? (
        <form onSubmit={submit} className="rounded-2xl border border-line bg-panel p-4 space-y-3">
          <Field label="Başlık">
            <input className={inputCls} value={form.title} maxLength={120} required onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Duyuru metni">
            <textarea className={inputCls} rows={4} value={form.body} maxLength={2000} required onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <Field label="Bitiş (isteğe bağlı)">
              <input type="datetime-local" className={inputCls} value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-xs font-bold text-ink-2">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Sabitle
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className={btnPrimary}>{editingId ? "Güncelle" : "Yayınla"}</button>
            {editingId && (
              <button type="button" className={btnGhost} onClick={() => { setEditingId(undefined); setForm({ ...EMPTY }); }}>Vazgeç</button>
            )}
            {msg && <span role="alert" className="text-xs font-bold text-live">{msg}</span>}
          </div>
        </form>
      ) : (
        <p className="text-xs text-ink-3">Duyuru yayınlama yetkisi yalnızca kulüp yöneticisindedir (antrenör hesabı duyuruları görüntüler).</p>
      )}

      {error && <p role="alert" className="text-xs font-bold text-live">{error}</p>}
      {loading ? (
        <p className="text-sm text-ink-3">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-3">Henüz duyuru yok.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="rounded-2xl border border-line bg-panel p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black">{a.pinned && "📌 "}{a.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-ink-2">{a.body}</p>
                  <p className="mt-2 text-xs text-ink-3">
                    {new Date(a.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
                    {a.expires_at && ` · bitiş ${new Date(a.expires_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      className={btnGhost}
                      onClick={() => {
                        setEditingId(a.id);
                        setForm({ title: a.title, body: a.body, pinned: a.pinned, expires_at: toLocalInput(a.expires_at) });
                      }}
                    >
                      Düzenle
                    </button>
                    <button
                      className={btnGhost}
                      onClick={async () => {
                        if (window.confirm("Duyuru silinsin mi?")) setMsg(await remove(a.id));
                      }}
                    >
                      Sil
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
