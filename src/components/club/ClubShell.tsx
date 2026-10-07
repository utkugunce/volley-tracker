import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Panel / giriş sayfaları için ortak sade kabuk. */
export function ClubShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link prefetch={false} href="/" className="inline-flex items-center gap-1 text-xs font-bold text-ink-2 hover:text-ink mb-6">
          <ChevronLeft size={14} /> Ana sayfa
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black mb-6">{title}</h1>
        {children}
      </div>
    </main>
  );
}

/** Kurulum eksikken gösterilen dostça durum kartı (siteyi etkilemez). */
export function SetupNotice({ kind }: { kind: "not_configured" | "setup_required" }) {
  return (
    <div role="status" className="rounded-2xl border border-line bg-panel p-6 text-sm">
      <p className="font-black text-base mb-2">Kulüp paneli yakında</p>
      <p className="text-ink-2">
        {kind === "setup_required"
          ? "Panel için veritabanı kurulumu henüz tamamlanmadı. Kurulum bittiğinde bu sayfa otomatik olarak çalışmaya başlayacak."
          : "Kulüp paneli şu anda etkin değil (kurulum gerekli). Site yöneticisi kurulumu tamamladığında buradan giriş yapabileceksiniz."}
      </p>
      <p className="text-ink-3 mt-3 text-xs">Sitenin geri kalanı (fikstür, puan durumu, istatistikler) normal çalışmaya devam eder.</p>
    </div>
  );
}
