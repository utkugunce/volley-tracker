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
