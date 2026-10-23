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

export interface SyncStage {
  id: string;
  label: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

const DEFAULT_STAGES: Array<{ id: string; label: string; description: string }> = [
  { id: "prep", label: "Sistem Hazırlığı", description: "Ortam ve scraper motoru başlatılıyor" },
  { id: "provinces", label: "81 İl Altyapı", description: "TVF yerel il bültenleri taranıyor" },
  { id: "k2lig", label: "Kadınlar 2. Ligi", description: "16 grup fikstür ve puan durumları çekiliyor" },
  { id: "volleybox", label: "Volleybox Eşleştirme", description: "Kadrolar, maçlar ve skorlar senkronize ediliyor" },
  { id: "finalize", label: "Kayıt & Canlıya Alma", description: "Veri doğrulama, Supabase ve site güncellemesi" },
];

function computeStagesFromGithubSteps(
  steps: Array<{ name: string; status: string; conclusion?: string | null }>,
  runStatus: string,
  runConclusion?: string | null
): SyncStage[] {
  if (runStatus === "completed" && runConclusion === "success") {
    return DEFAULT_STAGES.map((s) => ({ ...s, status: "completed" }));
  }

  const isProvRunning = steps.some((s) => (s.name.includes("81 provinces") || s.name.includes("Run TVF 81")) && s.status === "in_progress");
  const isProvDone = steps.some((s) => (s.name.includes("81 provinces") || s.name.includes("Run TVF 81")) && s.status === "completed" && s.conclusion === "success");

  const isK2Running = steps.some((s) => s.name.includes("Kadinlar 2. Lig") && s.status === "in_progress");
  const isK2Done = steps.some((s) => s.name.includes("Kadinlar 2. Lig") && s.status === "completed" && s.conclusion === "success");

  const isVboxRunning = steps.some((s) => s.name.includes("Sync Volleybox") && s.status === "in_progress");
  const isVboxDone = steps.some((s) => s.name.includes("Sync Volleybox") && s.status === "completed" && s.conclusion === "success");

  const isFinalRunning = steps.some((s) => (s.name.includes("Commit") || s.name.includes("Validate") || s.name.includes("Supabase") || s.name.includes("city slug")) && s.status === "in_progress");
  const isFinalDone = steps.some((s) => s.name.includes("Commit") && s.status === "completed" && s.conclusion === "success");

  let activeIdx = 0;
  if (isFinalRunning || isFinalDone) activeIdx = 4;
  else if (isVboxRunning || isVboxDone) activeIdx = 3;
  else if (isK2Running || isK2Done) activeIdx = 2;
  else if (isProvRunning || isProvDone) activeIdx = 1;
  else activeIdx = 0;

  return DEFAULT_STAGES.map((s, idx) => {
    let status: SyncStage["status"] = "pending";
    if (runConclusion === "failure" || runConclusion === "cancelled") {
      if (idx < activeIdx) status = "completed";
      else if (idx === activeIdx) status = "failed";
      else status = "pending";
    } else {
      if (idx < activeIdx) status = "completed";
      else if (idx === activeIdx) status = runStatus === "completed" ? "completed" : "in_progress";
      else status = "pending";
    }
    return { ...s, status };
  });
}

function computeStagesFromLocalJob(job: { status: string; conclusion?: string | null; activeStep: string }): SyncStage[] {
  if (job.status === "completed" && job.conclusion === "success") {
    return DEFAULT_STAGES.map((s) => ({ ...s, status: "completed" }));
  }

  const text = (job.activeStep || "").toLowerCase();
  let activeIdx = 1;
  if (text.includes("kadınlar") || text.includes("2. lig")) {
    activeIdx = 2;
  } else if (text.includes("volleybox")) {
    activeIdx = 3;
  } else if (text.includes("doğrulama") || text.includes("kayıt")) {
    activeIdx = 4;
  }

  return DEFAULT_STAGES.map((s, idx) => {
    let status: SyncStage["status"] = "pending";
    if (job.conclusion === "failure" || job.conclusion === "cancelled") {
      if (idx < activeIdx) status = "completed";
      else if (idx === activeIdx) status = "failed";
      else status = "pending";
    } else {
      if (idx < activeIdx) status = "completed";
      else if (idx === activeIdx) status = job.status === "completed" ? "completed" : "in_progress";
      else status = "pending";
    }
    return { ...s, status };
  });
}

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
    if (localJob.status === "in_progress" || nowMs - updatedMs < 120_000) {
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
      const TOTAL_ESTIMATED_SECONDS = 480;
      const remainingSeconds =
        localJob.status === "completed"
          ? 0
          : Math.max(5, TOTAL_ESTIMATED_SECONDS - elapsedSeconds);

      const stages = computeStagesFromLocalJob(localJob);

      return NextResponse.json({
        available: true,
        mode: "local",
        runId: localJob.id,
        status: localJob.status,
        conclusion: localJob.conclusion,
        createdAt: localJob.createdAt,
        updatedAt: localJob.updatedAt,
        activeStep: localJob.activeStep,
        lastCompletedAt: localJob.status === "completed" ? localJob.updatedAt : null,
        stages,
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
    let rawSteps: Array<{ name: string; status: string; conclusion?: string | null }> = [];
    if (latestRun.jobs_url) {
      try {
        const jobsRes = await fetch(latestRun.jobs_url, { headers, cache: "no-store" });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          rawSteps = jobsData.jobs?.[0]?.steps || [];
          const runningStep = rawSteps.find((s) => s.status === "in_progress");
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

    const stages = computeStagesFromGithubSteps(rawSteps, latestRun.status, latestRun.conclusion);

    const nowMs = Date.now();
    const createdMs = new Date(latestRun.created_at).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
    const TOTAL_ESTIMATED_SECONDS = 75;
    const remainingSeconds =
      latestRun.status === "completed"
        ? 0
        : Math.max(5, TOTAL_ESTIMATED_SECONDS - elapsedSeconds);

    const lastCompletedAt =
      latestRun.status === "completed"
        ? latestRun.updated_at
        : (latestPersistedSync?.finished_at as string | undefined) ||
          (latestPersistedSync?.started_at as string | undefined) ||
          latestRun.updated_at;

    return NextResponse.json({
      available: true,
      mode: "github_actions",
      runId: latestRun.id,
      status: latestRun.status, // "queued" | "in_progress" | "completed"
      conclusion: latestRun.conclusion, // "success" | "failure" | "cancelled" | null
      htmlUrl: latestRun.html_url,
      createdAt: latestRun.created_at,
      updatedAt: latestRun.updated_at,
      lastCompletedAt,
      activeStep,
      stages,
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
