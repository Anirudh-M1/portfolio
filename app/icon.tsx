import { ImageResponse } from "next/og";

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
          background: "#071512",
          border: "1px solid #16382f",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            border: "2px solid #c9962c",
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
