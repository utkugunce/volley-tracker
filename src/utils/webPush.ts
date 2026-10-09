import { createHash } from "crypto";
import path from "path";
import fs from "fs";
import webpush from "web-push";
import { put, list, get, del } from "@vercel/blob";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";
import { toErrorLike } from "@/utils/errors";

export interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
  favoriteTeams?: string[];
  favoriteMatches?: string[];
  createdAt: string;
}

/**
 * Yerel geliştirme için abonelik dosyası. Testlerde PUSH_SUBSCRIPTIONS_FILE ile
 * geçici bir dizine yönlendirilir.
 */
function getSubscriptionsFile(): string {
  return (
    process.env.PUSH_SUBSCRIPTIONS_FILE ||
    path.join(process.cwd(), "data", "push-subscriptions.json")
  );
}

/**
 * Vercel Blob fallback'inde her abonelik ayrı ve özel (private) bir nesnede tutulur:
 * `push-subscriptions/<sha256(endpoint)>.json`. Tek bir dizi dosyasını okuyup tamamen
 * yeniden yazmak eşzamanlı isteklerde kayıp güncellemelere (race) yol açıyordu.
 *
 * Vercel'de erişim türü mağaza (store) düzeyinde belirlenir: private nesneler yalnızca
 * private bir Blob store'a yazılabilir. Bu yüzden abonelikler, mevcut public store'dan
 * (BLOB_READ_WRITE_TOKEN, manuel override'lar için) ayrı bir private store'un token'ı
 * olan PUSH_SUBSCRIPTIONS_BLOB_TOKEN ile saklanır. Bu token yoksa Blob fallback'i
 * kullanılmaz; abonelikler asla herkese açık bir store'a yazılmaz.
 */
export const BLOB_SUBSCRIPTIONS_PREFIX = "push-subscriptions/";
/** Eski (herkese açık, tek dosyalık) blob; ilk okumada özel nesnelere taşınıp silinir. */
const LEGACY_BLOB_FILENAME = "push-subscriptions.json";
const BLOB_READ_CONCURRENCY = 10;
const MAX_LOCAL_SUBSCRIPTIONS = 5000;

let memorySubsCache: StoredSubscription[] | null = null;
let legacyMigrationDone = false;

export const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "";

export const DEFAULT_VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:admin@altyapivoleybol.com.tr";

/** Abonelikler için ayrılmış private Blob store token'ı. */
function getPrivateBlobToken(): string | undefined {
  return process.env.PUSH_SUBSCRIPTIONS_BLOB_TOKEN?.trim() || undefined;
}

/** Eski herkese açık dosyanın bulunabileceği (public) store token'ı. */
function getLegacyPublicBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

export function initVapid(): boolean {
  if (!DEFAULT_VAPID_PUBLIC_KEY || !DEFAULT_VAPID_PRIVATE_KEY) {
    return false;
  }
  try {
    webpush.setVapidDetails(
      DEFAULT_VAPID_SUBJECT,
      DEFAULT_VAPID_PUBLIC_KEY,
      DEFAULT_VAPID_PRIVATE_KEY
    );
    return true;
  } catch (err) {
    console.warn("VAPID yapılandırma uyarısı:", err);
    return false;
  }
}

export function subscriptionBlobPath(endpoint: string): string {
  const hash = createHash("sha256").update(endpoint).digest("hex");
  return `${BLOB_SUBSCRIPTIONS_PREFIX}${hash}.json`;
}

function isStoredSubscription(value: unknown): value is StoredSubscription {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredSubscription>;
  return (
    typeof candidate.endpoint === "string" &&
    !!candidate.keys &&
    typeof candidate.keys.p256dh === "string" &&
    typeof candidate.keys.auth === "string"
  );
}

async function readPrivateBlobJson(pathname: string, token: string): Promise<unknown | null> {
  const result = await get(pathname, { access: "private", useCache: false, token });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return text ? JSON.parse(text) : null;
}

async function writeSubscriptionBlob(sub: StoredSubscription, token: string): Promise<void> {
  await put(subscriptionBlobPath(sub.endpoint), JSON.stringify(sub), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
  });
}

async function listSubscriptionBlobPaths(token: string): Promise<string[]> {
  const pathnames: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: BLOB_SUBSCRIPTIONS_PREFIX, cursor, limit: 1000, token });
    for (const blob of page.blobs) pathnames.push(blob.pathname);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return pathnames;
}

