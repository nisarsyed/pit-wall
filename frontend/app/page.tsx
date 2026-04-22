import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RaceCard } from "../components/RaceCard";
import { api } from "../lib/api";

// Force runtime rendering — the landing fetches from the backend, which is not
// available at build time.
export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function Home(): Promise<React.ReactNode> {
  const races = await api.listRaces();

  return (
    <main className="relative z-10 min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          Pit Wall · Race Strategy Lab
        </div>
        <h1 className="mt-6 font-display text-[clamp(3.25rem,10vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.02em]">
          Out-strategise
          <br />
          the <span className="text-primary">pit wall.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          An F1 race strategy simulator grounded in real stint data. Pick a historical race,
          drag the pit stops, and see how your call stacks up against what actually happened.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Real FastF1 data</span>
          <span className="size-1 rounded-full bg-muted-foreground/40" aria-hidden />
          <span>Linear tyre degradation fits</span>
          <span className="size-1 rounded-full bg-muted-foreground/40" aria-hidden />
          <span>Deterministic simulator</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Races · {races.length}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight">
              Choose a grand prix
            </h2>
          </div>
          <Link
            href="/about"
            className="group hidden items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground md:flex"
          >
            How this works
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={1.5}
              aria-hidden
            />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
        <div className="mt-10 flex md:hidden">
          <Link
            href="/about"
            className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            How this works
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={1.5}
              aria-hidden
            />
          </Link>
        </div>
      </section>
    </main>
  );
}
