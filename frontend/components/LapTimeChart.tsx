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

export function LapTimeChart({ lapTimes, pitLaps }: Props): React.ReactNode {
  if (lapTimes.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-gray-400">
        Chart will appear once the first simulation runs.
      </div>
    );
  }
  const data = lapTimes.map((t, i) => ({ lap: i + 1, time: t }));
  const yMin = Math.floor(Math.min(...lapTimes) - 1);
  const yMax = Math.ceil(Math.max(...lapTimes) + 1);
  return (
    <div className="h-72 rounded-lg border border-white/10 bg-white/5 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
          <XAxis
            dataKey="lap"
            stroke="#a1a1aa"
            tick={{ fontSize: 11 }}
            label={{ value: "Lap", position: "insideBottom", offset: -4, fill: "#a1a1aa" }}
          />
          <YAxis
            stroke="#a1a1aa"
            tick={{ fontSize: 11 }}
            domain={[yMin, yMax]}
            label={{
              value: "Lap time (s)",
              angle: -90,
              position: "insideLeft",
              fill: "#a1a1aa",
              style: { textAnchor: "middle" },
            }}
          />
          <Tooltip
            contentStyle={{ background: "#111", border: "1px solid #333", fontSize: 12 }}
            formatter={(val) => [`${Number(val).toFixed(3)}s`, "Lap time"]}
            labelFormatter={(label) => `Lap ${label}`}
          />
          <Line type="monotone" dataKey="time" stroke="#ef4444" strokeWidth={2} dot={false} />
          {pitLaps.map((pit) => (
            <ReferenceLine
              key={pit}
              x={pit}
              stroke="#ffffff40"
              strokeDasharray="2 2"
              label={{ value: "pit", position: "top", fill: "#a1a1aa", fontSize: 10 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
