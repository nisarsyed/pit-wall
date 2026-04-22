import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, ApiRequestError } from "../lib/api";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn() as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("api client", () => {
  it("listRaces returns parsed JSON on 200", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [{ id: "2023_bahrain", name: "Bahrain", year: 2023 }],
    });
    const races = await api.listRaces();
    expect(races).toHaveLength(1);
    expect(races[0]?.id).toBe("2023_bahrain");
  });

  it("throws ApiRequestError with envelope fields on 404", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({
        error: { code: "NOT_FOUND", message: "race 'nope' not found", request_id: "abc123" },
      }),
    });
    await expect(api.getRace("nope")).rejects.toThrow(ApiRequestError);
    try {
      await api.getRace("nope");
    } catch (err) {
      const e = err as ApiRequestError;
      expect(e.status).toBe(404);
      expect(e.code).toBe("NOT_FOUND");
      expect(e.requestId).toBe("abc123");
    }
  });

  it("falls back gracefully when error body is non-JSON", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => {
        throw new Error("not json");
      },
    });
    await expect(api.listRaces()).rejects.toMatchObject({
      status: 500,
      code: "HTTP_500",
    });
  });
});
