import { LevelHubBody, generateLevelHubMetadata } from "@/lib/seo/level-hub";

export const revalidate = 3600; // ISR: word data changes rarely

export const metadata = generateLevelHubMetadata("B2");

export default function B2HubPage() {
  return <LevelHubBody level="B2" />;
}
