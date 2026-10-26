import fs from "fs";
import path from "path";
import { FixturesData, Match, StandingItem } from "@/types/fixture";
import { isCityHidden } from "./cityHelper";
import { isMatchScored } from "./matchScoring";
import { getIstanbulDateString, isMatchPlayedOrScored } from "./calendar";

// data/*.json derleme paketinden okunur ve yalnızca yeni deploy ile değişir; üretimde instance
// ömrü boyunca önbellekte tutmak her dakika 1+ MB JSON'u yeniden ayrıştırmayı (Fluid Active CPU) önler.
const CACHE_TTL_MS = process.env.NODE_ENV === "production" ? Number.POSITIVE_INFINITY : 60 * 1000;
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

    // 0. data/cities.json üzerinden 81 ilin merkezi tarama/güncelleme zaman damgasını oku
    let globalScanUpdatedAt: string | null = null;
    try {
      const citiesIndexPath = path.join(process.cwd(), "data", "cities.json");
      if (fs.existsSync(citiesIndexPath)) {
        const cJson = JSON.parse(fs.readFileSync(citiesIndexPath, "utf-8"));
        if (cJson && typeof cJson.updated_at === "string") {
          globalScanUpdatedAt = cJson.updated_at;
        }
      }
    } catch {
      // ignore
    }

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
              if (globalScanUpdatedAt && (!parsed.updated_at || new Date(globalScanUpdatedAt) > new Date(parsed.updated_at))) {
                parsed.updated_at = globalScanUpdatedAt;
              }
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
      const allMatches: Match[] = [];
      const allStandings: Record<string, StandingItem[]> = {};
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

          // 2026-2027 sezonu öncesine ait (eski sezon) verileri filtrele
          const hasCurrentMatches =
            Array.isArray(parsed.matches) &&
            parsed.matches.some((m: Match) => m.date && m.date >= "2026-08-01");
          if (Array.isArray(parsed.matches) && parsed.matches.length > 0 && !hasCurrentMatches) {
            continue;
          }

          if (parsed.updated_at && parsed.updated_at > latestUpdated) {
            latestUpdated = parsed.updated_at;
          }
          if (Array.isArray(parsed.matches)) {
            for (const m of parsed.matches) {
              if (m.date && m.date < "2026-08-01") continue;
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
              allStandings[`${cityName} - ${k}`] = v as StandingItem[];
            }
          }
        } catch (e) {
          console.warn(`Error reading city file ${file}:`, e);
        }
      }

      if (allMatches.length > 0) {
        const finalUpdatedAt = globalScanUpdatedAt || (latestUpdated > new Date(0).toISOString() ? latestUpdated : new Date().toISOString());
        const result: FixturesData = {
          city: "Tüm İller",
          title: "TVF Türkiye Geneli Genç & Yıldız Kızlar Süper Lig",
          updated_at: finalUpdatedAt,
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
      if (globalScanUpdatedAt && (!parsed.updated_at || new Date(globalScanUpdatedAt) > new Date(parsed.updated_at))) {
        parsed.updated_at = globalScanUpdatedAt;
      }
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
  // Tek bir şehir ise veriyi kırpmaya gerek yok, il dosyası zaten hafif (20-100 maç)
  if (citySlug && citySlug !== "all") {
    return data;
  }
  // Türkiye geneli için: Sonuçlanan maçlar + dün ve bugünün tüm maçları (skor bekleyenler dahil) + tarihi geçmiş maçlar
  const todayIso = getIstanbulDateString(0);
  const yesterdayIso = getIstanbulDateString(1);
  return {
    ...data,
    matches: data.matches.filter(
      (m) =>
        isMatchScored(m) ||
        m.status === "finished" ||
        m.date === yesterdayIso ||
        m.date === todayIso ||
        isMatchPlayedOrScored(m, todayIso)
    ),
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
  const todayIso = getIstanbulDateString(0);
  const yesterdayIso = getIstanbulDateString(1);

  // 1. Bugün ve dünün maçları
  const todayAndYesterday = full.matches.filter(
    (m) => m.date === todayIso || m.date === yesterdayIso
  );

  // 2. En son biten 16 maç
  const allScoredMatches = full.matches.filter(isMatchScored);
  const scored = allScoredMatches
    .sort((a, b) => (b.date && a.date ? b.date.localeCompare(a.date) : 0))
    .slice(0, 16);

  // 3. En yakın yaklaşan 16 maç
  const upcoming = full.matches
    .filter((m) => !isMatchScored(m) && m.date && m.date >= todayIso)
    .sort((a, b) => (a.date && b.date ? a.date.localeCompare(b.date) : 0))
    .slice(0, 16);

  // ID'ye göre tekilleştir
  const matchMap = new Map<string, Match>();
  [...todayAndYesterday, ...scored, ...upcoming].forEach((m) => {
    if (m && m.id) matchMap.set(m.id, m);
  });

  // Tüm benzersiz takım adları (Spotlight Arama ve Kulübüm widget'ı için)
  const teamsSet = new Set<string>();
  for (const m of full.matches) {
    if (m.home_team) teamsSet.add(m.home_team);
    if (m.away_team) teamsSet.add(m.away_team);
  }
  const allTeams = Array.from(teamsSet).sort((a, b) => a.localeCompare(b, "tr"));

  // Grup liderleri (her gruptan sadece ilk sıradaki takım)
  const homeStandings: Record<string, StandingItem[]> = {};
  if (full.standings) {
    for (const [k, v] of Object.entries(full.standings)) {
      if (Array.isArray(v) && v.length > 0) {
        homeStandings[k] = [v[0]];
      }
    }
  }

  return {
    ...full,
    scored_matches: allScoredMatches.length,
    all_teams: allTeams,
    matches: Array.from(matchMap.values()),
    standings: homeStandings,
  };
}
