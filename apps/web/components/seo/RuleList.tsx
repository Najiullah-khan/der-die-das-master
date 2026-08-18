import type { SemanticCategory, SuffixRule } from "@/lib/seo/gender-rules";
import { ReliabilityBadge } from "./ReliabilityBadge";

export function SuffixRuleList({ rules }: { rules: SuffixRule[] }) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {rules.map((rule) => (
        <li key={rule.suffix} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold">{rule.suffix}</span>
            <ReliabilityBadge reliability={rule.reliability} />
          </div>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{rule.examples.join(", ")}</p>
          {rule.note && <p className="mt-2 text-xs text-neutral-500">{rule.note}</p>}
        </li>
      ))}
    </ul>
  );
}

export function SemanticCategoryList({ categories }: { categories: SemanticCategory[] }) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {categories.map((category) => (
        <li key={category.label} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{category.label}</span>
            <ReliabilityBadge reliability={category.reliability} />
          </div>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{category.examples.join(", ")}</p>
          {category.note && <p className="mt-2 text-xs text-neutral-500">{category.note}</p>}
        </li>
      ))}
    </ul>
  );
}
