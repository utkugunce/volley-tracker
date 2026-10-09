import { loadAllCityData } from "@/utils/team/loaders";
import { extractClubRoot } from "@/utils/team/sisters";
import { slugify } from "@/utils/slugify";
import { normalizeCitySlug } from "@/utils/volleybox";
import venuesData from "@/data/venues.json";

export interface ClubItem {
  id: string;
  name: string;
  city: string;
  citySlug: string;
  district: string;
  districtSlug: string;
  categories: string[];
  teams: string[];
  matchCount: number;
  recentVenues: string[];
}

export interface DistrictSummary {
  name: string;
  slug: string;
  city: string;
  citySlug: string;
  clubCount: number;
  matchCount: number;
}

// Bilinen ana kulüp ve ilçe eşleştirmeleri
const KNOWN_CLUB_DISTRICTS: Record<string, string> = {
  "fenerbahce": "Kadıköy",
  "vakifbank": "Üsküdar",
  "eczacibasi": "Sarıyer",
  "galatasaray": "Bakırköy",
  "besiktas": "Beşiktaş",
  "thy": "Bakırköy",
  "turk-hava-yollari": "Bakırköy",
  "yesilyurt": "Bakırköy",
  "bizimkent": "Beylikdüzü",
  "istbol": "Beylikdüzü",
  "altinyurt": "Üsküdar",
  "karsiyaka": "Karşıyaka",
  "goztepe": "Konak",
  "arkas": "Konak",
  "ziraat-bankkart": "Yenimahalle",
  "halkbank": "Yenimahalle",
  "ted-ankara-kolejliler": "Gölbaşı",
  "nilufer-belediyespor": "Nilüfer",
  "bursa-buyuksehir-bld": "Osmangazi",
};

// İstanbul, Ankara, İzmir, Bursa ilçeleri listesi
const KNOWN_DISTRICTS_BY_CITY: Record<string, string[]> = {
  istanbul: [
    "Kadıköy", "Ataşehir", "Üsküdar", "Maltepe", "Kartal", "Pendik", "Ümraniye",
    "Çekmeköy", "Sancaktepe", "Beykoz", "Tuzla", "Şile", "Sultanbeyli", "Bakırköy",
    "Bahçelievler", "Beşiktaş", "Sarıyer", "Şişli", "Zeytinburnu", "Fatih", "Beyoğlu",
    "Güngören", "Bağcılar", "Esenler", "Bayrampaşa", "Eyüpsultan", "Gaziosmanpaşa",
    "Sultangazi", "Kâğıthane", "Küçükçekmece", "Büyükçekmece", "Beylikdüzü",
    "Avcılar", "Esenyurt", "Başakşehir", "Arnavutköy", "Silivri", "Çatalca", "Adalar"
  ],
  ankara: [
    "Çankaya", "Yenimahalle", "Keçiören", "Etimesgut", "Mamak", "Altındağ",
    "Gölbaşı", "Sincan", "Pursaklar", "Polatlı", "Kahramankazan"
  ],
  izmir: [
    "Bornova", "Karşıyaka", "Buca", "Gaziemir", "Konak", "Bayraklı", "Güzelbahçe",
    "Torbalı", "Menemen", "Çiğli", "Kemalpaşa", "Karabağlar", "Narlıdere", "Balçova",
    "Urla", "Seferihisar", "Çeşme", "Aliağa", "Bergama", "Tire", "Ödemiş", "Dikili"
  ],
  bursa: [
    "Nilüfer", "Osmangazi", "Yıldırım", "İnegöl", "Mudanya", "Gemlik",
    "Kestel", "Karacabey", "Orhangazi", "Yenişehir"
  ]
};

function inferDistrict(teamName: string, citySlug: string, venues: string[]): string {
  const normName = teamName.toLowerCase();
  const rootSlug = slugify(extractClubRoot(teamName).rootName);

  if (KNOWN_CLUB_DISTRICTS[rootSlug]) {
    return KNOWN_CLUB_DISTRICTS[rootSlug];
  }

  // Şehirdeki ilçe listesini kontrol et
  const cityDistricts = KNOWN_DISTRICTS_BY_CITY[citySlug] || [];
  for (const d of cityDistricts) {
    const dLower = d.toLowerCase();
    if (normName.includes(dLower)) {
      return d;
    }
  }

  // Salonlara göre ilçe tahmini
  for (const vName of venues) {
    const vMatch = venuesData.find(
      (v) => v.name.toLowerCase().includes(vName.toLowerCase()) || vName.toLowerCase().includes(v.name.toLowerCase())
    );
    if (vMatch?.district) {
      const primaryD = vMatch.district.split("/")[0].trim();
      return primaryD;
    }
  }

  // Varsayılan
  if (cityDistricts.length > 0) {
    return cityDistricts[0]; // Merkez/ilk ilçe
  }
  return "Merkez";
}

