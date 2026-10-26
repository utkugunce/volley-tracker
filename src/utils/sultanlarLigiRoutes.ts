import { Kadinlar2LigTabType } from "@/components/kadinlar-2-lig/Kadinlar2LigHeader";

export type SultanlarTabType = Kadinlar2LigTabType;

export const getSultanlarLigiRoute = (
  tab: SultanlarTabType,
  _groupNo?: number | "all"
): string => {
  switch (tab) {
    case "standings":
      return "/sultanlar-ligi/puan-durumu";
    case "fixtures":
      return "/sultanlar-ligi/fikstur";
    case "results":
      return "/sultanlar-ligi/sonuclar";
    case "today":
      return "/sultanlar-ligi/gunun-maclari";
    case "leaders":
      return "/sultanlar-ligi/puan-durumu";
    case "teams":
      return "/sultanlar-ligi/takimlar";
    case "karsilastir":
      return "/sultanlar-ligi/karsilastir";
    case "statu":
      return "/sultanlar-ligi/statu";
    case "home":
    default:
      return "/sultanlar-ligi";
  }
};

export const parseSultanlarLigiRoute = (
  pathname: string
): { tab: SultanlarTabType; groupNo: number | "all" } => {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  const parts = clean.split("/").filter(Boolean);

  const sub = parts[0] === "sultanlar-ligi" ? parts[1] : parts[0];

  let tab: SultanlarTabType = "home";

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
    tab = "standings";
  } else if (sub === "takimlar" || sub === "kulupler") {
    tab = "teams";
  } else if (sub === "karsilastir" || sub === "h2h") {
    tab = "karsilastir";
  } else if (sub === "statu") {
    tab = "statu";
  }

  return { tab, groupNo: 1 };
};

export const isValidSultanlarLigiSlug = (slug: string[]): boolean => {
  if (!slug || slug.length === 0) return true;
  if (slug.length > 2) return false;

  const validTabs = new Set([
    "puan-durumu",
    "fikstur",
    "sonuclar",
    "gunun-maclari",
    "takimlar",
    "karsilastir",
    "statu",
  ]);

  return validTabs.has(slug[0]);
};
