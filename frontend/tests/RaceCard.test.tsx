import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RaceCard } from "../components/RaceCard";
import type { RaceListItem } from "../lib/types";

const RACE: RaceListItem = {
  id: "2023_bahrain",
  name: "Bahrain Grand Prix",
  country: "Bahrain",
  year: 2023,
  total_laps: 57,
  compounds_available: ["HARD", "MEDIUM", "SOFT"],
  actual_winner_name: "Max Verstappen",
  actual_winning_time_s: 5636.7,
};

describe("RaceCard", () => {
  it("renders race name, year, country, and winner", () => {
    render(<RaceCard race={RACE} />);
    expect(screen.getByText("Bahrain Grand Prix")).toBeInTheDocument();
    expect(screen.getByText(/2023/)).toBeInTheDocument();
    expect(screen.getAllByText(/Bahrain/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Max Verstappen/)).toBeInTheDocument();
  });

  it("links to /race/{id}", () => {
    render(<RaceCard race={RACE} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/race/2023_bahrain");
  });
});
