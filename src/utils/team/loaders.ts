/** Takım verisi yükleyicileri: 81 il + Kadınlar 2. Lig maç/puan durumu ve kadro önbellekleri. */
import fs from "fs";
import path from "path";
import { Match, StandingItem } from "@/types/fixture";
import { applyOverridesToMatches } from "../overrides";
import { TeamRostersDatabase } from "@/types/roster";
import { isCityHidden } from "../cityHelper";
import { Kadinlar2LigTeam } from "@/types/kadinlar2Lig";
import type { StandingsCityEntry } from "./types";

/** TVF Kadınlar 2. Ligi tarihleri "gg.aa.yyyy" gelir; uygulamanın geri kalanıyla uyumlu ve sıralanabilir ISO biçimine çevirir. */
function normalizeK2Date(raw?: string): string {
  const m = (raw || "").trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : raw || "";
}

let cachedAllData: {
  matches: Match[];
  standingsByCity: Record<string, StandingsCityEntry>;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 1 minute

let cachedRosters: TeamRostersDatabase | null = null;
let rostersTimestamp = 0;

export function loadTeamRosters(): TeamRostersDatabase {
  const now = Date.now();
  if (cachedRosters && now - rostersTimestamp < CACHE_TTL_MS) {
    return cachedRosters;
  }
  const rostersPath = path.join(process.cwd(), "data", "team-rosters.json");
  if (fs.existsSync(rostersPath)) {
    try {
      cachedRosters = JSON.parse(fs.readFileSync(rostersPath, "utf-8"));
      rostersTimestamp = now;
      return cachedRosters || {};
    } catch {
      return {};
    }
  }
  return {};
}

export function extractVolleyboxTeamId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/-t(\d+)$/);
  if (m) return `t${m[1]}`;
  const m2 = url.match(/\/t(\d+)$/);
  if (m2) return `t${m2[1]}`;
  const parts = url.replace(/\/$/, "").split("/").pop()?.split("-") || [];
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].startsWith("t") && /^\d+$/.test(parts[i].slice(1))) {
      return parts[i];
    }
  }
  return null;
}

export function loadAllCityData() {
  const now = Date.now();
  if (cachedAllData && now - cachedAllData.timestamp < CACHE_TTL_MS) {
    return cachedAllData;
  }

  const citiesDir = path.join(process.cwd(), "data", "cities");
  const allMatches: Match[] = [];
  const standingsByCity: Record<string, StandingsCityEntry> = {};

  if (fs.existsSync(citiesDir)) {
    const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const fileSlug = file.replace(".json", "");
      if (isCityHidden(fileSlug)) continue;
      try {
        const fullPath = path.join(citiesDir, file);
        const content = fs.readFileSync(fullPath, "utf-8");
        const parsed = JSON.parse(content);
        const cityName = parsed.city || fileSlug;
        if (isCityHidden(cityName) || isCityHidden(parsed.slug)) continue;

        if (Array.isArray(parsed.matches)) {
          for (const m of parsed.matches) {
            allMatches.push({
              ...m,
              city: m.city || cityName,
            });
          }
        }

        if (parsed.standings && typeof parsed.standings === "object") {
          standingsByCity[cityName] = {
            city: cityName,
            standings: parsed.standings,
          };
        }
      } catch (err) {
        console.error(`Error loading city data for ${file}:`, err);
      }
    }
  }

  // TVF Kadınlar 2. Ligi Verilerini Yükle
  const k2Path = path.join(process.cwd(), "data", "kadinlar_2_lig.json");
  if (fs.existsSync(k2Path)) {
    try {
      const k2Content = fs.readFileSync(k2Path, "utf-8");
      const k2 = JSON.parse(k2Content);

      // 1. Karşılaşmalar
      if (Array.isArray(k2.tum_maclar)) {
        for (const m of k2.tum_maclar) {
          const setScores = m.set_sonuclari
            ? m.set_sonuclari.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];
          let homeScore: number | null = null;
          let awayScore: number | null = null;
          if (m.skor && m.skor.includes("-") && m.skor !== "- : -") {
            const parts = m.skor.split("-").map((s: string) => parseInt(s.trim(), 10));
            if (!isNaN(parts[0]) && !isNaN(parts[1])) {
              homeScore = parts[0];
              awayScore = parts[1];
            }
          }
          allMatches.push({
            id: m.id || `2lig_${m.grup_no}_${m.mac_no}`,
            match_no: m.mac_no || "",
            date: normalizeK2Date(m.tarih),
            time: m.saat || "",
            hall: m.salon || "",
            home_team: m.takim_a,
            away_team: m.takim_b,
            category: "Kadınlar 2. Ligi",
            age_group: "Genç",
            gender: "Kız",
            group: m.grup_adi || `Grup ${m.grup_no}`,
            city: m.sehir || "Türkiye",
            status: m.durum === "BİTTİ" ? "finished" : "upcoming",
            score: m.skor && m.skor !== "- : -" ? m.skor : undefined,
            set_scores: setScores,
            home_score: homeScore,
            away_score: awayScore,
          });
        }
      }

      // 2. Gruplar ve Puan Durumları
      if (Array.isArray(k2.gruplar)) {
        if (!standingsByCity["TVF Kadınlar 2. Ligi"]) {
          standingsByCity["TVF Kadınlar 2. Ligi"] = {
            city: "TVF Kadınlar 2. Ligi",
            standings: {},
          };
        }
        for (const g of k2.gruplar) {
          const groupName = g.grup_adi || `Grup ${g.grup_no}`;
          const table: StandingItem[] = (g.puan_durumu || []).map((t: Kadinlar2LigTeam) => ({
            rank: t.sira || 0,
            team: t.takim_adi,
            played: t.o || 0,
            won: t.g || 0,
            lost: t.m || 0,
            points: t.p || 0,
            sets_won: t.as || 0,
            sets_lost: t.vs || 0,
            set_ratio: String(t.sav || "0"),
            points_won: t.asp || 0,
            points_lost: t.vsp || 0,
            point_ratio: String(t.spav || "0"),
            form: [],
          }));
          standingsByCity["TVF Kadınlar 2. Ligi"].standings[groupName] = table;
        }
      }
    } catch (err) {
      console.error("Error loading kadinlar_2_lig.json in teamData:", err);
    }
  }

  cachedAllData = {
    matches: applyOverridesToMatches(allMatches),
    standingsByCity,
    timestamp: now,
  };

  return cachedAllData;
}
