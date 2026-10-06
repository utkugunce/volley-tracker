import { useState, useEffect, useCallback, useRef } from "react";
import type { FixturesData } from "@/types/fixture";
import { toErrorLike } from "@/utils/errors";

// İstemci tarafı şehir verisi önbelleği (Tekrar tıklanan iller 0ms anında açılır)
const clientCityCache = new Map<string, FixturesData>();

interface UseFixturesDataOptions {
  initialData: FixturesData;
  initialCity: string;
  initialDataPartial: boolean;
  currentCitySlug: string;
}

/**
 * DashboardClient için fikstür verisi: state (data/loading/error), istemci önbelleği,
 * kısmi veriyi tamamlama (ensureFullData), yenileme (fetchData) ve il verisi yükleme.
 */
export function useFixturesData({
  initialData,
  initialCity,
  initialDataPartial,
  currentCitySlug,
}: UseFixturesDataOptions) {
  const [data, setData] = useState<FixturesData>(initialData);
  const [isPartialData, setIsPartialData] = useState(initialDataPartial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fullDataRequestRef = useRef<Promise<boolean> | null>(null);

  // İlk veriyi istemci önbelleğine yaz
  useEffect(() => {
    if (initialData && !initialDataPartial) {
      clientCityCache.set(initialCity || "all", initialData);
      if (initialData.city && initialData.city !== "Tüm İller") {
        clientCityCache.set(initialData.city.toLowerCase(), initialData);
      }
    }
  }, [initialData, initialCity, initialDataPartial]);

  const ensureFullData = () => {
    if (!isPartialData) return Promise.resolve(true);
    if (fullDataRequestRef.current) return fullDataRequestRef.current;

    const request = (async () => {
      try {
        const cached = clientCityCache.get(currentCitySlug);
        if (cached && (cached.matches?.length || 0) > (data?.matches?.length || 0)) {
          setData(cached);
          setIsPartialData(false);
          return true;
        }

        const res = await fetch(`/api/fixtures?city=${currentCitySlug}`);
        if (!res.ok) {
          console.warn("Tam il verisi arka planda alınamadı, mevcut veri korunuyor.");
          return false;
        }
        const json: FixturesData = await res.json();
        if (json && Array.isArray(json.matches) && json.matches.length > 0) {
          clientCityCache.set(currentCitySlug, json);
          setData(json);
          setIsPartialData(false);
        }
        return true;
      } catch (err) {
        console.warn("Tam il verisi arka planda alınırken hata oluştu (mevcut veri korunuyor):", err);
        return false;
      } finally {
        fullDataRequestRef.current = null;
      }
    })();
    fullDataRequestRef.current = request;
    return request;
  };

  /** İl verisini önbellekten (anında) ya da API'den yükler. */
  const loadCityData = useCallback(async (slug: string) => {
    // 1. Önbellekte varsa anında 0ms aç (Loading beklemeden)
    const cached = clientCityCache.get(slug);
    if (cached) {
      setData(cached);
      setIsPartialData(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/fixtures?city=${slug}`);
      if (!res.ok) throw new Error("İl verisi alınamadı.");
      const json: FixturesData = await res.json();
      clientCityCache.set(slug, json);
      setData(json);
      setIsPartialData(false);
    } catch (err) {
      setError(toErrorLike(err).message || "İl fikstürü yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Geçerli ilin verisini API'den yeniden çeker (Header "Yenile" düğmesi). */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fixtures?city=${currentCitySlug}`);
      if (!res.ok) {
        throw new Error("Bülten verisi yüklenemedi.");
      }
      const json: FixturesData = await res.json();
      clientCityCache.set(currentCitySlug, json);
      setData(json);
      setIsPartialData(false);
    } catch (err) {
      setError(toErrorLike(err).message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    isPartialData,
    loading,
    error,
    setError,
    ensureFullData,
    loadCityData,
    fetchData,
  };
}
