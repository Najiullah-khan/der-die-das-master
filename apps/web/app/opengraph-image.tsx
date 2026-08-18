import { ImageResponse } from "next/og";

// Site-wide fallback OG image — used by every route that doesn't define its own more specific
// opengraph-image (only /word/[slug] does). File-convention precedence: a segment's own
// opengraph-image.tsx wins over this root one, so this never overrides that per-word image.
export const alt = "Der-Die-Das Master — learn German noun genders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DER = "#155dfc";
const DIE = "#ec003f";
const DAS = "#009966";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, gap: 20 }}>
          <span style={{ color: DER }}>Der</span>
          <span>·</span>
          <span style={{ color: DIE }}>Die</span>
          <span>·</span>
          <span style={{ color: DAS }}>Das</span>
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, marginTop: 8 }}>Master</div>
        <div style={{ display: "flex", fontSize: 36, color: "#a3a3a3", marginTop: 24 }}>
          Learn German noun genders the fast way
        </div>
      </div>
    ),
    size,
  );
}
