import { ImageResponse } from "next/og";
import type { Article } from "@ddd/shared";
import { getWordBySlug } from "@/lib/db/queries/words";
import { resolveEmoji } from "@/lib/emoji/resolve";

export const alt = "Der-Die-Das Master word card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ARTICLE_COLOR: Record<Article, string> = { der: "#3b82f6", die: "#ef4444", das: "#22c55e" };

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const word = await getWordBySlug(slug);

  if (!word) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            color: "white",
            fontSize: 64,
          }}
        >
          Der-Die-Das Master
        </div>
      ),
      size,
    );
  }

  const resolved = resolveEmoji(word.noun, word.article, word.emoji);

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
        <div style={{ display: "flex", fontSize: 200 }}>
          {resolved.kind === "emoji" ? resolved.glyph : word.noun.charAt(0)}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 24 }}>
          <span style={{ fontSize: 84, fontWeight: 700, color: ARTICLE_COLOR[word.article] }}>{word.article}</span>
          <span style={{ fontSize: 84, fontWeight: 700 }}>{word.noun}</span>
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#a3a3a3", marginTop: 16 }}>{word.translation}</div>
      </div>
    ),
    size,
  );
}
