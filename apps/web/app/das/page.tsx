import { ArticleHubBody, generateArticleHubMetadata } from "@/lib/seo/article-hub";

export const revalidate = 3600; // ISR: word data changes rarely

export const metadata = generateArticleHubMetadata("das");

export default function DasHubPage() {
  return <ArticleHubBody article="das" />;
}
