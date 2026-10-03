export type AppMainTab = "home" | "results" | "today" | "fixtures" | "standings" | "group-status";

export const getAppRoute = (
  tab: AppMainTab,
  citySlug?: string
): string => {
  const isCity = citySlug && citySlug !== "all" && citySlug !== "Tüm İller";
  const slug = isCity ? citySlug.toLowerCase() : "";

  switch (tab) {
    case "group-status":
      return slug ? `/grup-durumu/${slug}` : "/grup-durumu";
    case "standings":
      return slug ? `/puan-durumu/${slug}` : "/puan-durumu";
    case "fixtures":
      return slug ? `/fikstur/${slug}` : "/fikstur";
    case "results":
      return slug ? `/sonuclar/${slug}` : "/sonuclar";
    case "today":
      return slug ? `/gunun-maclari/${slug}` : "/gunun-maclari";
    case "home":
    default:
      return slug ? `/${slug}` : "/";
  }
};

export const parseAppRoute = (
  pathname: string
): { tab: AppMainTab; city: string } => {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");
  if (!cleanPath) {
    return { tab: "home", city: "all" };
  }

  const parts = cleanPath.split("/").filter(Boolean);
  const first = parts[0]?.toLowerCase();
  const second = parts[1]?.toLowerCase();

  // Pattern 1: /grup-durumu/[city]
  if (first === "grup-durumu") {
    return { tab: "group-status", city: second || "all" };
  }
  if (first === "puan-durumu") {
    return { tab: "standings", city: second || "all" };
  }
  if (first === "fikstur") {
    return { tab: "fixtures", city: second || "all" };
  }
  if (first === "sonuclar") {
    return { tab: "results", city: second || "all" };
  }
  if (first === "gunun-maclari") {
    return { tab: "today", city: second || "all" };
  }

  // Pattern 2: /[city]/grup-durumu
  if (second === "grup-durumu") {
    return { tab: "group-status", city: first };
  }
  if (second === "puan-durumu") {
    return { tab: "standings", city: first };
  }
  if (second === "fikstur") {
    return { tab: "fixtures", city: first };
  }
  if (second === "sonuclar") {
    return { tab: "results", city: first };
  }
  if (second === "gunun-maclari") {
    return { tab: "today", city: first };
  }

  // Pattern 3: /[city] (direct city slug like /istanbul)
  return { tab: "home", city: first };
};