let cachedClubs: ClubItem[] | null = null;

export function getAllClubs(): ClubItem[] {
  if (cachedClubs) return cachedClubs;

  const { matches, standingsByCity } = loadAllCityData();
  const clubMap = new Map<string, {
    name: string;
    city: string;
    citySlug: string;
    district: string;
    districtSlug: string;
    categories: Set<string>;
    teams: Set<string>;
    matchCount: number;
    venues: Set<string>;
  }>();

  const processTeam = (rawTeam: string, city: string, category?: string, venue?: string) => {
    if (!rawTeam) return;
    const { rootName, rootSlug } = extractClubRoot(rawTeam);
    if (!rootName || rootName.length < 2) return;

    const cSlug = normalizeCitySlug(city || "İstanbul");
    const key = `${cSlug}-${rootSlug}`;

    if (!clubMap.has(key)) {
      clubMap.set(key, {
        name: rootName,
        city: city || "İstanbul",
        citySlug: cSlug,
        district: "",
        districtSlug: "",
        categories: new Set(),
        teams: new Set(),
        matchCount: 0,
        venues: new Set(),
      });
    }

    const entry = clubMap.get(key)!;
    entry.teams.add(rawTeam);
    if (category) entry.categories.add(category);
    if (venue) entry.venues.add(venue);
    entry.matchCount++;
  };

  for (const m of matches) {
    const mCity = m.city || "İstanbul";
    processTeam(m.home_team, mCity, m.category, m.hall);
    processTeam(m.away_team, mCity, m.category, m.hall);
  }

  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    for (const groupData of Object.values(cityGroup.standings)) {
      const table = Array.isArray(groupData) ? groupData : groupData?.table || [];
      for (const item of table) {
        if (item.team) {
          processTeam(item.team, cityName);
        }
      }
    }
  }

  const result: ClubItem[] = [];

  for (const [key, item] of clubMap.entries()) {
    const venueList = Array.from(item.venues);
    const assignedDistrict = inferDistrict(item.name, item.citySlug, venueList);
    const districtSlug = slugify(assignedDistrict);

    result.push({
      id: slugify(item.name),
      name: item.name,
      city: item.city,
      citySlug: item.citySlug,
      district: assignedDistrict,
      districtSlug,
      categories: Array.from(item.categories),
      teams: Array.from(item.teams),
      matchCount: item.matchCount,
      recentVenues: venueList.slice(0, 3),
    });
  }

  // Sıralama: En çok maçı/takımı olan kulüpler önce
  result.sort((a, b) => b.matchCount - a.matchCount || a.name.localeCompare(b.name, "tr"));

  cachedClubs = result;
  return result;
}

export function getClubsByCity(citySlug: string): ClubItem[] {
  const norm = normalizeCitySlug(citySlug);
  return getAllClubs().filter((c) => c.citySlug === norm);
}

export function getClubsByDistrict(citySlug: string, districtSlug: string): ClubItem[] {
  const normCity = normalizeCitySlug(citySlug);
  const normDist = slugify(districtSlug);
  return getAllClubs().filter(
    (c) => c.citySlug === normCity && c.districtSlug === normDist
  );
}

export function getDistrictSummaries(citySlug: string): DistrictSummary[] {
  const normCity = normalizeCitySlug(citySlug);
  const clubsInCity = getClubsByCity(normCity);
  const known = KNOWN_DISTRICTS_BY_CITY[normCity] || [];

  const map = new Map<string, { name: string; clubCount: number; matchCount: number }>();

  // Önce bilinen tüm ilçeleri sıfırla doldur
  for (const d of known) {
    const s = slugify(d);
    map.set(s, { name: d, clubCount: 0, matchCount: 0 });
  }

  // Kulüpleri ekle
  for (const club of clubsInCity) {
    const s = club.districtSlug;
    if (!map.has(s)) {
      map.set(s, { name: club.district, clubCount: 0, matchCount: 0 });
    }
    const entry = map.get(s)!;
    entry.clubCount++;
    entry.matchCount += club.matchCount;
  }

  const summaries: DistrictSummary[] = [];
  for (const [slug, val] of map.entries()) {
    summaries.push({
      slug,
      name: val.name,
      city: clubsInCity[0]?.city || citySlug,
      citySlug: normCity,
      clubCount: val.clubCount,
      matchCount: val.matchCount,
    });
  }

  summaries.sort((a, b) => b.clubCount - a.clubCount || a.name.localeCompare(b.name, "tr"));
  return summaries;
}
