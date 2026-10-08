export const TURKISH_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
  "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale",
  "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum",
  "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin",
  "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli",
  "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
  "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat",
  "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak",
  "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

export interface ParsedStandingContext {
  rawKey: string;
  city: string;
  ageGroup: string; // "Genç (U18)", "Yıldız (U16)", "Küçük (U14)", "Genel"
  leagueTier: string; // "Süper Lig", "1. Lig", etc.
  leagueFullName: string; // e.g. "Genç Kızlar Süper Lig"
  rawGroup: string; // e.g. "Genç Kızlar Süper Lig 1. Grup" or "A Grubu"
  displayGroup: string; // e.g. "1. Grup" or "A Grubu"
}

export interface StandingsTeamContext {
  rawKey: string;
  city: string;
  leagueName: string;
  groupName: string;
}

export const CITY_SLUG_TO_NAME: Record<string, string> = {
  adana: "Adana",
  adiyaman: "Adıyaman",
  afyon: "Afyonkarahisar",
  afyonkarahisar: "Afyonkarahisar",
  agri: "Ağrı",
  amasya: "Amasya",
  ankara: "Ankara",
  antalya: "Antalya",
  artvin: "Artvin",
  aydin: "Aydın",
  balikesir: "Balıkesir",
  bilecik: "Bilecik",
  bingol: "Bingöl",
  bitlis: "Bitlis",
  bolu: "Bolu",
  burdur: "Burdur",
  bursa: "Bursa",
  canakkale: "Çanakkale",
  cankiri: "Çankırı",
  corum: "Çorum",
  denizli: "Denizli",
  diyarbakir: "Diyarbakır",
  edirne: "Edirne",
  elazig: "Elazığ",
  erzincan: "Erzincan",
  erzurum: "Erzurum",
  eskisehir: "Eskişehir",
  gaziantep: "Gaziantep",
  giresun: "Giresun",
  gumushane: "Gümüşhane",
  hakkari: "Hakkari",
  hatay: "Hatay",
  isparta: "Isparta",
  mersin: "Mersin",
  istanbul: "İstanbul",
  izmir: "İzmir",
  kars: "Kars",
  kastamonu: "Kastamonu",
  kayseri: "Kayseri",
  kirklareli: "Kırklareli",
  kirsehir: "Kırşehir",
  kocaeli: "Kocaeli",
  konya: "Konya",
  kutahya: "Kütahya",
  malatya: "Malatya",
  manisa: "Manisa",
  kahramanmaras: "Kahramanmaraş",
  mardin: "Mardin",
  mugla: "Muğla",
  mus: "Muş",
  nevsehir: "Nevşehir",
  nigde: "Niğde",
  ordu: "Ordu",
  rize: "Rize",
  sakarya: "Sakarya",
  samsun: "Samsun",
  siirt: "Siirt",
  sinop: "Sinop",
  sivas: "Sivas",
  tekirdag: "Tekirdağ",
  tokat: "Tokat",
  trabzon: "Trabzon",
  tunceli: "Tunceli",
  sanliurfa: "Şanlıurfa",
  usak: "Uşak",
  van: "Van",
  yozgat: "Yozgat",
  zonguldak: "Zonguldak",
  aksaray: "Aksaray",
  bayburt: "Bayburt",
  karaman: "Karaman",
  kirikkale: "Kırıkkale",
  batman: "Batman",
  sirnak: "Şırnak",
  bartin: "Bartın",
  ardahan: "Ardahan",
  igdir: "Iğdır",
  yalova: "Yalova",
  karabuk: "Karabük",
  kilis: "Kilis",
  osmaniye: "Osmaniye",
  duzce: "Düzce",
};

