import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TVF Voleybol İl Temsilciliği | Kızlar Süper Lig Bülteni",
  description: "Türkiye Voleybol Federasyonu 81 İl Temsilciliği Genç ve Yıldız Kızlar Süper Lig Haftalık Maç Programı ve Fikstür",
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
      <body className="min-h-screen bg-background text-navy font-sans antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
