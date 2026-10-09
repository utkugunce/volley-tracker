"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { ShieldCheck, Cookie, X } from "lucide-react";

export const CONSENT_KEY = "av-analytics-consent";

export type ConsentStatus = "granted" | "denied" | "undecided";

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return "undecided";
  try {
    const val = localStorage.getItem(CONSENT_KEY);
    if (val === "granted" || val === "denied") return val;
    return "undecided";
  } catch {
    return "undecided";
  }
}

export function setConsentStatus(status: "granted" | "denied") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, status);
    window.dispatchEvent(new CustomEvent("av-consent-changed", { detail: status }));
  } catch {
    // ignore
  }
}

/**
 * Yalnızca ziyaretçi açık rıza (opt-in) vermişse Vercel Analytics'i yükler.
 * Rıza verilmemişse hiçbir izleme kodu çalışmaz (GDPR / ePrivacy / KVKK uyumlu).
 */
export function AnalyticsConsentWrapper() {
  const [consent, setConsent] = useState<ConsentStatus>("undecided");

  useEffect(() => {
    setConsent(getConsentStatus());

    const handleConsentChange = (e: Event) => {
      const customEvent = e as CustomEvent<ConsentStatus>;
      setConsent(customEvent.detail || getConsentStatus());
    };

    window.addEventListener("av-consent-changed", handleConsentChange);
    return () => window.removeEventListener("av-consent-changed", handleConsentChange);
  }, []);

  if (consent !== "granted") {
    return null;
  }

  return <Analytics />;
}

/**
 * İlk ziyarette kullanıcıya onay soran WCAG 2.1 AA uyumlu çerez ve analiz onay çubuğu.
 */
export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ConsentStatus>("granted"); // Başlangıçta gizli tut

  useEffect(() => {
    setMounted(true);
    setStatus(getConsentStatus());

    const handleConsentChange = () => {
      setStatus(getConsentStatus());
    };

    window.addEventListener("av-consent-changed", handleConsentChange);
    return () => window.removeEventListener("av-consent-changed", handleConsentChange);
  }, []);

  if (!mounted || status !== "undecided") {
    return null;
  }

  const handleAccept = () => {
    setConsentStatus("granted");
    setStatus("granted");
  };

  const handleReject = () => {
    setConsentStatus("denied");
    setStatus("denied");
  };

  return (
    <aside
      role="region"
      aria-label="Çerez ve Gizlilik Tercihleri"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 no-print"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
            <Cookie size={18} aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-white text-xs sm:text-sm">
              Gizliliğinize ve Tercihlerinize Saygı Duyuyoruz
            </p>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Sitemizde yalnızca temel teknik işlevler ve anonimleştirilmiş kullanım analitiği (Vercel Analytics) için çerez ve yerel depolama kullanılır. Reklam izleyicisi, üçüncü taraf profilleme veya kişisel veri satışı yapılmaz. Ayruntılı bilgi için{" "}
              <Link
                href="/gizlilik"
                prefetch={false}
                className="text-primary hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-primary rounded"
              >
                Gizlilik Politikası ve KVKK Aydınlatma Metni
              </Link>
              ’ni inceleyebilirsiniz.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0">
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Yalnızca Zorunlu
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold text-primary-fg bg-primary hover:bg-primary-hover shadow-glow-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Analitiğe İzin Ver
          </button>
        </div>
      </div>
    </aside>
  );
}
