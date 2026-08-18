/** Embedded CTA rendered at the bottom of every blog post (blueprint blog spec §4). */
export function GameCta() {
  return (
    <div className="relative mt-12 overflow-hidden rounded-3xl border border-neutral-200 bg-linear-to-br from-der/10 via-die/5 to-das/10 p-8 text-center shadow-sm dark:border-neutral-800">
      <p className="text-lg font-semibold">
        Ready to test your German gender skills? Play our free A1&ndash;C2 Game Deck!
      </p>
      <a
        href="/play/A1"
        className="mt-4 inline-block rounded-full bg-der px-6 py-3 font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-der-strong"
      >
        Play now
      </a>
    </div>
  );
}
