/**
 * Kulüp paneli sunucu yardımcıları: oturum (çerez), üyelik, yönetici yetkisi, CSRF/hız sınırı.
 * Yalnızca sunucuda (route handler / server component) kullanılır.
 */
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import { RateLimiter, getClientIp } from "@/utils/rateLimit";
import {
  canPerform,
  findApprovedMembership,
  type ClubAction,
  type ClubMembership,
} from "./permissions";

// ---------------------------------------------------------------------------
// Yapılandırma / kurulum durumu
// ---------------------------------------------------------------------------
export function getPublicSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  } catch {
    return null;
  }
  return { url, anonKey };
}

/** Giriş (magic link) için gereken genel anahtarlar tanımlı mı? */
export function isAuthConfigured(): boolean {
  return getPublicSupabaseConfig() !== null;
}

/** Postgres / PostgREST "tablo yok" hatalarını tanır (migration uygulanmamış). */
export function isMissingSchemaError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, message } = error as { code?: string; message?: string };
  if (code === "42P01" || code === "PGRST205" || code === "PGRST204" || code === "42703") return true;
  const text = (message || "").toLowerCase();
  return (
    text.includes("schema cache") ||
    (text.includes("relation") && text.includes("does not exist")) ||
    (text.includes("could not find the table"))
  );
}

export type SetupState = "ready" | "not_configured" | "setup_required";

export function notConfiguredResponse(): NextResponse {
  return NextResponse.json(
    { error: "Kulüp paneli henüz yapılandırılmadı.", code: "not_configured" },
    { status: 503 }
  );
}

export function setupRequiredResponse(): NextResponse {
  return NextResponse.json(
    { error: "Kulüp paneli veritabanı kurulumu bekliyor.", code: "setup_required" },
    { status: 503 }
  );
}

/** Supabase hatasını uygun HTTP yanıtına çevirir (kurulum eksikse 503, aksi halde 500). */
export function dbErrorResponse(error: unknown, logLabel: string): NextResponse {
  if (isMissingSchemaError(error)) return setupRequiredResponse();
  console.error(`[club] ${logLabel}`, error);
  return NextResponse.json({ error: "İşlem şu anda yapılamadı." }, { status: 500 });
}

// ---------------------------------------------------------------------------
// Oturum (çerez tabanlı, @supabase/ssr)
// ---------------------------------------------------------------------------
export async function createSessionClient(): Promise<SupabaseClient | null> {
  const config = getPublicSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component içinde çerez yazılamaz; proxy oturumu yeniler.
        }
      },
    },
  });
}

/** Çerezdeki oturumu Supabase ile doğrulayıp kullanıcıyı döndürür (getUser; sahte çerez geçmez). */
export async function getSessionUser(): Promise<User | null> {
  const client = await createSessionClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

// ---------------------------------------------------------------------------
// Üyelikler
// ---------------------------------------------------------------------------
const MEMBERSHIP_COLUMNS = "id, user_id, club_slug, member_role, status, note, requested_at, decided_at";

export async function fetchMemberships(
  db: SupabaseClient,
  userId: string
): Promise<{ memberships: ClubMembership[]; error: unknown }> {
  const { data, error } = await db
    .from("club_members")
    .select(MEMBERSHIP_COLUMNS)
    .eq("user_id", userId)
    .order("requested_at", { ascending: false });
  if (error) return { memberships: [], error };
  return { memberships: (data ?? []) as ClubMembership[], error: null };
}

export type ClubAuthResult =
  | { ok: true; user: User; membership: ClubMembership; db: SupabaseClient }
  | { ok: false; response: NextResponse };

/**
 * Bir kulüp işlemi için tam yetkilendirme: yapılandırma -> oturum -> onaylı üyelik -> rol izni.
 * Her yazma route'unda ve kulüp-özel okumada çağrılır.
 */
export async function authorizeClubAction(
  clubSlug: string,
  action: ClubAction,
  deps: {
    getUser?: () => Promise<User | null>;
    getDb?: () => SupabaseClient | null;
  } = {}
): Promise<ClubAuthResult> {
  const db = (deps.getDb ?? getSupabaseAdmin)();
  if (!db || !isAuthConfigured()) return { ok: false, response: notConfiguredResponse() };

  const user = await (deps.getUser ?? getSessionUser)();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 }) };
  }

  const { memberships, error } = await fetchMemberships(db, user.id);
  if (error) return { ok: false, response: dbErrorResponse(error, "membership lookup") };

  const membership = findApprovedMembership(memberships, clubSlug);
  if (!membership || !canPerform(membership, clubSlug, action)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 }),
    };
  }
  return { ok: true, user, membership, db };
}

