import { NextRequest, NextResponse } from "next/server";
import {
  savePushSubscription,
  removePushSubscription,
  StoredSubscription,
} from "@/utils/webPush";
import { RateLimiter } from "@/utils/rateLimit";
import { getRateLimitResponse, validateSameOrigin } from "@/utils/apiSecurity";

const subscriptionLimiter = new RateLimiter({
  name: "notifications-subscribe",
  windowMs: 10 * 60 * 1000,
  maxRequests: 20,
});

const MAX_ENDPOINT_LENGTH = 2048;
const MAX_KEY_LENGTH = 512;
const MAX_FAVORITES = 100;
const MAX_FAVORITE_LENGTH = 200;

/** Push endpoint'i https URL olmalı ve makul uzunlukta olmalıdır. */
function isValidEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > MAX_ENDPOINT_LENGTH) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isValidKey(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_KEY_LENGTH;
}

/**
 * Favori listesi doğrulaması: tanımsız/null ise boş liste; aksi halde en fazla 100 öğelik,
 * her biri en fazla 200 karakterlik string dizisi olmalıdır. Geçersizse null döner.
 */
function parseFavoriteList(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_FAVORITES) return null;
  for (const item of value) {
    if (typeof item !== "string" || item.length > MAX_FAVORITE_LENGTH) return null;
  }
  return value as string[];
}

export async function POST(req: NextRequest) {
  try {
    const originError = validateSameOrigin(req);
    if (originError) return originError;
    const rateLimitError = await getRateLimitResponse(req, subscriptionLimiter);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { subscription, favoriteTeams, favoriteMatches } = body || {};

    if (
      !subscription ||
      typeof subscription !== "object" ||
      !isValidEndpoint(subscription.endpoint) ||
      !subscription.keys ||
      !isValidKey(subscription.keys.p256dh) ||
      !isValidKey(subscription.keys.auth)
    ) {
      return NextResponse.json(
        { error: "Geçersiz push abonelik verisi. Endpoint ve VAPID anahtarları zorunludur." },
        { status: 400 }
      );
    }

    const teams = parseFavoriteList(favoriteTeams);
    const matches = parseFavoriteList(favoriteMatches);
    if (!teams || !matches) {
      return NextResponse.json(
        {
          error: `Geçersiz favori listesi. favoriteTeams ve favoriteMatches en fazla ${MAX_FAVORITES} öğelik, her biri en fazla ${MAX_FAVORITE_LENGTH} karakterlik metin dizisi olmalıdır.`,
        },
        { status: 400 }
      );
    }

    const expirationTime =
      typeof subscription.expirationTime === "number" && Number.isFinite(subscription.expirationTime)
        ? subscription.expirationTime
        : null;

    const newSub: StoredSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      expirationTime,
      favoriteTeams: teams,
      favoriteMatches: matches,
      createdAt: new Date().toISOString(),
    };

    await savePushSubscription(newSub);

    return NextResponse.json({
      ok: true,
      message: "Push aboneliği başarıyla kaydedildi.",
    });
  } catch (err) {
    console.error("Abonelik kaydetme hatası:", err);
    return NextResponse.json(
      { error: "Sunucu hatası: Abonelik kaydedilemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const originError = validateSameOrigin(req);
    if (originError) return originError;
    const rateLimitError = await getRateLimitResponse(req, subscriptionLimiter);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { endpoint } = body || {};

    if (!endpoint || typeof endpoint !== "string" || endpoint.length > MAX_ENDPOINT_LENGTH) {
      return NextResponse.json(
        { error: "Endpoint parametresi zorunludur." },
        { status: 400 }
      );
    }

    await removePushSubscription(endpoint);

    return NextResponse.json({
      ok: true,
      message: "Abonelik başarıyla silindi.",
    });
  } catch (err) {
    console.error("Abonelik silme hatası:", err);
    return NextResponse.json(
      { error: "Sunucu hatası: Abonelik silinemedi." },
      { status: 500 }
    );
  }
}
