"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { RotateCcw, Home, AlertOctagon } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Üretimde hatayı konsola logla (monitoring servisleri için)
    console.error("Uygulama hatası yakalandı:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-4xl mx-auto w-full pt-4 flex items-center justify-between">
        <Link href="/" prefetch={false} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
          <BrandLogo />
        </Link>
      </header>

      <div className="max-w-md mx-auto w-full my-auto text-center py-12 px-4 space-y-6">
        {/* Hata ikonu */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-glow-red">
          <AlertOctagon className="w-10 h-10" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-display">
            Teknik Mola!
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
            Bu sayfa yüklenirken beklenmeyen bir aksaklık oluştu. Sayfayı yeniden yüklemeyi veya ana sayfaya dönmeyi deneyebilirsiniz.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-ink-3 pt-1">
              Referans Kodu: {error.digest}
            </p>
          )}
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Tekrar Dene</span>
          </button>
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-surface hover:bg-surface-raised border border-line text-ink text-xs sm:text-sm font-bold transition-all active:scale-95"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Ana Sayfa</span>
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-ink-3 pb-4">
        <p>Altyapı Voleybol • TVF Türkiye Altyapı Ligleri</p>
      </footer>
    </main>
  );
}
