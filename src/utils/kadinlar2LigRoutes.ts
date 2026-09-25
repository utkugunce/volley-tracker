import { Kadinlar2LigTabType } from "@/components/kadinlar-2-lig/Kadinlar2LigHeader";

/**
 * Kadınlar 2. Ligi sekmesine ve opsiyonel gruba göre rota URL'i üretir.
 * Örn:
 * - "home" -> "/kadinlar-2-ligi"
 * - "standings", 1 -> "/kadinlar-2-ligi/puan-durumu"
 * - "standings", 3 -> "/kadinlar-2-ligi/puan-durumu/grup-3"
 * - "fixtures", 2 -> "/kadinlar-2-ligi/fikstur/grup-2"
 * - "results" -> "/kadinlar-2-ligi/sonuclar"
 * - "today" -> "/kadinlar-2-ligi/gunun-maclari"
 * - "leaders" -> "/kadinlar-2-ligi/grup-durumu"
 * - "teams" -> "/kadinlar-2-ligi/takimlar"
 * - "statu" -> "/kadinlar-2-ligi/statu"
 */
export const getKadinlar2LigRoute = (
  tab: Kadinlar2LigTabType,
  groupNo?: number
): string => {
  const isGroupSpecific =
    (tab === "standings" || tab === "fixtures") && groupNo && groupNo > 1;
  const groupSuffix = isGroupSpecific ? `/grup-${groupNo}` : "";

  switch (tab) {
    case "standings":
      return `/kadinlar-2-ligi/puan-durumu${groupSuffix}`;
    case "fixtures":
      return `/kadinlar-2-ligi/fikstur${groupSuffix}`;
    case "results":
      return "/kadinlar-2-ligi/sonuclar";
    case "today":
      return "/kadinlar-2-ligi/gunun-maclari";
    case "leaders":
      return "/kadinlar-2-ligi/grup-durumu";
    case "teams":
      return "/kadinlar-2-ligi/takimlar";
    case "karsilastir":
      return "/kadinlar-2-ligi/karsilastir";
    case "statu":
      return "/kadinlar-2-ligi/statu";
    case "home":
    default:
      return "/kadinlar-2-ligi";
  }
};

/**
 * URL pathname string'ini ayrıştırarak Kadınlar 2. Ligi sekmesi ve grup numarasını döner.
 */
export const parseKadinlar2LigRoute = (
  pathname: string
): { tab: Kadinlar2LigTabType; groupNo: number } => {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  const parts = clean.split("/").filter(Boolean);

  // İlk parça "kadinlar-2-ligi" ise sonraki parçaları al
  let sub = parts[0] === "kadinlar-2-ligi" ? parts[1] : parts[0];
  let second = parts[0] === "kadinlar-2-ligi" ? parts[2] : parts[1];

  let tab: Kadinlar2LigTabType = "home";
  let groupNo = 1;

  if (!sub || sub === "anasayfa") {
    tab = "home";
  } else if (sub === "puan-durumu") {
    tab = "standings";
  } else if (sub === "fikstur") {
    tab = "fixtures";
  } else if (sub === "sonuclar") {
    tab = "results";
  } else if (sub === "gunun-maclari") {
    tab = "today";
  } else if (sub === "grup-durumu" || sub === "liderler") {
    tab = "leaders";
  } else if (sub === "takimlar" || sub === "kulupler") {
    tab = "teams";
  } else if (sub === "karsilastir" || sub === "h2h") {
    tab = "karsilastir";
  } else if (sub === "statu") {
    tab = "statu";
  }

  // Grup numarası kontrolü: grup-1..16, g1..16, 1..16
  if (second) {
    const match = second.match(/^(?:grup-?|g)?(\d+)$/i);
    if (match) {
      const parsedG = parseInt(match[1], 10);
      if (parsedG >= 1 && parsedG <= 16) {
        groupNo = parsedG;
      }
    }
  }

  return { tab, groupNo };
};
