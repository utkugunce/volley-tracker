import { Kadinlar2LigTabType } from "@/components/kadinlar-2-lig/Kadinlar2LigHeader";

export type Kadinlar1LigTabType = Kadinlar2LigTabType;

export const getKadinlar1LigRoute = (
  tab: Kadinlar1LigTabType,
  groupNo?: number | "all"
): string => {
  const isAllGroups = groupNo === "all";
  const isGroupB = groupNo === 2;

  let groupSuffix = "";
  if (isGroupB) {
    groupSuffix = "/grup-b";
  } else if (isAllGroups) {
    groupSuffix = "/tum-gruplar";
  }

  switch (tab) {
    case "standings":
      return `/kadinlar-1-ligi/puan-durumu${groupSuffix}`;
    case "fixtures":
      return `/kadinlar-1-ligi/fikstur${groupSuffix}`;
    case "results":
      return "/kadinlar-1-ligi/sonuclar";
    case "today":
      return "/kadinlar-1-ligi/gunun-maclari";
    case "leaders":
      return "/kadinlar-1-ligi/grup-durumu";
    case "teams":
      return "/kadinlar-1-ligi/takimlar";
    case "karsilastir":
      return "/kadinlar-1-ligi/karsilastir";
    case "statu":
      return "/kadinlar-1-ligi/statu";
    case "home":
    default:
      return "/kadinlar-1-ligi";
  }
};

export const parseKadinlar1LigRoute = (
  pathname: string
): { tab: Kadinlar1LigTabType; groupNo: number | "all" } => {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  const parts = clean.split("/").filter(Boolean);

  const sub = parts[0] === "kadinlar-1-ligi" ? parts[1] : parts[0];
  const second = parts[0] === "kadinlar-1-ligi" ? parts[2] : parts[1];

  let tab: Kadinlar1LigTabType = "home";
  let groupNo: number | "all" = 1;

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

  if (second === "tum-gruplar" || second === "all" || second === "tumu") {
    groupNo = "all";
  } else if (second === "grup-b" || second === "b" || second === "2" || second === "grup-2") {
    groupNo = 2;
  } else if (second === "grup-a" || second === "a" || second === "1" || second === "grup-1") {
    groupNo = 1;
  }

  return { tab, groupNo };
};

export const isValidKadinlar1LigSlug = (slug: string[]): boolean => {
  if (!slug || slug.length === 0) return true;
  if (slug.length > 2) return false;

  const validTabs = new Set([
    "puan-durumu",
    "fikstur",
    "sonuclar",
    "gunun-maclari",
    "grup-durumu",
    "takimlar",
    "karsilastir",
    "statu",
  ]);

  if (!validTabs.has(slug[0])) return false;

  if (slug.length === 2) {
    const validGroups = new Set(["grup-a", "grup-b", "tum-gruplar", "1", "2"]);
    if (!validGroups.has(slug[1])) return false;
  }

  return true;
};
