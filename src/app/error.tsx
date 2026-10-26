"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { RotateCcw, Home, AlertOctagon } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 1. Hatayı konsola logla (monitoring servisleri için)
    console.error("Uygulama hatası yakalandı:", error);

    // 2. ChunkLoadError / Statik Varlık / CSS Yükleme Hatası Otomatik İyileştirme
    if (typeof window !== "undefined") {
      const message = error?.message || "";
      const isChunkOrAssetError =
        message.includes("ChunkLoadError") ||
        message.includes("Loading chunk") ||
        message.includes("dynamically imported module") ||
        message.includes("CSS_CHUNK_LOAD_FAILED") ||
        message.includes("Failed to fetch") ||
        message.includes("NetworkError");

      if (isChunkOrAssetError) {
        const key = "chunk_load_failed_reload";
        const lastReload = sessionStorage.getItem(key);
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
          sessionStorage.setItem(key, now.toString());
          console.warn(
            "Statik varlık hatası tespit edildi, sayfa güncel sürüm için yenileniyor..."
          );
          window.location.reload();
        }
      }
    }
  }, [error]);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      reset();
    }
  };

  const handleHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#07131F",
        color: "#F1F5F9",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "16px",
      }}
      className="min-h-screen bg-canvas text-ink flex flex-col justify-between p-4 sm:p-6"
    >
      <header
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          width: "100%",
          paddingTop: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="max-w-4xl mx-auto w-full pt-4 flex items-center justify-between"
      >
        <Link
          href="/"
          prefetch={false}
          style={{ textDecoration: "none", color: "inherit" }}
          className="focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
        >
          <BrandLogo />
        </Link>
      </header>

      <div
        style={{
          maxWidth: "448px",
          margin: "auto",
          width: "100%",
          textAlign: "center",
          padding: "48px 24px",
          backgroundColor: "#0B1B2B",
          border: "1px solid #1E293B",
          borderRadius: "20px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
        className="max-w-md mx-auto w-full my-auto text-center py-12 px-4 space-y-6"
      >
        {/* Hata ikonu */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "24px",
            backgroundColor: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
            color: "#FB7185",
            marginBottom: "16px",
          }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-glow-red"
        >
          <AlertOctagon
            style={{ width: "40px", height: "40px" }}
            className="w-10 h-10"
            aria-hidden="true"
          />
        </div>

        <div style={{ marginBottom: "24px" }} className="space-y-2">
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.025em",
              margin: "0 0 8px 0",
            }}
            className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-display"
          >
            Teknik Mola!
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#94A3B8",
              lineHeight: 1.6,
              margin: 0,
            }}
            className="text-xs sm:text-sm text-ink-2 leading-relaxed"
          >
            Bu sayfa yüklenirken beklenmeyen bir aksaklık oluştu. Sayfayı yeniden yüklemeyi veya ana sayfaya dönmeyi deneyebilirsiniz.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "10px",
                fontFamily: "monospace",
                color: "#64748B",
                marginTop: "8px",
              }}
              className="text-[10px] font-mono text-ink-3 pt-1"
            >
              Referans Kodu: {error.digest}
            </p>
          )}
        </div>

        {/* Aksiyon Butonları */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "12px",
            justifyContent: "center",
          }}
          className="flex flex-col sm:flex-row items-center gap-3 pt-2"
        >
          <button
            type="button"
            onClick={handleRetry}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "12px 20px",
              borderRadius: "12px",
              backgroundColor: "#00E5FF",
              color: "#07131F",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 15px -3px rgba(0, 229, 255, 0.2)",
            }}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-primary-fg text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw
              style={{ width: "16px", height: "16px" }}
              className="w-4 h-4"
              aria-hidden="true"
            />
            <span>Tekrar Dene</span>
          </button>
          <button
            type="button"
            onClick={handleHome}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "12px 20px",
              borderRadius: "12px",
              backgroundColor: "#0F1E2E",
              border: "1px solid #1E293B",
              color: "#F1F5F9",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-surface hover:bg-surface-raised border border-line text-ink text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Home
              style={{ width: "16px", height: "16px" }}
              className="w-4 h-4"
              aria-hidden="true"
            />
            <span>Ana Sayfa</span>
          </button>
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "#64748B",
          paddingBottom: "16px",
        }}
        className="text-center text-[11px] text-ink-3 pb-4"
      >
        <p style={{ margin: 0 }}>Altyapı Voleybol • TVF Türkiye Altyapı Ligleri</p>
      </footer>
    </main>
  );
}
