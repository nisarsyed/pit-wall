import Link from "next/link";
import { ArrowLeft, Flag } from "lucide-react";

import { Button } from "../../../components/ui/button";

export default function NotFound(): React.ReactNode {
  return (
    <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-3xl flex-col items-start justify-center px-6 py-24">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <Flag className="size-3.5 text-primary" strokeWidth={1.5} aria-hidden />
        404 · Race not found
      </div>
      <h1 className="mt-6 font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.02em] md:text-6xl">
        That one&apos;s
        <br />
        <span className="text-primary">not on the calendar.</span>
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        We don&apos;t have that grand prix in the current dataset. Pit Wall models three
        curated dry races for now — more will be added as the curve pipeline grows.
      </p>
      <Button asChild variant="outline" className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em]">
        <Link href="/">
          <ArrowLeft className="mr-1.5 size-3.5" strokeWidth={1.5} aria-hidden />
          Back to races
        </Link>
      </Button>
    </main>
  );
}
