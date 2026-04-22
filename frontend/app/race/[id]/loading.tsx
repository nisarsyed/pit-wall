export default function Loading(): React.ReactNode {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 h-10 w-64 animate-pulse rounded bg-white/10" />
      <div className="h-64 animate-pulse rounded-lg bg-white/5" />
    </main>
  );
}
