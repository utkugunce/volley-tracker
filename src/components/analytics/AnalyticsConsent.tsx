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
      className="fixed inset-x-2 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 md:inset-x-auto md:right-4 md:max-w-md z-50 rounded-2xl p-3 bg-slate-950/95 border border-slate-800 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 no-print"
    >
      <div className="flex items-center gap-3 text-xs">
        <Cookie size={16} className="text-primary shrink-0" aria-hidden="true" />
        <p className="flex-1 min-w-0 text-slate-300 leading-snug">
          Yalnızca anonim kullanım analitiği.{" "}
          <Link
            href="/gizlilik"
            prefetch={false}
            className="text-primary hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-primary rounded"
          >
            Gizlilik
          </Link>
        </p>
        <button
          type="button"
          onClick={handleReject}
          className="shrink-0 px-3 py-2 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Reddet
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="shrink-0 px-3 py-2 rounded-xl font-bold text-primary-fg bg-primary hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Kabul
        </button>
      </div>
    </aside>
  );
}
