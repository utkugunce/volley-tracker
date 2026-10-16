import { ImageResponse } from "next/og";

export const alt = "Altyapı Voleybol — TVF 81 İl Fikstür, Canlı Skor ve Puan Durumu";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #020617 0%, #0f172a 55%, #1e1b4b 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "10px 22px",
              borderRadius: "999px",
              background: "rgba(249, 115, 22, 0.16)",
              border: "1px solid rgba(249, 115, 22, 0.45)",
              color: "#fb923c",
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "0.06em",
            }}
          >
            TVF 81 İL ALTYAPI &amp; KADINLAR 2. LİG BÜLTENİ
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#94a3b8",
            }}
          >
            altyapivoleybol.com.tr
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            Altyapı Voleybol
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 500,
              lineHeight: 1.35,
              color: "#cbd5e1",
              maxWidth: "960px",
            }}
          >
            Genç, Yıldız, Küçük ve Midi Kızlar Süper Lig ile 1. Lig haftalık maç programı, canlı sonuçlar ve anlık puan durumu.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            borderTop: "1px solid rgba(148, 163, 184, 0.2)",
            paddingTop: "28px",
            fontSize: "22px",
            fontWeight: 700,
            color: "#38bdf8",
          }}
        >
          <span>81 İl Temsilciliği</span>
          <span style={{ color: "#475569" }}>•</span>
          <span>Canlı Puan Durumu</span>
          <span style={{ color: "#475569" }}>•</span>
          <span>Volleybox Kadro &amp; Kulüp Rehberi</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
