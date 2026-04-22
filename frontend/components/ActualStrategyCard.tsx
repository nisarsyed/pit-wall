"use client";

import { Flag } from "lucide-react";

import type { ActualWinnerOut } from "../lib/types";

const COMPOUND_FILL: Record<string, string> = {
  SOFT: "bg-soft",
  MEDIUM: "bg-medium",
  HARD: "bg-hard",
  INTERMEDIATE: "bg-intermediate",
  WET: "bg-wet",
};

const COMPOUND_LETTER: Record<string, string> = {
  SOFT: "S",
  MEDIUM: "M",
  HARD: "H",
  INTERMEDIATE: "I",
  WET: "W",
};

function formatRaceTime(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface Props {
  winner: ActualWinnerOut;
  totalLaps: number;
}

export function ActualStrategyCard({ winner, totalLaps }: Props): React.ReactNode {
  const segments = winner.strategy.map((stint, idx) => {
    const start = stint.start_lap;
    const end =
      idx + 1 < winner.strategy.length
        ? winner.strategy[idx + 1]!.start_lap - 1
        : totalLaps;
    return { compound: stint.compound, start, laps: end - start + 1 };
  });

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Flag className="size-3 text-primary" strokeWidth={1.5} aria-hidden />
            Actual winner
          </p>
          <p className="mt-2 font-display text-lg font-bold uppercase leading-tight">
            {winner.name}
          </p>
        </div>
        <p className="font-mono text-xs tabular-nums text-foreground/80">
          {formatRaceTime(winner.total_time_s)}
        </p>
      </div>

      <div className="flex h-5 w-full overflow-hidden rounded-sm border border-border/60">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            style={{ flex: seg.laps }}
            className={`flex items-center justify-center font-display text-[10px] font-bold uppercase leading-none ${COMPOUND_FILL[seg.compound] ?? "bg-muted"} text-neutral-950`}
            title={`${seg.compound}: ${seg.laps} laps`}
          >
            {COMPOUND_LETTER[seg.compound] ?? seg.compound.slice(0, 1)}
          </div>
        ))}
      </div>

      <div className="space-y-1 font-mono text-[10px] uppercase tracking-[0.15em]">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-baseline justify-between gap-2">
            <span className="flex items-baseline gap-2">
              <span
                aria-hidden
                className={`inline-block size-1.5 rounded-full ${COMPOUND_FILL[seg.compound] ?? "bg-muted"}`}
              />
              <span className="text-muted-foreground">
                {seg.compound} · from lap {seg.start}
              </span>
            </span>
            <span className="tabular-nums text-foreground/70">{seg.laps}L</span>
          </div>
        ))}
      </div>
    </section>
  );
}
