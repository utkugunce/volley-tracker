"use client";

import React, { useEffect } from "react";
import { RotateCcw, AlertOctagon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global kök hata yakalandı:", error);
  }, [error]);

  return (
    <html lang="tr" data-theme="dark">
      <body
        style={{
          margin: 0,
          padding: "16px",
          minHeight: "100vh",
          backgroundColor: "#07131F",
          color: "#F1F5F9",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "448px",
            width: "100%",
            textAlign: "center",
            padding: "48px 24px",
            backgroundColor: "#0B1B2B",
            border: "1px solid #1E293B",
            borderRadius: "20px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              backgroundColor: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              color: "#FB7185",
              marginBottom: "16px",
            }}
          >
            <AlertOctagon style={{ width: "36px", height: "36px" }} aria-hidden="true" />
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 900,
              margin: "0 0 8px 0",
              color: "#FFFFFF",
            }}
          >
            Teknik Mola!
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#94A3B8",
              lineHeight: 1.6,
              margin: "0 0 24px 0",
            }}
          >
            Uygulama yüklenirken beklenmedik bir aksaklık oluştu. Lütfen sayfayı yenileyiniz.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                } else {
                  reset();
                }
              }}
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
              }}
            >
              <RotateCcw style={{ width: "16px", height: "16px" }} aria-hidden="true" />
              <span>Tekrar Dene</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.href = "/";
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
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
            >
              <span>Ana Sayfa</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
