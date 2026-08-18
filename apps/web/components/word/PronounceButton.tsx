"use client";

import { Volume2 } from "lucide-react";
import { pronounceWord } from "@/lib/speech/pronounce";

export function PronounceButton({ article, noun }: { article: string; noun: string }) {
  return (
    <button
      type="button"
      onClick={() => pronounceWord(article, noun)}
      aria-label={`Pronounce ${article} ${noun}`}
      className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
    >
      <Volume2 className="h-5 w-5" aria-hidden />
    </button>
  );
}
