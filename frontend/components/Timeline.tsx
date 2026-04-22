"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { StrategyStintOut } from "../lib/types";

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
  onMovePit?: (stintIdx: number, lap: number) => void;
  onSelectStint?: (stintIdx: number) => void;
  onRemovePit?: (stintIdx: number) => void;
  selectedStintIdx?: number | null;
}

export function Timeline({
  totalLaps,
  strategy,
  onMovePit,
  onSelectStint,
  onRemovePit,
  selectedStintIdx,
}: Props): React.ReactNode {
  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const stints = strategy.map((stint, idx) => {
    const start = stint.start_lap;
    const end = idx + 1 < strategy.length ? strategy[idx + 1]!.start_lap - 1 : totalLaps;
    return { ...stint, start, end, laps: end - start + 1 };
  });

  const pixelToLap = useCallback(
    (pixelX: number): number => {
      const track = trackRef.current;
      if (!track) return 1;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (pixelX - rect.left) / rect.width));
      return Math.max(1, Math.min(totalLaps, Math.round(1 + ratio * (totalLaps - 1))));
    },
    [totalLaps],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent): void => {
      if (draggingIdx === null || !onMovePit) return;
      const lap = pixelToLap(event.clientX);
      onMovePit(draggingIdx, lap);
    },
    [draggingIdx, onMovePit, pixelToLap],
  );

  const handlePointerUp = useCallback((): void => {
    setDraggingIdx(null);
  }, []);

  useEffect(() => {
    if (draggingIdx === null) return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingIdx, handlePointerMove, handlePointerUp]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, stintIdx: number): void => {
      if (stintIdx === 0) return;
      if (event.key === "ArrowLeft" && onMovePit) {
        event.preventDefault();
        onMovePit(stintIdx, strategy[stintIdx]!.start_lap - 1);
      } else if (event.key === "ArrowRight" && onMovePit) {
        event.preventDefault();
        onMovePit(stintIdx, strategy[stintIdx]!.start_lap + 1);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onRemovePit?.(stintIdx);
      }
    },
    [onMovePit, onRemovePit, strategy],
  );

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className="relative flex h-14 w-full overflow-hidden rounded-md border border-white/10 select-none"
      >
        {stints.map((stint, idx) => (
          <button
            key={idx}
            type="button"
            data-testid="stint-block"
            aria-label={`${stint.compound} stint, laps ${stint.start}-${stint.end}`}
            style={{ flex: stint.laps }}
            onClick={() => onSelectStint?.(idx)}
            className={`flex items-center justify-center font-bold transition ${
              COMPOUND_COLOUR[stint.compound] ?? "bg-gray-500/80"
            } ${selectedStintIdx === idx ? "ring-2 ring-white/60" : ""}`}
            title={`${stint.compound}: laps ${stint.start}-${stint.end} (${stint.laps})`}
          >
            {COMPOUND_LETTER[stint.compound] ?? stint.compound.slice(0, 1)}
          </button>
        ))}
        {stints.slice(1).map((stint, i) => {
          const stintIdx = i + 1;
          const leftPercent = ((stint.start - 1) / Math.max(1, totalLaps - 1)) * 100;
          return (
            <div
              key={`pit-${stintIdx}`}
              role="slider"
              tabIndex={0}
              aria-label={`pit stop ${stintIdx}, currently at lap ${stint.start}`}
              aria-valuemin={2}
              aria-valuemax={totalLaps - 1}
              aria-valuenow={stint.start}
              onPointerDown={(e) => {
                e.preventDefault();
                setDraggingIdx(stintIdx);
              }}
              onKeyDown={(e) => handleKeyDown(e, stintIdx)}
              style={{ left: `${leftPercent}%` }}
              className="absolute top-0 z-10 h-full w-2 -translate-x-1/2 cursor-ew-resize bg-white/40 hover:bg-white/80 focus:bg-white focus:outline-none"
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>Lap 1</span>
        <span>Lap {totalLaps}</span>
      </div>
    </div>
  );
}
