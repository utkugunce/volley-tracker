"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { Cookie } from "lucide-react";

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
      className="fixed inset-x-2 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-50 rounded-2xl border border-line bg-surface/95 p-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300 no-print md:inset-x-auto md:bottom-4 md:right-4 md:max-w-md"
    >
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-xs sm:flex sm:gap-3">
        <Cookie size={16} className="text-primary shrink-0" aria-hidden="true" />
        <p className="min-w-0 text-ink-2 sm:flex-1">
          Yalnızca anonim kullanım analitiği.{" "}
          <Link
            href="/gizlilik"
            prefetch={false}
            className="text-primary hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-primary rounded"
          >
            Gizlilik
          </Link>
        </p>
        <div className="col-span-2 grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button
            type="button"
            onClick={handleReject}
            className="min-h-11 rounded-xl border border-line bg-surface-muted px-3 py-2 font-semibold text-ink-2 transition-colors duration-300 hover:bg-surface-raised hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Reddet
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="min-h-11 rounded-xl bg-primary px-3 py-2 font-semibold text-primary-fg transition-colors duration-300 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Kabul
          </button>
        </div>
      </div>
    </aside>
  );
}
