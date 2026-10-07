import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execFile, execFileSync } from "child_process";
import { dispatchScrapeWorkflow, isLocalScrapeAllowed, runLocalScraper } from "../scrapeTrigger";
import { GET as fixturesGet } from "@/app/api/fixtures/route";
import { GET as kadinlarGet } from "@/app/api/kadinlar-2-ligi/route";

vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return { ...actual, execFile: vi.fn(), execFileSync: vi.fn() };
});

describe("scrapeTrigger", () => {
  const saved = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GH_TOKEN: process.env.GH_TOKEN,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    delete process.env.GITHUB_REPOSITORY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("geliştirme ortamı dışında yerel scraper'a izin vermez ve Python çalıştırmaz", async () => {
    expect(process.env.NODE_ENV).not.toBe("development");
    expect(isLocalScrapeAllowed()).toBe(false);
    await expect(runLocalScraper("scripts/scrape_all_provinces.py", 1000)).rejects.toThrow();
    expect(vi.mocked(execFile)).not.toHaveBeenCalled();
  });

  it("GitHub token/repo yoksa workflow tetiklemesi not_configured döner", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await dispatchScrapeWorkflow()).toEqual({ status: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("token ve repo varsa scrape-sync.yml workflow_dispatch çağrısı yapar", async () => {
    process.env.GITHUB_TOKEN = "gh-test";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await dispatchScrapeWorkflow()).toEqual({ status: "dispatched" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo/actions/workflows/scrape-sync.yml/dispatches",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("/api/fixtures?refresh=1 üretim modunda istek içinde Python çalıştırmaz, workflow'u tetikler", async () => {
    process.env.ADMIN_TOKEN = "admin-secret";
    process.env.GITHUB_TOKEN = "gh-test";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost:3000/api/fixtures?city=istanbul&refresh=1", {
      headers: { authorization: "Bearer admin-secret", "x-forwarded-for": "198.51.100.10" },
    });
    const res = await fixturesGet(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sync?.mode).toBe("github_actions_dispatch");
    expect(data.sync?.success).toBe(true);
    expect(vi.mocked(execFile)).not.toHaveBeenCalled();
    expect(vi.mocked(execFileSync)).not.toHaveBeenCalled();
  });

  it("/api/kadinlar-2-ligi?refresh=1 üretim modunda Python çalıştırmaz", async () => {
    process.env.ADMIN_TOKEN = "admin-secret";
    const req = new Request("http://localhost:3000/api/kadinlar-2-ligi?refresh=1", {
      headers: { authorization: "Bearer admin-secret", "x-forwarded-for": "198.51.100.11" },
    });
    const res = await kadinlarGet(req);
    expect([200, 404]).toContain(res.status);
    expect(vi.mocked(execFile)).not.toHaveBeenCalled();
    expect(vi.mocked(execFileSync)).not.toHaveBeenCalled();
  });
});
