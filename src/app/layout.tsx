import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/theme/theme-vars.css";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/theme/theme";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { OfflineBanner } from "@/components/OfflineBanner";
import { GlobalJsonLd } from "@/components/JsonLd";
import {
  AnalyticsConsentWrapper,
  CookieConsentBanner,
} from "@/components/analytics/AnalyticsConsent";

const manrope = localFont({
  src: [
    {
      path: "../fonts/Manrope-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Manrope-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/Manrope-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: [
    {
      path: "../fonts/SpaceGrotesk-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/SpaceGrotesk-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#07131F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Altyapı Voleybol — TVF Fikstür ve Puan Durumu",
    template: "%s | Altyapı Voleybol",
  },
  description: "Türkiye Voleybol Federasyonu (TVF) 81 İl Temsilciliği Genç ve Yıldız Kızlar Süper Lig ile 1. Lig haftalık maç programı, canlı sonuçlar ve puan durumu.",
  metadataBase: new URL("https://altyapivoleybol.com.tr"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Altyapı Voleybol",
  },
  openGraph: {
    title: "Altyapı Voleybol — TVF Fikstür ve Puan Durumu",
    description: "Türkiye Voleybol Federasyonu (TVF) 81 İl Temsilciliği Genç ve Yıldız Kızlar Süper Lig ile 1. Lig haftalık maç programı, canlı sonuçlar ve puan durumu.",
    url: "https://altyapivoleybol.com.tr",
    siteName: "Altyapı Voleybol",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, type: "image/png", alt: "Altyapı Voleybol" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Altyapı Voleybol — TVF Fikstür ve Puan Durumu",
    description: "Türkiye Voleybol Federasyonu (TVF) 81 İl Temsilciliği Genç ve Yıldız Kızlar Süper Lig ile 1. Lig haftalık maç programı, canlı sonuçlar ve puan durumu.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      data-theme="dark"
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Tema/dil tercihini ilk boyamadan önce uygular (yanıp sönme olmaz). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased selection:bg-selected-strong selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-fg focus:text-xs focus:font-semibold focus:shadow-lg"
        >
          Ana içeriğe atla
        </a>
        <GlobalJsonLd />
        {children}
        <AnalyticsConsentWrapper />
        <CookieConsentBanner />
        <ServiceWorkerRegister />
        <OfflineBanner />
      </body>
    </html>
  );
}
