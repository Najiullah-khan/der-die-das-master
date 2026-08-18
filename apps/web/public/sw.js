// Service worker for offline play (blueprint §9): precaches the app shell plus the full
// A1/A2/B1/B2 word lists so a session can start (and the deck stay usable) with no network. Bump
// CACHE_VERSION whenever the caching strategy itself changes — the old caches are purged on activate.
const CACHE_VERSION = "v3"; // bumped: Codex → Dictionary rename changed which URL the shell precaches
const SHELL_CACHE = `ddd-shell-${CACHE_VERSION}`;
const WORDS_CACHE = `ddd-words-${CACHE_VERSION}`;

const SHELL_URLS = ["/", "/dictionary"];
// Keep in sync with PLAYABLE_LEVELS in lib/game-engine/levels.ts (level-availability upgrade) —
// this file can't import it directly, it's an unbundled static script.
const OFFLINE_LEVELS = ["A1", "A2", "B1", "B2"];
const PRECACHE_COUNT = 3000; // above any real level's word count (B2 is the largest at ~2,500), so this fetches the full deck

function wordsCacheKey(level) {
  return `/api/words?level=${level}`;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(SHELL_CACHE);
      await shellCache.addAll(SHELL_URLS).catch(() => {
        // Best-effort — a flaky shell precache shouldn't block the SW from installing.
      });

      const wordsCache = await caches.open(WORDS_CACHE);
      await Promise.all(
        OFFLINE_LEVELS.map(async (level) => {
          try {
            const res = await fetch(`/api/words?level=${level}&count=${PRECACHE_COUNT}`);
            if (res.ok) await wordsCache.put(wordsCacheKey(level), res);
          } catch {
            // Offline at install time (or first visit) — nothing to precache yet, fine.
          }
        }),
      );

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== WORDS_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Word batches: network-first (data changes rarely but should still win when available),
  // falling back to the precached full-level list (re-sliced to the requested count) offline.
  if (url.pathname === "/api/words") {
    const level = url.searchParams.get("level");
    const count = Number(url.searchParams.get("count")) || 15;

    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(WORDS_CACHE);
        const cached = level ? await cache.match(wordsCacheKey(level)) : null;
        if (!cached) {
          return new Response(JSON.stringify({ words: [] }), { headers: { "Content-Type": "application/json" } });
        }
        const data = await cached.json();
        return new Response(JSON.stringify({ words: data.words.slice(0, count) }), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    return;
  }

  // Page navigations: network-first so signed-in/dynamic pages stay fresh online, falling back
  // to the cached shell offline rather than a browser error page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(request)) ?? (await caches.match("/")) ?? Response.error()),
    );
  }
});
