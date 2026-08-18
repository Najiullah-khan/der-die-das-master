import type { Metadata } from "next";
import { generateWordMetadata, generateWordStaticParams, WordPageBody } from "@/lib/seo/word-page";

export const revalidate = 3600; // ISR: word data changes rarely
// Words outside generateStaticParams's A1/A2 build-time scope (lib/seo/word-page.tsx) still
// resolve — this makes the default explicit rather than relying on it silently staying true.
export const dynamicParams = true;

export async function generateStaticParams() {
  return generateWordStaticParams("der");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ noun: string }>;
}): Promise<Metadata> {
  const { noun } = await params;
  return generateWordMetadata("der", noun);
}

export default async function DerWordPage({ params }: { params: Promise<{ noun: string }> }) {
  const { noun } = await params;
  return <WordPageBody article="der" noun={noun} />;
}
