import { useEffect, useMemo, useState } from "react";
import type { StandingItem } from "@/types/fixture";
import { parseStandingKey } from "@/utils/standingsParsing";

/**
 * Puan durumu anahtarlarını ayrıştırır; il → yaş grubu → lig kademesi → grup seçimlerini
 * (state + senkronizasyon effect'leri) yönetir ve aktif bağlam ile satırları üretir.
 */
export function useStandingsSelection(
  standingsData: { [category: string]: StandingItem[] },
  city?: string
) {
  const allKeys = Object.keys(standingsData);

  // Tüm anahtarları ayrıştır
  const parsedContexts = useMemo(() => {
    return allKeys.map((k) => parseStandingKey(k, city));
  }, [allKeys, city]);

  // 1. İller Listesi (Eğer birden fazla il varsa İL seçici gösterilir)
  const distinctCities = useMemo(() => {
    const set = new Set<string>();
    parsedContexts.forEach((ctx) => {
      if (ctx.city) set.add(ctx.city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr", { numeric: true }));
  }, [parsedContexts]);

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (city && distinctCities.includes(city)) return city;
    return distinctCities[0] || "";
  });

  useEffect(() => {
    if (city && distinctCities.includes(city)) {
      setSelectedCity(city);
    } else if (distinctCities.length > 0 && !distinctCities.includes(selectedCity)) {
      setSelectedCity(distinctCities[0]);
    }
  }, [city, distinctCities, selectedCity]);

  // Seçili ile ait bağlamlar (Eğer il seçici yoksa hepsi)
  const cityFilteredContexts = useMemo(() => {
    if (distinctCities.length <= 1 || !selectedCity) {
      return parsedContexts;
    }
    return parsedContexts.filter((ctx) => ctx.city === selectedCity);
  }, [parsedContexts, distinctCities, selectedCity]);

  // 2. Yaş Grubu / Kategori Seçimi (Genç U18, Yıldız U16)
  const availableAgeGroups = useMemo(() => {
    const set = new Set<string>();
    cityFilteredContexts.forEach((ctx) => {
      set.add(ctx.ageGroup);
    });
    const order = ["Genç (U18)", "Yıldız (U16)", "Küçük (U14)", "Genel"];
    return Array.from(set).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, "tr");
    });
  }, [cityFilteredContexts]);

  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>(
    availableAgeGroups[0] || "Genç (U18)"
  );

  useEffect(() => {
    if (availableAgeGroups.length > 0 && !availableAgeGroups.includes(selectedAgeGroup)) {
      setSelectedAgeGroup(availableAgeGroups[0]);
    }
  }, [availableAgeGroups, selectedAgeGroup]);

  // Seçili yaş grubuna ait bağlamlar
  const ageFilteredContexts = useMemo(() => {
    return cityFilteredContexts.filter((ctx) => ctx.ageGroup === selectedAgeGroup);
  }, [cityFilteredContexts, selectedAgeGroup]);

  // 3. Lig Kademesi (Süper Lig / 1. Lig) - Birden fazla varsa lig seçici gösterilir
  const availableLeagues = useMemo(() => {
    const set = new Set<string>();
    ageFilteredContexts.forEach((ctx) => {
      set.add(ctx.leagueTier);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [ageFilteredContexts]);

  const [selectedLeagueTier, setSelectedLeagueTier] = useState<string>(
    availableLeagues[0] || "Süper Lig"
  );

  useEffect(() => {
    if (availableLeagues.length > 0 && !availableLeagues.includes(selectedLeagueTier)) {
      setSelectedLeagueTier(availableLeagues[0]);
    }
  }, [availableLeagues, selectedLeagueTier]);

  // 4. Grup Seçimi
  const availableGroups = useMemo(() => {
    const filtered = ageFilteredContexts.filter((ctx) => {
      if (availableLeagues.length > 1) {
        return ctx.leagueTier === selectedLeagueTier;
      }
      return true;
    });

    // Grupları sırala: Sayısal (1. Bölge A Grubu, 1. Bölge B Grubu...) veya Alfabetik (A Grubu, B Grubu)
    return filtered.sort((a, b) => {
      const numA = parseInt(a.displayGroup);
      const numB = parseInt(b.displayGroup);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
      return a.displayGroup.localeCompare(b.displayGroup, "tr", { numeric: true });
    });
  }, [ageFilteredContexts, availableLeagues, selectedLeagueTier]);

  const [selectedGroupKey, setSelectedGroupKey] = useState<string>(
    availableGroups[0]?.rawKey || allKeys[0] || ""
  );

  useEffect(() => {
    if (availableGroups.length > 0) {
      const exists = availableGroups.some((g) => g.rawKey === selectedGroupKey);
      if (!exists) {
        setSelectedGroupKey(availableGroups[0].rawKey);
      }
    }
  }, [availableGroups, selectedGroupKey]);

  // Seçili bağlam ve kesin puan tablosu verisi (sessiz fallback yok!)
  const activeContext = useMemo(() => {
    return parsedContexts.find((c) => c.rawKey === selectedGroupKey) || parsedContexts[0];
  }, [parsedContexts, selectedGroupKey]);

  const items = useMemo(() => {
    if (selectedGroupKey && standingsData[selectedGroupKey]) {
      return standingsData[selectedGroupKey];
    }
    return [];
  }, [selectedGroupKey, standingsData]);

  return {
    allKeys,
    parsedContexts,
    distinctCities,
    selectedCity,
    setSelectedCity,
    availableAgeGroups,
    selectedAgeGroup,
    setSelectedAgeGroup,
    availableLeagues,
    selectedLeagueTier,
    setSelectedLeagueTier,
    availableGroups,
    selectedGroupKey,
    setSelectedGroupKey,
    activeContext,
    items,
  };
}
