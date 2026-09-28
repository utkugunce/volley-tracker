import { getSupabaseAdmin } from "./supabaseAdmin";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

export interface QueuedNotification {
  id: string;
  subscription_endpoint: string;
  payload: NotificationPayload;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  priority: number;
  scheduled_for: string;
  attempts: number;
  max_attempts: number;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  error_message: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  subscription_endpoint: string;
  payload: NotificationPayload;
  status: 'sent' | 'failed' | 'cancelled';
  sent_at: string | null;
  error_message: string | null;
  delivery_time_ms: number | null;
  idempotency_key: string | null;
  created_at: string;
}

export class NotificationQueueManager {
  private isProcessing = false;
  private batchSize = 10;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Bildirimi kuyruğa ekle (idempotency ile)
   */
  async addToQueue(
    subscriptionEndpoint: string,
    payload: NotificationPayload,
    options: {
      priority?: number;
      scheduledFor?: Date;
      idempotencyKey?: string;
      maxAttempts?: number;
    } = {}
  ): Promise<string | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error("Supabase yapılandırılmamış");
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('add_to_queue', {
        p_subscription_endpoint: subscriptionEndpoint,
        p_payload: payload,
        p_priority: options.priority || 0,
        p_scheduled_for: options.scheduledFor?.toISOString() || new Date().toISOString(),
        p_idempotency_key: options.idempotencyKey || null,
        p_max_attempts: options.maxAttempts || 3,
      });

      if (error) throw error;

      return data as string;
    } catch (error) {
      console.error("Bildirim kuyruğa ekleme hatası:", error);
      return null;
    }
  }

  /**
   * Bekleyen bildirimleri işle
   */
  async processPendingNotifications(): Promise<number> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error("Supabase yapılandırılmış");
      return 0;
    }

    if (this.isProcessing) {
      console.log("Zaten işleniyor, atlanıyor");
      return 0;
    }

    this.isProcessing = true;

    try {
      // Bekleyen bildirimleri al
      const { data: notifications, error } = await supabase.rpc('get_pending_notifications', {
        p_limit: this.batchSize,
      });

      if (error) throw error;

      const pendingNotifications = notifications as QueuedNotification[];
      console.log(`${pendingNotifications.length} bekleyen bildirim işleniyor`);

      let processedCount = 0;

      for (const notification of pendingNotifications) {
        try {
          // Durumu processing olarak güncelle
          await supabase
            .from('notification_queue')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', notification.id);

          // Bildirimi gönder
          const deliveryTime = await this.sendNotification(
            notification.subscription_endpoint,
            notification.payload
          );

          // Başarılı olarak işaretle
          await supabase.rpc('mark_notification_sent', {
            p_queue_id: notification.id,
            p_delivery_time_ms: deliveryTime,
          });

          processedCount++;
        } catch (error: any) {
          console.error(`Bildirim gönderme hatası (${notification.id}):`, error);

          // Başarısız olarak işaretle ve retry planla
          await supabase.rpc('mark_notification_failed', {
            p_queue_id: notification.id,
            p_error_message: error.message || 'Bilinmeyen hata',
            p_response_code: null,
            p_response_body: null,
          });
        }
      }

      return processedCount;
    } catch (error) {
      console.error("Bildirim işleme hatası:", error);
      return 0;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Bildirim gönderme (web-push)
   */
  private async sendNotification(
    subscriptionEndpoint: string,
    payload: NotificationPayload
  ): Promise<number> {
    const startTime = Date.now();

    // Burada web-push kullanarak bildirim gönderilecek
    // Şimdilik simülasyon
    console.log(`Bildirim gönderiliyor: ${subscriptionEndpoint}`, payload);

    // Simüle edilmiş teslimat süresi
    await new Promise(resolve => setTimeout(resolve, 100));

    return Date.now() - startTime;
  }

  /**
   * Otomatik işlemeyi başlat
   */
  startAutoProcessing(intervalMs: number = 60000) {
    if (this.processingInterval) {
      console.log("Otomatik işlem zaten çalışıyor");
      return;
    }

    console.log(`Otomatik bildirim işlemesi başlatıldı (${intervalMs}ms aralıklık)`);

    this.processingInterval = setInterval(async () => {
      await this.processPendingNotifications();
    }, intervalMs);
  }

  /**
   * Otomatik işlemeyi durdur
   */
  stopAutoProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("Otomatik bildirim işlemesi durduruldu");
    }
  }

  /**
   * Bildirim geçmişini al
   */
  async getNotificationHistory(
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationHistory[]> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data as NotificationHistory[];
    } catch (error) {
      console.error("Bildirim geçmişi alma hatası:", error);
      return [];
    }
  }

  /**
   * Kuyruk durumunu al
   */
  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  }> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { pending: 0, processing: 0, sent: 0, failed: 0 };
    }

    try {
      const { data: queueData, error: queueError } = await supabase
        .from('notification_queue')
        .select('status');

      if (queueError) throw queueError;

      const { data: historyData, error: historyError } = await supabase
        .from('notification_history')
        .select('status');

      if (historyError) throw historyError;

      const queueStatus = queueData.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, { pending: 0, processing: 0, sent: 0, failed: 0 });

      const historyStatus = historyData.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, { sent: 0, failed: 0, cancelled: 0 });

      return {
        pending: queueStatus.pending,
        processing: queueStatus.processing,
        sent: historyStatus.sent,
        failed: queueStatus.failed + historyStatus.failed,
      };
    } catch (error) {
      console.error("Kuyruk durumu alma hatası:", error);
      return { pending: 0, processing: 0, sent: 0, failed: 0 };
    }
  }
}

// Global instance
let globalQueueManager: NotificationQueueManager | null = null;

export function getNotificationQueueManager(): NotificationQueueManager {
  if (!globalQueueManager) {
    globalQueueManager = new NotificationQueueManager();
  }
  return globalQueueManager;
}

export function destroyNotificationQueueManager(): void {
  if (globalQueueManager) {
    globalQueueManager.stopAutoProcessing();
    globalQueueManager = null;
  }
}
