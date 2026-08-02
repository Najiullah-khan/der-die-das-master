import { notFound } from "next/navigation";
import type { CefrLevel } from "@ddd/shared";
import { PlayClient } from "./PlayClient";

const VALID_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function PlayPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  const upper = level.toUpperCase();
  if (!VALID_LEVELS.includes(upper as CefrLevel)) notFound();

  return <PlayClient level={upper as CefrLevel} />;
}
