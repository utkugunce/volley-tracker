import { useState, useEffect } from "react";
import { getIstanbulDateString } from "@/utils/calendar";

/**
 * Bugün & Dün tarihleri — Türkiye saat dilimi (Europe/Istanbul, UTC+3) baz alınarak
 * hem SSR (sunucu) hem istemcide tutarlı ve anında hazır şekilde hesaplanır.
 */
export function useTodayYesterday() {
  const [todayStr, setTodayStr] = useState(() => getIstanbulDateString(0));
  const [yesterdayStr, setYesterdayStr] = useState(() => getIstanbulDateString(1));

  useEffect(() => {
    setTodayStr(getIstanbulDateString(0));
    setYesterdayStr(getIstanbulDateString(1));
  }, []);

  return { todayStr, yesterdayStr };
}
