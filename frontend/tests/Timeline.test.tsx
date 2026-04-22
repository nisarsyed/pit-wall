import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
    expect(screen.getByText("Lap 1")).toBeInTheDocument();
    expect(screen.getByText("Lap 57")).toBeInTheDocument();
  });
});

describe("Timeline interactions", () => {
  const strategy = [
    { compound: "MEDIUM", start_lap: 1 },
    { compound: "HARD", start_lap: 25 },
  ];

  it("calls onSelectStint when a stint block is clicked", async () => {
    const onSelectStint = vi.fn();
    render(
      <Timeline totalLaps={57} strategy={strategy} onSelectStint={onSelectStint} />,
    );
    await userEvent.click(screen.getAllByTestId("stint-block")[0]!);
    expect(onSelectStint).toHaveBeenCalledWith(0);
  });

  it("calls onMovePit when ArrowRight is pressed on a pit slider", async () => {
    const onMovePit = vi.fn();
    render(
      <Timeline totalLaps={57} strategy={strategy} onMovePit={onMovePit} />,
    );
    const slider = screen.getByRole("slider", { name: /pit stop 1/ });
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onMovePit).toHaveBeenCalledWith(1, 26);
  });

  it("calls onMovePit with lap-1 on ArrowLeft", async () => {
    const onMovePit = vi.fn();
    render(
      <Timeline totalLaps={57} strategy={strategy} onMovePit={onMovePit} />,
    );
    screen.getByRole("slider", { name: /pit stop 1/ }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onMovePit).toHaveBeenCalledWith(1, 24);
  });

  it("calls onRemovePit when Delete is pressed on a pit slider", () => {
    const onRemovePit = vi.fn();
    render(
      <Timeline totalLaps={57} strategy={strategy} onRemovePit={onRemovePit} />,
    );
    const slider = screen.getByRole("slider", { name: /pit stop 1/ });
    slider.focus();
    fireEvent.keyDown(slider, { key: "Delete" });
    expect(onRemovePit).toHaveBeenCalledWith(1);
  });
});
