import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const SCRAPE_WORKFLOW_FILE = "scrape-sync.yml";

export type WorkflowDispatchResult =
  | { status: "dispatched" }
  | { status: "not_configured" }
  | { status: "failed"; httpStatus?: number; error?: string };

/**
 * İstek içinde senkron Python çalıştırmak yerine GitHub Actions üzerindeki
 * tarama workflow'unu (scrape-sync.yml) `workflow_dispatch` ile tetikler.
 * GITHUB_TOKEN/GH_TOKEN ve GITHUB_REPOSITORY tanımlı değilse "not_configured" döner.
 */
export async function dispatchScrapeWorkflow(): Promise<WorkflowDispatchResult> {
  const ghToken = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN)?.trim();
  const repo = process.env.GITHUB_REPOSITORY?.trim();
  if (!ghToken || !repo) {
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
