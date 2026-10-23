import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import {
  dispatchScrapeWorkflow,
  extractSyncPasswordFromRequest,
  isLocalScrapeAllowed,
  startLocalFullScrapeJob,
  verifySyncPasswordFromValue,
} from "@/utils/scrapeTrigger";

export async function POST(request: Request) {
  let bodyPassword: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.password === "string") {
      bodyPassword = body.password;
    }
  } catch {
    // body may be empty if header is used
  }

  const provided = extractSyncPasswordFromRequest(request, bodyPassword);
  const isPasswordAuthorized = verifySyncPasswordFromValue(provided);

  let isJwtAuthorized = false;
  if (!isPasswordAuthorized) {
    const authUser = await getAuthenticatedUser(request);
    isJwtAuthorized = Boolean(authUser && (authUser.role === "admin" || authUser.role === "editor"));
  }

  if (!isPasswordAuthorized && !isJwtAuthorized) {
    return NextResponse.json(
      { ok: false, error: "Hatalı şifre! Lütfen şifreyi kontrol edip tekrar deneyin." },
      { status: 401 }
    );
  }

  if (isLocalScrapeAllowed()) {
    try {
      const job = startLocalFullScrapeJob();
      return NextResponse.json({
        ok: true,
        mode: "local",
        runId: job.id,
        status: job.status,
        activeStep: job.activeStep,
        startedAt: job.createdAt,
        message: "81 İl Altyapı ve Kadınlar 2. Ligi çekim işlemi başlatıldı.",
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: err instanceof Error ? err.message : "Yerel çekim işlemi başlatılamadı.",
        },
        { status: 500 }
      );
    }
  }

  const dispatch = await dispatchScrapeWorkflow();
  if (dispatch.status === "dispatched") {
    return NextResponse.json({
      ok: true,
      mode: "github_actions",
      status: "in_progress",
      activeStep: "81 İl ve Kadınlar 2. Ligi taraması başlatılıyor...",
      startedAt: new Date().toISOString(),
      message: "81 İl Altyapı ve Kadınlar 2. Ligi çekim işlemi başlatıldı.",
    });
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        dispatch.status === "not_configured"
          ? "Çekim servisi yapılandırılmamış (GITHUB_TOKEN / GITHUB_REPOSITORY eksik)."
          : `Çekim servisi başlatılamadı${dispatch.httpStatus ? ` (HTTP ${dispatch.httpStatus})` : ""}.`,
    },
    { status: 502 }
  );
}
