export interface CategoryInfo {
  code: string;
  name: string;
  ageRange: string;
  birthYears: string;
  netHeight: string;
  ballType: string;
  liberoRule: string;
  courtSize: string;
  leagueType: string;
  description: string;
  advice: string;
  targetCategorySlug: string;
}

export function calculateVolleyCategory(
  birthYear: number,
  gender: "Kız" | "Erkek"
): CategoryInfo {
  // 2026-2027 Sezonu baz alınarak yaş hesaplama
  const seasonCurrentYear = 2026;
  const age = seasonCurrentYear - birthYear;

  const genderPlural = gender === "Kız" ? "Kızlar" : "Erkekler";

  if (birthYear >= 2018) {
    return {
      code: "U8-U9",
      name: "Mini Hazırlık / Spor Okulu",
      ageRange: `${age} Yaş ve Altı`,
      birthYears: `${birthYear} ve sonrası`,
      netHeight: "1.90 m - 2.00 m",
      ballType: "Hafif sünger / mini voleybol topu",
      liberoRule: "Libero kuralı uygulanmaz",
      courtSize: "Mini koordinasyon alanı (4x4m - 6x6m)",
      leagueType: "Spor Okulu & Gelişim Festivali",
      description: "Voleybolun temel motor becerilerinin, top koordinasyonunun ve spor sevgisinin kazandırıldığı başlangıç seviyesidir.",
      advice: "Bu yaş grubunda resmi TVF müsabaka lisansı aranmaz. Çocuğunuzun haftada 2-3 gün spor okulu antrenmanlarına katılması fiziksel gelişimi için idealdir.",
      targetCategorySlug: "mini",
    };
  }

  if (birthYear === 2016 || birthYear === 2017) {
    return {
      code: "U10-U11",
      name: `Mini ${genderPlural}`,
      ageRange: "9 - 10 Yaş",
      birthYears: "2016 - 2017",
      netHeight: "2.00 m (Ortak)",
      ballType: "Resmi 4 numara hafif mini voleybol topu (200-220 gr)",
      liberoRule: "Libero kuralı uygulanmaz",
      courtSize: "6x6 m veya 7x7 m özel mini saha",
      leagueType: "TVF Yerel Mini Ligleri & Şenlik",
      description: "Mini Voleybol statüsünde 3x3 veya 4x4 oyun formatıyla temel tekniklerin geliştirildiği resmi hazırlık ligidir.",
      advice: "Spor okulundan kulüp altyapı performans takımına geçiş için kritik yaş dönemidir. Kulüpler bu yaş grubunda temel manşet ve pas tekniklerine dikkat eder.",
      targetCategorySlug: "mini",
    };
  }

  if (birthYear === 2014 || birthYear === 2015) {
    const net = gender === "Kız" ? "2.10 m" : "2.15 m";
    return {
      code: "U12",
      name: `Midi ${genderPlural}`,
      ageRange: "11 - 12 Yaş",
      birthYears: "2014 - 2015",
      netHeight: net,
      ballType: "Resmi 4 numara voleybol topu",
      liberoRule: "Libero kuralı uygulanmaz (Tüm oyuncular servis ve savunma yapar)",
      courtSize: "8x8 m veya 9x9 m standart saha",
      leagueType: "Resmi TVF Lisanslı Yerel Lig",
      description: "Resmi TVF lisansının zorunlu olduğu, il birinciliği maçlarının ve yerel lig fikstürlerinin başladığı kategoridir.",
      advice: "Midi kategorisi sporcuların ilk resmi lisansla sahaya çıktığı seviyedir. Bu dönemde servis istikrarı ve pozisyon bilgisi ön plana çıkar.",
      targetCategorySlug: "midi",
    };
  }

  if (birthYear === 2012 || birthYear === 2013) {
    const net = gender === "Kız" ? "2.15 m" : "2.24 m";
    return {
      code: "U13-U14",
      name: `Küçük ${genderPlural}`,
      ageRange: "13 - 14 Yaş",
      birthYears: "2012 - 2013",
      netHeight: net,
      ballType: "Resmi 5 numara standart maç topu",
      liberoRule: "Libero kuralı uygulanır (Serbest)",
      courtSize: "9x9 m tam nizami voleybol sahası",
      leagueType: "TVF Süper Lig & 1. Lig (İl Birinciliği & Türkiye Finalleri)",
      description: "6x6 tam voleybol kurallarının ve Libero sisteminin eksiksiz uygulandığı ana gelişim kategorisidir.",
      advice: "Süper Lig ve 1. Lig bölge gruplarında tek devreli veya çift devreli ligler oynanır. Türkiye finallerine yükselme hakkı bu kategoride başlar.",
      targetCategorySlug: "kucuk",
    };
  }

  if (birthYear === 2010 || birthYear === 2011) {
    const net = gender === "Kız" ? "2.24 m" : "2.35 m";
    return {
      code: "U15-U16",
      name: `Yıldız ${genderPlural}`,
      ageRange: "15 - 16 Yaş",
      birthYears: "2010 - 2011",
      netHeight: net,
      ballType: "Resmi 5 numara maç topu",
      liberoRule: "Libero kuralı uygulanır (Maksimum 2 libero)",
      courtSize: "9x9 m nizami voleybol sahası",
      leagueType: "TVF Yıldızlar Süper Lig & Türkiye Şampiyonası",
      description: "Milli takım altyapı taramalarının ve kulüp A takımına aday sporcuların vitrine çıktığı rekabetçi ligdir.",
      advice: "Fiziksel güç, blok yüksekliği, sıçrama ve taktik varyasyonlar bu kategoride en belirleyici unsurlardır.",
      targetCategorySlug: "yildiz",
    };
  }

  if (birthYear === 2008 || birthYear === 2009) {
    const net = gender === "Kız" ? "2.24 m" : "2.43 m";
    return {
      code: "U17-U18",
      name: `Genç ${genderPlural}`,
      ageRange: "17 - 18 Yaş",
      birthYears: "2008 - 2009",
      netHeight: net,
      ballType: "Resmi 5 numara maç topu",
      liberoRule: "Libero kuralı uygulanır",
      courtSize: "9x9 m nizami saha",
      leagueType: "TVF Gençler Süper Lig & 2. Lig Geçiş Kademesi",
      description: "Altyapının en üst basamağıdır. Sporcular eş zamanlı olarak TVF Kadınlar 2. Ligi veya A Takım kadrolarında yer alabilir.",
      advice: "Genç ligi sporcuları kulüplerin profesyonel liglere açılan köprüsüdür. Maç temposu ve taktik seviye en üst düzeydedir.",
      targetCategorySlug: "genc",
    };
  }

  // 2007 ve öncesi
  return {
    code: "Senior",
    name: "Büyükler / Kadınlar 2. Lig",
    ageRange: "19 Yaş ve Üzeri",
    birthYears: `${birthYear} ve öncesi`,
    netHeight: gender === "Kız" ? "2.24 m" : "2.43 m",
    ballType: "Resmi 5 numara maç topu",
    liberoRule: "Libero kuralı uygulanır",
    courtSize: "9x9 m nizami saha",
    leagueType: "TVF Kadınlar 2. Ligi / 1. Lig / Bölgesel Lig",
    description: "Profesyonel ve amatör büyükler ligi kategorisidir. TVF Kadınlar 2. Ligi 16 gruptan oluşur.",
    advice: "Platformumuz üzerinden Kadınlar 2. Ligi'ndeki 16 grubun tüm maç fikstürlerini ve anlık puan durumlarını takip edebilirsiniz.",
    targetCategorySlug: "kadinlar-2-ligi",
  };
}

export function getAvailableBirthYears(): number[] {
  return [
    2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007,
  ];
}
