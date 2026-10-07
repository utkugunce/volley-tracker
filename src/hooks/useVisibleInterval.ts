import { useEffect, useRef } from "react";

/**
 * Sekme görünürken `callback`'i `ms` aralıklarla çalıştırır; sekme arka plana geçince (document.hidden)
 * zamanlayıcıyı tamamen durdurur, geri gelince hemen bir kez çalıştırıp yeniden başlatır.
 * Bileşen kaldırılınca zamanlayıcı ve dinleyici temizlenir (gezinmeler arasında sızıntı olmaz).
 *
 * `callback` her render'da değişebilir; zamanlayıcı yalnızca `ms`/`enabled` değişince yeniden kurulur.
 */
export function useVisibleInterval(callback: () => void, ms: number, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !(ms > 0) || typeof document === "undefined") return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => savedCallback.current();
    const start = () => {
      if (timer === null) timer = setInterval(tick, ms);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        tick();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ms, enabled]);
}
