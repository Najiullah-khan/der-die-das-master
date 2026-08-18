import { LevelHubBody, generateLevelHubMetadata } from "@/lib/seo/level-hub";

export const revalidate = 3600; // ISR: word data changes rarely

export const metadata = generateLevelHubMetadata("A1");

export default function A1HubPage() {
  return <LevelHubBody level="A1" />;
}
