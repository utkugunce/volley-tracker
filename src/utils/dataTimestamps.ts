import fs from "fs";
import path from "path";

/**
 * cities.json `updated_at` alanı "Wed 2026-10-07 7:43 PM (UTC+03:00)" biçimindedir.
 * Ayrıştırılamazsa undefined döner (lastModified alanı hiç yazılmaz).
 */
export function parseScanTimestamp(raw: unknown): Date | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*\(UTC([+-]\d{2}):(\d{2})\)/i);
  if (m) {
    let hour = Number(m[4]);
    const ampm = m[6]?.toUpperCase();
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    const iso = `${m[1]}-${m[2]}-${m[3]}T${String(hour).padStart(2, "0")}:${m[5]}:00${m[7]}:${m[8]}`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  // Saat dilimi olmayan ISO zaman damgaları (GitHub Actions çıktısı) UTC kabul edilir.
  const iso = /[zZ]|[+-]\d{2}:\d{2}$/.test(raw) ? raw : `${raw}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** data/ altındaki bir JSON dosyasını okur; yoksa ya da bozuksa null döner. */
export function readDataJson(rel: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf-8"));
  } catch {
    return null;
  }
}
