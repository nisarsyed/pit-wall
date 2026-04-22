"use client";

import { Trash2 } from "lucide-react";

import { CompoundPicker } from "./CompoundPicker";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import type { StrategyStintOut } from "../lib/types";

interface Stint extends StrategyStintOut {
  start: number;
  end: number;
  laps: number;
}

interface Props {
  stints: StrategyStintOut[];
  totalLaps: number;
  compoundsAvailable: string[];
  onSelectCompound: (stintIdx: number, compound: string) => void;
  onRemove: (stintIdx: number) => void;
}

function expand(stints: StrategyStintOut[], totalLaps: number): Stint[] {
  return stints.map((stint, idx) => {
    const start = stint.start_lap;
    const end = idx + 1 < stints.length ? stints[idx + 1]!.start_lap - 1 : totalLaps;
    return { ...stint, start, end, laps: end - start + 1 };
  });
}

export function StintBreakdown({
  stints,
  totalLaps,
  compoundsAvailable,
  onSelectCompound,
  onRemove,
}: Props): React.ReactNode {
  const expanded = expand(stints, totalLaps);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Stint breakdown · {expanded.length}
          </span>
          <span
            aria-hidden
            className="h-px w-8 bg-gradient-to-r from-primary/0 via-primary to-primary/0"
          />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
          {expanded.reduce((a, s) => a + s.laps, 0)} laps total
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {expanded.map((stint, idx) => (
          <StintCard
            key={`stint-${idx}-${stint.start}`}
            idx={idx}
            stint={stint}
            compoundsAvailable={compoundsAvailable}
            onSelectCompound={(c) => onSelectCompound(idx, c)}
            onRemove={() => onRemove(idx)}
          />
        ))}
      </div>
    </section>
  );
}

function StintCard({
  idx,
  stint,
  compoundsAvailable,
  onSelectCompound,
  onRemove,
}: {
  idx: number;
  stint: Stint;
  compoundsAvailable: string[];
  onSelectCompound: (c: string) => void;
  onRemove: () => void;
}): React.ReactNode {
  return (
    <Card className="border-border bg-card/80 transition-colors hover:border-border/80">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Stint
            </span>
            <span className="font-display text-2xl font-bold uppercase leading-none tabular-nums">
              {String(idx + 1).padStart(2, "0")}
            </span>
          </div>
          <span
            aria-hidden
            className={`inline-flex size-6 items-center justify-center rounded font-display text-[11px] font-bold uppercase ${compoundChip(stint.compound)}`}
          >
            {compoundLetter(stint.compound)}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/70">
              Laps
            </span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {stint.start} <span className="text-foreground/30">→</span> {stint.end}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/70">
              Length
            </span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {stint.laps} laps
            </span>
          </div>
        </div>

        <div className="border-t border-border/60 pt-3">
          <CompoundPicker
            current={stint.compound}
            available={compoundsAvailable}
            onSelect={onSelectCompound}
          />
        </div>

        {idx > 0 ? (
          <div className="mt-auto flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label={`Remove pit stop before stint ${idx + 1}`}
              className="h-7 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 hover:text-destructive"
            >
              <Trash2 className="mr-1 size-3" strokeWidth={1.5} aria-hidden />
              Remove pit
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function compoundChip(compound: string): string {
  switch (compound) {
    case "SOFT":
      return "bg-soft text-neutral-950";
    case "MEDIUM":
      return "bg-medium text-neutral-950";
    case "HARD":
      return "bg-hard text-neutral-950";
    case "INTERMEDIATE":
      return "bg-intermediate text-neutral-950";
    case "WET":
      return "bg-wet text-neutral-50";
    default:
      return "bg-muted text-foreground";
  }
}

function compoundLetter(compound: string): string {
  switch (compound) {
    case "SOFT":
      return "S";
    case "MEDIUM":
      return "M";
    case "HARD":
      return "H";
    case "INTERMEDIATE":
      return "I";
    case "WET":
      return "W";
    default:
      return compound.slice(0, 1);
  }
}
