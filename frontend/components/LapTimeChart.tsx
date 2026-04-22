"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  lapTimes: number[];
  pitLaps: number[];
}

const AXIS_LABEL_STYLE = {
  fontSize: 9,
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  fill: "var(--muted-foreground)",
};

export function LapTimeChart({ lapTimes, pitLaps }: Props): React.ReactNode {
  if (lapTimes.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border bg-card/40">
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Awaiting simulation
          </span>
          <span className="text-xs text-muted-foreground/70">
            Move a pit stop or change a compound to populate the lap-time trace.
          </span>
        </div>
      </div>
    );
  }

  const data = lapTimes.map((t, i) => ({ lap: i + 1, time: t }));
  const yMin = Math.floor(Math.min(...lapTimes) - 1);
  const yMax = Math.ceil(Math.max(...lapTimes) + 1);

  return (
    <div className="rounded-lg border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
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
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 12 }}>
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
              width={40}
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
            <Line
              type="monotone"
              dataKey="time"
              stroke="var(--primary)"
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--popover)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {pitLaps.map((pit) => (
              <ReferenceLine
                key={pit}
                x={pit}
                stroke="var(--foreground)"
                strokeOpacity={0.4}
                strokeDasharray="3 3"
                label={{
                  value: "pit",
                  position: "top",
                  fill: "var(--muted-foreground)",
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.15em",
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
