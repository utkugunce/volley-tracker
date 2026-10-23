import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import { toErrorLike } from "@/utils/errors";
import {
  extractSyncPasswordFromRequest,
  getLocalFullScrapeJob,
  normalizeGithubRepo,
  verifySyncPasswordFromValue,
} from "@/utils/scrapeTrigger";

export async function GET(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  const provided = extractSyncPasswordFromRequest(request);

  const isLegacyOrSyncAuthorized = Boolean(provided && verifySyncPasswordFromValue(provided));
  let isJwtAuthorized = false;
  if (!isLegacyOrSyncAuthorized) {
    const authUser = await getAuthenticatedUser(request);
    isJwtAuthorized = Boolean(authUser && (authUser.role === "admin" || authUser.role === "editor"));
  }

  if (!isLegacyOrSyncAuthorized && !isJwtAuthorized) {
    if (!adminToken && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "Sunucu yapılandırması eksik: ADMIN_TOKEN veya Supabase Auth tanımlanmamış." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  // 1. Yerel arka plan çekim görevi varsa öncelikle onu döndür
  const localJob = getLocalFullScrapeJob();
  if (localJob) {
    const nowMs = Date.now();
    const createdMs = new Date(localJob.createdAt).getTime();
    const updatedMs = new Date(localJob.updatedAt).getTime();
    // Aktifse veya son 2 dakika içinde tamamlandıysa yerel durumu raporla
    if (localJob.status === "in_progress" || nowMs - updatedMs < 120_000) {
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
      const TOTAL_ESTIMATED_SECONDS = 480;
      const remainingSeconds =
        localJob.status === "completed"
          ? 0
          : Math.max(5, TOTAL_ESTIMATED_SECONDS - elapsedSeconds);

      return NextResponse.json({
        available: true,
        mode: "local",
        runId: localJob.id,
        status: localJob.status,
        conclusion: localJob.conclusion,
        createdAt: localJob.createdAt,
        updatedAt: localJob.updatedAt,
        activeStep: localJob.activeStep,
        elapsedSeconds,
        remainingSeconds,
        totalEstimatedSeconds: TOTAL_ESTIMATED_SECONDS,
      });
    }
  }

  const repo = normalizeGithubRepo(process.env.GITHUB_REPOSITORY);
  if (!repo) {
    return NextResponse.json({
      available: false,
      error: "GITHUB_REPOSITORY ortam değişkeni yapılandırılmamış.",
    });
  }

  const ghToken = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN)?.trim();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "VolleyTracker-App",
  };
  if (ghToken) {
    headers["Authorization"] = `Bearer ${ghToken}`;
  }

  try {
    let latestPersistedSync: Record<string, unknown> | null = null;
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from("sync_runs")
        .select("id, source, status, started_at, finished_at, cities_scanned, matches_imported, error_message, metadata")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        latestPersistedSync = data;
      } else if (error) {
        console.warn("Supabase sync geçmişi okunamadı:", error.message);
      }
    }

    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/scrape-sync.yml/runs?per_page=1`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        available: false,
        error: `GitHub API status ${res.status}`,
      });
    }

    const data = await res.json();
    const latestRun = data.workflow_runs?.[0];

    if (!latestRun) {
      return NextResponse.json({
        available: false,
      });
    }

    let activeStep = "";
    if (latestRun.status === "in_progress" && latestRun.jobs_url) {
      try {
        const jobsRes = await fetch(latestRun.jobs_url, { headers, cache: "no-store" });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const steps: Array<{ name: string; status: string }> =
            jobsData.jobs?.[0]?.steps || [];
          const runningStep = steps.find((s) => s.status === "in_progress");
          if (runningStep) {
            if (runningStep.name.includes("81 provinces") || runningStep.name.includes("Run TVF 81")) {
              activeStep = "TVF 81 il bülteni taranıyor...";
            } else if (runningStep.name.includes("Kadinlar 2. Lig")) {
              activeStep = "TVF Kadınlar 2. Ligi (16 Grup) taranıyor...";
            } else if (runningStep.name.includes("Run TVF")) {
              activeStep = "TVF 81 il bülteni taranıyor...";
            } else if (runningStep.name.includes("Sync Volleybox")) {
              activeStep = "Volleybox maç ve skorları taranıyor...";
            } else if (runningStep.name.includes("Commit")) {
              activeStep = "Güncel veriler depoya yazılıyor...";
            } else {
              activeStep = runningStep.name;
            }
          }
        }
      } catch {
        // ignore job step fetch error
      }
    }

    const nowMs = Date.now();
    const createdMs = new Date(latestRun.created_at).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
    const TOTAL_ESTIMATED_SECONDS = 75;
    const remainingSeconds =
      latestRun.status === "completed"
        ? 0
        : Math.max(5, TOTAL_ESTIMATED_SECONDS - elapsedSeconds);

    return NextResponse.json({
      available: true,
      mode: "github_actions",
      runId: latestRun.id,
      status: latestRun.status, // "queued" | "in_progress" | "completed"
      conclusion: latestRun.conclusion, // "success" | "failure" | "cancelled" | null
      htmlUrl: latestRun.html_url,
      createdAt: latestRun.created_at,
      updatedAt: latestRun.updated_at,
      activeStep,
      elapsedSeconds,
      remainingSeconds,
      totalEstimatedSeconds: TOTAL_ESTIMATED_SECONDS,
      latestPersistedSync,
    });
  } catch (err) {
    return NextResponse.json({
      available: false,
      error: toErrorLike(err).message,
    });
  }
}
