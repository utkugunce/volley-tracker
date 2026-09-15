import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  parseMatchDateTime,
  checkAndTriggerMatchReminders,
  isBannerDismissed,
  dismissBanner,
  setNotificationsEnabled,
} from "../notifications";
import { Match } from "@/types/fixture";

describe("Browser Match Reminder Notifications (GÖREV 2)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("parseMatchDateTime", () => {
    it("geçerli tarih ve saati Date nesnesine çevirir", () => {
      const dt = parseMatchDateTime("2026-09-15", "14:30");
      expect(dt).not.toBeNull();
      expect(dt?.getFullYear()).toBe(2026);
      expect(dt?.getMonth()).toBe(8); // September (0-indexed)
      expect(dt?.getDate()).toBe(15);
      expect(dt?.getHours()).toBe(14);
      expect(dt?.getMinutes()).toBe(30);
    });

    it("saat TBD veya eksikse varsayılan 12:00 atar", () => {
      const dt = parseMatchDateTime("2026-09-15", "TBD");
      expect(dt).not.toBeNull();
      expect(dt?.getHours()).toBe(12);
    });

    it("tarih TBD veya boşsa null döner", () => {
      expect(parseMatchDateTime("TBD")).toBeNull();
      expect(parseMatchDateTime("")).toBeNull();
      expect(parseMatchDateTime(undefined)).toBeNull();
    });
  });

  describe("checkAndTriggerMatchReminders", () => {
    const baseMatch: Match = {
      id: "match-fav-1",
      city: "İstanbul",
      date: "2026-09-15",
      time: "15:00",
      hall: "TVF 50. Yıl",
      category: "Genç Kızlar",
      home_team: "Eczacıbaşı",
      away_team: "Fenerbahçe",
      status: "upcoming",
    } as any;

    it("30 dakika içinde başlayacak favori maç için bildirim tetikler", () => {
      // Şimdi: 14:40 (maça 20 dakika var)
      const now = new Date(2026, 8, 15, 14, 40, 0);
      const notifyFn = vi.fn();

      const result = checkAndTriggerMatchReminders([baseMatch], ["match-fav-1"], {
        now,
        notifyFn,
        leadMinutes: 30,
      });

      expect(result.triggered).toContain("match-fav-1");
      expect(notifyFn).toHaveBeenCalledTimes(1);
      expect(notifyFn).toHaveBeenCalledWith(
        expect.stringContaining("Eczacıbaşı vs Fenerbahçe"),
        expect.objectContaining({
          body: expect.stringContaining("20 dakika içinde"),
        })
      );
    });

    it("maç saatine 1 saatten fazla varsa bildirim tetiklemez", () => {
      // Şimdi: 13:00 (maça 2 saat var)
      const now = new Date(2026, 8, 15, 13, 0, 0);
      const notifyFn = vi.fn();

      const result = checkAndTriggerMatchReminders([baseMatch], ["match-fav-1"], {
        now,
        notifyFn,
        leadMinutes: 30,
      });

      expect(result.triggered).toHaveLength(0);
      expect(notifyFn).not.toHaveBeenCalled();
    });

    it("geçmiş maçlar için bildirim tetiklemez", () => {
      // Şimdi: 16:00 (maç başlamış veya bitmiş)
      const now = new Date(2026, 8, 15, 16, 0, 0);
      const notifyFn = vi.fn();

      const result = checkAndTriggerMatchReminders([baseMatch], ["match-fav-1"], {
        now,
        notifyFn,
        leadMinutes: 30,
      });

      expect(result.triggered).toHaveLength(0);
      expect(notifyFn).not.toHaveBeenCalled();
    });

    it("aynı maç için ikinci kez tekrar bildirim göndermez (duplicate önleme)", () => {
      const now = new Date(2026, 8, 15, 14, 45, 0);
      const notifyFn = vi.fn();

      // 1. tetikleme
      checkAndTriggerMatchReminders([baseMatch], ["match-fav-1"], { now, notifyFn });
      expect(notifyFn).toHaveBeenCalledTimes(1);

      // 2. tetikleme aynı anda veya 1 dk sonra
      const secondResult = checkAndTriggerMatchReminders([baseMatch], ["match-fav-1"], { now, notifyFn });
      expect(secondResult.triggered).toHaveLength(0);
      expect(notifyFn).toHaveBeenCalledTimes(1); // Tekrar çağrılmadı
    });

    it("favorilerde olmayan maç için bildirim tetiklemez", () => {
      const now = new Date(2026, 8, 15, 14, 45, 0);
      const notifyFn = vi.fn();

      const result = checkAndTriggerMatchReminders([baseMatch], ["baska-mac-id"], { now, notifyFn });
      expect(result.triggered).toHaveLength(0);
      expect(notifyFn).not.toHaveBeenCalled();
    });
  });

  describe("Banner ve Tercih Yönetimi", () => {
    it("banner reddedildiğinde isBannerDismissed true döner", () => {
      expect(isBannerDismissed()).toBe(false);
      dismissBanner();
      expect(isBannerDismissed()).toBe(true);
    });

    it("bildirim tercihi localStorage'a doğru kaydedilir", () => {
      setNotificationsEnabled(true);
      expect(localStorage.getItem("tvf_notifications_enabled")).toBe("true");

      setNotificationsEnabled(false);
      expect(localStorage.getItem("tvf_notifications_enabled")).toBe("false");
    });
  });
});
