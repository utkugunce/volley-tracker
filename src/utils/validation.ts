import { z } from "zod";

// Match validation schemas
export const MatchSchema = z.object({
  id: z.string().optional(),
  home_team: z.string().min(1, "Ev sahibi takım gerekli"),
  away_team: z.string().min(1, "Deplasman takımı gerekli"),
  home_score: z.number().int().min(0).nullable(),
  away_score: z.number().int().min(0).nullable(),
  status: z.enum(["upcoming", "live", "finished", "postponed"]),
  date: z.string().min(1, "Tarih gerekli"),
  time: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  league: z.string().optional(),
  group: z.string().optional(),
  set_scores: z.array(z.string()).optional(),
});

export const CreateMatchSchema = MatchSchema.partial({
  id: true,
}).required({
  home_team: true,
  away_team: true,
  status: true,
  date: true,
});

export const UpdateMatchSchema = MatchSchema.partial();

// Standing validation schemas
export const StandingSchema = z.object({
  id: z.string().optional(),
  team: z.string().min(1, "Takım adı gerekli"),
  played: z.number().int().min(0),
  won: z.number().int().min(0),
  lost: z.number().int().min(0),
  points: z.number().int().min(0),
  group: z.string().optional(),
  city: z.string().optional(),
  league: z.string().optional(),
});

export const CreateStandingSchema = StandingSchema.partial({
  id: true,
}).required({
  team: true,
  played: true,
  won: true,
  lost: true,
  points: true,
});

// User validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  role: z.enum(["admin", "editor", "viewer"]),
});

export const UpdateUserSchema = z.object({
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  email: z.string().email("Geçerli bir email adresi girin").optional(),
});

// Notification validation schemas
export const NotificationSchema = z.object({
  subscription_endpoint: z.string().url("Geçerli bir endpoint URL girin"),
  payload: z.object({
    title: z.string().min(1, "Bildirim başlığı gerekli"),
    body: z.string().min(1, "Bildirim içeriği gerekli"),
    icon: z.string().url().optional(),
    data: z.any().optional(),
  }),
  priority: z.number().int().min(0).max(10).default(0),
  scheduled_for: z.string().optional(),
  idempotency_key: z.string().optional(),
  max_attempts: z.number().int().min(1).max(10).default(3),
});

// Pagination validation schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export type Match = z.infer<typeof MatchSchema>;
export type CreateMatch = z.infer<typeof CreateMatchSchema>;
export type UpdateMatch = z.infer<typeof UpdateMatchSchema>;
export type Standing = z.infer<typeof StandingSchema>;
export type CreateStanding = z.infer<typeof CreateStandingSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
