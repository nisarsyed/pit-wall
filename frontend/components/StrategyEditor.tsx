"use client";

import { useEffect, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";

import { ActualStrategyCard } from "./ActualStrategyCard";
import { LapTimeChart } from "./LapTimeChart";
import { ResultsPanel } from "./ResultsPanel";
import { ResponsiveBanner } from "./ResponsiveBanner";
import { StintBreakdown } from "./StintBreakdown";
import { Timeline } from "./Timeline";
import { Button } from "./ui/button";
import { useSimulate } from "../lib/queries";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import { useStrategy } from "../lib/useStrategy";
import type { RaceDetail } from "../lib/types";

const DEBOUNCE_MS = 150;

function fallbackInitialStrategy(race: RaceDetail) {
  if (race.actual_winner && race.actual_winner.strategy.length > 0) {
    return race.actual_winner.strategy;
  }
  const compounds = Object.keys(race.compounds);
  const first = compounds[0] ?? "MEDIUM";
  const second = compounds[1] ?? "HARD";
  return [
    { compound: first, start_lap: 1 },
    { compound: second, start_lap: Math.floor(race.total_laps / 2) },
  ];
}

export function StrategyEditor({ race }: { race: RaceDetail }): React.ReactNode {
  const initial = fallbackInitialStrategy(race);
  const compoundsAvailable = Object.keys(race.compounds);
  const strategy = useStrategy({
    totalLaps: race.total_laps,
    compoundsAvailable,
    initial,
  });
  const debouncedStints = useDebouncedValue(strategy.stints, DEBOUNCE_MS);
  const simulate = useSimulate(race.id);
  const [selectedStintIdx, setSelectedStintIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!strategy.isValid) return;
    simulate.mutate({ stints: debouncedStints });
    // Only re-fire when the debounced strategy changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedStints, strategy.isValid]);

  const totalTimeS = simulate.data?.total_time_s ?? null;
  const deltaS = simulate.data?.total_time_vs_actual_s ?? null;
  const warnings = simulate.data?.warnings ?? [];

  return (
    <>
      <ResponsiveBanner />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-8">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Lap timeline
                </span>
                <span
                  aria-hidden
                  className="h-px w-8 bg-gradient-to-r from-primary/0 via-primary to-primary/0"
                />
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Drag markers · ←/→ nudge · Delete removes
              </span>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <Timeline
                totalLaps={race.total_laps}
                strategy={strategy.stints}
                selectedStintIdx={selectedStintIdx}
                onMovePit={(idx, lap) => strategy.movePit(idx, lap)}
                onSelectStint={setSelectedStintIdx}
                onRemovePit={(idx) => {
                  strategy.removePit(idx);
                  setSelectedStintIdx(null);
                }}
              />
            </div>
          </section>

          <StintBreakdown
            stints={strategy.stints}
            totalLaps={race.total_laps}
            compoundsAvailable={compoundsAvailable}
            onSelectCompound={(idx, compound) => strategy.setCompound(idx, compound)}
            onRemove={(idx) => {
              strategy.removePit(idx);
              setSelectedStintIdx(null);
            }}
          />

          <LapTimeChart
            lapTimes={simulate.data?.lap_times ?? []}
            pitLaps={strategy.stints.slice(1).map((s) => s.start_lap)}
            stints={strategy.stints}
            totalLaps={race.total_laps}
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={strategy.addPit}
              className="font-mono text-[11px] uppercase tracking-[0.2em]"
            >
              <Plus className="mr-1.5 size-3.5" strokeWidth={1.5} aria-hidden />
              Add pit stop
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={strategy.reset}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              <RotateCcw className="mr-1.5 size-3.5" strokeWidth={1.5} aria-hidden />
              Reset to actual
            </Button>
            {!strategy.isValid ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-warn">
                Needs ≥2 distinct compounds and a valid pit order
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <ResultsPanel
            totalTimeS={totalTimeS}
            deltaS={deltaS}
            warnings={warnings}
            loading={simulate.isPending}
          />
          {race.actual_winner ? (
            <ActualStrategyCard
              winner={race.actual_winner}
              totalLaps={race.total_laps}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
