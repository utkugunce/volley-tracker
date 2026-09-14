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

