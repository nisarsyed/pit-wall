"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StrategyStintOut } from "../lib/types";

interface Props {
  lapTimes: number[];
  pitLaps: number[];
  stints?: StrategyStintOut[];
  totalLaps?: number;
}

const AXIS_LABEL_STYLE = {
  fontSize: 9,
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  fill: "var(--muted-foreground)",
};

const COMPOUND_BAND_FILL: Record<string, string> = {
  SOFT: "#ff3030",
  MEDIUM: "#fcc11d",
  HARD: "#e8e8ea",
  INTERMEDIATE: "#2eca5f",
  WET: "#2988eb",
};

export function LapTimeChart({
  lapTimes,
  pitLaps,
  stints,
  totalLaps,
}: Props): React.ReactNode {
  if (lapTimes.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Lap-time trace
          </span>
          <span
            aria-hidden
            className="h-px w-8 bg-gradient-to-r from-primary/0 via-primary to-primary/0"
          />
        </div>
        <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-border bg-card/40">
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Awaiting simulation
            </span>
            <span className="text-xs text-muted-foreground/70">
              Move a pit stop or change a compound to populate the trace.
            </span>
          </div>
        </div>
      </section>
    );
  }

  const pitLapSet = new Set(pitLaps);
  const nonPitLapTimes = lapTimes.filter((_, i) => !pitLapSet.has(i + 1));
  const reference = nonPitLapTimes.length > 0 ? nonPitLapTimes : lapTimes;
  const yMin = Math.floor(Math.min(...reference) - 0.5);
  const yMax = Math.ceil(Math.max(...reference) + 1.5);

  // For each pit lap, compute how many seconds the pit lap cost above the
  // typical racing pace — shown as the "+Xs" label on the reference line.
  const avgNonPit =
    nonPitLapTimes.length > 0
      ? nonPitLapTimes.reduce((a, b) => a + b, 0) / nonPitLapTimes.length
      : 0;
  const pitDelta = new Map<number, number>();
  pitLaps.forEach((lap) => {
    const lt = lapTimes[lap - 1];
    if (lt !== undefined && avgNonPit > 0) {
      pitDelta.set(lap, Math.round(lt - avgNonPit));
    }
  });

  // Compound colour bands under the line — drawn via ReferenceArea.
  const bands = (() => {
    if (!stints || stints.length === 0 || !totalLaps) return [];
    return stints.map((stint, idx) => {
      const start = stint.start_lap;
      const end = idx + 1 < stints.length ? stints[idx + 1]!.start_lap - 1 : totalLaps;
      return {
        compound: stint.compound,
        x1: start - 0.5,
        x2: end + 0.5,
      };
    });
  })();

  const data = lapTimes.map((t, i) => ({ lap: i + 1, time: t }));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Lap-time trace
          </span>
          <span
            aria-hidden
            className="h-px w-8 bg-gradient-to-r from-primary/0 via-primary to-primary/0"
          />
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-primary" aria-hidden />
            Simulated
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 border-l border-dashed border-foreground/40" aria-hidden />
            Pit
          </span>
          <span className="hidden items-center gap-1.5 md:flex">
            <span className="size-2 rounded-sm bg-medium/30" aria-hidden />
            Compound band
          </span>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card/60 p-4">
        <div className="h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={data} margin={{ top: 16, right: 12, bottom: 4, left: 4 }}>
              {bands.map((band, idx) => (
                <ReferenceArea
                  key={`band-${idx}-${band.compound}-${band.x1}`}
                  x1={band.x1}
                  x2={band.x2}
                  y1={yMin}
                  y2={yMax}
                  fill={COMPOUND_BAND_FILL[band.compound] ?? "#ffffff"}
                  fillOpacity={0.05}
                  stroke="none"
                  ifOverflow="visible"
                />
              ))}
              <CartesianGrid
                stroke="var(--foreground)"
                strokeOpacity={0.06}
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="lap"
                stroke="var(--foreground)"
                strokeOpacity={0.3}
                tickLine={false}
                axisLine={{ strokeOpacity: 0.15 }}
                tick={AXIS_LABEL_STYLE}
                minTickGap={24}
              />
              <YAxis
                stroke="var(--foreground)"
                strokeOpacity={0.3}
                tickLine={false}
                axisLine={{ strokeOpacity: 0.15 }}
                tick={AXIS_LABEL_STYLE}
                domain={[yMin, yMax]}
                allowDataOverflow
                width={44}
                tickFormatter={(v) => `${Math.round(Number(v))}s`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  padding: "8px 10px",
                }}
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{
                  color: "var(--muted-foreground)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: 4,
                }}
                formatter={(val) => [`${Number(val).toFixed(3)}s`, "Lap time"]}
                labelFormatter={(label) => `Lap ${label}`}
                cursor={{ stroke: "var(--foreground)", strokeOpacity: 0.15, strokeWidth: 1 }}
              />
              {pitLaps.map((pit) => {
                const delta = pitDelta.get(pit);
                const label = delta !== undefined ? `PIT · +${delta}s` : "PIT";
                return (
                  <ReferenceLine
                    key={pit}
                    x={pit}
                    stroke="var(--foreground)"
                    strokeOpacity={0.5}
                    strokeDasharray="3 3"
                    label={{
                      value: label,
                      position: "insideTopRight",
                      fill: "var(--foreground)",
                      fillOpacity: 0.7,
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.15em",
                      offset: 4,
                    }}
                  />
                );
              })}
              <Line
                type="monotone"
                dataKey="time"
                stroke="var(--primary)"
                strokeWidth={1.75}
                dot={false}
                activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--popover)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
