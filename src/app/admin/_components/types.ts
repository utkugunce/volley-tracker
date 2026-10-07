/** /api/admin/users yanıtındaki kullanıcı kaydı. */
export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  created_at?: string;
  last_sign_in_at?: string;
  role_updated_at?: string;
}

/** /api/notifications/queue?action=status yanıtı. */
export interface NotificationQueueStatus {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

export type AdminTab = "matches" | "audit" | "users" | "notifications" | "sync" | "teams" | "clubs";

export type AdminUserRole = "admin" | "editor" | "viewer";

/** Canlı Tarama (GitHub Actions / Local Scraper) durumu. */
export interface AdminSyncStatus {
  inProgress: boolean;
  message: string;
  type: "info" | "success" | "error";
  step?: string;
  remainingSeconds?: number;
}
