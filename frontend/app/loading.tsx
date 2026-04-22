import { Skeleton } from "../components/ui/skeleton";

export default function Loading(): React.ReactNode {
  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-20">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden />
        Pit Wall · Race Strategy Lab
      </div>
      <Skeleton className="mt-6 h-24 w-3/4 md:h-40 md:w-2/3" />
      <Skeleton className="mt-3 h-24 w-2/3 md:h-40 md:w-1/2" />
      <Skeleton className="mt-8 h-6 w-[28rem] max-w-full" />
      <Skeleton className="mt-2 h-6 w-96 max-w-full" />
      <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
      </div>
    </main>
  );
}
