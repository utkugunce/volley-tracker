import { NextRequest, NextResponse } from "next/server";
import {
  savePushSubscription,
  removePushSubscription,
  StoredSubscription,
} from "@/utils/webPush";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, favoriteTeams, favoriteMatches } = body || {};

    if (
      !subscription ||
      typeof subscription.endpoint !== "string" ||
      !subscription.endpoint ||
      !subscription.keys ||
      typeof subscription.keys.p256dh !== "string" ||
      typeof subscription.keys.auth !== "string"
    ) {
      return NextResponse.json(
        { error: "Geçersiz push abonelik verisi. Endpoint ve VAPID anahtarları zorunludur." },
        { status: 400 }
      );
    }

    const newSub: StoredSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      expirationTime: subscription.expirationTime ?? null,
      favoriteTeams: Array.isArray(favoriteTeams) ? favoriteTeams : [],
      favoriteMatches: Array.isArray(favoriteMatches) ? favoriteMatches : [],
      createdAt: new Date().toISOString(),
    };

    await savePushSubscription(newSub);

    return NextResponse.json({
      ok: true,
      message: "Push aboneliği başarıyla kaydedildi.",
    });
  } catch (err: any) {
    console.error("Abonelik kaydetme hatası:", err);
    return NextResponse.json(
      { error: "Sunucu hatası: Abonelik kaydedilemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body || {};

    if (!endpoint || typeof endpoint !== "string") {
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
  } catch (err: any) {
    console.error("Abonelik silme hatası:", err);
    return NextResponse.json(
      { error: "Sunucu hatası: Abonelik silinemedi." },
      { status: 500 }
    );
  }
}
