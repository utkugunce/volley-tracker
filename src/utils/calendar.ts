/**
 * TVF Volley Tracker - Takvim ve Zaman Yardımcıları
 * Hata korumalı ISO tarih/saat çözümleyici
 */

export function getCalendarIsoTimes(dateStr?: string, timeStr?: string): { startIso: string; endIso: string } {
  const cleanDate = (dateStr || "20260915").replace(/[^0-9]/g, "").padEnd(8, "0").slice(0, 8);
  
  let h = "18";
  let mn = "00";
  
  if (timeStr && typeof timeStr === "string") {
    const parts = timeStr.trim().split(/[:.]/);
    if (parts.length >= 2) {
      h = parts[0] || "18";
      mn = parts[1] || "00";
    } else if (parts.length === 1 && parts[0].length > 0) {
      h = parts[0];
    }
  }

  const startH = String(h).padStart(2, "0").slice(-2);
  const startM = String(mn).padStart(2, "0").slice(-2);
  
  let endHNum = 20;
  try {
    const parsed = parseInt(startH, 10);
    if (!isNaN(parsed)) {
      endHNum = (parsed + 2) % 24;
    }
  } catch {}
  const endH = String(endHNum).padStart(2, "0");

  return {
    startIso: `${cleanDate}T${startH}${startM}00`,
    endIso: `${cleanDate}T${endH}${startM}00`,
  };
}

/**
 * Bir maçın tarihinin ve saatinin geçip geçmediğini kontrol eder.
 * Maç durumu "finished" ise veya maç tarihi/saati geride kalmışsa true döner.
 */
export function isMatchPassed(dateStr?: string, timeStr?: string, status?: string): boolean {
  if (status === "finished") return true;
  if (!dateStr || dateStr === "TBD") return false;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;

  if (dateStr < today) return true;
  if (dateStr > today) return false;

  // Bugün ise saat kontrolü yap
  if (timeStr && timeStr !== "--:--") {
    const parts = timeStr.trim().split(/[:.]/);
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || "0", 10);
    if (!isNaN(h)) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const matchMinutes = h * 60 + m;
      return currentMinutes >= matchMinutes;
    }
  }

  return false;
}

/**
 * Bir maçın Volleybox skoru için gecikmiş ("skorsuz") kabul edilip edilmeyeceğini belirler.
 * Kullanıcı skorları genelde maçtan bir gün sonra girdiği için,
 * maç günü (o gün) olan maçlar henüz skorsuz olarak işaretlenmez.
 * Yalnızca tarihi bugünden önce olan (dün veya daha eski, dateStr < today) maçlar "skorsuz" sayılır.
 */
export function isMatchOverdueForScore(dateStr?: string, todayStr?: string): boolean {
  if (!dateStr || dateStr === "TBD") return false;

  let today = todayStr;
  if (!today) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    today = `${year}-${month}-${day}`;
  }

  return dateStr < today;
}

/**
 * ISO veya YYYY-MM-DD formatındaki tarihi Türkçe okunaklı formata çevirir.
 * Örn: '2026-09-14' -> '14 Eylül 2026 Pazartesi'
 */
export function formatDateTurkish(dateStr?: string): string {
  if (!dateStr || dateStr === "TBD") return dateStr || "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      });
    }
  } catch {}
  return dateStr;
}

/**
 * İki maç saatini kronolojik olarak karşılaştırır.
 * Erken saatteki maç her zaman önce gelir.
 * Örn: '10:00' < '14:30', '09:00' < '18:00'
 * Belirtilmemiş veya '--:--' olan saatler en sona atılır.
 */
export function compareMatchTimes(t1?: string | null, t2?: string | null): number {
  const time1 = (t1 || "").trim();
  const time2 = (t2 || "").trim();

  const isInvalid1 = !time1 || time1 === "--:--" || time1 === "TBD";
  const isInvalid2 = !time2 || time2 === "--:--" || time2 === "TBD";

  if (isInvalid1 && isInvalid2) return 0;
  if (isInvalid1) return 1;
  if (isInvalid2) return -1;

  return time1.localeCompare(time2);
}

/**
 * İki maçı tarih ve saatine göre sıralar.
 * Aynı gün içindeki maçlar her zaman erken saat ilk olacak şekilde sıralanır.
 * dateOrder 'asc' ise eski tarihten yeni tarihe, 'desc' ise yeni tarihten eski tarihe dizer.
 */
export function compareMatchDateTime(
  m1: { date?: string | null; time?: string | null },
  m2: { date?: string | null; time?: string | null },
  dateOrder: "asc" | "desc" = "asc"
): number {
  const d1 = (m1.date || "").trim();
  const d2 = (m2.date || "").trim();

  const isTbd1 = !d1 || d1 === "TBD";
  const isTbd2 = !d2 || d2 === "TBD";

  if (isTbd1 && isTbd2) return compareMatchTimes(m1.time, m2.time);
  if (isTbd1) return 1;
  if (isTbd2) return -1;

  if (d1 !== d2) {
    return dateOrder === "desc" ? d2.localeCompare(d1) : d1.localeCompare(d2);
  }

  // Aynı tarihte her zaman erken saatteki maç ilk gösterilir!
  return compareMatchTimes(m1.time, m2.time);
}

