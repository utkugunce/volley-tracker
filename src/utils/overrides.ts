import fs from "fs";
import path from "path";
import { Match } from "@/types/fixture";

export interface MatchOverride {
  match_id: string;
  home_score: number | null;
  away_score: number | null;
  set_scores?: string[];
  status?: "upcoming" | "finished" | "live";
  updated_at: string;
  updated_by: string;
  reason: string;
}

export interface AuditLogEntry {
  id: string;
  match_id: string;
  action: "create" | "update" | "delete";
  timestamp: string;
  updated_by: string;
  reason: string;
  old_value?: Partial<MatchOverride> | null;
  new_value?: Partial<MatchOverride> | null;
}

export interface OverridesData {
  overrides: Record<string, MatchOverride>;
  audit_log: AuditLogEntry[];
}

const OVERRIDES_FILE = path.join(process.cwd(), "data", "manual-overrides.json");

export function getOverridesData(): OverridesData {
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const content = fs.readFileSync(OVERRIDES_FILE, "utf-8").trim();
      if (!content) return { overrides: {}, audit_log: [] };
      const parsed = JSON.parse(content);
      return {
        overrides: parsed.overrides || {},
        audit_log: Array.isArray(parsed.audit_log) ? parsed.audit_log : [],
      };
    }
  } catch (e) {
    console.error("Error reading manual-overrides.json:", e);
  }
  return { overrides: {}, audit_log: [] };
}

export function saveOverridesData(data: OverridesData): void {
  try {
    const dir = path.dirname(OVERRIDES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing manual-overrides.json:", e);
    throw new Error("Manuel düzeltmeler dosyasına yazılamadı");
  }
}

export function applyOverridesToMatches(matches: Match[]): Match[] {
  const { overrides } = getOverridesData();
  if (!overrides || Object.keys(overrides).length === 0) {
    return matches;
  }

  return matches.map((m) => {
    const override = overrides[m.id];
    if (!override) return m;

    return {
      ...m,
      home_score: override.home_score !== undefined ? (override.home_score ?? undefined) : m.home_score,
      away_score: override.away_score !== undefined ? (override.away_score ?? undefined) : m.away_score,
      set_scores: override.set_scores !== undefined ? override.set_scores : (m as any).set_scores,
      status: override.status || m.status,
      manual_override: true,
      override_meta: {
        updated_at: override.updated_at,
        updated_by: override.updated_by,
        reason: override.reason,
      },
    } as Match;
  });
}
