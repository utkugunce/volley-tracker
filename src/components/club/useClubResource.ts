"use client";

import { useCallback, useEffect, useState } from "react";

export async function clubApi<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data: T & { error?: string; code?: string } }> {
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  return { ok: res.ok, status: res.status, data };
}

/** /api/panel/<resource> için liste + ekle/güncelle/sil durumu. */
export function useClubResource<T extends { id: string }>(resource: string, club: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/panel/${resource}`;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await clubApi<{ items: T[] }>("GET", `${base}?club=${encodeURIComponent(club)}`);
      if (!r.ok) setError(r.data.error || "Liste alınamadı.");
      else setItems(r.data.items ?? []);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }, [base, club]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (values: Record<string, unknown>, id?: string): Promise<string | null> => {
      try {
        const r = id
          ? await clubApi("PUT", base, { ...values, id })
          : await clubApi("POST", base, { ...values, club_slug: club });
        if (!r.ok) return r.data.error || "Kaydedilemedi.";
        await reload();
        return null;
      } catch {
        return "Bağlantı hatası.";
      }
    },
    [base, club, reload]
  );

  const remove = useCallback(
    async (id: string): Promise<string | null> => {
      try {
        const r = await clubApi("DELETE", base, { id });
        if (!r.ok) return r.data.error || "Silinemedi.";
        await reload();
        return null;
      } catch {
        return "Bağlantı hatası.";
      }
    },
    [base, reload]
  );

  return { items, loading, error, reload, save, remove };
}
