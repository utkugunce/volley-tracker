import fs from "fs";
import path from "path";
import { execFile, spawn, type ChildProcess } from "child_process";
import { promisify } from "util";
import { timingSafeEqual } from "crypto";

const execFileAsync = promisify(execFile);

export const SCRAPE_WORKFLOW_FILE = "scrape-sync.yml";
export const DEFAULT_SYNC_PASSWORD = "845780";

export type WorkflowDispatchResult =
  | { status: "dispatched" }
  | { status: "not_configured" }
  | { status: "failed"; httpStatus?: number; error?: string };

export type WorkflowCancelResult =
  | { status: "cancelled"; runId?: number; mode: "local" | "github_actions" }
  | { status: "no_active_run" }
  | { status: "not_configured" }
  | { status: "failed"; httpStatus?: number; error?: string };

export interface LocalScrapeJobState {
  id: number;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | null;
  activeStep: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

interface InternalLocalJob {
  state: LocalScrapeJobState;
  proc: ChildProcess | null;
  cancelled: boolean;
}

const globalForScrape = globalThis as unknown as {
  __volleyActiveLocalScrape?: InternalLocalJob | null;
};

export function normalizeGithubRepo(raw?: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
}

function safeCompareStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Yenile / İptal / Durum isteklerinde şifre veya admin token doğrulaması yapar.
 * Varsayılan şifre: process.env.SYNC_PASSWORD || "845780".
 */
export function verifySyncPasswordFromValue(provided: string | null | undefined): boolean {
  if (!provided) return false;
  const trimmed = provided.trim();
  if (!trimmed) return false;

  const syncPassword = (process.env.SYNC_PASSWORD || DEFAULT_SYNC_PASSWORD).trim();
  if (syncPassword && safeCompareStrings(trimmed, syncPassword)) {
    return true;
  }

  const adminToken = process.env.ADMIN_TOKEN?.trim();
  if (adminToken && safeCompareStrings(trimmed, adminToken)) {
    return true;
  }

  return false;
}

export function extractSyncPasswordFromRequest(request: Request, bodyPassword?: string): string | null {
  if (bodyPassword && typeof bodyPassword === "string" && bodyPassword.trim()) {
    return bodyPassword.trim();
  }
  const xSync = request.headers.get("x-sync-password");
  if (xSync) return xSync.trim();
  const xAdmin = request.headers.get("x-admin-token");
  if (xAdmin) return xAdmin.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (auth) return auth.trim();
  return null;
}

/**
 * İstek içinde senkron Python çalıştırmak yerine GitHub Actions üzerindeki
 * tarama workflow'unu (scrape-sync.yml) `workflow_dispatch` ile tetikler.
 * GITHUB_TOKEN/GH_TOKEN ve GITHUB_REPOSITORY tanımlı değilse "not_configured" döner.
 */
export async function dispatchScrapeWorkflow(): Promise<WorkflowDispatchResult> {
  const ghToken = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN)?.trim();
  const repo = normalizeGithubRepo(process.env.GITHUB_REPOSITORY) || "utkugunce/volley-tracker";
  if (!ghToken) {
    return { status: "not_configured" };
  }

