import type {
  ApiError,
  RaceDetail,
  RaceListItem,
  SimulateResponse,
  StrategyRequest,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId: string;

  constructor(status: number, code: string, message: string, requestId: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      /* non-JSON error body */
    }
    const msg = body?.error?.message ?? res.statusText;
    const code = body?.error?.code ?? `HTTP_${res.status}`;
    const rid = body?.error?.request_id ?? "-";
    throw new ApiRequestError(res.status, code, msg, rid);
  }
  return (await res.json()) as T;
}

export const api = {
  listRaces: (): Promise<RaceListItem[]> => request("/races"),
  getRace: (raceId: string): Promise<RaceDetail> =>
    request(`/races/${encodeURIComponent(raceId)}`),
  simulate: (raceId: string, strategy: StrategyRequest): Promise<SimulateResponse> =>
    request(`/races/${encodeURIComponent(raceId)}/simulate`, {
      method: "POST",
      body: JSON.stringify(strategy),
    }),
};
