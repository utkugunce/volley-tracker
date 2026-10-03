"use client";

import React, { useEffect, useMemo, useState } from "react";
import { btnPrimary, Field, inputCls } from "./fields";
import { clubApi } from "./useClubResource";
import { trLower } from "@/utils/turkishLocale";

interface TeamOption {
  name: string;
  slug: string;
  city: string;
}

export function ApplyForm({ onDone }: { onDone: () => void }) {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState("");
  const [role, setRole] = useState<"manager" | "coach">("coach");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/club/teams")
      .then((r) => r.json())
      .then((d) => setTeams(Array.isArray(d.teams) ? d.teams : []))
      .catch(() => setMsg("Takım listesi alınamadı."));
  }, []);

  const matches = useMemo(() => {
    const q = trLower(query.trim());
    if (q.length < 2) return [];
    return teams.filter((t) => trLower(t.name).includes(q)).slice(0, 8);
  }, [teams, query]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) {
      setMsg("Listeden bir takım seçin.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await clubApi("POST", "/api/panel/apply", { club_slug: slug, member_role: role, note });
      if (!r.ok) setMsg(r.data.error || "Başvuru gönderilemedi.");
      else onDone();
    } catch {
      setMsg("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-panel p-5 space-y-4">
      <div>
        <p className="font-black">Kulüp başvurusu</p>
        <p className="text-xs text-ink-2 mt-1">
          Yöneticisi/antrenörü olduğunuz takımı seçin. Başvurunuz site yöneticisi tarafından onaylandıktan sonra panel açılır.
        </p>
      </div>
      <Field label="Takım ara">
        <input
          className={inputCls}
          value={query}
          maxLength={80}
          placeholder="Takım adının bir bölümünü yazın"
          onChange={(e) => {
            setQuery(e.target.value);
            setSlug("");
          }}
        />
      </Field>
      {matches.length > 0 && !slug && (
        <ul className="rounded-xl border border-line divide-y divide-line text-sm">
          {matches.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-surface-muted"
                onClick={() => {
                  setSlug(t.slug);
                  setQuery(t.name);
                }}
              >
                {t.name} <span className="text-xs text-ink-3">· {t.city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Field label="Rolünüz">
        <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as "manager" | "coach")}>
          <option value="coach">Antrenör (kadro ve maç notları)</option>
          <option value="manager">Kulüp yöneticisi (kadro, duyuru ve maç notları)</option>
        </select>
      </Field>
      <Field label="Not (isteğe bağlı)">
        <textarea className={inputCls} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>Başvur</button>
        {msg && <span role="alert" className="text-xs font-bold text-live">{msg}</span>}
      </div>
    </form>
  );
}
