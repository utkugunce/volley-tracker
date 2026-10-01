import fs from "fs";
import path from "path";
import { FixturesData } from "@/types/fixture";
import { isCityHidden } from "./cityHelper";
import { isMatchScored } from "./matchScoring";

const CACHE_TTL_MS = 60 * 1000;
let cachedAllData: { data: FixturesData; timestamp: number } | null = null;
const cachedCityData = new Map<string, { data: FixturesData; timestamp: number }>();

/**
 * Sunucu tarafında (SSR/SSG) fikstür ve puan durumu verilerini yükler.
 * Belirli bir il slug'ı verilirse o ilin dosyasını, verilmezse ("all") 81 ilin
 * birleştirilmiş veritabanını döndürür. Bellek önbelleği ile disk I/O yükünü minimize eder.
 */
export function getInitialFixtures(citySlug?: string): FixturesData {
  const now = Date.now();
  try {
    const citiesDir = path.join(process.cwd(), "data", "cities");

    // 1. Belirli bir il istendiyse doğrudan o ilin verisini döndür (gizli iller atlanır)
    if (citySlug && citySlug !== "all" && citySlug !== "Tüm İller") {
      const sanitizedSlug = citySlug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!isCityHidden(sanitizedSlug)) {
        const cached = cachedCityData.get(sanitizedSlug);
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
          return cached.data;
        }

        const specificFile = path.join(citiesDir, `${sanitizedSlug}.json`);
        if (fs.existsSync(specificFile)) {
          try {
            const content = fs.readFileSync(specificFile, "utf-8");
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === "object") {
              cachedCityData.set(sanitizedSlug, { data: parsed, timestamp: now });
              return parsed;
            }
          } catch (e) {
            console.warn(`Error reading specific city file for ${citySlug}:`, e);
          }
        }
      }
    }

    // 2. Tüm İller için önbellek kontrolü
    if (!citySlug || citySlug === "all" || citySlug === "Tüm İller") {
      if (cachedAllData && now - cachedAllData.timestamp < CACHE_TTL_MS) {
        return cachedAllData.data;
      }
    }

    // 3. Tüm İller: data/cities klasöründeki tüm JSON dosyalarını tara ve birleştir
    if (fs.existsSync(citiesDir)) {
      const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith(".json"));
      const allMatches: any[] = [];
      const allStandings: Record<string, any[]> = {};
      const categoriesSet = new Set<string>(["Tümü"]);
      const hallsSet = new Set<string>(["Tümü"]);
      let latestUpdated = new Date(0).toISOString();

      for (const file of files) {
        const fileSlug = file.replace(".json", "");
        if (isCityHidden(fileSlug)) continue;
        try {
          const content = fs.readFileSync(path.join(citiesDir, file), "utf-8");
          const parsed = JSON.parse(content);
          const cityName = parsed.city || file.replace(".json", "");
          if (isCityHidden(cityName)) continue;
          if (parsed.updated_at && parsed.updated_at > latestUpdated) {
            latestUpdated = parsed.updated_at;
          }
          if (Array.isArray(parsed.matches)) {
            for (const m of parsed.matches) {
              allMatches.push({
                ...m,
                city: m.city || cityName,
              });
              if (m.category) categoriesSet.add(m.category);
              if (m.hall) hallsSet.add(m.hall);
            }
          }
          if (parsed.standings && typeof parsed.standings === "object") {
            for (const [k, v] of Object.entries(parsed.standings)) {
              allStandings[`${cityName} - ${k}`] = v as any[];
            }
          }
        } catch (e) {
          console.warn(`Error reading city file ${file}:`, e);
        }
      }

      if (allMatches.length > 0) {
        const result: FixturesData = {
          city: "Tüm İller",
          title: "TVF Türkiye Geneli Genç & Yıldız Kızlar Süper Lig",
          updated_at: latestUpdated > new Date(0).toISOString() ? latestUpdated : new Date().toISOString(),
          total_matches: allMatches.length,
          source: "TVF İl Temsilcilikleri",
          filters: {
            categories: Array.from(categoriesSet),
            age_groups: ["Tümü", "Genç", "Yıldız"],
            genders: ["Kız"],
            halls: Array.from(hallsSet),
          },
          matches: allMatches,
          standings: allStandings,
        };
        cachedAllData = { data: result, timestamp: now };
        return result;
      }
    }

    // 3. Klasörde maç yoksa veya okunamazsa data/fixtures.json yedeğini oku (geçici fallback)
    const filePath = path.join(process.cwd(), "data", "fixtures.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      console.warn("JSON fallback kullanılıyor - Supabase birincil kaynak olmalı");
      return parsed;
    }
  } catch (e) {
    console.error("Fikstür verisi yüklenemedi:", e);
  }

  // 4. Nihai güvenli fallback
  return {
    city: "Tüm İller",
    title: "TVF Türkiye Geneli Genç & Yıldız Kızlar Süper Lig",
    updated_at: new Date().toISOString(),
    total_matches: 0,
    source: "TVF İl Temsilcilikleri",
    filters: {
      categories: ["Tümü", "Genç Kızlar Süper Lig", "Yıldız Kızlar Süper Lig"],
      age_groups: ["Tümü", "Genç", "Yıldız"],
      genders: ["Kız"],
      halls: [],
    },
    matches: [],
  };
}

