import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#04110F",
          border: "1px solid #16382F",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            border: "2px solid #D9AC55",
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
