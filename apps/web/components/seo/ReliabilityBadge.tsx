import type { Reliability } from "@/lib/seo/gender-rules";

const STYLE: Record<Reliability, string> = {
  reliable: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  tendency: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const LABEL: Record<Reliability, string> = {
  reliable: "Reliable pattern",
  tendency: "Tendency, not a rule",
};

/** Flags a suffix/category as an exceptionless pattern vs. a statistical lean — the linguistic
 * precision the flagship guide and article hubs are required not to blur together. */
export function ReliabilityBadge({ reliability }: { reliability: Reliability }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLE[reliability]}`}>
      {LABEL[reliability]}
    </span>
  );
}
