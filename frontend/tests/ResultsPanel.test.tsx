import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultsPanel } from "../components/ResultsPanel";

describe("ResultsPanel", () => {
  it("shows total time formatted as h:mm:ss", () => {
    render(
      <ResultsPanel totalTimeS={5636.736} deltaS={77.25} warnings={[]} loading={false} />,
    );
    expect(screen.getByText(/1:33:57/)).toBeInTheDocument();
  });

  it("shows positive delta in red (slower than actual)", () => {
    const { container } = render(
      <ResultsPanel totalTimeS={5636.736} deltaS={77.25} warnings={[]} loading={false} />,
    );
    const delta = container.querySelector('[data-testid="delta"]');
    expect(delta?.className).toMatch(/red/);
  });

  it("shows negative delta in green (faster than actual)", () => {
    const { container } = render(
      <ResultsPanel totalTimeS={5500} deltaS={-30} warnings={[]} loading={false} />,
    );
    const delta = container.querySelector('[data-testid="delta"]');
    expect(delta?.className).toMatch(/green/);
  });

  it("renders each warning as a list item", () => {
    render(
      <ResultsPanel
        totalTimeS={5636}
        deltaS={0}
        warnings={["stint 1 extrapolated", "compound HARD low R²"]}
        loading={false}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows a loading indicator when loading is true", () => {
    render(<ResultsPanel totalTimeS={null} deltaS={null} warnings={[]} loading={true} />);
    expect(screen.getByText(/simulating/i)).toBeInTheDocument();
  });
});
