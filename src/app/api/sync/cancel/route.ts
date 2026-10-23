import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import {
  cancelScrapeWorkflow,
  extractSyncPasswordFromRequest,
  verifySyncPasswordFromValue,
} from "@/utils/scrapeTrigger";

export async function POST(request: Request) {
  let bodyPassword: string | undefined;
  let runId: number | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.password === "string") {
      bodyPassword = body.password;
    }
    if (body && typeof body.runId === "number") {
      runId = body.runId;
    }
  } catch {
    // ignore empty body
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
      { ok: false, error: "Yetkisiz işlem: Geçerli şifre gerekli." },
      { status: 401 }
    );
  }

  const result = await cancelScrapeWorkflow(runId);

  if (result.status === "cancelled" || result.status === "no_active_run" || result.status === "not_configured") {
    return NextResponse.json({
      ok: true,
      status: result.status,
      runId: result.status === "cancelled" ? result.runId : undefined,
      message: "Çekim işlemi iptal edildi.",
    });
  }

  return NextResponse.json(
    {
      ok: false,
      status: result.status,
      error: result.error || `İptal isteği başarısız oldu${result.httpStatus ? ` (HTTP ${result.httpStatus})` : ""}.`,
    },
    { status: 502 }
  );
}
