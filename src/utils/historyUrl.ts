/**
 * Adres çubuğunu `history.replaceState` ile günceller; adres zaten aynıysa HİÇBİR ŞEY yapmaz.
 *
 * Her `replaceState` çağrısı tarayıcı sürecine (IPC) gider ve Next.js yönlendiricisini de tetikler;
 * aynı adresi tekrar tekrar yazmak (ör. bir effect ya da seçim döngüsünde) tarayıcı arayüzünü yorar.
 * Mevcut `history.state` korunur (Next.js'in iç gezinme durumu silinmez → geri/ileri tam sayfa yenilemez).
 *
 * @returns adres değiştiyse `true`
 */
export function replaceUrlIfChanged(url: string | URL): boolean {
  if (typeof window === "undefined") return false;
  let next: URL;
  try {
    next = new URL(String(url), window.location.href);
  } catch {
    return false;
  }
  if (next.origin !== window.location.origin || next.href === window.location.href) return false;
  try {
    window.history.replaceState(window.history.state, "", `${next.pathname}${next.search}${next.hash}`);
    return true;
  } catch {
    return false;
  }
}
