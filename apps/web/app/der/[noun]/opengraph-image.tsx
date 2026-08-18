import { renderWordOgImage, wordOgImageAlt, wordOgImageSize, wordOgImageContentType } from "@/lib/seo/word-og-image";

export const alt = wordOgImageAlt;
export const size = wordOgImageSize;
export const contentType = wordOgImageContentType;

export default async function Image({ params }: { params: Promise<{ noun: string }> }) {
  const { noun } = await params;
  return renderWordOgImage("der", noun);
}
