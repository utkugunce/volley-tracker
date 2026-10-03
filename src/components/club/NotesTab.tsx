"use client";

import React, { useState } from "react";
import { useClubResource } from "./useClubResource";
import { btnGhost, btnPrimary, Field, inputCls } from "./fields";

interface MatchNote {
  id: string;
  opponent: string | null;
  match_date: string | null;
  body: string;
  visibility: "club" | "public";
  created_at: string;
}

const EMPTY = { opponent: "", match_date: "", body: "", visibility: "club" as "club" | "public" };

export function NotesTab({ club }: { club: string }) {
  const { items, loading, error, save, remove } = useClubResource<MatchNote>("notes", club);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | undefined>();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const err = await save(form, editingId);
    setBusy(false);
    if (err) setMsg(err);
    else {
      setForm({ ...EMPTY });
      setEditingId(undefined);
    }
  };

  return (
    <section aria-label="Maç notları" className="space-y-4">
      <form onSubmit={submit} className="rounded-2xl border border-line bg-panel p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Rakip">
            <input className={inputCls} value={form.opponent} maxLength={120} onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
          </Field>
          <Field label="Maç tarihi">
            <input type="date" className={inputCls} value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} />
          </Field>
        </div>
        <Field label="Maç sonrası not">
          <textarea className={inputCls} rows={5} value={form.body} maxLength={4000} required onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-xs font-bold text-ink-2">
          <input
            type="checkbox"
            checked={form.visibility === "public"}
            onChange={(e) => setForm({ ...form, visibility: e.target.checked ? "public" : "club" })}
          />
          Herkese açık yap (varsayılan: yalnızca kulüp içi, özel)
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className={btnPrimary}>{editingId ? "Güncelle" : "Notu kaydet"}</button>
          {editingId && (
            <button type="button" className={btnGhost} onClick={() => { setEditingId(undefined); setForm({ ...EMPTY }); }}>Vazgeç</button>
          )}
          {msg && <span role="alert" className="text-xs font-bold text-live">{msg}</span>}
        </div>
      </form>

      {error && <p role="alert" className="text-xs font-bold text-live">{error}</p>}
      {loading ? (
        <p className="text-sm text-ink-3">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-3">Henüz maç notu yok.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id} className="rounded-2xl border border-line bg-panel p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black">
                    {n.opponent ? `vs ${n.opponent}` : "Maç notu"}
                    {n.match_date && <span className="ml-2 text-xs font-bold text-ink-3">{n.match_date}</span>}
                    <span className={`ml-2 text-[10px] font-bold uppercase ${n.visibility === "public" ? "text-done" : "text-ink-3"}`}>
                      {n.visibility === "public" ? "Herkese açık" : "Özel"}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-ink-2">{n.body}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className={btnGhost}
                    onClick={() => {
                      setEditingId(n.id);
                      setForm({ opponent: n.opponent ?? "", match_date: n.match_date ?? "", body: n.body, visibility: n.visibility });
                    }}
                  >
                    Düzenle
                  </button>
                  <button
                    className={btnGhost}
                    onClick={async () => {
                      if (window.confirm("Not silinsin mi?")) setMsg(await remove(n.id));
                    }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