/**
 * Eski sürüm tüm abonelikleri public store'da `access: "public"` ve sabit isimle tek bir
 * dosyada tutuyordu (URL'yi bilen herkes endpoint/anahtarları indirebiliyordu).
 * Güvenli bir hedef (Supabase veya private Blob store) varsa içeriği oraya taşır ve
 * herkese açık dosyayı siler. Güvenli hedef yoksa dosyaya dokunmaz, uyarı loglar.
 */
async function migrateLegacyPublicBlob(): Promise<void> {
  if (legacyMigrationDone) return;
  const publicToken = getLegacyPublicBlobToken();
  if (!publicToken) {
    legacyMigrationDone = true;
    return;
  }
  const { blobs } = await list({ prefix: LEGACY_BLOB_FILENAME, token: publicToken });
  const legacy = blobs.find((b) => b.pathname === LEGACY_BLOB_FILENAME);
  if (!legacy?.url) {
    legacyMigrationDone = true;
    return;
  }

  const supabase = getSupabaseAdmin();
  const privateToken = getPrivateBlobToken();
  if (!supabase && !privateToken) {
    console.warn(
      "Herkese açık eski push-subscriptions.json bulundu fakat güvenli hedef (Supabase veya PUSH_SUBSCRIPTIONS_BLOB_TOKEN) yok; dosya taşınmadı."
    );
    legacyMigrationDone = true;
    return;
  }

  const res = await fetch(legacy.url, { cache: "no-store" });
  if (res.ok) {
    const parsed = await res.json();
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!isStoredSubscription(item)) continue;
        if (supabase) {
          const { error } = await supabase.from("push_subscriptions").upsert(toSupabaseRow(item));
          if (error) throw new Error(`Supabase taşıma hatası: ${error.message}`);
        } else if (privateToken) {
          await writeSubscriptionBlob(item, privateToken);
        }
      }
    }
  }
  await del(legacy.url, { token: publicToken });
  legacyMigrationDone = true;
}

function toSupabaseRow(sub: StoredSubscription) {
  return {
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    expiration_time: sub.expirationTime ?? null,
    favorite_teams: sub.favoriteTeams || [],
    favorite_matches: sub.favoriteMatches || [],
    created_at: sub.createdAt,
    updated_at: new Date().toISOString(),
  };
}

async function readSubscriptionsFromBlob(token: string): Promise<StoredSubscription[]> {
  const pathnames = await listSubscriptionBlobPaths(token);
  const subscriptions: StoredSubscription[] = [];
  for (let i = 0; i < pathnames.length; i += BLOB_READ_CONCURRENCY) {
    const chunk = pathnames.slice(i, i + BLOB_READ_CONCURRENCY);
    const results = await Promise.all(
      chunk.map((pathname) =>
        readPrivateBlobJson(pathname, token).catch((err) => {
          console.warn(`Abonelik blob'u okunamadı (${pathname}):`, err);
          return null;
        })
      )
    );
    for (const item of results) {
      if (isStoredSubscription(item)) subscriptions.push(item);
    }
  }
  subscriptions.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return subscriptions;
}

function readLocalSubscriptions(): StoredSubscription[] {
  try {
    const file = getSubscriptionsFile();
    if (fs.existsSync(/*turbopackIgnore: true*/ file)) {
      const content = fs.readFileSync(/*turbopackIgnore: true*/ file, "utf-8").trim();
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.error("Yerel abonelik dosyası okuma hatası:", err);
  }
  return [];
}

function writeLocalSubscriptions(subs: StoredSubscription[]): void {
  try {
    const file = getSubscriptionsFile();
    const dir = path.dirname(file);
    if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) {
      fs.mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
    }
    fs.writeFileSync(/*turbopackIgnore: true*/ file, JSON.stringify(subs, null, 2), "utf-8");
  } catch {
    // Vercel read-only diskte beklenen durum
  }
}

function updateMemoryCache(updater: (current: StoredSubscription[]) => StoredSubscription[]): void {
  if (memorySubsCache) memorySubsCache = updater(memorySubsCache);
}

/**
 * Tüm push aboneliklerini getirir (Supabase, Vercel Blob veya yerel depolama).
 */
