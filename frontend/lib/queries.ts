import { useMutation, useQuery } from "@tanstack/react-query";

import { api, ApiRequestError } from "./api";
import type { RaceDetail, RaceListItem, SimulateResponse, StrategyRequest } from "./types";

export function useRaces() {
  return useQuery<RaceListItem[], ApiRequestError>({
    queryKey: ["races"],
    queryFn: api.listRaces,
  });
}

export function useRace(raceId: string) {
  return useQuery<RaceDetail, ApiRequestError>({
    queryKey: ["race", raceId],
    queryFn: () => api.getRace(raceId),
    enabled: Boolean(raceId),
  });
}

export function useSimulate(raceId: string) {
  return useMutation<SimulateResponse, ApiRequestError, StrategyRequest>({
    mutationKey: ["simulate", raceId],
    mutationFn: (strategy) => api.simulate(raceId, strategy),
  });
}
