import type { Metadata } from "next";
import { generateWordMetadata, generateWordStaticParams, WordPageBody } from "@/lib/seo/word-page";

export const revalidate = 3600; // ISR: word data changes rarely

export async function generateStaticParams() {
  return generateWordStaticParams("das");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ noun: string }>;
}): Promise<Metadata> {
  const { noun } = await params;
  return generateWordMetadata("das", noun);
}

export default async function DasWordPage({ params }: { params: Promise<{ noun: string }> }) {
  const { noun } = await params;
  return <WordPageBody article="das" noun={noun} />;
}
