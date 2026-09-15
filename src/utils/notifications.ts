import { Match } from "@/types/fixture";

const STORAGE_NOTIF_ENABLED = "tvf_notifications_enabled";
const STORAGE_NOTIF_DISMISSED = "tvf_notifications_dismissed";
const STORAGE_NOTIFIED_MATCHES = "tvf_notified_matches_v1";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export function isNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const pref = localStorage.getItem(STORAGE_NOTIF_ENABLED);
    return pref === "true" && isNotificationSupported() && Notification.permission === "granted";
  } catch {
    return false;
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_NOTIF_ENABLED, String(enabled));
  } catch (e) {
    console.error("Failed to save notification preference:", e);
  }
}

export function isBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_NOTIF_DISMISSED) === "true";
  } catch {
    return false;
  }
}

export function dismissBanner(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_NOTIF_DISMISSED, "true");
  } catch (e) {
    console.error("Failed to dismiss banner:", e);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      return true;
    } else {
      setNotificationsEnabled(false);
      return false;
    }
  } catch (e) {
    console.error("Notification permission error:", e);
    return false;
  }
}

export function getNotifiedMatchIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_NOTIFIED_MATCHES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function markMatchAsNotified(matchId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getNotifiedMatchIds();
    if (!current.includes(matchId)) {
      current.push(matchId);
      localStorage.setItem(STORAGE_NOTIFIED_MATCHES, JSON.stringify(current));
    }
  } catch (e) {
    console.error("Failed to mark match as notified:", e);
  }
}

/**
 * Parses match date and time into a Date object.
 * Returns null if invalid or TBD.
 */
export function parseMatchDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || dateStr === "TBD" || dateStr.length < 10) return null;
  const time = timeStr && timeStr !== "TBD" ? timeStr : "12:00";
  const [hours, minutes] = time.split(":").map((v) => parseInt(v, 10) || 0);

  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Checks favorite matches and triggers a notification if match starts within 30 minutes.
 * Can accept a custom notifyFn for unit testing or custom handling.
 */
export function checkAndTriggerMatchReminders(
  matches: Match[],
  favoriteIds: string[],
  options?: {
    now?: Date;
    notifyFn?: (title: string, options: NotificationOptions) => void;
    leadMinutes?: number;
  }
): { triggered: string[] } {
  const triggered: string[] = [];
  if (!matches || matches.length === 0 || !favoriteIds || favoriteIds.length === 0) {
    return { triggered };
  }

  const now = options?.now || new Date();
  const leadMinutes = options?.leadMinutes ?? 30; // 30 minutes before match
  const windowMs = leadMinutes * 60 * 1000;
  const notifiedIds = getNotifiedMatchIds();

  for (const match of matches) {
    if (!favoriteIds.includes(match.id)) continue;
    if (match.status === "finished") continue;
    if (notifiedIds.includes(match.id)) continue;

    const matchDate = parseMatchDateTime(match.date, match.time);
    if (!matchDate) continue;

    const diffMs = matchDate.getTime() - now.getTime();

    // Trigger if match is starting in the upcoming window (0 to 30 mins)
    if (diffMs > 0 && diffMs <= windowMs) {
      const remainingMinutes = Math.max(1, Math.round(diffMs / 60000));
      const title = `🔔 Maç Hatırlatması: ${match.home_team} vs ${match.away_team}`;
      const hall = match.hall || (match as any).venue || "Belirtilmedi";
      const body = `Maç ${remainingMinutes} dakika içinde (${match.time}) başlıyor!\nSalon: ${hall}`;

      if (options?.notifyFn) {
        options.notifyFn(title, { body, tag: `match-${match.id}` });
      } else if (isNotificationsEnabled()) {
        try {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: `match-${match.id}`,
          });
        } catch (e) {
          console.error("Notification trigger error:", e);
        }
      }

      markMatchAsNotified(match.id);
      triggered.push(match.id);
    }
  }

  return { triggered };
}
