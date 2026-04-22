import { act, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Home from "../app/page";

describe("Home page", () => {
  it("renders the Pit Wall heading", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as unknown as typeof fetch;

    await act(async () => {
      render(await Home());
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/out-strategise/i);
  });
});
