import { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";

export interface RealtimeMatchUpdate {
  id: string;
  home_score: number | null;
  away_score: number | null;
  set_scores: any[];
  status: string;
  updated_at: string;
}

export interface RealtimeSubscriptionOptions {
  onMatchUpdate?: (match: RealtimeMatchUpdate) => void;
  onMatchInserted?: (match: RealtimeMatchUpdate) => void;
  onMatchDeleted?: (matchId: string) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export class SupabaseRealtimeManager {
  private channel: RealtimeChannel | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private options: RealtimeSubscriptionOptions;
  private matchIds: Set<string> = new Set();

  constructor(options: RealtimeSubscriptionOptions = {}) {
    this.options = options;
  }

  /**
   * Belirli maçlar için Realtime aboneliği başlat
   */
  async subscribeToMatches(matchIds: string[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      this.options.onError?.(new Error("Supabase client yapılandırılmamış"));
      return;
    }

    // Abone olunacak maçları güncelle
    this.matchIds = new Set(matchIds);

    // Eğer zaten bağlıysa, önce aboneliği iptal et
    if (this.channel) {
      await this.unsubscribe();
    }

    // Yeni channel oluştur
    const channelName = `matches-${Date.now()}`;
    this.channel = supabase.channel(channelName);

    // Realtime aboneliği ayarla
    this.channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=in.(${matchIds.join(",")})`,
        },
        (payload) => {
          if (payload.new) {
            this.options.onMatchUpdate?.(payload.new as RealtimeMatchUpdate);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `id=in.(${matchIds.join(",")})`,
        },
        (payload) => {
          if (payload.new) {
            this.options.onMatchInserted?.(payload.new as RealtimeMatchUpdate);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "matches",
          filter: `id=in.(${matchIds.join(",")})`,
        },
        (payload) => {
          if (payload.old) {
            this.options.onMatchDeleted?.(payload.old.id as string);
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime connection status:", status);
        
        switch (status) {
          case "SUBSCRIBED":
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.options.onConnectionChange?.(true);
            break;
          case "CLOSED":
          case "CHANNEL_ERROR":
            this.isConnected = false;
            this.options.onConnectionChange?.(false);
            this.handleReconnect();
            break;
          case "TIMED_OUT":
            this.isConnected = false;
            this.options.onConnectionChange?.(false);
            this.handleReconnect();
            break;
        }
      });
  }

  /**
   * Tüm maçlar için genel Realtime aboneliği
   */
  async subscribeToAllMatches(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      this.options.onError?.(new Error("Supabase client yapılandırılmamış"));
      return;
    }

    if (this.channel) {
      await this.unsubscribe();
    }

    const channelName = `all-matches-${Date.now()}`;
    this.channel = supabase.channel(channelName);

    this.channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
        },
        (payload) => {
          if (payload.new) {
            this.options.onMatchUpdate?.(payload.new as RealtimeMatchUpdate);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
        },
        (payload) => {
          if (payload.new) {
            this.options.onMatchInserted?.(payload.new as RealtimeMatchUpdate);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "matches",
        },
        (payload) => {
          if (payload.old) {
            this.options.onMatchDeleted?.(payload.old.id as string);
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime connection status:", status);
        
        switch (status) {
          case "SUBSCRIBED":
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.options.onConnectionChange?.(true);
            break;
          case "CLOSED":
          case "CHANNEL_ERROR":
            this.isConnected = false;
            this.options.onConnectionChange?.(false);
            this.handleReconnect();
            break;
          case "TIMED_OUT":
            this.isConnected = false;
            this.options.onConnectionChange?.(false);
            this.handleReconnect();
            break;
        }
      });
  }

  /**
   * Aboneliği iptal et
   */
  async unsubscribe(): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
      this.isConnected = false;
      this.options.onConnectionChange?.(false);
    }
  }

  /**
   * Otomatik yeniden bağlanma
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.options.onError?.(
        new Error(`Maksimum yeniden bağlanma denemesi (${this.maxReconnectAttempts}) aşıldı`)
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}, ${delay}ms bekleniyor...`);
    
    setTimeout(async () => {
      if (this.matchIds.size > 0) {
        await this.subscribeToMatches(Array.from(this.matchIds));
      } else {
        await this.subscribeToAllMatches();
      }
    }, delay);
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Channel'ı temizle
   */
  destroy(): void {
    this.unsubscribe();
    this.matchIds.clear();
    this.reconnectAttempts = 0;
  }
}

/**
 * Global Realtime manager instance
 */
let globalRealtimeManager: SupabaseRealtimeManager | null = null;

export function getRealtimeManager(options?: RealtimeSubscriptionOptions): SupabaseRealtimeManager {
  if (!globalRealtimeManager) {
    globalRealtimeManager = new SupabaseRealtimeManager(options);
  }
  return globalRealtimeManager;
}

export function destroyRealtimeManager(): void {
  if (globalRealtimeManager) {
    globalRealtimeManager.destroy();
    globalRealtimeManager = null;
  }
}
