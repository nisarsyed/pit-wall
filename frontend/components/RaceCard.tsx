import Link from "next/link";

import type { RaceListItem } from "../lib/types";

export function RaceCard({ race }: { race: RaceListItem }): React.ReactNode {
  return (
    <Link
      href={`/race/${encodeURIComponent(race.id)}`}
      className="block rounded-lg border border-white/10 bg-white/5 p-6 transition hover:border-white/30 hover:bg-white/10"
    >
      <h2 className="text-2xl font-semibold">{race.name}</h2>
      <p className="mt-1 text-sm text-gray-400">
        {race.year} · {race.country} · {race.total_laps} laps
      </p>
      {race.actual_winner_name ? (
        <p className="mt-4 text-sm text-gray-300">Winner: {race.actual_winner_name}</p>
      ) : null}
    </Link>
  );
}