export function getInitialResults(citySlug?: string): FixturesData {
  const data = getInitialFixtures(citySlug);
  return {
    ...data,
    matches: data.matches.filter(isMatchScored),
  };
}

/**
 * Anasayfa (/) ilk açılışını hızlandırmak ve mobil TBT / LCP darboğazını çözmek için
 * hafifletilmiş başlangıç verisi döndürür. 81 ilin tüm veritabanı (1+ MB JSON) yerine
 * sadece bugün/dün maçlarını, son biten 16 maçı, en yakın 16 maçı ve grup liderlerini içerir.
 * Tam veri kullanıcı diğer sekmelere geçtiğinde veya il seçtiğinde arka planda yüklenir.
 */
export function getInitialHomeFixtures(): FixturesData {
  const full = getInitialFixtures("all");
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const todayIso = `${year}-${month}-${day}`;

  const yesterday = new Date(Date.now() - 86400000);
  const yDay = String(yesterday.getDate()).padStart(2, "0");
  const yMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
  const yYear = yesterday.getFullYear();
  const yesterdayIso = `${yYear}-${yMonth}-${yDay}`;

  // 1. Bugün ve dünün maçları
  const todayAndYesterday = full.matches.filter(
    (m) => m.date === todayIso || m.date === yesterdayIso
  );

  // 2. En son biten 16 maç
  const scored = full.matches
    .filter(isMatchScored)
    .sort((a, b) => (b.date && a.date ? b.date.localeCompare(a.date) : 0))
    .slice(0, 16);

  // 3. En yakın yaklaşan 16 maç
  const upcoming = full.matches
    .filter((m) => !isMatchScored(m) && m.date && m.date >= todayIso)
    .sort((a, b) => (a.date && b.date ? a.date.localeCompare(b.date) : 0))
    .slice(0, 16);

  // ID'ye göre tekilleştir
  const matchMap = new Map<string, any>();
  [...todayAndYesterday, ...scored, ...upcoming].forEach((m) => {
    if (m && m.id) matchMap.set(m.id, m);
  });

  // Grup liderleri (her gruptan sadece ilk sıradaki takım)
  const homeStandings: Record<string, any[]> = {};
  if (full.standings) {
    for (const [k, v] of Object.entries(full.standings)) {
      if (Array.isArray(v) && v.length > 0) {
        homeStandings[k] = [v[0]];
      }
    }
  }

  return {
    ...full,
    matches: Array.from(matchMap.values()),
    standings: homeStandings,
  };
}
