import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "./ui/card";
import type { RaceListItem } from "../lib/types";

function formatRaceTime(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function RaceCard({ race }: { race: RaceListItem }): React.ReactNode {
  return (
    <Link
      href={`/race/${encodeURIComponent(race.id)}`}
      className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Card className="relative h-full overflow-hidden border-border bg-card/60 backdrop-blur-sm transition-colors duration-200 hover:border-primary/60 hover:bg-card">
        <CardContent className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {race.year} · Round
            </span>
            <ArrowUpRight
              className="size-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-foreground">
              {race.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {race.country} · {race.total_laps} laps
            </p>
          </div>
          <div className="mt-auto space-y-3 border-t border-border/80 pt-4">
            {race.actual_winner_name ? (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Winner
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {race.actual_winner_name}
                  </span>
                </div>
                {race.actual_winning_time_s !== null ? (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Race time
                    </span>
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {formatRaceTime(race.actual_winning_time_s)}
                    </span>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
