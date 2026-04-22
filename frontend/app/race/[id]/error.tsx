"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactNode {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-gray-400">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
      >
        Try again
      </button>
    </main>
  );
}
