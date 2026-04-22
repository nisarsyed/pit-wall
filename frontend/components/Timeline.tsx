"use client";

import type { StrategyStintOut } from "../lib/types";

// Pirelli palette. These are standard Tailwind 4 utility classes; theme tokens land
// in Task 5.1 which will refactor this map to use semantic names.
const COMPOUND_COLOUR: Record<string, string> = {
  SOFT: "bg-red-500/80 text-white",
  MEDIUM: "bg-yellow-400/80 text-black",
  HARD: "bg-gray-200/80 text-black",
  INTERMEDIATE: "bg-green-500/80 text-white",
  WET: "bg-blue-500/80 text-white",
};

const COMPOUND_LETTER: Record<string, string> = {
  SOFT: "S",
  MEDIUM: "M",
  HARD: "H",
  INTERMEDIATE: "I",
  WET: "W",
};

interface Props {
  totalLaps: number;
  strategy: StrategyStintOut[];
}

export function Timeline({ totalLaps, strategy }: Props): React.ReactNode {
  // Compute per-stint length in laps.
  const stints = strategy.map((stint, idx) => {
    const start = stint.start_lap;
    const end = idx + 1 < strategy.length ? strategy[idx + 1]!.start_lap - 1 : totalLaps;
    const laps = end - start + 1;
    return { ...stint, start, end, laps };
  });

  return (
    <div className="space-y-2">
      <div className="flex h-14 w-full overflow-hidden rounded-md border border-white/10">
        {stints.map((stint, idx) => (
          <div
            key={idx}
            data-testid="stint-block"
            style={{ flex: stint.laps }}
            className={`flex items-center justify-center font-bold ${
              COMPOUND_COLOUR[stint.compound] ?? "bg-gray-500/80"
            }`}
            title={`${stint.compound}: laps ${stint.start}-${stint.end} (${stint.laps})`}
          >
            {COMPOUND_LETTER[stint.compound] ?? stint.compound.slice(0, 1)}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>1</span>
        <span>{totalLaps}</span>
      </div>
    </div>
  );
}
