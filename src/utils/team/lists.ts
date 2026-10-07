/** Takım slug ve liste üretimi (sitemap, karşılaştırma seçicisi). */
import { StandingItem } from "@/types/fixture";
import { slugify } from "../slugify";
import { getVolleyboxMapping, normalizeCitySlug } from "../volleybox";
import { loadAllCityData } from "./loaders";
import type { TeamListItem } from "./types";

export function getAllTeamSlugs(): string[] {
  const { matches, standingsByCity } = loadAllCityData();
  const slugs = new Set<string>();
  const teamCities = new Map<string, Set<string>>();

  const addTeamWithAliases = (name: string, city: string, category?: string) => {
    if (!name) return;
    const s = slugify(name);
    slugs.add(s);
    if (!teamCities.has(s)) teamCities.set(s, new Set());
    teamCities.get(s)!.add(city);

    const map = getVolleyboxMapping(name, category, undefined, city);
    if (map?.matched_as) {
      const ms = slugify(map.matched_as);
      slugs.add(ms);
      if (!teamCities.has(ms)) teamCities.set(ms, new Set());
      teamCities.get(ms)!.add(city);
    }
    if (map?.internal_name) {
      const is = slugify(map.internal_name);
      slugs.add(is);
      if (!teamCities.has(is)) teamCities.set(is, new Set());
      teamCities.get(is)!.add(city);
    }
  };

  for (const m of matches) {
    const mCity = m.city || "İstanbul";
    if (m.home_team) {
      addTeamWithAliases(m.home_team, mCity, m.category);
    }
    if (m.away_team) {
      addTeamWithAliases(m.away_team, mCity, m.category);
    }
  }

  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    for (const groupData of Object.values(cityGroup.standings)) {
      const table: StandingItem[] = Array.isArray(groupData)
        ? groupData
        : groupData?.table || [];
      for (const item of table) {
        if (item.team) {
          addTeamWithAliases(item.team, cityName);
        }
      }
    }
  }

  // Çoklu şehirde oynayan takımlar için şehir önekli slug'ları da ekle (örn: izmir-vakifbank)
  for (const [s, cities] of teamCities.entries()) {
    if (cities.size > 1) {
      for (const c of cities) {
        slugs.add(`${normalizeCitySlug(c)}-${s}`);
      }
    }
  }

  return Array.from(slugs).filter(Boolean);
}

export function getAllTeamsList(): TeamListItem[] {
  const { matches, standingsByCity } = loadAllCityData();
  const map = new Map<string, TeamListItem>();

  const register = (name: string, city: string) => {
    if (!name || name.trim().length < 2) return;
    const cleanSlug = slugify(name);
    if (!map.has(cleanSlug)) {
      map.set(cleanSlug, {
        name: name.trim(),
        slug: cleanSlug,
        city: city || "İstanbul",
      });
    }
  };

  for (const m of matches) {
    if (m.home_team) register(m.home_team, m.city || "İstanbul");
    if (m.away_team) register(m.away_team, m.city || "İstanbul");
  }

  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    for (const groupData of Object.values(cityGroup.standings)) {
      const table: StandingItem[] = Array.isArray(groupData)
        ? groupData
        : groupData?.table || [];
      for (const item of table) {
        if (item.team) {
          register(item.team, cityName);
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"));
}
