import { LevelHubBody, generateLevelHubMetadata } from "@/lib/seo/level-hub";

export const revalidate = 3600; // ISR: word data changes rarely

export const metadata = generateLevelHubMetadata("B1");

export default function B1HubPage() {
  return <LevelHubBody level="B1" />;
}
