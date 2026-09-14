import { NextResponse } from "next/server";

export async function GET() {
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
    const res = await fetch(
      "https://api.github.com/repos/utkugunce/volley-tracker/actions/workflows/scrape-sync.yml/runs?per_page=1",
      {
        headers,
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        available: false,
        error: `GitHub API status ${res.status}`,
        fallbackUrl: "https://github.com/utkugunce/volley-tracker/actions",
      });
    }

    const data = await res.json();
    const latestRun = data.workflow_runs?.[0];

    if (!latestRun) {
      return NextResponse.json({
        available: false,
        fallbackUrl: "https://github.com/utkugunce/volley-tracker/actions",
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
            if (runningStep.name.includes("Run TVF")) {
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

    return NextResponse.json({
      available: true,
      runId: latestRun.id,
      status: latestRun.status, // "queued" | "in_progress" | "completed"
      conclusion: latestRun.conclusion, // "success" | "failure" | null
      htmlUrl: latestRun.html_url,
      createdAt: latestRun.created_at,
      updatedAt: latestRun.updated_at,
      activeStep,
    });
  } catch (err: any) {
    return NextResponse.json({
      available: false,
      error: err.message,
      fallbackUrl: "https://github.com/utkugunce/volley-tracker/actions",
    });
  }
}
