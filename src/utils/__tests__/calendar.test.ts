import { describe, it, expect } from "vitest";
import {
  compareMatchTimes,
  compareMatchDateTime,
  formatDateTurkish,
  isMatchPassed,
  isMatchOverdueForScore,
} from "../calendar";

describe("Calendar & Match Time Sorting Utilities", () => {
  describe("compareMatchTimes", () => {
    it("erken saatteki maçı her zaman ilk sıraya koyar (kronolojik artan sıra)", () => {
      expect(compareMatchTimes("10:00", "14:00")).toBeLessThan(0);
      expect(compareMatchTimes("14:00", "10:00")).toBeGreaterThan(0);
      expect(compareMatchTimes("09:30", "11:00")).toBeLessThan(0);
      expect(compareMatchTimes("18:45", "19:00")).toBeLessThan(0);
      expect(compareMatchTimes("15:00", "15:00")).toBe(0);
    });

    it("geçersiz veya açıklanmamış saatleri (--:--, TBD, boşluk) listenin sonuna atar", () => {
      expect(compareMatchTimes("10:00", "--:--")).toBeLessThan(0);
      expect(compareMatchTimes("--:--", "10:00")).toBeGreaterThan(0);
      expect(compareMatchTimes("14:00", "TBD")).toBeLessThan(0);
      expect(compareMatchTimes("TBD", "14:00")).toBeGreaterThan(0);
      expect(compareMatchTimes("10:00", "")).toBeLessThan(0);
      expect(compareMatchTimes("", "10:00")).toBeGreaterThan(0);
      expect(compareMatchTimes("--:--", "TBD")).toBe(0);
    });
  });

  describe("compareMatchDateTime", () => {
    it("aynı gün içindeki maçlarda HER ZAMAN erken saatteki maç ilk gösterilir", () => {
      const matchEarly = { date: "2026-09-20", time: "11:00" };
      const matchLate = { date: "2026-09-20", time: "17:30" };

      // Fikstür modunda (asc)
      expect(compareMatchDateTime(matchEarly, matchLate, "asc")).toBeLessThan(0);
      expect(compareMatchDateTime(matchLate, matchEarly, "asc")).toBeGreaterThan(0);

      // Sonuçlar modunda (desc - tarihler geriye doğru dizilirken bile aynı gün içinde erken saat ilk gelir)
      expect(compareMatchDateTime(matchEarly, matchLate, "desc")).toBeLessThan(0);
      expect(compareMatchDateTime(matchLate, matchEarly, "desc")).toBeGreaterThan(0);
    });

    it("farklı tarihlerde dateOrder parametresine göre dizilir", () => {
      const day1 = { date: "2026-09-15", time: "16:00" };
      const day2 = { date: "2026-09-20", time: "10:00" };

      // Fikstür: önce 15 Eylül, sonra 20 Eylül
      expect(compareMatchDateTime(day1, day2, "asc")).toBeLessThan(0);

      // Sonuçlar: önce 20 Eylül, sonra 15 Eylül
      expect(compareMatchDateTime(day1, day2, "desc")).toBeGreaterThan(0);
    });

    it("TBD tarihli maçları daima listenin en sonuna atar", () => {
      const matchTbd = { date: "TBD", time: "10:00" };
      const matchKnown = { date: "2026-09-25", time: "19:00" };

      expect(compareMatchDateTime(matchKnown, matchTbd, "asc")).toBeLessThan(0);
      expect(compareMatchDateTime(matchTbd, matchKnown, "asc")).toBeGreaterThan(0);
      expect(compareMatchDateTime(matchKnown, matchTbd, "desc")).toBeLessThan(0);
    });
  });

  describe("formatDateTurkish", () => {
    it("YYYY-MM-DD formatını Türkçe güne çevirir", () => {
      const formatted = formatDateTurkish("2026-09-18");
      expect(formatted).toContain("Eylül");
      expect(formatted).toContain("2026");
    });

    it("TBD veya boş tarihleri güvenle ele alır", () => {
      expect(formatDateTurkish("TBD")).toBe("TBD");
      expect(formatDateTurkish("")).toBe("");
    });
  });

  describe("isMatchOverdueForScore", () => {
    it("o gün olan maçları (bugün) skorsuz olarak göstermez", () => {
      // Bugün: 2026-09-26, Maç: 2026-09-26 -> false (skorsuz DEĞİL)
      expect(isMatchOverdueForScore("2026-09-26", "2026-09-26")).toBe(false);
    });

    it("gelecek maçları skorsuz olarak göstermez", () => {
      expect(isMatchOverdueForScore("2026-09-27", "2026-09-26")).toBe(false);
      expect(isMatchOverdueForScore("2026-10-01", "2026-09-26")).toBe(false);
    });

    it("dünden ve daha eski tarihlerden kalan maçları skorsuz kabul eder", () => {
      expect(isMatchOverdueForScore("2026-09-25", "2026-09-26")).toBe(true);
      expect(isMatchOverdueForScore("2026-09-20", "2026-09-26")).toBe(true);
    });

    it("TBD veya boş tarihleri skorsuz saymaz", () => {
      expect(isMatchOverdueForScore("TBD", "2026-09-26")).toBe(false);
      expect(isMatchOverdueForScore("", "2026-09-26")).toBe(false);
      expect(isMatchOverdueForScore(undefined, "2026-09-26")).toBe(false);
    });
  });
});