export async function getPushSubscriptions(): Promise<StoredSubscription[]> {
  try {
    await migrateLegacyPublicBlob();
  } catch (err) {
    console.warn("Eski herkese açık abonelik blob'u taşınamadı:", err);
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, expiration_time, favorite_teams, favorite_matches, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const subscriptions = data.map((row) => ({
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
        expirationTime: row.expiration_time ?? null,
        favoriteTeams: Array.isArray(row.favorite_teams) ? row.favorite_teams : [],
        favoriteMatches: Array.isArray(row.favorite_matches) ? row.favorite_matches : [],
        createdAt: row.created_at,
      }));
      memorySubsCache = subscriptions;
      return subscriptions;
    }
    if (error) console.warn("Supabase push abonelik okuma hatası (fallback'e dönülüyor):", error.message);
  }

  const privateToken = getPrivateBlobToken();
  if (privateToken) {
    try {
      const subscriptions = await readSubscriptionsFromBlob(privateToken);
      memorySubsCache = subscriptions;
      return subscriptions;
    } catch (err) {
      console.warn("Vercel Blob abonelik okuma hatası (fallback'e dönülüyor):", err);
    }
  }

  if (memorySubsCache) {
    return memorySubsCache;
  }

  const local = readLocalSubscriptions();
  if (local.length) memorySubsCache = local;
  return local;
}

/**
 * Yeni veya güncellenmiş push aboneliğini kaydeder.
 * Supabase'de tek satır upsert edilir; Blob'da yalnızca bu aboneliğin kendi nesnesi yazılır.
 * Hiçbir yolda tüm abonelik listesi okunup yeniden yazılmaz (yerel dev dosyası hariç).
 */
export async function savePushSubscription(sub: StoredSubscription): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("push_subscriptions").upsert(toSupabaseRow(sub));
    if (!error) {
      updateMemoryCache((current) => [sub, ...current.filter((item) => item.endpoint !== sub.endpoint)]);
      return;
    }
    console.warn("Supabase push abonelik yazma hatası (fallback'e dönülüyor):", error.message);
  }

  const privateToken = getPrivateBlobToken();
  if (privateToken) {
    try {
      let merged = sub;
      const existing = await readPrivateBlobJson(subscriptionBlobPath(sub.endpoint), privateToken).catch(
        () => null
      );
      if (isStoredSubscription(existing)) {
        // orijinal oluşturma tarihini koru
        merged = { ...existing, ...sub, createdAt: existing.createdAt || sub.createdAt };
      }
      await writeSubscriptionBlob(merged, privateToken);
      updateMemoryCache((current) => [merged, ...current.filter((item) => item.endpoint !== sub.endpoint)]);
      return;
    } catch (err) {
      console.error("Vercel Blob abonelik kaydetme hatası:", err);
    }
  }

  // Yerel geliştirme fallback'i (tek süreç): dosyadaki listeyi güncelle
  const current = memorySubsCache ?? readLocalSubscriptions();
  const index = current.findIndex((item) => item.endpoint === sub.endpoint);
  let updated: StoredSubscription[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = {
      ...updated[index],
      ...sub,
      createdAt: updated[index].createdAt, // orijinal oluşturma tarihini koru
    };
  } else {
    updated = [sub, ...current];
  }
  if (updated.length > MAX_LOCAL_SUBSCRIPTIONS) {
    updated = updated.slice(0, MAX_LOCAL_SUBSCRIPTIONS);
  }
  memorySubsCache = updated;
  writeLocalSubscriptions(updated);
}

/**
 * Belirtilen endpoint'e sahip aboneliği siler.
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  updateMemoryCache((current) => current.filter((item) => item.endpoint !== endpoint));

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    if (!error) return;
    console.warn("Supabase push abonelik silme hatası (fallback'e dönülüyor):", error.message);
  }

  const privateToken = getPrivateBlobToken();
  if (privateToken) {
    try {
      await del(subscriptionBlobPath(endpoint), { token: privateToken });
      return;
    } catch (err) {
      console.error("Vercel Blob abonelik silme hatası:", err);
    }
  }

  const local = readLocalSubscriptions();
  const filtered = local.filter((item) => item.endpoint !== endpoint);
  if (filtered.length !== local.length) {
    writeLocalSubscriptions(filtered);
  }
}

/**
 * Web Push üzerinden tek bir aboneye bildirim gönderir.
 * Endpoint 410 Gone / 404 Not Found dönerse aboneliği otomatik temizler.
 */
export async function sendWebPush(
  sub: StoredSubscription,
  payload: { title: string; body: string; data?: unknown; tag?: string }
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const initialized = initVapid();
  if (!initialized) {
    return {
      success: false,
      error: "VAPID anahtarları yapılandırılmamış (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY eksik).",
    };
  }

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  };

  try {
    const res = await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    return { success: true, statusCode: res.statusCode };
  } catch (err) {
    const { statusCode, message } = toErrorLike(err);
    // 410 Gone veya 404 Not Found durumunda artık geçersiz olan bu aboneliği kaldır
    if (statusCode === 410 || statusCode === 404) {
      await removePushSubscription(sub.endpoint);
    }
    return { success: false, statusCode, error: message };
  }
}
