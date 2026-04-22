"use client";

import { useEffect, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";

import { LapTimeChart } from "./LapTimeChart";
import { StintInspector } from "./StintInspector";
import { ResultsPanel } from "./ResultsPanel";
import { ResponsiveBanner } from "./ResponsiveBanner";
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
    // We intentionally only re-fire when the debounced strategy changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedStints, strategy.isValid]);

  const totalTimeS = simulate.data?.total_time_s ?? null;
  const deltaS = simulate.data?.total_time_vs_actual_s ?? null;
  const warnings = simulate.data?.warnings ?? [];

  const selectedIdx = selectedStintIdx;
  const selectedStint = selectedIdx !== null ? strategy.stints[selectedIdx] : undefined;
  const selectedEndLap =
    selectedIdx !== null && selectedIdx < strategy.stints.length
      ? selectedIdx + 1 < strategy.stints.length
        ? strategy.stints[selectedIdx + 1]!.start_lap - 1
        : race.total_laps
      : null;

  return (
    <>
      <ResponsiveBanner />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
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
          <LapTimeChart
            lapTimes={simulate.data?.lap_times ?? []}
            pitLaps={strategy.stints.slice(1).map((s) => s.start_lap)}
          />
          {selectedStint && selectedIdx !== null && selectedEndLap !== null ? (
            <StintInspector
              stintIdx={selectedIdx}
              stint={selectedStint}
              endLap={selectedEndLap}
              laps={selectedEndLap - selectedStint.start_lap + 1}
              compoundsAvailable={compoundsAvailable}
              canRemove={selectedIdx > 0}
              onSelectCompound={(compound) => strategy.setCompound(selectedIdx, compound)}
              onRemove={() => {
                strategy.removePit(selectedIdx);
                setSelectedStintIdx(null);
              }}
            />
          ) : null}
          <div className="flex gap-2">
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
          </div>
          {!strategy.isValid ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-warn">
              Strategy must use at least 2 distinct compounds and have a valid pit order.
            </p>
          ) : null}
        </div>
        <ResultsPanel
          totalTimeS={totalTimeS}
          deltaS={deltaS}
          warnings={warnings}
          loading={simulate.isPending}
        />
      </div>
    </>
  );
}
