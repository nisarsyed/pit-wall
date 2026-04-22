import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { StrategyEditor } from "../../../components/StrategyEditor";
import { api, ApiRequestError } from "../../../lib/api";
import type { RaceDetail } from "../../../lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function displaySplit(raceName: string): { lead: string; trailing: string } {
  // "Hungarian Grand Prix" -> { lead: "Hungarian", trailing: "Grand Prix" }
  // Falls back to the whole name on the first line if there's no "Grand Prix" suffix.
  const suffix = "Grand Prix";
  if (raceName.endsWith(suffix)) {
    return { lead: raceName.slice(0, -suffix.length).trim(), trailing: suffix };
  }
  return { lead: raceName, trailing: "" };
}

function formatRaceTime(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default async function RacePage({ params }: PageProps): Promise<React.ReactNode> {
  const { id } = await params;
  let race: RaceDetail;
  try {
    race = await api.getRace(id);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) {
      notFound();
    }
    throw err;
  }
  const { lead, trailing } = displaySplit(race.name);
  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-16 md:pt-14">
      <Link
        href="/"
        className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft
          className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
          strokeWidth={1.5}
          aria-hidden
        />
        Back to races
      </Link>

      <header className="mt-8 border-b border-border pb-8">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          {race.year} · {race.country}
        </div>
        <h1 className="mt-4 font-display text-[clamp(2.75rem,7.5vw,5.25rem)] font-black uppercase leading-[0.88] tracking-[-0.02em]">
          {lead}
          {trailing ? (
            <>
              <br />
              <span className="text-primary">{trailing}</span>
            </>
          ) : null}
        </h1>
        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
          <Stat label="Laps" value={String(race.total_laps)} />
          <Stat
            label="Compounds"
            value={Object.keys(race.compounds).sort().join(" · ")}
          />
          <Stat
            label="Winner"
            value={race.actual_winner?.name ?? "—"}
          />
          <Stat
            label="Race time"
            value={
              race.actual_winner ? formatRaceTime(race.actual_winner.total_time_s) : "—"
            }
          />
        </dl>
      </header>

      <div className="mt-10">
        <StrategyEditor race={race} />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </dt>
      <dd className="font-mono text-sm tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
