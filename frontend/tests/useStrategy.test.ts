import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useStrategy } from "../lib/useStrategy";

describe("useStrategy", () => {
  it("seeds from the initial stints", () => {
    const { result } = renderHook(() =>
      useStrategy({
        totalLaps: 57,
        compoundsAvailable: ["SOFT", "MEDIUM", "HARD"],
        initial: [
          { compound: "MEDIUM", start_lap: 1 },
          { compound: "HARD", start_lap: 25 },
        ],
      }),
    );
    expect(result.current.stints).toHaveLength(2);
    expect(result.current.isValid).toBe(true);
  });

  it("movePit updates the start_lap of the given stint", () => {
    const { result } = renderHook(() =>
      useStrategy({
        totalLaps: 57,
        compoundsAvailable: ["SOFT", "MEDIUM", "HARD"],
        initial: [
          { compound: "MEDIUM", start_lap: 1 },
          { compound: "HARD", start_lap: 25 },
        ],
      }),
    );
    act(() => {
      result.current.movePit(1, 30);
    });
    expect(result.current.stints[1]?.start_lap).toBe(30);
  });

  it("movePit clamps to valid range (not < 2, not >= totalLaps)", () => {
    const { result } = renderHook(() =>
      useStrategy({
        totalLaps: 57,
        compoundsAvailable: ["SOFT", "MEDIUM", "HARD"],
        initial: [
          { compound: "MEDIUM", start_lap: 1 },
          { compound: "HARD", start_lap: 25 },
        ],
      }),
    );
    act(() => {
      result.current.movePit(1, 1);
    });
    expect(result.current.stints[1]?.start_lap).toBe(2);
    act(() => {
      result.current.movePit(1, 100);
    });
    expect(result.current.stints[1]?.start_lap).toBe(56); // totalLaps - 1
  });

  it("addPit inserts at midpoint of longest stint with a fresh compound", () => {
    const { result } = renderHook(() =>
      useStrategy({
        totalLaps: 57,
        compoundsAvailable: ["SOFT", "MEDIUM", "HARD"],
        initial: [
          { compound: "MEDIUM", start_lap: 1 },
          { compound: "HARD", start_lap: 25 }, // stint1 24 laps, stint2 33 laps (longer)
        ],
      }),
    );
    act(() => {
      result.current.addPit();
    });
    expect(result.current.stints).toHaveLength(3);
    // Inserted in stint2 (longer): midpoint of laps 25..57 is (25+57)/2 = 41
    const newStint = result.current.stints[2];
    expect(newStint?.start_lap).toBe(41);
  });

  it("removePit removes the stint at idx (idx >= 1)", () => {
    const { result } = renderHook(() =>
      useStrategy({
        totalLaps: 57,
        compoundsAvailable: ["SOFT", "MEDIUM", "HARD"],
        initial: [
          { compound: "MEDIUM", start_lap: 1 },
          { compound: "HARD", start_lap: 25 },
          { compound: "SOFT", start_lap: 45 },
        ],
      }),
    );
    act(() => {
      result.current.removePit(1);
    });
    expect(result.current.stints).toHaveLength(2);
    expect(result.current.stints[0]?.compound).toBe("MEDIUM");
    expect(result.current.stints[1]?.compound).toBe("SOFT");
    expect(result.current.stints[1]?.start_lap).toBe(45);
  });

  it("setCompound updates an existing stint's compound", () => {
    const { result } = renderHook(() =>
      useStrategy({
        totalLaps: 57,
        compoundsAvailable: ["SOFT", "MEDIUM", "HARD"],
        initial: [
          { compound: "MEDIUM", start_lap: 1 },
          { compound: "HARD", start_lap: 25 },
        ],
      }),
    );
    act(() => {
      result.current.setCompound(0, "SOFT");
    });
    expect(result.current.stints[0]?.compound).toBe("SOFT");
  });

  it("reports isValid=false for single-compound strategies", () => {
    const { result } = renderHook(() =>
      useStrategy({
        totalLaps: 57,
        compoundsAvailable: ["SOFT", "MEDIUM", "HARD"],
        initial: [
          { compound: "MEDIUM", start_lap: 1 },
          { compound: "MEDIUM", start_lap: 25 },
        ],
      }),
    );
    expect(result.current.isValid).toBe(false);
  });

  it("reset returns to the initial strategy", () => {
    const { result } = renderHook(() =>
      useStrategy({
        totalLaps: 57,
        compoundsAvailable: ["SOFT", "MEDIUM", "HARD"],
        initial: [
          { compound: "MEDIUM", start_lap: 1 },
          { compound: "HARD", start_lap: 25 },
        ],
      }),
    );
    act(() => {
      result.current.movePit(1, 40);
      result.current.reset();
    });
    expect(result.current.stints[1]?.start_lap).toBe(25);
  });
});
