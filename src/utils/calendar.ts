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
