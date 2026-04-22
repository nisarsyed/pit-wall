import { Skeleton } from "../../../components/ui/skeleton";

export default function Loading(): React.ReactNode {
  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 space-y-2">
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-48 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </main>
  );
}