export function parseStandingKey(rawKey: string, defaultCity?: string): ParsedStandingContext {
  let rem = rawKey.trim();
  let city = defaultCity && defaultCity !== "Tüm İller" ? defaultCity : "";

  // 1. İl Tespiti (resmi isim, slug veya küçük/büyük harf duyarsız kontrol)
  const dashPos = rem.indexOf(" - ");
  if (dashPos !== -1) {
    const candidate = rem.slice(0, dashPos).trim();
    const candidateLower = candidate.toLocaleLowerCase("tr-TR");
    const candidateNormalized = candidateLower
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c");

    const matchedCity = TURKISH_CITIES.find(
      (c) => c.toLocaleLowerCase("tr-TR") === candidateLower
    );
    const slugMatched =
      CITY_SLUG_TO_NAME[candidateLower] || CITY_SLUG_TO_NAME[candidateNormalized];

    if (matchedCity) {
      city = matchedCity;
      rem = rem.slice(dashPos + 3).trim();
    } else if (slugMatched) {
      city = slugMatched;
      rem = rem.slice(dashPos + 3).trim();
    }
  }

  // Yedek kontrol: Eğer ilk parça ayrılmadıysa doğrudan prefix kontrolü yap
  if (!city) {
    for (const c of TURKISH_CITIES) {
      const prefix = `${c} - `;
      if (rem.startsWith(prefix)) {
        city = c;
        rem = rem.slice(prefix.length).trim();
        break;
      }
    }
  }

  // 2. Yaş Grubu / Kategori Tespiti (Genç U18, Yıldız U16, vb.)
  const lowerRem = rem.toLocaleLowerCase("tr-TR");
  let ageGroup = "Genel";
  if (lowerRem.includes("genç") || lowerRem.includes("genc") || lowerRem.includes("u18")) {
    ageGroup = "Genç (U18)";
  } else if (lowerRem.includes("yıldız") || lowerRem.includes("yildiz") || lowerRem.includes("u16")) {
    ageGroup = "Yıldız (U16)";
  } else if (lowerRem.includes("küçük") || lowerRem.includes("kucuk") || lowerRem.includes("u14")) {
    ageGroup = "Küçük (U14)";
  } else if (lowerRem.includes("midi") || lowerRem.includes("u12")) {
    ageGroup = "Midi (U12)";
  }

  // 3. Lig ve Grup Ayrımı
  const dashIdx = rem.indexOf(" - ");
  let leaguePart = "";
  let groupPart = "";

  if (dashIdx !== -1) {
    leaguePart = rem.slice(0, dashIdx).trim();
    groupPart = rem.slice(dashIdx + 3).trim();
  } else {
    const isOnlyGroup = /^(?:[A-Z0-9]\.?\s*Gr(?:up|ubu)?|Grup\s+[A-Z0-9]|\d+\.\s*Grup)/i.test(rem);
    if (isOnlyGroup) {
      leaguePart = "Süper Lig";
      groupPart = rem.trim();
    } else {
      leaguePart = rem.trim();
      groupPart = "Genel";
    }
  }

  // 4. Lig Seviyesi (Süper Lig / 1. Lig)
  let leagueTier = "Süper Lig";
  if (/1\.\s*Lig/i.test(leaguePart)) {
    leagueTier = "1. Lig";
  } else if (/Süper\s*Lig/i.test(leaguePart)) {
    leagueTier = "Süper Lig";
  } else {
    const isCity =
      TURKISH_CITIES.some((c) => c.toLocaleLowerCase("tr-TR") === leaguePart.toLocaleLowerCase("tr-TR")) ||
      Boolean(CITY_SLUG_TO_NAME[leaguePart.toLocaleLowerCase("tr-TR")]);
    leagueTier = isCity ? "Süper Lig" : leaguePart;
  }

  // 5. Temiz Grup Adı
  let displayGroup = groupPart;
  const stripPrefixRegex = /^(?:(?:Genç|Yıldız|Küçük|Midi|Mini)\s+(?:Kız(?:lar)?|Erkek(?:ler)?|Kadın(?:lar)?)?\s*(?:Süper\s+Lig[iıİI]?|1\.\s*Lig[iıİI]?)?|(?:Süper\s+Lig|1\.\s*Lig)\s*(?:Genç|Yıldız)?\s*(?:Kız(?:lar)?)?)\s*[-–—:\s]*(?=(?:[A-Z0-9]\.?\s*Gr(?:up|ubu)?|Grup\s+[A-Z0-9]|[A-Z]\s*(?:\(|$|\s*Gr)))/i;
  let cleaned = displayGroup.replace(stripPrefixRegex, "").trim();

  // Parantez içi ve tire kenarı boşluklarını düzelt (örn: "( Merkez+Marmara)" -> "(Merkez+Marmara)")
  cleaned = cleaned.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/^[-–—\s]+/, "");

  if (/^[A-Z]$/i.test(cleaned)) {
    cleaned = `${cleaned.toUpperCase()} Grubu`;
  } else if (/^[A-Z]\s+Gr$/i.test(cleaned) || /\b[A-Z]\s+Gr\b/i.test(cleaned)) {
    cleaned = cleaned.replace(/\b([A-Z])\s+Gr\b/i, "$1 Grubu");
  } else if (/^Grup\s+([A-Z0-9]+)/i.test(cleaned)) {
    cleaned = cleaned.replace(/^Grup\s+([A-Z0-9]+)/i, "$1 Grubu");
  } else if (/^\d+\.?(?:\s*Grup)?$/i.test(cleaned)) {
    const numMatch = cleaned.match(/^(\d+)/);
    if (numMatch) {
      cleaned = `${numMatch[1]}. Grup`;
    }
  }

  if (!cleaned || cleaned.toLocaleLowerCase("tr-TR") === leaguePart.toLocaleLowerCase("tr-TR")) {
    cleaned = groupPart === "Genel" ? "Genel" : groupPart;
  } else {
    displayGroup = cleaned;
  }

  return {
    rawKey,
    city,
    ageGroup,
    leagueTier,
    leagueFullName: leaguePart || rem,
    rawGroup: groupPart,
    displayGroup,
  };
}
