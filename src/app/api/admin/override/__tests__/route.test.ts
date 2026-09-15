import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET, POST, DELETE } from "../route";
import { getOverridesData, applyOverridesToMatches } from "@/utils/overrides";
import { Match } from "@/types/fixture";
import fs from "fs";
import path from "path";

const OVERRIDES_FILE = path.join(process.cwd(), "data", "manual-overrides.json");

describe("Admin Manual Match Override API & Auth (GÖREV 5)", () => {
  const originalEnv = process.env.ADMIN_TOKEN;
  let originalFileContent: string | null = null;

  beforeEach(() => {
    if (fs.existsSync(OVERRIDES_FILE)) {
      originalFileContent = fs.readFileSync(OVERRIDES_FILE, "utf-8");
    }
    // Clean initial state for test
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify({ overrides: {}, audit_log: [] }, null, 2));
  });

  afterEach(() => {
    if (originalFileContent !== null) {
      fs.writeFileSync(OVERRIDES_FILE, originalFileContent);
    }
    if (originalEnv) {
      process.env.ADMIN_TOKEN = originalEnv;
    } else {
      delete process.env.ADMIN_TOKEN;
    }
    vi.restoreAllMocks();
  });

  describe("ADMIN_TOKEN Doğrulaması", () => {
    it("ADMIN_TOKEN env değişkeni tanımlı değilse 503 döner", async () => {
      delete process.env.ADMIN_TOKEN;

      const req = new Request("http://localhost:3000/api/admin/override", {
        headers: { "x-admin-token": "any-token" },
      });

      const res = await GET(req);
      expect(res.status).toBe(503);
    });

    it("geçersiz admin token verildiğinde 401 döner", async () => {
      process.env.ADMIN_TOKEN = "correct-secret-token-2026";

      const req = new Request("http://localhost:3000/api/admin/override", {
        headers: { "x-admin-token": "wrong-token" },
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("doğru x-admin-token verildiğinde 200 döner", async () => {
      process.env.ADMIN_TOKEN = "correct-secret-token-2026";

      const req = new Request("http://localhost:3000/api/admin/override", {
        headers: { "x-admin-token": "correct-secret-token-2026" },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("overrides");
      expect(data).toHaveProperty("audit_log");
    });
  });

  describe("POST ve DELETE Override İşlemleri", () => {
    beforeEach(() => {
      process.env.ADMIN_TOKEN = "test-token";
    });

    it("gerekçe (reason) olmadan gönderilen istek 400 ile reddedilir", async () => {
      const req = new Request("http://localhost:3000/api/admin/override", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "test-token",
        },
        body: JSON.stringify({
          match_id: "match-101",
          home_score: 3,
          away_score: 0,
          reason: "", // Boş gerekçe
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("geçerli skor düzeltmesini kaydeder ve denetim günlüğü (audit log) oluşturur", async () => {
      const req = new Request("http://localhost:3000/api/admin/override", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "test-token",
        },
        body: JSON.stringify({
          match_id: "match-101",
          home_score: 3,
          away_score: 2,
          set_scores: ["25-23", "20-25", "25-22", "19-25", "15-12"],
          status: "finished",
          reason: "TVF bülteninde skor eksikti",
          updated_by: "utku",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.override.home_score).toBe(3);
      expect(json.override.away_score).toBe(2);

      // Dosyadaki kaydı doğrula
      const stored = getOverridesData();
      expect(stored.overrides["match-101"]).toBeDefined();
      expect(stored.overrides["match-101"].home_score).toBe(3);
      expect(stored.audit_log).toHaveLength(1);
      expect(stored.audit_log[0].action).toBe("create");
      expect(stored.audit_log[0].reason).toBe("TVF bülteninde skor eksikti");
    });

    it("DELETE ile override silindiğinde audit loga delete kaydı eklenir", async () => {
      // Önce override ekle
      const currentData = getOverridesData();
      currentData.overrides["match-delete-test"] = {
        match_id: "match-delete-test",
        home_score: 3,
        away_score: 1,
        updated_at: new Date().toISOString(),
        updated_by: "admin",
        reason: "Test",
      };
      fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(currentData, null, 2));

      // DELETE çağır
      const req = new Request("http://localhost:3000/api/admin/override?match_id=match-delete-test", {
        method: "DELETE",
        headers: { "x-admin-token": "test-token" },
      });

      const res = await DELETE(req);
      expect(res.status).toBe(200);

      const afterData = getOverridesData();
      expect(afterData.overrides["match-delete-test"]).toBeUndefined();
      expect(afterData.audit_log[0].action).toBe("delete");
    });
  });

  describe("applyOverridesToMatches", () => {
    it("scraped maç verisi üzerine kayıtlı override skorunu uygular", () => {
      // Override ekle
      const currentData = getOverridesData();
      currentData.overrides["match-scrape-test"] = {
        match_id: "match-scrape-test",
        home_score: 3,
        away_score: 0,
        status: "finished",
        updated_at: new Date().toISOString(),
        updated_by: "admin",
        reason: "Scraped skoru ez",
      };
      fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(currentData, null, 2));

      const mockMatch: Match = {
        id: "match-scrape-test",
        city: "İstanbul",
        date: "2026-09-15",
        time: "14:00",
        hall: "TVF",
        category: "Genç",
        home_team: "Takım A",
        away_team: "Takım B",
        home_score: undefined, // Scraper henüz skor girmemiş
        away_score: undefined,
        status: "upcoming",
      } as any;

      const results = applyOverridesToMatches([mockMatch]);
      expect(results[0].home_score).toBe(3);
      expect(results[0].away_score).toBe(0);
      expect(results[0].status).toBe("finished");
      expect((results[0] as any).manual_override).toBe(true);
    });
  });
});
