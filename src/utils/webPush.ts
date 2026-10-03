import path from "path";
import fs from "fs";
import webpush from "web-push";
import { put, list } from "@vercel/blob";
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

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), "data", "push-subscriptions.json");
const BLOB_FILENAME = "push-subscriptions.json";

let memorySubsCache: StoredSubscription[] | null = null;

export const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "";

export const DEFAULT_VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:admin@altyapivoleybol.com.tr";

function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
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

/**
 * Tüm push aboneliklerini getirir (Vercel Blob veya yerel depolama).
 */
export async function getPushSubscriptions(): Promise<StoredSubscription[]> {
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

  if (isBlobConfigured()) {
    try {
      const { blobs } = await list({ prefix: BLOB_FILENAME });
      const target = blobs.find((b) => b.pathname === BLOB_FILENAME) || blobs[0];

      if (target && target.url) {
        const res = await fetch(target.url, { cache: "no-store" });
        if (res.ok) {
          const parsed = await res.json();
          if (Array.isArray(parsed)) {
            memorySubsCache = parsed;
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn("Vercel Blob abonelik okuma hatası (fallback'e dönülüyor):", err);
    }
  }

  if (memorySubsCache) {
    return memorySubsCache;
  }

  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const content = fs.readFileSync(SUBSCRIPTIONS_FILE, "utf-8").trim();
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          memorySubsCache = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error("Yerel abonelik dosyası okuma hatası:", err);
  }

  return [];
}

/**
 * Yeni veya güncellenmiş push aboneliğini kaydeder.
 */
export async function savePushSubscription(sub: StoredSubscription): Promise<void> {
  const current = await getPushSubscriptions();
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

  // Maksimum 5000 abonelik tut
  if (updated.length > 5000) {
    updated = updated.slice(0, 5000);
  }

  memorySubsCache = updated;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("push_subscriptions").upsert({
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      expiration_time: sub.expirationTime ?? null,
      favorite_teams: sub.favoriteTeams || [],
      favorite_matches: sub.favoriteMatches || [],
      created_at: sub.createdAt,
      updated_at: new Date().toISOString(),
    });
    if (!error) return;
    console.warn("Supabase push abonelik yazma hatası (fallback'e dönülüyor):", error.message);
  }

  // 1. Vercel Blob'a yaz
  if (isBlobConfigured()) {
    try {
      await put(BLOB_FILENAME, JSON.stringify(updated, null, 2), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } catch (err) {
      console.error("Vercel Blob abonelik kaydetme hatası:", err);
    }
  }

  // 2. Yerel dosya sistemine yazmayı dene
  try {
    const dir = path.dirname(SUBSCRIPTIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch {
    // Vercel read-only diskte beklenen durum
  }
}

/**
 * Belirtilen endpoint'e sahip aboneliği siler.
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  const current = await getPushSubscriptions();
  const filtered = current.filter((item) => item.endpoint !== endpoint);

  memorySubsCache = filtered;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    if (!error) return;
    console.warn("Supabase push abonelik silme hatası (fallback'e dönülüyor):", error.message);
  }

  if (isBlobConfigured()) {
    try {
      await put(BLOB_FILENAME, JSON.stringify(filtered, null, 2), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } catch (err) {
      console.error("Vercel Blob abonelik silme hatası:", err);
    }
  }

  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  } catch {
    // Read-only filesystem
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
