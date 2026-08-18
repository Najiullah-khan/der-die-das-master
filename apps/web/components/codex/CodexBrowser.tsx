"use client";

import { useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Article, CefrLevel, CodexEntry, CodexMasteryFilter, CodexSearchResponse } from "@ddd/shared";
import { PLAYABLE_LEVELS } from "@/lib/game-engine/levels";
import { useSession } from "@/lib/auth/client";
import { WordEmoji } from "@/components/word/WordEmoji";
import { wordPath } from "@/lib/seo/word-url";
import { pronounceWord } from "@/lib/speech/pronounce";
const MASTERY_FILTERS: { value: CodexMasteryFilter; label: string }[] = [
  { value: "never_seen", label: "Never Seen" },
  { value: "discovered", label: "Discovered" },
  { value: "struggled", label: "Struggled" },
  { value: "any", label: "Any mastery" },
];
// Lands the user directly on words they haven't played yet (Codex mastery filter upgrade),
// rather than the unfiltered "any mastery" view.
const DEFAULT_MASTERY_FILTER: CodexMasteryFilter = "never_seen";
const SEARCH_DEBOUNCE_MS = 300;

const GENDER_BADGE: Record<Article, string> = {
  der: "bg-der/15 text-der-strong dark:text-der",
  die: "bg-die/15 text-die-strong dark:text-die",
  das: "bg-das/15 text-das-strong dark:text-das",
};

/** Builds a crawlable `/dictionary` URL for a given search + offset — used for the pagination
 * links' real `href`s, not just their client-side onClick handlers. */
