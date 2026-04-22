import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompoundPicker } from "../components/CompoundPicker";

describe("CompoundPicker", () => {
  it("lists all available compounds as buttons", () => {
    render(
      <CompoundPicker
        current="MEDIUM"
        available={["SOFT", "MEDIUM", "HARD"]}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /SOFT/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /MEDIUM/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /HARD/ })).toBeInTheDocument();
  });

  it("calls onSelect when a compound button is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <CompoundPicker
        current="MEDIUM"
        available={["SOFT", "MEDIUM", "HARD"]}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /HARD/ }));
    expect(onSelect).toHaveBeenCalledWith("HARD");
  });

  it("marks the current compound as aria-pressed", () => {
    render(
      <CompoundPicker
        current="MEDIUM"
        available={["SOFT", "MEDIUM", "HARD"]}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /MEDIUM/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
