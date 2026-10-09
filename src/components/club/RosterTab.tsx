"use client";

import React, { useState } from "react";
import { useClubResource } from "./useClubResource";
import { btnGhost, btnPrimary, Field, inputCls } from "./fields";

interface RosterEntry {
  id: string;
  name: string;
  shirt_number: number | null;
  position: string | null;
  height_cm: number | null;
  birth_year: number | null;
  is_staff: boolean;
  is_visible: boolean;
}

const EMPTY = { name: "", shirt_number: "", position: "", height_cm: "", birth_year: "", is_staff: false, is_visible: true };

export function RosterTab({ club }: { club: string }) {
  const { items, loading, error, save, remove } = useClubResource<RosterEntry>("roster", club);
  const [form, setForm] = useState({ ...EMPTY });
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currentYear = new Date().getFullYear();
  const isUnder13 = !form.is_staff && Boolean(form.birth_year) && Number(form.birth_year) > (currentYear - 13);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnder13 && !guardianConsent) {
      setMsg("13 yaşından küçük sporcular için veli/yasal temsilci izni teyidi zorunludur.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const err = await save(form, editingId);
    setBusy(false);
    if (err) setMsg(err);
    else {
      setForm({ ...EMPTY });
      setGuardianConsent(false);
      setEditingId(undefined);
    }
  };

  const startEdit = (p: RosterEntry) => {
    setEditingId(p.id);
    setGuardianConsent(false);
    setForm({
      name: p.name,
      shirt_number: p.shirt_number?.toString() ?? "",
      position: p.position ?? "",
      height_cm: p.height_cm?.toString() ?? "",
      birth_year: p.birth_year?.toString() ?? "",
      is_staff: p.is_staff,
      is_visible: p.is_visible,
    });
  };

  return (
    <section aria-label="Kadro" className="space-y-4">
      <form onSubmit={submit} className="rounded-2xl border border-line bg-panel p-4 grid grid-cols-2 sm:grid-cols-6 gap-3">
        <Field label="İsim Soyisim" className="col-span-2 sm:col-span-3">
          <input className={inputCls} value={form.name} maxLength={80} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Forma no">
          <input className={inputCls} inputMode="numeric" value={form.shirt_number} maxLength={2} onChange={(e) => setForm({ ...form, shirt_number: e.target.value })} />
        </Field>
        <Field label="Boy (cm)">
          <input className={inputCls} inputMode="numeric" value={form.height_cm} maxLength={3} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
        </Field>
        <Field label="Doğum yılı">
          <input className={inputCls} inputMode="numeric" value={form.birth_year} maxLength={4} onChange={(e) => setForm({ ...form, birth_year: e.target.value })} />
        </Field>
        <Field label="Pozisyon / Görev" className="col-span-2 sm:col-span-3">
          <input className={inputCls} value={form.position} maxLength={40} onChange={(e) => setForm({ ...form, position: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-xs font-bold text-ink-2 col-span-1 sm:col-span-1">
          <input type="checkbox" checked={form.is_staff} onChange={(e) => setForm({ ...form, is_staff: e.target.checked })} /> Teknik ekip
        </label>
        <label className="flex items-center gap-2 text-xs font-bold text-ink-2 col-span-1 sm:col-span-2">
          <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} /> Takım sayfasında göster
        </label>

        {isUnder13 && (
          <div className="col-span-2 sm:col-span-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
            <label className="flex items-start gap-2 font-semibold cursor-pointer">
              <input
                type="checkbox"
                required
                checked={guardianConsent}
                onChange={(e) => setGuardianConsent(e.target.checked)}
                className="mt-0.5 rounded border-amber-500 focus:ring-amber-400"
              />
              <span>
                <strong>Veli / Yasal Temsilci Rızası:</strong> Bu sporcu 13 yaşından küçüktür (COPPA / KVKK). Sporcunun isim, mevki ve fiziksel verilerinin Altyapı Voleybol platformunda kamuya açık kadro bülteninde listelenmesi için velisinin/yasal temsilcisinin açık rızası kulüp tarafından alınmıştır.
              </span>
            </label>
          </div>
        )}

        <div className="col-span-2 sm:col-span-6 flex items-center gap-3">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {editingId ? "Güncelle" : "Ekle"}
          </button>
          {editingId && (
            <button type="button" className={btnGhost} onClick={() => { setEditingId(undefined); setForm({ ...EMPTY }); setGuardianConsent(false); }}>
              Vazgeç
            </button>
          )}
        </div>
      </form>

      {msg && <p role="status" className="text-xs font-bold text-ink-2">{msg}</p>}
      {error && <p role="alert" className="text-xs font-bold text-live">{error}</p>}
      {loading ? (
        <p className="text-sm text-ink-3">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-3">Henüz kadro girişi yok.</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-panel">
          {items.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-bold truncate">
                  {p.shirt_number !== null && <span className="text-ink-3 mr-2">#{p.shirt_number}</span>}
                  {p.name}
                  {!p.is_visible && <span className="ml-2 text-xs text-ink-3">(gizli)</span>}
                </p>
                <p className="text-xs text-ink-3">
                  {[p.is_staff ? "Teknik ekip" : null, p.position, p.height_cm ? `${p.height_cm} cm` : null, p.birth_year].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  className={btnGhost}
                  aria-label={`${p.name} kaydını düzenle`}
                  onClick={() => startEdit(p)}
                >
                  Düzenle
                </button>
                <button
                  className={btnGhost}
                  aria-label={`${p.name} kaydını sil`}
                  onClick={async () => {
                    if (window.confirm(`${p.name} silinsin mi?`)) setMsg(await remove(p.id));
                  }}
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
