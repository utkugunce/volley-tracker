import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Altyapı Voleybol — TVF Fikstür ve Puan Durumu",
    template: "%s | Altyapı Voleybol",
  },
  description: "Türkiye Voleybol Federasyonu (TVF) 81 İl Temsilciliği Genç ve Yıldız Kızlar Süper Lig ile 1. Lig haftalık maç programı, canlı sonuçlar ve puan durumu.",
  metadataBase: new URL("https://altyapivoleybol.com.tr"),
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [
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
    <html lang="tr">
      <head>
        <link
          rel="preload"
          href="/fonts/museo-sans-500.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/museo-sans-700.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
