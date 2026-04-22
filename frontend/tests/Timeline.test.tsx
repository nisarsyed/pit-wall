import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Timeline } from "../components/Timeline";
import type { StrategyStintOut } from "../lib/types";

describe("Timeline", () => {
  const strategy: StrategyStintOut[] = [
    { compound: "SOFT", start_lap: 1 },
    { compound: "MEDIUM", start_lap: 20 },
    { compound: "HARD", start_lap: 40 },
  ];

  it("renders one compound block per stint", () => {
    render(<Timeline totalLaps={57} strategy={strategy} />);
    expect(screen.getAllByTestId("stint-block")).toHaveLength(3);
  });

  it("shows the compound letter for each stint", () => {
    render(<Timeline totalLaps={57} strategy={strategy} />);
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("H")).toBeInTheDocument();
  });

  it("shows the first-lap and last-lap labels", () => {
    render(<Timeline totalLaps={57} strategy={strategy} />);
    // There may be multiple "1"s in the DOM (compound letter for... no, letters are S/M/H).
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("57")).toBeInTheDocument();
  });
});