// ---------------------------------------------------------------------------
// Yönetici yetkisi: mevcut ADMIN_TOKEN akışı + Supabase admin rolü (Bearer veya çerez)
// ---------------------------------------------------------------------------
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export type AdminAuthResult =
  | { ok: true; actor: string; db: SupabaseClient }
  | { ok: false; response: NextResponse };

const adminLimiter = new RateLimiter({ name: "club-admin", windowMs: 60_000, maxRequests: 60 });
const adminFailLimiter = new RateLimiter({ name: "club-admin-fail", windowMs: 5 * 60_000, maxRequests: 10, blockDurationMs: 15 * 60_000 });

export async function authorizeAdmin(request: Request): Promise<AdminAuthResult> {
  const db = getSupabaseAdmin();
  if (!db) return { ok: false, response: notConfiguredResponse() };

  const ip = getClientIp(request);
  const general = await adminLimiter.check(ip);
  if (!general.allowed) {
    return { ok: false, response: rateLimited(general.retryAfterSeconds) };
  }

  const provided =
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ||
    null;
  const expected = process.env.ADMIN_TOKEN?.trim();

  // 1) Mevcut ADMIN_TOKEN akışı
  if (expected && provided && safeEqual(provided, expected)) {
    return { ok: true, actor: "admin-token", db };
  }

  // 2) Supabase Bearer erişim jetonu ile admin rolü (mevcut /admin girişi)
  const bearerUser = provided ? await getAuthenticatedUser(request) : null;
  if (bearerUser?.role === "admin") {
    return { ok: true, actor: bearerUser.user.id, db };
  }

  // 3) Magic-link çerez oturumu + admin rolü
  const sessionUser = await getSessionUser().catch(() => null);
  if (sessionUser) {
    const role = await resolveUserRole(db, sessionUser);
    if (role === "admin") return { ok: true, actor: sessionUser.id, db };
  }

  const fail = await adminFailLimiter.check(`${ip}:fail`);
  if (!fail.allowed) return { ok: false, response: rateLimited(fail.retryAfterSeconds) };
  return { ok: false, response: NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 }) };
}

async function resolveUserRole(db: SupabaseClient, user: User): Promise<string> {
  const metaRole = user.app_metadata?.role;
  if (metaRole === "admin" || metaRole === "editor" || metaRole === "viewer") return metaRole;
  const { data } = await db.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
  return typeof data?.role === "string" ? data.role : "viewer";
}

// ---------------------------------------------------------------------------
// İstek koruması
// ---------------------------------------------------------------------------
export function rateLimited(retryAfterSeconds?: number): NextResponse {
  const response = NextResponse.json(
    { error: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin." },
    { status: 429 }
  );
  response.headers.set("Retry-After", String(retryAfterSeconds || 60));
  return response;
}

/**
 * Çerez tabanlı oturumda CSRF savunması: JSON içerik türü zorunlu (basit form POST'ları geçemez)
 * ve Origin başlığı varsa aynı kaynak olmalı.
 */
export function guardMutation(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (origin) {
    let requestOrigin: string;
    try {
      requestOrigin = new URL(request.url).origin;
    } catch {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
    const forwardedHost = request.headers.get("x-forwarded-host");
    const allowed = new Set([requestOrigin]);
    if (forwardedHost) allowed.add(`https://${forwardedHost}`);
    if (!allowed.has(origin)) {
      return NextResponse.json({ error: "Geçersiz istek kaynağı" }, { status: 403 });
    }
  }
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "İçerik türü application/json olmalı." }, { status: 415 });
  }
  return null;
}

/** Kullanıcı başına yazma sınırı (dakikada 40 işlem). */
const mutationLimiter = new RateLimiter({ name: "club-mutation", windowMs: 60_000, maxRequests: 40 });
export async function checkMutationRate(userId: string): Promise<NextResponse | null> {
  const result = await mutationLimiter.check(userId);
  return result.allowed ? null : rateLimited(result.retryAfterSeconds);
}

/** Güvenli JSON gövde okuma (en fazla ~20 KB). */
export async function readJsonBody(request: Request, maxBytes = 20_000): Promise<unknown | null> {
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export { getClientIp };
