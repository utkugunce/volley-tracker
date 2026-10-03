import { useEffect, useMemo, useRef, useState } from "react";
import { trLower, trIncludes } from "@/utils/turkishLocale";

/**
 * İl seçici açılır menüsü: açık/kapalı durumu, arama terimi, dışarı tıklayınca kapanma,
 * Türkçe karakter duyarlı filtreleme ve "kategori & grup" bölümünün açık/kapalı durumu.
 */
export function useStandingsCityDropdown(
  distinctCities: string[],
  setSelectedCity: (cityName: string) => void
) {
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState<boolean>(false);
  const [citySearchTerm, setCitySearchTerm] = useState<string>("");
  const [isCategoryGroupOpen, setIsCategoryGroupOpen] = useState<boolean>(true);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // İl arama filtresi (Türkçe karakter duyarlı)
  const filteredCities = useMemo(() => {
    if (!citySearchTerm.trim()) return distinctCities;
    const q = trLower(citySearchTerm).trim();
    return distinctCities.filter((c) => trIncludes(c, q));
  }, [distinctCities, citySearchTerm]);

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setIsCityDropdownOpen(false);
    setCitySearchTerm("");
    setIsCategoryGroupOpen(true); // "ili seçince altındaki kategori grup kısmı da açılsın"
  };

  return {
    isCityDropdownOpen,
    setIsCityDropdownOpen,
    citySearchTerm,
    setCitySearchTerm,
    isCategoryGroupOpen,
    setIsCategoryGroupOpen,
    cityDropdownRef,
    filteredCities,
    handleCitySelect,
  };
}
