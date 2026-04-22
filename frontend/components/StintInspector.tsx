"use client";

import { Trash2 } from "lucide-react";

import { CompoundPicker } from "./CompoundPicker";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import type { StrategyStintOut } from "../lib/types";

interface Props {
  stintIdx: number;
  stint: StrategyStintOut;
  endLap: number;
  laps: number;
  compoundsAvailable: string[];
  canRemove: boolean;
  onSelectCompound: (compound: string) => void;
  onRemove: () => void;
}

export function StintInspector({
  stintIdx,
  stint,
  endLap,
  laps,
  compoundsAvailable,
  canRemove,
  onSelectCompound,
  onRemove,
}: Props): React.ReactNode {
  return (
    <Card className="border-border bg-card/80">
      <CardContent className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Stint
            </span>
            <span className="font-display text-2xl font-bold uppercase leading-none">
              {String(stintIdx + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Lap {stint.start_lap} <span className="mx-1 text-foreground/30">→</span> Lap {endLap}
            <span className="mx-2 text-foreground/30">·</span>
            <span className="text-foreground">{laps}</span> laps
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Compound
          </p>
          <CompoundPicker
            current={stint.compound}
            available={compoundsAvailable}
            onSelect={onSelectCompound}
          />
        </div>

        {canRemove ? (
          <div className="flex justify-end border-t border-border/80 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1.5 size-3.5" strokeWidth={1.5} aria-hidden />
              Remove pit stop
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
