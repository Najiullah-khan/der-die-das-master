import { ImageResponse } from "next/og";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e"]; // der / die / das

/** Shared icon graphic for the PWA manifest (used by the icon-192 and icon-512 route files) — three article-colored dots, no text (must read at 48px). */
export function renderAppIcon(size: number): ImageResponse {
  const dot = Math.round(size * 0.22);
  const gap = Math.round(size * 0.12);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap,
          background: "#0a0a0a",
          borderRadius: size * 0.2,
        }}
      >
        {COLORS.map((color) => (
          <div key={color} style={{ display: "flex", width: dot, height: dot, borderRadius: "50%", background: color }} />
        ))}
      </div>
    ),
    { width: size, height: size },
  );
}
