export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <h1 className="text-5xl font-bold">
        Der<span className="text-blue-600">·</span>Die<span className="text-red-600">·</span>Das{" "}
        <span className="text-green-600">Master</span>
      </h1>
      <p className="max-w-md text-lg text-neutral-600 dark:text-neutral-300">
        Learn German noun genders the fast way. Guess der, die, or das — no account required.
      </p>
      <a
        href="/play/A1"
        className="rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700"
      >
        Start playing
      </a>
      <a href="/codex" className="text-sm text-neutral-500 underline hover:text-neutral-700">
        Browse the word codex
      </a>
    </main>
  );
}
