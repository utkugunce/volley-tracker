import { useState, useEffect } from "react";
import { computeLocalDateString } from "@/utils/dashboardFilters";

/**
 * Bugün & Dün tarihleri — sadece client tarafında hesaplanır.
 * useMemo yerine useEffect kullanılır: SSR (UTC) vs istemci (UTC+3) timezone farkından
 * kaynaklanan React hydration error #418 (metin uyuşmazlığı) önlenir.
 */
export function useTodayYesterday() {
  const [todayStr, setTodayStr] = useState("");
  const [yesterdayStr, setYesterdayStr] = useState("");

  useEffect(() => {
    setTodayStr(computeLocalDateString(0));
    setYesterdayStr(computeLocalDateString(1));
  }, []);

  return { todayStr, yesterdayStr };
}
