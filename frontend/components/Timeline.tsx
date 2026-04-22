"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { StrategyStintOut } from "../lib/types";

const COMPOUND_CLASS: Record<string, string> = {
  SOFT: "bg-soft text-neutral-950",
  MEDIUM: "bg-medium text-neutral-950",
  HARD: "bg-hard text-neutral-950",
  INTERMEDIATE: "bg-intermediate text-neutral-950",
  WET: "bg-wet text-neutral-50",
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
  const [hoverLap, setHoverLap] = useState<number | null>(null);
  const [focusedPitIdx, setFocusedPitIdx] = useState<number | null>(null);

  const stints = useMemo(
    () =>
      strategy.map((stint, idx) => {
        const start = stint.start_lap;
        const end = idx + 1 < strategy.length ? strategy[idx + 1]!.start_lap - 1 : totalLaps;
        return { ...stint, start, end, laps: end - start + 1 };
      }),
    [strategy, totalLaps],
  );

  // Tick marks: every 5 laps, with labels at 1, 10, 20, ..., totalLaps.
  const ticks = useMemo(() => {
    const out: { lap: number; labeled: boolean }[] = [];
    for (let lap = 1; lap <= totalLaps; lap += 1) {
      if (lap === 1 || lap === totalLaps || lap % 5 === 0) {
        const labeled = lap === 1 || lap === totalLaps || lap % 10 === 0;
        out.push({ lap, labeled });
      }
    }
    return out;
  }, [totalLaps]);

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
      setHoverLap(lap);
      onMovePit(draggingIdx, lap);
    },
    [draggingIdx, onMovePit, pixelToLap],
  );

  const handlePointerUp = useCallback((): void => {
    setDraggingIdx(null);
    setHoverLap(null);
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
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={trackRef}
          className="relative flex h-16 w-full overflow-hidden rounded-md border border-border bg-card shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
        >
          {stints.map((stint, idx) => (
            <button
              key={`stint-${idx}-${stint.start}`}
              type="button"
              data-testid="stint-block"
              aria-label={`${stint.compound} stint, laps ${stint.start}-${stint.end}`}
              style={{
                flex: stint.laps,
                animationDelay: `${idx * 60}ms`,
              }}
              onClick={() => onSelectStint?.(idx)}
              className={`pitwall-stint-in relative flex items-center justify-center transition-[filter] duration-200 ${
                COMPOUND_CLASS[stint.compound] ?? "bg-muted text-foreground"
              } ${
                selectedStintIdx === idx
                  ? "brightness-110 ring-2 ring-inset ring-primary/60"
                  : "brightness-95 hover:brightness-100"
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20"
              />
              <span className="relative font-display text-xl font-extrabold uppercase leading-none">
                {COMPOUND_LETTER[stint.compound] ?? stint.compound.slice(0, 1)}
              </span>
            </button>
          ))}
          {stints.slice(1).map((stint, i) => {
            const stintIdx = i + 1;
            const leftPercent = ((stint.start - 1) / Math.max(1, totalLaps - 1)) * 100;
            const isActive = draggingIdx === stintIdx || focusedPitIdx === stintIdx;
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
                  setHoverLap(stint.start);
                }}
                onFocus={() => setFocusedPitIdx(stintIdx)}
                onBlur={() => setFocusedPitIdx((prev) => (prev === stintIdx ? null : prev))}
                onKeyDown={(e) => handleKeyDown(e, stintIdx)}
                style={{ left: `${leftPercent}%` }}
                className={`group absolute top-0 z-20 h-full w-[3px] -translate-x-1/2 cursor-ew-resize transition-[background-color,box-shadow] duration-150 focus:outline-none ${
                  isActive
                    ? "bg-primary shadow-[0_0_0_3px_rgba(255,24,1,0.2)]"
                    : "bg-foreground/70 hover:bg-foreground"
                }`}
              >
                {/* Top grip handle — the main affordance */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute left-1/2 -top-2 flex h-5 w-6 -translate-x-1/2 items-center justify-center rounded-sm border transition-colors ${
                    isActive
                      ? "border-primary bg-popover"
                      : "border-foreground/70 bg-popover group-hover:border-foreground"
                  }`}
                >
                  <span className="flex gap-[2px]">
                    <span
                      className={`block h-2 w-[1.5px] ${
                        isActive ? "bg-primary" : "bg-foreground/80"
                      }`}
                    />
                    <span
                      className={`block h-2 w-[1.5px] ${
                        isActive ? "bg-primary" : "bg-foreground/80"
                      }`}
                    />
                  </span>
                </span>

                {/* Bottom notch — subtle directional cue without the clutter of the old diamond */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute left-1/2 bottom-0 h-[6px] w-[6px] -translate-x-1/2 translate-y-1/2 rotate-45 border-r border-b transition-colors ${
                    isActive
                      ? "border-primary bg-primary"
                      : "border-foreground/70 bg-foreground/70"
                  }`}
                />

                {/* Floating lap readout tooltip, only while active */}
                {isActive ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 -top-11 -translate-x-1/2 rounded-md border border-primary/70 bg-popover px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  >
                    Lap {draggingIdx === stintIdx && hoverLap !== null ? hoverLap : stint.start}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tick rail */}
      <div className="relative h-5 w-full">
        {ticks.map(({ lap, labeled }) => {
          const leftPercent = ((lap - 1) / Math.max(1, totalLaps - 1)) * 100;
          const isFirst = lap === 1;
          const isLast = lap === totalLaps;
          // Tick mark centers on the percentage. The label's horizontal alignment
          // swings so the text stays inside the card: first tick left-aligns, last
          // tick right-aligns, everything else stays centered.
          const labelAlign = isFirst
            ? "left-0"
            : isLast
              ? "right-0"
              : "left-1/2 -translate-x-1/2";
          return (
            <div
              key={`tick-${lap}`}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${leftPercent}%` }}
            >
              <span
                className={`block w-px ${labeled ? "h-2 bg-foreground/30" : "h-1 bg-foreground/15"}`}
              />
              {labeled ? (
                <span
                  className={`absolute top-3 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground ${labelAlign}`}
                >
                  Lap {lap}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
