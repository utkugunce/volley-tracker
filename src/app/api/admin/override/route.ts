import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  getOverridesData,
  saveOverridesData,
  MatchOverride,
  AuditLogEntry,
} from "@/utils/overrides";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function verifyAdminToken(request: Request): { authorized: boolean; response?: NextResponse } {
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) {
    console.error("ADMIN_TOKEN ortam değişkeni tanımlı değil — admin override endpoint devre dışı.");
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Sunucu yapılandırması eksik: ADMIN_TOKEN ortam değişkeni tanımlanmamış." },
        { status: 503 }
      ),
    };
  }

  const authHeader =
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!authHeader || !safeCompare(authHeader, expectedToken)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Yetkisiz işlem: Geçersiz veya eksik admin token." },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}

export async function GET(request: Request) {
  const auth = verifyAdminToken(request);
  if (!auth.authorized) return auth.response!;

  try {
    const data = getOverridesData();
    return NextResponse.json(data);
  } catch (e: any) {
    console.error("GET override error:", e);
    return NextResponse.json({ error: "Düzeltmeler okunamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = verifyAdminToken(request);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await request.json();
    const { match_id, home_score, away_score, set_scores, status, reason, updated_by } = body;

    if (!match_id || typeof match_id !== "string") {
      return NextResponse.json({ error: "match_id alanı zorunludur." }, { status: 400 });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Düzeltme gerekçesi (reason) belirtilmelidir." },
        { status: 400 }
      );
    }

    const currentData = getOverridesData();
    const existingOverride = currentData.overrides[match_id];
    const isUpdate = !!existingOverride;

    const newOverride: MatchOverride = {
      match_id,
      home_score: home_score !== undefined && home_score !== null ? Number(home_score) : null,
      away_score: away_score !== undefined && away_score !== null ? Number(away_score) : null,
      set_scores: Array.isArray(set_scores) ? set_scores : undefined,
      status: status || (home_score !== null && away_score !== null ? "finished" : "upcoming"),
      updated_at: new Date().toISOString(),
      updated_by: updated_by?.trim() || "admin",
      reason: reason.trim(),
    };

    currentData.overrides[match_id] = newOverride;

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      match_id,
      action: isUpdate ? "update" : "create",
      timestamp: new Date().toISOString(),
      updated_by: newOverride.updated_by,
      reason: newOverride.reason,
      old_value: existingOverride || null,
      new_value: newOverride,
    };

    // Keep up to 200 recent audit logs
    currentData.audit_log.unshift(auditEntry);
    if (currentData.audit_log.length > 200) {
      currentData.audit_log = currentData.audit_log.slice(0, 200);
    }

    saveOverridesData(currentData);

    return NextResponse.json({
      success: true,
      override: newOverride,
      audit_entry: auditEntry,
      message: `Maç (#${match_id}) skoru başarıyla güncellendi.`,
    });
  } catch (e: any) {
    console.error("POST override error:", e);
    return NextResponse.json(
      { error: `Düzeltme kaydedilemedi: ${e.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = verifyAdminToken(request);
  if (!auth.authorized) return auth.response!;

  try {
    const { searchParams } = new URL(request.url);
    const match_id = searchParams.get("match_id");
    const reason = searchParams.get("reason") || "Manuel override kaldırıldı";
    const updated_by = searchParams.get("updated_by") || "admin";

    if (!match_id) {
      return NextResponse.json({ error: "match_id parametresi gereklidir." }, { status: 400 });
    }

    const currentData = getOverridesData();
    const existing = currentData.overrides[match_id];

    if (!existing) {
      return NextResponse.json(
        { error: "Bu maç için kayıtlı manuel override bulunamadı." },
        { status: 404 }
      );
    }

    delete currentData.overrides[match_id];

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      match_id,
      action: "delete",
      timestamp: new Date().toISOString(),
      updated_by,
      reason,
      old_value: existing,
      new_value: null,
    };

    currentData.audit_log.unshift(auditEntry);
    saveOverridesData(currentData);

    return NextResponse.json({
      success: true,
      match_id,
      message: `Maç (#${match_id}) üzerindeki manuel override kaldırıldı.`,
    });
  } catch (e: any) {
    console.error("DELETE override error:", e);
    return NextResponse.json(
      { error: `Override silinemedi: ${e.message}` },
      { status: 500 }
    );
  }
}