  try {
    const dispatchRes = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${SCRAPE_WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "VolleyTracker-App",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    if (dispatchRes.ok || dispatchRes.status === 204) {
      return { status: "dispatched" };
    }
    const errBody = await dispatchRes.text();
    console.error("GitHub Actions dispatch failed:", dispatchRes.status, errBody);
    return { status: "failed", httpStatus: dispatchRes.status };
  } catch (e) {
    console.error("GitHub Actions dispatch error:", e);
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Yerel Python scraper'ları yalnızca geliştirme ortamında çalıştırılabilir. */
export function isLocalScrapeAllowed(): boolean {
  return process.env.NODE_ENV === "development";
}

function resolvePythonBin(): string {
  const venvPyWin = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
  const venvPyNix = path.join(process.cwd(), ".venv", "bin", "python");
  if (fs.existsSync(venvPyWin)) return venvPyWin;
  if (fs.existsSync(venvPyNix)) return venvPyNix;
  return "python";
}

/**
 * Bir Python scraper betiğini asenkron (event loop'u bloklamadan) çalıştırır.
 * Yalnızca NODE_ENV === "development" iken izin verilir; aksi halde hata fırlatır.
 */
export async function runLocalScraper(scriptRelativePath: string, timeoutMs: number): Promise<void> {
  if (!isLocalScrapeAllowed()) {
    throw new Error("Yerel scraper yalnızca geliştirme ortamında çalıştırılabilir.");
  }
  await execFileAsync(resolvePythonBin(), [path.join(/*turbopackIgnore: true*/ process.cwd(), scriptRelativePath)], {
    cwd: process.cwd(),
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function killProcessTree(proc: ChildProcess | null): void {
  if (!proc) return;
  try {
    if (process.platform === "win32" && proc.pid) {
      const killer = spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
      killer.unref();
    }
    proc.kill("SIGTERM");
  } catch {
    // ignore kill errors if process already exited
  }
}

function spawnScriptStep(job: InternalLocalJob, args: string[]): Promise<number | null> {
  return new Promise((resolve, reject) => {
    if (job.cancelled) {
      resolve(null);
      return;
    }
    const pyBin = resolvePythonBin();
    const child = spawn(pyBin, args, {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: "ignore",
    });
    job.proc = child;
    child.on("error", (err) => {
      job.proc = null;
      reject(err);
    });
    child.on("close", (code) => {
      job.proc = null;
      resolve(code);
    });
  });
}

/**
 * Yerel geliştirme ortamında 81 İl (--force) ve Kadınlar 2. Ligi taramalarını
 * arka planda sırayla başlatır ve iptal edilebilir şekilde izler.
 */
export function startLocalFullScrapeJob(): LocalScrapeJobState {
  if (!isLocalScrapeAllowed()) {
    throw new Error("Yerel scraper yalnızca geliştirme ortamında çalıştırılabilir.");
  }

  const existing = globalForScrape.__volleyActiveLocalScrape;
  if (existing && existing.state.status === "in_progress" && !existing.cancelled) {
    return existing.state;
  }

  const nowIso = new Date().toISOString();
  const job: InternalLocalJob = {
    state: {
      id: Date.now(),
      status: "in_progress",
      conclusion: null,
      activeStep: "81 İl Altyapı bültenleri ve Volleybox taranıyor (1/2)...",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    proc: null,
    cancelled: false,
  };

  globalForScrape.__volleyActiveLocalScrape = job;

  (async () => {
    try {
      const script1 = path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts/scrape_all_provinces.py");
      const code1 = await spawnScriptStep(job, [script1, "--force"]);
      if (job.cancelled) return;
      if (code1 !== 0) {
        job.state.status = "completed";
        job.state.conclusion = "failure";
        job.state.activeStep = "81 İl taraması sırasında hata oluştu.";
        job.state.updatedAt = new Date().toISOString();
        return;
      }

      job.state.activeStep = "Kadınlar 2. Ligi (16 Grup) ve Volleybox taranıyor (2/2)...";
      job.state.updatedAt = new Date().toISOString();

      const script2 = path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts/scrape_kadinlar_2_lig.py");
      const code2 = await spawnScriptStep(job, [script2]);
      if (job.cancelled) return;
      if (code2 !== 0) {
        job.state.status = "completed";
        job.state.conclusion = "failure";
        job.state.activeStep = "Kadınlar 2. Ligi taraması sırasında hata oluştu.";
        job.state.updatedAt = new Date().toISOString();
        return;
      }

      job.state.status = "completed";
      job.state.conclusion = "success";
      job.state.activeStep = "Tüm veriler (81 İl ve 2. Lig) başarıyla güncellendi!";
      job.state.updatedAt = new Date().toISOString();
    } catch (err) {
      if (job.cancelled) return;
      job.state.status = "completed";
      job.state.conclusion = "failure";
      job.state.activeStep = "Tarama sırasında beklenmeyen bir hata oluştu.";
      job.state.error = err instanceof Error ? err.message : String(err);
      job.state.updatedAt = new Date().toISOString();
    }
  })();

  return job.state;
}

export function getLocalFullScrapeJob(): LocalScrapeJobState | null {
  return globalForScrape.__volleyActiveLocalScrape?.state ?? null;
}

export function cancelLocalFullScrapeJob(): boolean {
  const active = globalForScrape.__volleyActiveLocalScrape;
  if (!active || active.state.status !== "in_progress") {
    return false;
  }
  active.cancelled = true;
  killProcessTree(active.proc);
  active.proc = null;
  active.state.status = "completed";
  active.state.conclusion = "cancelled";
  active.state.activeStep = "Çekim işlemi kullanıcı tarafından iptal edildi.";
  active.state.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Hem yerel geliştirme sürecini hem de GitHub Actions üzerinde çalışan
 * scrape-sync.yml işini iptal eder.
 */
export async function cancelScrapeWorkflow(runId?: number): Promise<WorkflowCancelResult> {
  if (cancelLocalFullScrapeJob()) {
    return { status: "cancelled", mode: "local" };
  }

  const ghToken = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN)?.trim();
  const repo = normalizeGithubRepo(process.env.GITHUB_REPOSITORY) || "utkugunce/volley-tracker";
  if (!ghToken) {
    return { status: "not_configured" };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${ghToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "VolleyTracker-App",
  };

  try {
    let targetRunId = runId;

    if (!targetRunId) {
      const runsRes = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/${SCRAPE_WORKFLOW_FILE}/runs?per_page=5`,
        { headers, cache: "no-store" }
      );
      if (!runsRes.ok) {
        return { status: "failed", httpStatus: runsRes.status };
      }
      const runsData = await runsRes.json();
      const runs: Array<{ id: number; status: string }> = runsData.workflow_runs || [];
      const activeRun = runs.find((r) => r.status === "in_progress" || r.status === "queued" || r.status === "waiting");
      if (!activeRun) {
        return { status: "no_active_run" };
      }
      targetRunId = activeRun.id;
    }

    const cancelRes = await fetch(
      `https://api.github.com/repos/${repo}/actions/runs/${targetRunId}/cancel`,
      {
        method: "POST",
        headers,
      }
    );

    if (cancelRes.ok || cancelRes.status === 202 || cancelRes.status === 409) {
      return { status: "cancelled", runId: targetRunId, mode: "github_actions" };
    }

    return { status: "failed", httpStatus: cancelRes.status };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}
