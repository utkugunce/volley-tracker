import { useState, useEffect } from "react";
import type { CityInfo } from "@/types/fixture";

/** /api/cities yanıtındaki il kaydı: CityInfo alanları + sayaçlar. */
export type CityListItem = CityInfo & { finished_count?: number; scored_matches?: number };

/** 81 İl listesini /api/cities'ten yükler. */
export function useCitiesList() {
  const [citiesList, setCitiesList] = useState<CityListItem[]>([]);

  useEffect(() => {
    fetch("/api/cities")
      .then((res) => res.json())
      .then((json) => {
        if (json?.cities) {
          setCitiesList(json.cities);
        }
      })
      .catch((e) => console.error("Cities load error:", e));
  }, []);

  return citiesList;
}

/** En son 81 il tarama zaman damgasını /api/cities üzerinden alır. */
export function useCitiesSyncTime(): string | null {
  const [syncTime, setSyncTime] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cities")
      .then((res) => res.json())
      .then((json) => {
        if (json?.updated_at) {
          setSyncTime(json.updated_at);
        }
      })
      .catch((e) => console.error("Cities sync time error:", e));
  }, []);

  return syncTime;
}
