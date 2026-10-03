import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Manrope, Space_Grotesk } from "next/font/google";
import "@/theme/theme-vars.css";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/theme/theme";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Analytics } from "@vercel/analytics/next";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
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
    images: [{ url: "/icon.svg", width: 512, height: 512, alt: "Altyapı Voleybol" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Altyapı Voleybol — TVF Fikstür ve Puan Durumu",
    description: "Türkiye Voleybol Federasyonu (TVF) 81 İl Temsilciliği Genç ve Yıldız Kızlar Süper Lig ile 1. Lig haftalık maç programı, canlı sonuçlar ve puan durumu.",
    images: ["/icon.svg"],
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
    <html lang="tr" data-theme="dark" suppressHydrationWarning className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Tema/dil tercihini ilk boyamadan önce uygular (yanıp sönme olmaz). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased selection:bg-selected-strong selection:text-white">
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S5FYXCW2LC"
          strategy="lazyOnload"
        />
        {/* gtag.js (157 KB) sayfa yüklendikten sonra çekilir; dataLayer kuyruğu satır içi betikle hemen kurulur,
            böylece config/page_view olayları kaybolmaz ve kütüphane yüklenince işlenir. */}
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-S5FYXCW2LC');`}
        </Script>
        <Analytics />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
