import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Pit Wall models tyre degradation, fuel burn, and pit-stop strategy from real FastF1 stint data.",
};

export default function About(): React.ReactNode {
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-6 pt-16 pb-24 md:pt-20">
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

      <header className="mt-10 border-b border-border pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Methodology
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[-0.02em]">
          How the model
          <br />
          <span className="text-primary">keeps honest.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Pit Wall&apos;s race-strategy simulator is grounded in real Formula 1 stint data.
          The model is linear, deliberate, and explicit about its limits.
        </p>
      </header>

      <article className="prose-editorial mt-12 space-y-16">
        <Section label="01 · Data source" heading="Real races, cleaned laps.">
          <p>
            Lap and stint data is pulled from{" "}
            <ExternalLink href="https://docs.fastf1.dev/">FastF1</ExternalLink>, the
            canonical Python library for historical F1 telemetry. Pit Wall currently ships
            three dry races: the 2023 Bahrain Grand Prix, the 2023 Hungarian Grand Prix,
            and the 2024 British Grand Prix.
          </p>
          <p>
            Before any curve fitting, laps are filtered: in-laps and out-laps dropped; laps
            under safety car or virtual safety car dropped; laps slower than 107 % of the
            stint best dropped as traffic; the tyre warm-up lap dropped to keep the
            regression honest on short stints.
          </p>
        </Section>

        <Section label="02 · Model" heading="Linear, fuel-corrected, and scoped.">
          <p>
            Each lap&apos;s time is modelled as a sum of four terms:
          </p>
          <pre
            aria-hidden
            className="whitespace-pre-wrap rounded-lg border border-border bg-card/60 p-4 font-mono text-[11px] leading-relaxed text-foreground/80"
          >{`lap_time  =  base_lap_time
           +  tyre_delta(compound, stint_lap)
           +  fuel_delta(lap)
           +  pit_loss(lap)

tyre_delta  =  slope · stint_lap + intercept
fuel_delta  =  fuel_kg_remaining(lap) · 0.035 s/kg`}</pre>
          <p>
            Fuel burns linearly from 110 kg at lap 1 to zero at the final lap. The tyre
            degradation curves are per-compound linear least-squares fits over all clean
            stints in each race, using the actual stint-lap position — not a compressed
            count of surviving laps — so the fit&apos;s x-axis matches the simulator&apos;s.
          </p>
        </Section>

        <Section label="03 · Scope" heading="What we don't model.">
          <p>
            Keeping the model linear means keeping it narrow. Out of scope:
          </p>
          <ul className="mt-2 space-y-1.5 list-none pl-0">
            <BulletItem>Wet or mixed-condition strategy (intermediate and wet compounds are skipped at fit time).</BulletItem>
            <BulletItem>Track evolution within a race.</BulletItem>
            <BulletItem>Traffic, DRS trains, ERS deployment, battery management.</BulletItem>
            <BulletItem>Driver skill variance between drivers on the same compound.</BulletItem>
            <BulletItem>Tyre warm-up effects beyond the first racing lap.</BulletItem>
            <BulletItem>Changes to the pit loss within a race.</BulletItem>
          </ul>
          <p>
            The simulator surfaces warnings when a stint extrapolates past the fit&apos;s
            valid range, or when a compound&apos;s fit has an R² below 0.5. The point is to
            be honest about extrapolation, not to hide it.
          </p>
        </Section>

        <Section label="04 · Built with" heading="Two services, polyglot intentionally.">
          <p>
            A Python FastAPI service runs the deterministic simulator and serves the API.
            A Next.js 16 front-end owns the interactive timeline, state, and charts. Data
            flows one way: FastF1 → offline pipeline → committed{" "}
            <code className="font-mono text-foreground">curves.json</code> → FastAPI at
            start-up → TanStack Query → React.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Python 3.13 · FastAPI · FastF1 · NumPy
            <br />
            Next.js 16 · React 19 · TypeScript · Tailwind 4 · Recharts · shadcn/ui
            <br />
            Fly.io · Vercel · GitHub Actions
          </p>
        </Section>
      </article>
    </main>
  );
}

function Section({
  label,
  heading,
  children,
}: {
  label: string;
  heading: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <section className="grid gap-6 md:grid-cols-[140px_1fr] md:gap-10">
      <header className="md:sticky md:top-20 md:self-start">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {label}
        </p>
      </header>
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-bold uppercase leading-tight tracking-tight text-foreground">
          {heading}
        </h2>
        <div className="space-y-4 text-base leading-relaxed text-foreground/80">
          {children}
        </div>
      </div>
    </section>
  );
}

function BulletItem({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="mt-2 inline-block h-px w-4 bg-foreground/40" />
      <span className="text-foreground/80">{children}</span>
    </li>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-primary"
    >
      {children}
    </a>
  );
}
