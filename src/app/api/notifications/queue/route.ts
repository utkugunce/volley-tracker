import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import { getNotificationQueueManager } from "@/utils/notificationQueue";
import { toErrorLike } from "@/utils/errors";

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUser(request);
  if (!authenticatedUser || (authenticatedUser.role !== "admin" && authenticatedUser.role !== "editor")) {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subscriptionEndpoint, payload, options } = body;

    if (!subscriptionEndpoint || !payload) {
      return NextResponse.json(
        { error: "subscriptionEndpoint ve payload gerekli" },
        { status: 400 }
      );
    }

    const queueManager = getNotificationQueueManager();
    const queueId = await queueManager.addToQueue(subscriptionEndpoint, payload, options);

    if (!queueId) {
      return NextResponse.json(
        { error: "Bildirim kuyruğa eklenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      queueId,
      message: "Bildirim kuyruğa eklendi",
    });
  } catch (error) {
    console.error("Bildirim kuyruğa ekleme hatası:", error);
    return NextResponse.json(
      { error: toErrorLike(error).message || "İşlem hatası" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const authenticatedUser = await getAuthenticatedUser(request);
  if (!authenticatedUser || (authenticatedUser.role !== "admin" && authenticatedUser.role !== "editor")) {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  const queueManager = getNotificationQueueManager();

  if (action === "status") {
    const status = await queueManager.getQueueStatus();
    return NextResponse.json(status);
  }

  if (action === "history") {
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const history = await queueManager.getNotificationHistory(limit, offset);
    return NextResponse.json({ history });
  }

  if (action === "process") {
    const processed = await queueManager.processPendingNotifications();
    return NextResponse.json({
      success: true,
      processed,
      message: `${processed} bildirim işlendi`,
    });
  }

  return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
}
