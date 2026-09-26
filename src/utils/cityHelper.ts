import fs from "fs";
import path from "path";
import { slugify } from "./slugify";
import { HIDDEN_CITY_SLUGS, isCityHidden } from "./hiddenCities";

export { HIDDEN_CITY_SLUGS, isCityHidden };

export interface CityEntry {
  ilid: string;
  name: string;
  slug: string;
  matches_count?: number;
}

let cachedCities: CityEntry[] | null = null;

export function getAllCitiesList(): CityEntry[] {
  if (cachedCities) return cachedCities;
  try {
    const filePath = path.join(process.cwd(), "data", "cities.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (Array.isArray(data?.cities)) {
        // Canlıda gizlenen illeri filtrele
        const filtered = data.cities.filter((c: CityEntry) => !isCityHidden(c.slug));
        cachedCities = filtered;
        return filtered;
      }
    }
  } catch (e) {
    console.error("Error reading cities.json:", e);
  }
  return [];
}

export function getCityNameFromSlug(slug: string): string {
  if (!slug || slug === "all" || slug === "Tüm İller") {
    return "Tüm İller";
  }
  const cleanSlug = slugify(slug);
  const cities = getAllCitiesList();
  const found = cities.find((c) => c.slug.toLowerCase() === cleanSlug);
  if (found) return found.name;

  // Fallback: capitalize
  return slug.charAt(0).toLocaleUpperCase("tr-TR") + slug.slice(1);
}

export function isValidCitySlug(slug: string): boolean {
  if (!slug || slug === "all") return true;
  const cleanSlug = slugify(slug);
  if (isCityHidden(cleanSlug)) return false;
  const cities = getAllCitiesList();
  if (cities.length === 0) return true; // fallback if list not loaded yet
  return cities.some((c) => c.slug.toLowerCase() === cleanSlug);
}
