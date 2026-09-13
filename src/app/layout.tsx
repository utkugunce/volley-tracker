import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TVF İstanbul Voleybol İl Temsilciliği | Kızlar Süper Lig Bülteni",
  description: "Türkiye Voleybol Federasyonu İstanbul İl Temsilciliği Genç ve Yıldız Kızlar Süper Lig Haftalık Maç Programı ve Fikstür",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-background text-navy font-sans antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
