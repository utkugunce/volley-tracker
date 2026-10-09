import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Home, Calendar, Trophy, Shield, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-4xl mx-auto w-full pt-4 flex items-center justify-between">
        <Link href="/" prefetch={false} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
          <BrandLogo />
        </Link>
      </header>

      <div className="max-w-lg mx-auto w-full my-auto text-center py-12 px-4 space-y-6">
        {/* Voleybol rozeti & 404 göstergesi */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 text-primary shadow-glow-primary">
          <span className="font-display font-black text-3xl tracking-tight">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-display">
            Top Çizgi Dışında Kaldı!
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
            Aradığınız maç, takım veya sayfa taşınmış, silinmiş ya da geçersiz bir adrese sahip olabilir.
          </p>
        </div>

        {/* Hızlı Yönlendirme Kartları */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 text-left">
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-surface hover:bg-surface-raised border border-line text-xs font-semibold text-ink transition-colors active:scale-95"
          >
            <Home className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>Ana Sayfa</span>
          </Link>
          <Link
            href="/fikstur"
            prefetch={false}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-surface hover:bg-surface-raised border border-line text-xs font-semibold text-ink transition-colors active:scale-95"
          >
            <Calendar className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>Haftalık Fikstür</span>
          </Link>
          <Link
            href="/puan-durumu"
            prefetch={false}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-surface hover:bg-surface-raised border border-line text-xs font-semibold text-ink transition-colors active:scale-95"
          >
            <Trophy className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>Puan Durumu</span>
          </Link>
          <Link
            href="/kulupler"
            prefetch={false}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-surface hover:bg-surface-raised border border-line text-xs font-semibold text-ink transition-colors active:scale-95"
          >
            <Shield className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>Kulüpler Rehberi</span>
          </Link>
        </div>

        {/* Ana Buton */}
        <div className="pt-2">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-ink-3 pb-4">
        <p>Altyapı Voleybol • TVF Türkiye Altyapı Ligleri</p>
      </footer>
    </main>
  );
}
