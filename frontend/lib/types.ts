// TypeScript mirrors of backend Pydantic schemas. Kept manually in sync.
// Source of truth: backend/pit_wall/api/schemas.py + backend/pit_wall/data/curves.py

export type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";

export interface HealthResponse {
  status: string;
  version: string;
}

export interface CompoundCurveOut {
  slope: number;
  intercept: number;
  r2: number;
  valid_stint_range: [number, number];
}

export interface StrategyStintOut {
  compound: string;
  start_lap: number;
}

export interface ActualWinnerOut {
  name: string;
  strategy: StrategyStintOut[];
  total_time_s: number;
}

export interface RaceListItem {
  id: string;
  name: string;
  country: string;
  year: number;
  total_laps: number;
  compounds_available: string[];
  actual_winner_name: string | null;
  actual_winning_time_s: number | null;
}

export interface RaceDetail {
  id: string;
  name: string;
  country: string;
  year: number;
  total_laps: number;
  base_lap_time_s: number;
  pit_loss_s: number;
  compounds: Record<string, CompoundCurveOut>;
  actual_winner: ActualWinnerOut | null;
}

export interface StintRequest {
  compound: string;
  start_lap: number;
}

export interface StrategyRequest {
  stints: StintRequest[];
}

export interface SimulateResponse {
  lap_times: number[];
  cumulative_times: number[];
  total_time_s: number;
  total_time_vs_actual_s: number | null;
  warnings: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}
