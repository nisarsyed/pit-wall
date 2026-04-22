"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";

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
  // Extrapolation warnings mean the stint length lies outside the curve's fit
  // range, so the sim is guessing — downgrade the delta to muted + "≈" prefix.
  // Low-R² warnings on their own don't get muted: the fit is noisy but strategies
  // within range are still in meaningful comparison territory.
  const isExtrapolated = warnings.some((w) => w.includes("extrapolated"));
  const deltaClass =
    deltaS === null
      ? "text-muted-foreground"
      : isExtrapolated
        ? "text-muted-foreground/80"
        : deltaS > 0
          ? "text-red-400"
          : deltaS < 0
            ? "text-green-400"
            : "text-muted-foreground";

  return (
    <aside className="sticky top-8 space-y-5 rounded-lg border border-border bg-card/80 p-6 backdrop-blur-sm">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Total time
        </p>
        <p className="mt-2 font-mono text-4xl tabular-nums text-foreground leading-none">
          {totalTimeS === null ? "—" : formatDuration(totalTimeS)}
        </p>
      </div>

      <Separator />

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Vs actual winner
        </p>
        <p
          key={`delta-${deltaS ?? "null"}`}
          data-testid="delta"
          className={`pitwall-delta-pulse mt-2 font-mono text-3xl tabular-nums leading-none ${deltaClass}`}
        >
          {deltaS === null
            ? "—"
            : isExtrapolated
              ? `≈ ${formatDelta(deltaS)}`
              : formatDelta(deltaS)}
        </p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Simulating…
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <Alert className="border-warn/40 bg-warn/10 text-foreground">
          <AlertTriangle className="size-4 text-warn" aria-hidden />
          <AlertTitle className="font-mono text-[10px] uppercase tracking-[0.3em] text-warn">
            Model warnings
          </AlertTitle>
          <AlertDescription>
            <ul role="list" className="mt-2 space-y-1.5 text-xs text-foreground/80">
              {warnings.map((w, idx) => (
                <li role="listitem" key={idx} className="flex gap-2">
                  <span aria-hidden className="text-warn">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
    </aside>
  );
}
