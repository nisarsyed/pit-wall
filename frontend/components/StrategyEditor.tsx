"use client";

import type { RaceDetail } from "../lib/types";

export function StrategyEditor({ race }: { race: RaceDetail }): React.ReactNode {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-8">
      <p className="text-gray-400">
        Strategy editor — {Object.keys(race.compounds).length} compounds, {race.total_laps}{" "}
        laps. Interactive timeline coming next.
      </p>
    </div>
  );
}
