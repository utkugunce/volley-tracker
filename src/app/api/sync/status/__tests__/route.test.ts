import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

describe("GET /api/sync/status Authorization & Security", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("ADMIN_TOKEN ortam değişkeni tanımlı değilse 503 döner", async () => {
    delete process.env.ADMIN_TOKEN;

    const req = new NextRequest("http://localhost:3000/api/sync/status");
    const res = await GET(req);

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain("ADMIN_TOKEN");
  });

  it("token gönderilmediğinde veya geçersiz olduğunda 401 döner", async () => {
    process.env.ADMIN_TOKEN = "test-secret-admin-token";

    // Token yok
    const req1 = new NextRequest("http://localhost:3000/api/sync/status");
    const res1 = await GET(req1);
    expect(res1.status).toBe(401);
    const json1 = await res1.json();
    expect(json1.error).toBe("Yetkisiz erişim");

    // Yanlış token
    const req2 = new NextRequest("http://localhost:3000/api/sync/status", {
      headers: { "x-admin-token": "wrong-token" },
    });
    const res2 = await GET(req2);
    expect(res2.status).toBe(401);
  });

  it("GITHUB_REPOSITORY tanımlı değilse 200 döner ancak available: false ve hata mesajı belirtir", async () => {
    process.env.ADMIN_TOKEN = "test-secret-admin-token";
    delete process.env.GITHUB_REPOSITORY;

    const req = new NextRequest("http://localhost:3000/api/sync/status", {
      headers: { "x-admin-token": "test-secret-admin-token" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.available).toBe(false);
    expect(json.error).toContain("GITHUB_REPOSITORY");
  });

  it("geçerli token ve GITHUB_REPOSITORY ile GitHub API yanıtını başarıyla parse eder", async () => {
    process.env.ADMIN_TOKEN = "test-secret-admin-token";
    process.env.GITHUB_REPOSITORY = "test-org/volley-tracker";

    const mockRun = {
      id: 999111,
      status: "in_progress",
      conclusion: null,
      html_url: "https://github.com/test-org/volley-tracker/actions/runs/999111",
      created_at: new Date(Date.now() - 20000).toISOString(),
      updated_at: new Date().toISOString(),
      jobs_url: "https://api.github.com/repos/test-org/volley-tracker/actions/runs/999111/jobs",
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/runs?per_page=1")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ workflow_runs: [mockRun] }),
        });
      }
      if (url.includes("/jobs")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            jobs: [
              {
                steps: [
                  { name: "Set up Python", status: "completed" },
                  { name: "Run TVF 81 provinces scraper", status: "in_progress" },
                ],
              },
            ],
          }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const req = new NextRequest("http://localhost:3000/api/sync/status", {
      headers: { authorization: "Bearer test-secret-admin-token" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.available).toBe(true);
    expect(json.runId).toBe(999111);
    expect(json.status).toBe("in_progress");
    expect(json.activeStep).toBe("TVF 81 il bülteni taranıyor...");
    expect(json.remainingSeconds).toBeGreaterThan(0);
  });
});
