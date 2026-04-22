"use client";

function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  const abs = Math.abs(delta);
  if (abs < 60) return `${sign}${abs.toFixed(2)}s`;
  const mins = Math.floor(abs / 60);
  const secs = abs - mins * 60;
  return `${sign}${mins}:${secs.toFixed(1).padStart(4, "0")}`;
}

interface Props {
  totalTimeS: number | null;
  deltaS: number | null;
  warnings: string[];
  loading: boolean;
}

export function ResultsPanel({ totalTimeS, deltaS, warnings, loading }: Props): React.ReactNode {
  const deltaClass =
    deltaS === null
      ? "text-gray-400"
      : deltaS > 0
        ? "text-red-400"
        : deltaS < 0
          ? "text-green-400"
          : "text-gray-300";

  return (
    <aside className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">Total time</p>
        <p className="mt-1 font-mono text-3xl tabular-nums">
          {totalTimeS === null ? "—" : formatDuration(totalTimeS)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">Vs actual winner</p>
        <p data-testid="delta" className={`mt-1 font-mono text-2xl tabular-nums ${deltaClass}`}>
          {deltaS === null ? "—" : formatDelta(deltaS)}
        </p>
      </div>
      {loading ? <p className="text-sm text-gray-400">Simulating…</p> : null}
      {warnings.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-400">Warnings</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-300">
            {warnings.map((w, idx) => (
              <li key={idx}>• {w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