function buildPageHref(search: string, targetOffset: number, limit: number): string {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  const page = Math.floor(targetOffset / limit) + 1;
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/dictionary?${qs}` : "/dictionary";
}

interface CodexBrowserProps {
  initialEntries: CodexEntry[];
  initialTotal: number;
  limit: number;
  /** Seeds search from the page's `?q=` (the WebSite SearchAction's target) so a search-engine
   *  deep link lands already filtered instead of resetting to the unfiltered default view. */
  initialSearch?: string;
  /** Seeds pagination from the page's `?page=`/`?offset=` — same reasoning as `initialSearch`,
   *  so a crawler (or a shared link) landing on page N gets that page's real SSR content. */
  initialOffset?: number;
}

export function CodexBrowser({ initialEntries, initialTotal, limit, initialSearch = "", initialOffset = 0 }: CodexBrowserProps) {
  const { data: session, isPending } = useSession();
  const isAuthed = Boolean(session?.user);

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [level, setLevel] = useState<CefrLevel | "">("");
  const [mastery, setMastery] = useState<CodexMasteryFilter>(DEFAULT_MASTERY_FILTER);
  const [offset, setOffset] = useState(initialOffset);

  const [fetched, setFetched] = useState<CodexSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounce free-text search so we're not firing a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  // Any filter change restarts pagination at the top — adjusted during render (React's
  // documented pattern for "reset state when an input changes") rather than via a second
  // effect, so it doesn't fire an extra render pass just to zero `offset`.
  const [prevFilters, setPrevFilters] = useState({ search: debouncedSearch, level, mastery });
  if (prevFilters.search !== debouncedSearch || prevFilters.level !== level || prevFilters.mastery !== mastery) {
    setPrevFilters({ search: debouncedSearch, level, mastery });
    if (offset !== 0) setOffset(0);
  }

  // "Default view" means "exactly what the server already rendered" — initialSearch/initialOffset,
  // not hardcoded ""/0, since the SSR shell now reflects the page's own ?q=/?page= (blueprint §1
  // session-agnostic rendering still applies; this just generalizes it beyond the very first page).
  const isDefaultView =
    debouncedSearch === initialSearch && level === "" && mastery === DEFAULT_MASTERY_FILTER && offset === initialOffset;
  // Skip the redundant refetch and just render what SSR gave us (mastery badges only exist for
  // authed users, whose SSR shell is intentionally session-agnostic so /dictionary itself stays
  // static/cacheable). No state to reset here since we simply don't fetch in this case.
  const skipFetch = isDefaultView && !isAuthed;

  useEffect(() => {
    // Session state not resolved yet, or nothing to fetch — wait / skip.
    if (isPending || skipFetch) return;

    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (level) params.set("level", level);
    if (mastery !== "any" && isAuthed) params.set("mastery", mastery);

    let cancelled = false;
    // Deferred off the synchronous effect body (react-hooks/set-state-in-effect) — a microtask
    // still fires well before the fetch resolves, so the loading indicator's timing is
    // unaffected; it just avoids the extra synchronous render pass the lint rule flags.
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetch(`/api/codex?${params.toString()}`)
      .then((res) => (res.ok ? (res.json() as Promise<CodexSearchResponse>) : Promise.reject(res)))
      .then((data) => {
        if (!cancelled) setFetched(data);
      })
      .catch(() => {
        if (!cancelled) setFetched({ entries: [], total: 0, limit, offset });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, level, mastery, offset, isAuthed, isPending, skipFetch, limit]);

  const entries = skipFetch ? initialEntries : (fetched?.entries ?? initialEntries);
  const total = skipFetch ? initialTotal : (fetched?.total ?? initialTotal);

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const masteryOptions = useMemo(() => (isAuthed ? MASTERY_FILTERS : []), [isAuthed]);

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a noun or translation…"
            aria-label="Search words"
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm focus:border-der focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
          {masteryOptions.length > 0 && (
            <select
              value={mastery}
              onChange={(e) => setMastery(e.target.value as CodexMasteryFilter)}
              aria-label="Filter by mastery"
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              {masteryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Chips, not a <select>, for the level filter (blueprint UI spec) — only levels the
            dataset actually has words for (level-availability upgrade: PLAYABLE_LEVELS). Coming
            Soon levels (C1–C2) aren't seeded yet, so chips for them would just be dead ends that
            always show "0 words". */}
        <div role="group" aria-label="Filter by CEFR level" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLevel("")}
            aria-pressed={level === ""}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              level === ""
                ? "bg-der text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }`}
          >
            All levels
          </button>
          {PLAYABLE_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                level === l
                  ? "bg-der text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-neutral-500" role="status">
        {loading ? "Searching…" : `${total} word${total === 1 ? "" : "s"}`}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {entries.map((word) => {
          return (
            <div
              key={word.slug}
              className="relative flex items-center gap-3 rounded-2xl border border-neutral-200 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800"
            >
              <WordEmoji word={word} size={36} />
              <a href={wordPath(word)} className="min-w-0 flex-1">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${GENDER_BADGE[word.article]}`}>
                  {word.article}
                </span>
                <p className="truncate font-medium">{word.noun}</p>
                <p className="truncate text-sm text-neutral-500">{word.translation}</p>
              </a>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => pronounceWord(word.article, word.noun)}
                  aria-label={`Pronounce ${word.article} ${word.noun}`}
                  className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                  <Volume2 className="h-4 w-4" aria-hidden />
                </button>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{word.cefrLevel}</span>
                {word.stats && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {word.stats.mastery}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {entries.length === 0 && !loading && (
          <p className="col-span-full py-8 text-center text-sm text-neutral-500">No words match your filters.</p>
        )}
      </div>

      {totalPages > 1 && (
        // Real `<a href>`s, not just onClick buttons — so a crawler without JS can walk the
        // Previous/Next chain page by page and reach all 5,600+ words through on-page links,
        // not just the XML sitemap. The onClick still intercepts for JS-enabled visitors so
        // pagination stays instant/client-side instead of a full page reload.
        <nav aria-label="Dictionary pagination" className="mt-6 flex items-center justify-center gap-4 text-sm">
          {offset > 0 ? (
            <a
              href={buildPageHref(debouncedSearch, offset - limit, limit)}
              onClick={(e) => {
                e.preventDefault();
                setOffset((o) => Math.max(0, o - limit));
              }}
              className="rounded-full border border-neutral-300 px-4 py-2 dark:border-neutral-700"
            >
              Previous
            </a>
          ) : (
            <span aria-disabled="true" className="rounded-full border border-neutral-300 px-4 py-2 opacity-40 dark:border-neutral-700">
              Previous
            </span>
          )}
          <span className="text-neutral-500">
            Page {page} of {totalPages}
          </span>
          {offset + limit < total ? (
            <a
              href={buildPageHref(debouncedSearch, offset + limit, limit)}
              onClick={(e) => {
                e.preventDefault();
                setOffset((o) => o + limit);
              }}
              className="rounded-full border border-neutral-300 px-4 py-2 dark:border-neutral-700"
            >
              Next
            </a>
          ) : (
            <span aria-disabled="true" className="rounded-full border border-neutral-300 px-4 py-2 opacity-40 dark:border-neutral-700">
              Next
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
