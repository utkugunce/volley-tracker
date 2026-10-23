/**
 * Son çekim / senkronizasyon zaman damgasını (ISO veya yerel format)
 * Türkiye saat dilimi (Europe/Istanbul) ile tarih ve saat olarak biçimlendirir.
 */
export function formatSyncDateTime(raw?: string | null): { date: string; time: string; full: string } {
  if (!raw) return { date: "--.--.----", time: "--:--", full: "--:--" };
  try {
    const isoString = raw.includes("Z") || raw.includes("+") ? raw : `${raw}+03:00`;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { date: "--.--.----", time: "--:--", full: raw };
    }
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    });
    const date = `${day}.${month}.${year}`;
    return {
      date,
      time,
      full: `${date} ${time}`,
    };
  } catch {
    return { date: "--.--.----", time: "--:--", full: raw || "--:--" };
  }
}
