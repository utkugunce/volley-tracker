import { slugify } from "./slugify";

/**
 * Hall & Navigation Utilities for Volleyball Gyms across Turkey.
 */

export interface HallInfo {
  name: string;
  city: string;
  district?: string;
  metroTips?: string;
  parking?: string;
  notes?: string;
}

/**
 * Curated knowledge base of major volleyball venues in Turkey with practical transit tips for parents and teams.
 */
export const POPULAR_HALLS: Record<string, HallInfo> = {
  "burhan felek": {
    name: "TVF Burhan Felek Voleybol Salonu",
    city: "İstanbul",
    district: "Üsküdar / Zeynep Kamil",
    metroTips: "Altunizade Metrobüs veya Üsküdar Marmaray istasyonundan dolmuş/otobüs ile 5-10 dk.",
    parking: "Yerleşke içerisinde ücretli/etkinlik otoparkı mevcuttur.",
    notes: "TVF'nin ana lig ve altyapı merkez kompleksidir.",
  },
  "50. yil": {
    name: "TVF 50. Yıl Deniz Esinduy Voleybol Salonu",
    city: "İstanbul",
    district: "Üsküdar",
    metroTips: "Burhan Felek Spor Kompleksi içerisinde yer alır.",
    parking: "Burhan Felek açık otoparkı kullanılabilir.",
    notes: "İstanbul altyapı liglerinin ana maç merkezidir.",
  },
  "baskent": {
    name: "TVF Başkent Voleybol Salonu (Ziraat Bankkart)",
    city: "Ankara",
    district: "Yenimahalle / Beşevler",
    metroTips: "Ankaray Beşevler durağına yürüme mesafesinde (5 dk).",
    parking: "Salon önü ve TVF kampüsü otoparkı mevcuttur.",
    notes: "Ankara altyapı ve Efeler/Sultanlar ligi karşılaşmaları oynanır.",
  },
  "bestepe": {
    name: "TVF Beştepe Voleybol Salonu",
    city: "Ankara",
    district: "Yenimahalle / Beştepe",
    metroTips: "Milli Kütüphane / Bahçelievler metrosuna yakın.",
    parking: "TVF ana bina otoparkı.",
    notes: "Ankara yerel lig maçları için yoğun kullanılır.",
  },
  "selim sirri": {
    name: "Selim Sırrı Tarcan Spor Salonu",
    city: "Ankara",
    district: "Altındağ / Gar Yakını",
    metroTips: "Ulus veya Gar metro istasyonlarına yürüme mesafesi.",
    parking: "Gar civarı otopark alanları.",
    notes: "Tarihi voleybol mabedi.",
  },
  "ataturk": {
    name: "TVF Atatürk Voleybol Salonu",
    city: "İzmir",
    district: "Konak / Alsancak",
    metroTips: "Alsancak İZBAN ve Tramvay durağına yürüme mesafesinde.",
    parking: "Fuar ve cadde çevresi otoparklar.",
    notes: "İzmir il birinciliği ve altyapı liglerinin merkez salonudur.",
  },
  "cengiz gollu": {
    name: "Cengiz Göllü Voleybol Salonu",
    city: "Bursa",
    district: "Nilüfer",
    metroTips: "Bursaray Nilüfer veya FSM durağı aktarması.",
    parking: "Salon bünyesinde otopark alanı mevcuttur.",
    notes: "Bursa yerel voleybol ligleri merkezi.",
  },
};

/**
 * Generates a direct Google Maps navigation URL for any volleyball hall.
 */
export function getHallNavigationUrl(hallName: string, city?: string): string {
  if (!hallName || hallName.trim() === "" || hallName === "TBD") {
    return "https://www.google.com/maps";
  }

  const cleanHall = hallName.trim();
  const cleanCity = city && city !== "Tüm İller" ? city.trim() : "";
  
  // E.g., "50. Yıl Deniz Esinduy Spor Salonu İstanbul"
  const query = `${cleanHall} Spor Salonu ${cleanCity}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Finds curated transit and venue tips for a hall name if known.
 */
export function getHallDetails(hallName: string): HallInfo | null {
  if (!hallName) return null;
  const slug = slugify(hallName);

  for (const [key, info] of Object.entries(POPULAR_HALLS)) {
    const keySlug = slugify(key);
    if (slug.includes(keySlug)) {
      return info;
    }
  }
  return null;
}
