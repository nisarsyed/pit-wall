import { notFound } from "next/navigation";

import { StrategyEditor } from "../../../components/StrategyEditor";
import { api, ApiRequestError } from "../../../lib/api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RacePage({ params }: PageProps): Promise<React.ReactNode> {
  const { id } = await params;
  let race;
  try {
    race = await api.getRace(id);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) {
      notFound();
    }
    throw err;
  }
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{race.name}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {race.year} · {race.country} · {race.total_laps} laps
          {race.actual_winner
            ? ` · Winner: ${race.actual_winner.name} (${Math.round(
                race.actual_winner.total_time_s,
              )}s)`
            : ""}
        </p>
      </header>
      <StrategyEditor race={race} />
    </main>
  );
}
