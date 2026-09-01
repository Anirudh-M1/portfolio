import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "#04110F",
          color: "#E8EEEC",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#F0503A" }} />
          <div style={{ fontSize: 22, letterSpacing: 6, color: "#84A099", textTransform: "uppercase" }}>
            Computer Engineering · UIUC · 2027
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
          Anirudh Moholkar
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 500,
            color: "#84A099",
            marginTop: 6,
          }}
        >
          Distributed Systems &amp; Backend Infrastructure
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 44,
            width: 120,
            height: 4,
            background: "#D9AC55",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
