import { useCallback, useRef, useState } from "react";

import type { StrategyStintOut } from "./types";

export interface UseStrategyArgs {
  totalLaps: number;
  compoundsAvailable: string[];
  initial: StrategyStintOut[];
}

export interface UseStrategyResult {
  stints: StrategyStintOut[];
  isValid: boolean;
  movePit: (stintIdx: number, lap: number) => void;
  setCompound: (stintIdx: number, compound: string) => void;
  addPit: () => void;
  removePit: (stintIdx: number) => void;
  reset: () => void;
}

function validate(stints: StrategyStintOut[]): boolean {
  if (stints.length === 0) return false;
  if (stints[0]!.start_lap !== 1) return false;
  for (let i = 1; i < stints.length; i += 1) {
    if (stints[i]!.start_lap <= stints[i - 1]!.start_lap) return false;
  }
  const distinct = new Set(stints.map((s) => s.compound));
  if (distinct.size < 2) return false;
  return true;
}

function nextCompound(current: string[], available: string[]): string {
  const used = new Set(current);
  for (const c of available) {
    if (!used.has(c)) return c;
  }
  return available[0] ?? "HARD";
}

export function useStrategy({
  totalLaps,
  compoundsAvailable,
  initial,
}: UseStrategyArgs): UseStrategyResult {
  const initialRef = useRef(initial);
  const [stints, setStints] = useState<StrategyStintOut[]>(() =>
    initial.map((s) => ({ ...s })),
  );

  const movePit = useCallback(
    (stintIdx: number, lap: number): void => {
      if (stintIdx === 0) return; // first stint's start_lap is always 1
      setStints((prev) => {
        if (stintIdx >= prev.length) return prev;
        const lower = prev[stintIdx - 1]!.start_lap + 1;
        const upper = totalLaps - 1;
        const clampedLow = Math.max(lap, Math.max(2, lower));
        const next = prev[stintIdx + 1]?.start_lap;
        const clamped =
          next !== undefined ? Math.min(clampedLow, next - 1, upper) : Math.min(clampedLow, upper);
        return prev.map((s, i) => (i === stintIdx ? { ...s, start_lap: clamped } : s));
      });
    },
    [totalLaps],
  );

  const setCompound = useCallback((stintIdx: number, compound: string): void => {
    setStints((prev) => prev.map((s, i) => (i === stintIdx ? { ...s, compound } : s)));
  }, []);

  const addPit = useCallback((): void => {
    setStints((prev) => {
      if (prev.length === 0) return prev;
      let longestIdx = 0;
      let longestLen = 0;
      for (let i = 0; i < prev.length; i += 1) {
        const start = prev[i]!.start_lap;
        const end = i + 1 < prev.length ? prev[i + 1]!.start_lap - 1 : totalLaps;
        const len = end - start + 1;
        if (len > longestLen) {
          longestLen = len;
          longestIdx = i;
        }
      }
      const start = prev[longestIdx]!.start_lap;
      const end =
        longestIdx + 1 < prev.length ? prev[longestIdx + 1]!.start_lap - 1 : totalLaps;
      const mid = Math.floor((start + end) / 2);
      const newStint: StrategyStintOut = {
        compound: nextCompound(
          prev.map((s) => s.compound),
          compoundsAvailable,
        ),
        start_lap: Math.max(start + 1, Math.min(mid, end - 1)),
      };
      const next = [...prev];
      next.splice(longestIdx + 1, 0, newStint);
      return next;
    });
  }, [compoundsAvailable, totalLaps]);

  const removePit = useCallback((stintIdx: number): void => {
    if (stintIdx === 0) return;
    setStints((prev) => prev.filter((_, i) => i !== stintIdx));
  }, []);

  const reset = useCallback((): void => {
    setStints(initialRef.current.map((s) => ({ ...s })));
  }, []);

  return {
    stints,
    isValid: validate(stints),
    movePit,
    setCompound,
    addPit,
    removePit,
    reset,
  };
}
