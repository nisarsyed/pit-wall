import Link from "next/link";

import { RaceCard } from "../components/RaceCard";
import { api } from "../lib/api";

// Force runtime rendering — the landing fetches from the backend, which is not
// available at build time.
export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function Home(): Promise<React.ReactNode> {
  const races = await api.listRaces();
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12">
        <h1 className="text-5xl font-bold">Pit Wall</h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-400">
          An F1 race strategy simulator grounded in real stint data. Pick a race, drag the
          pit stops, see how your call compares to the real winner.
        </p>
      </section>

      <h2 className="mb-4 text-xl font-semibold text-gray-300">Races</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {races.map((race) => (
          <RaceCard key={race.id} race={race} />
        ))}
      </div>

      <p className="mt-12 text-sm text-gray-500">
        <Link href="/about" className="underline underline-offset-4 hover:text-gray-300">
          How this works
        </Link>
      </p>
    </main>
  );
}
