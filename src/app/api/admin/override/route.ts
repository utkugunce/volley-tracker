import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  getOverridesData,
  saveOverridesData,
  MatchOverride,
  AuditLogEntry,
} from "@/utils/overrides";
import { RateLimiter, getClientIp } from "@/utils/rateLimit";
import {
  sanitizeString,
  sanitizeMatchId,
  sanitizeSetScores,
  sanitizeStatus,
} from "@/utils/sanitize";

// Brute-force koruması: 5 dakika içinde 10 hatalı token denemesi -> 15 dakika blok
const adminAuthLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
  blockDurationMs: 15 * 60 * 1000,
});

// Genel istek hız sınırı: dakikada 60 istek
const adminGeneralLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function verifyAdminToken(request: Request): { authorized: boolean; response?: NextResponse } {
  const clientIp = getClientIp(request);

  // 1. Genel hız sınırı kontrolü
  const generalCheck = adminGeneralLimiter.check(clientIp);
  if (!generalCheck.allowed) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Çok fazla istek gönderildi. Lütfen bir süre bekleyin." },
        { status: 429, headers: { "Retry-After": String(generalCheck.retryAfterSeconds || 60) } }
      ),
    };
  }

  // 2. Brute-force blok kontrolü
  const authCheck = adminAuthLimiter.check(clientIp);
  if (!authCheck.allowed) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Güvenlik uyarısı: Çok fazla hatalı token denemesi nedeniyle IP adresiniz geçici olarak kilitlendi." },
        { status: 429, headers: { "Retry-After": String(authCheck.retryAfterSeconds || 900) } }
      ),
    };
  }

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

  // Başarılı giriş yapıldığında bu IP için hatalı giriş sayacını sıfırla
  adminAuthLimiter.reset(clientIp);

  return { authorized: true };
}

export async function GET(request: Request) {
  const auth = verifyAdminToken(request);
  if (!auth.authorized) return auth.response!;

  try {
    const data = await getOverridesData();
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

    // Girdi Doğrulama ve Sanitization
    const safeMatchId = sanitizeMatchId(match_id);
    if (!safeMatchId) {
      return NextResponse.json(
        { error: "match_id alanı geçersiz veya eksik. Yalnızca harf, rakam, tire ve alt çizgi içerebilir." },
        { status: 400 }
      );
    }

    const safeReason = sanitizeString(reason, 500);
    if (!safeReason || safeReason.length === 0) {
      return NextResponse.json(
        { error: "Düzeltme gerekçesi (reason) belirtilmelidir." },
        { status: 400 }
      );
    }

    const safeUpdatedBy = sanitizeString(updated_by || "admin", 50) || "admin";
    const safeSetScores = sanitizeSetScores(set_scores);
    const safeStatus = sanitizeStatus(status || (home_score !== null && away_score !== null ? "finished" : "upcoming"));

    // Skor sayı kontrolü (0 - 3 arası voleybol set skoru)
    let parsedHomeScore: number | null = null;
    let parsedAwayScore: number | null = null;

    if (home_score !== undefined && home_score !== null && home_score !== "") {
      const num = Number(home_score);
      if (isNaN(num) || num < 0 || num > 3) {
        return NextResponse.json({ error: "Ev sahibi set skoru 0 ile 3 arasında bir sayı olmalıdır." }, { status: 400 });
      }
      parsedHomeScore = num;
    }

    if (away_score !== undefined && away_score !== null && away_score !== "") {
      const num = Number(away_score);
      if (isNaN(num) || num < 0 || num > 3) {
        return NextResponse.json({ error: "Deplasman set skoru 0 ile 3 arasında bir sayı olmalıdır." }, { status: 400 });
      }
      parsedAwayScore = num;
    }

    const currentData = await getOverridesData();
    const existingOverride = currentData.overrides[safeMatchId];
    const isUpdate = !!existingOverride;

    const newOverride: MatchOverride = {
      match_id: safeMatchId,
      home_score: parsedHomeScore,
      away_score: parsedAwayScore,
      set_scores: safeSetScores,
      status: safeStatus,
      updated_at: new Date().toISOString(),
      updated_by: safeUpdatedBy,
      reason: safeReason,
    };

    currentData.overrides[safeMatchId] = newOverride;

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      match_id: safeMatchId,
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

    await saveOverridesData(currentData);

    return NextResponse.json({
      success: true,
      override: newOverride,
      audit_entry: auditEntry,
      message: `Maç (#${safeMatchId}) skoru başarıyla güncellendi.`,
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
    const rawMatchId = searchParams.get("match_id");
    const safeMatchId = sanitizeMatchId(rawMatchId);
    const safeReason = sanitizeString(searchParams.get("reason") || "Manuel override kaldırıldı", 255);
    const safeUpdatedBy = sanitizeString(searchParams.get("updated_by") || "admin", 50);

    if (!safeMatchId) {
      return NextResponse.json({ error: "Geçerli bir match_id parametresi gereklidir." }, { status: 400 });
    }

    const currentData = await getOverridesData();
    const existing = currentData.overrides[safeMatchId];

    if (!existing) {
      return NextResponse.json(
        { error: "Bu maç için kayıtlı manuel override bulunamadı." },
        { status: 404 }
      );
    }

    delete currentData.overrides[safeMatchId];

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      match_id: safeMatchId,
      action: "delete",
      timestamp: new Date().toISOString(),
      updated_by: safeUpdatedBy,
      reason: safeReason,
      old_value: existing,
      new_value: null,
    };

    currentData.audit_log.unshift(auditEntry);
    await saveOverridesData(currentData);

    return NextResponse.json({
      success: true,
      match_id: safeMatchId,
      message: `Maç (#${safeMatchId}) üzerindeki manuel override kaldırıldı.`,
    });
  } catch (e: any) {
    console.error("DELETE override error:", e);
    return NextResponse.json(
      { error: `Override silinemedi: ${e.message}` },
      { status: 500 }
    );
  }
}
