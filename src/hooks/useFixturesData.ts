import { useState, useEffect, useCallback, useRef } from "react";
import type { FixturesData, Match } from "@/types/fixture";
import { toErrorLike } from "@/utils/errors";

// İstemci tarafı şehir verisi önbelleği (Tekrar tıklanan iller 0ms anında açılır)
const clientCityCache = new Map<string, FixturesData>();

function matchIdentityKey(m: Match): string {
  return `${m.date || ""}|${(m.home_team || "").trim()}|${(m.away_team || "").trim()}`;
}

function isSameFixtureMatch(a: Match, b: Match): boolean {
  return (
    (a.home_team || "").trim() === (b.home_team || "").trim() &&
    (a.away_team || "").trim() === (b.away_team || "").trim() &&
    (a.date || "") === (b.date || "")
  );
}

/**
 * SSR (initialData) veya mevcut ekranda skoru zaten gelmiş ("finished") bir maçın,
 * arka plandaki gecikmeli bir API/önbellek yanıtıyla tekrar skorsuz ("upcoming" / "Skor Bekleniyor")
 * duruma düşmesini engeller.
 */
export function preserveScoredMatches(
  incoming: FixturesData,
  current: FixturesData | null | undefined
): FixturesData {
  if (!current || !Array.isArray(current.matches) || current.matches.length === 0) {
    return incoming;
  }
  if (!incoming || !Array.isArray(incoming.matches)) {
    return incoming;
  }

  const scoredById = new Map<string, Match>();
  const scoredByKey = new Map<string, Match>();
  for (const cm of current.matches) {
    if (!cm) continue;
    const hasScore =
      cm.status === "finished" ||
      (cm.home_score !== null && cm.home_score !== undefined && cm.away_score !== null && cm.away_score !== undefined);
    if (hasScore) {
      if (cm.id) scoredById.set(cm.id, cm);
      if (cm.home_team && cm.away_team) scoredByKey.set(matchIdentityKey(cm), cm);
    }
  }

  if (scoredById.size === 0 && scoredByKey.size === 0) return incoming;

  let changed = false;
  const merged = incoming.matches.map((im) => {
    if (!im || im.is_overridden) return im;
    const candidateById = im.id ? scoredById.get(im.id) : undefined;
    const prev =
      candidateById && isSameFixtureMatch(im, candidateById)
        ? candidateById
        : scoredByKey.get(matchIdentityKey(im));
    if (!prev) return im;

    const incomingHasScore =
      im.status === "finished" ||
      (im.home_score !== null && im.home_score !== undefined && im.away_score !== null && im.away_score !== undefined);

    if (!incomingHasScore) {
      changed = true;
      return {
        ...im,
        score: prev.score,
        home_score: prev.home_score,
        away_score: prev.away_score,
        set_scores: prev.set_scores && prev.set_scores.length > 0 ? prev.set_scores : im.set_scores,
        status: prev.status || "finished",
        forfeit: prev.forfeit ?? im.forfeit,
        volleybox: prev.volleybox?.synced ? prev.volleybox : im.volleybox,
      };
    }

    if ((!im.set_scores || im.set_scores.length === 0) && prev.set_scores && prev.set_scores.length > 0) {
      changed = true;
      return {
        ...im,
        set_scores: prev.set_scores,
      };
    }

    return im;
  });

  return changed ? { ...incoming, matches: merged } : incoming;
}

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

  const ensureFullData = useCallback(() => {
    if (!isPartialData) return Promise.resolve(true);
    if (fullDataRequestRef.current) return fullDataRequestRef.current;

    const request = (async () => {
      try {
        const cached = clientCityCache.get(currentCitySlug);
        // Sadece tam ve güncel önbellek varsa kullan; 1700 altındaki eski/kısmi önbelleği atla
        if (
          cached &&
          (cached.matches?.length || 0) > (data?.matches?.length || 0) &&
          (currentCitySlug !== "all" || (cached.matches?.length || 0) >= 1700)
        ) {
          setData(cached);
          setIsPartialData(false);
          return true;
        }

        const res = await fetch(`/api/fixtures?city=${currentCitySlug}&_t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) {
          console.warn("Tam il verisi arka planda alınamadı, mevcut veri korunuyor.");
          return false;
        }
        const json: FixturesData = await res.json();
        if (json && Array.isArray(json.matches) && json.matches.length > 0) {
          setData((prev) => {
            const reconciled = preserveScoredMatches(json, prev);
            clientCityCache.set(currentCitySlug, reconciled);
            return reconciled;
          });
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
  }, [currentCitySlug, data?.matches?.length, isPartialData]);

  // Başlangıç verisi kısmi (partial) ise sayfa açılır açılmaz arka planda tam veriyi sessizce tamamla
  useEffect(() => {
    if (initialDataPartial && isPartialData) {
      void ensureFullData();
    }
  }, [ensureFullData, initialDataPartial, isPartialData]);

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
      setData((prev) => {
        const reconciled = preserveScoredMatches(json, prev);
        clientCityCache.set(slug, reconciled);
        return reconciled;
      });
      setIsPartialData(false);
    } catch (err) {
      setError(toErrorLike(err).message || "İl fikstürü yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Geçerli ilin verisini API'den yeniden çeker (Header "Yenile" düğmesi). */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fixtures?city=${currentCitySlug}`);
      if (!res.ok) {
        throw new Error("Bülten verisi yüklenemedi.");
      }
      const json: FixturesData = await res.json();
      setData((prev) => {
        const reconciled = preserveScoredMatches(json, prev);
        clientCityCache.set(currentCitySlug, reconciled);
        return reconciled;
      });
      setIsPartialData(false);
    } catch (err) {
      setError(toErrorLike(err).message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [currentCitySlug]);

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
