import type { Metadata } from "next";
import { NotFoundView } from "@/components/NotFoundView";

/**
 * proxy.ts'in (middleware) geçersiz şehir adresleri için rewrite ettiği hedef.
 *
 * NOT (Next.js /404 Rezervasyonu):
 *   Next.js `/404` yolunu dahili not-found rotası (app/not-found.tsx) olarak rezerve eder.
 *   Dolayısıyla bu dosyadaki metadata doğrudan uygulanmaz; ancak proxy.ts'in rewrite hedefi
 *   olarak geçerli bir App Router sayfasının bulunması için bu dosya mevcuttur.
 *
 * Neden ayrı bir rota?
 *   `src/app/[city]/page.tsx` içindeki `notFound()` doğru çalışıyor, fakat
 *   `src/app/loading.tsx` Suspense kabuğunu HTTP 200 ile flush ettiği için
 *   status kodu sonradan 404'e çevrilemiyor. proxy.ts stream'den önce
 *   çalıştığından isteği bu rotaya `status: 404` ile rewrite ediyoruz:
 *   kullanıcı aynı 404 arayüzünü görür, ama arama motorları ve önbellek
 *   gerçek bir 404 alır.
 *
 *   `/404` statik bir segment olduğu için `/[city]` tarafından gölgelenmez
 *   (Next.js'te statik segment dinamik segmentten önce gelir).
 */
export const metadata: Metadata = {
  // title.absolute: layout.tsx'in "%s | Altyapı Voleybol" şablonu uygulanmasın.
  title: { absolute: "Sayfa Bulunamadı (404)" },
  description: "Aradığınız maç, takım veya sayfa taşınmış, silinmiş ya da geçersiz bir adrese sahip olabilir.",
  robots: { index: false, follow: true },
};

export default function HardNotFoundPage() {
  return <NotFoundView />;
}
