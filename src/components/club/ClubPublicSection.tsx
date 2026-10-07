"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Users } from "lucide-react";

interface PublicContent {
  available: boolean;
  announcements: { id: string; title: string; body: string; pinned: boolean; created_at: string }[];
  roster: {
    id: string;
    name: string;
    shirt_number: number | null;
    position: string | null;
    height_cm: number | null;
    birth_year: number | null;
    is_staff: boolean;
  }[];
  notes: { id: string; opponent: string | null; match_date: string | null; body: string }[];
}

/**
 * Takım sayfasında kulüp tarafından yayınlanan içerik (duyuru / kadro / herkese açık notlar).
 * İçerik istemci tarafında çekilir; böylece takım sayfaları statik kalır. İçerik yoksa,
 * kurulum yapılmamışsa ya da istek başarısız olursa hiçbir şey çizilmez.
 */
export function ClubPublicSection({ slug }: { slug: string }) {
  const [content, setContent] = useState<PublicContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/club/public?team=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && d.available) setContent(d as PublicContent);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!content) return null;
  const { announcements, roster, notes } = content;
  if (announcements.length === 0 && roster.length === 0 && notes.length === 0) return null;

  return (
    <section aria-label="Kulüp duyuruları ve kadrosu" className="space-y-4 rounded-2xl border border-line bg-panel p-4 sm:p-5">
      {announcements.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-black">
            <Megaphone size={16} aria-hidden /> Kulüp Duyuruları
          </h2>
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-xl bg-surface-muted p-3 text-sm">
                <p className="font-bold">{a.pinned && "📌 "}{a.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-ink-2">{a.body}</p>
                <p className="mt-1 text-[11px] text-ink-3">
                  {new Date(a.created_at).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {roster.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-black">
            <Users size={16} aria-hidden /> Kulüp Kadrosu <span className="text-[11px] font-bold text-ink-3">(kulüp tarafından girildi)</span>
          </h2>
          <ul className="grid gap-1 sm:grid-cols-2 text-sm">
            {roster.map((p) => (
              <li key={p.id} className="rounded-lg bg-surface-muted px-3 py-2">
                {p.shirt_number !== null && <span className="mr-2 text-ink-3">#{p.shirt_number}</span>}
                <span className="font-bold">{p.name}</span>
                <span className="ml-2 text-xs text-ink-3">
                  {[p.is_staff ? "Teknik ekip" : null, p.position, p.height_cm ? `${p.height_cm} cm` : null].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-black">Maç Notları</h2>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl bg-surface-muted p-3 text-sm">
                <p className="font-bold">{n.opponent ? `vs ${n.opponent}` : "Maç notu"} {n.match_date && <span className="text-xs text-ink-3">{n.match_date}</span>}</p>
                <p className="mt-1 whitespace-pre-wrap text-ink-2">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-ink-3">
        Kulüp yetkilisi misiniz? <Link prefetch={false} href="/giris" className="underline">Giriş yapın</Link>.
      </p>
    </section>
  );
}
