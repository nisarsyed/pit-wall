"use client";

import { AlertCircle, RotateCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactNode {
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-6 py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Error
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-tight tracking-tight">
        Strategy engine stalled.
      </h1>
      <Alert className="mt-8 border-destructive/40 bg-destructive/10">
        <AlertCircle className="size-4 text-destructive" aria-hidden />
        <AlertTitle className="font-mono text-[10px] uppercase tracking-[0.3em] text-destructive">
          Request failed
        </AlertTitle>
        <AlertDescription className="mt-2 text-sm text-foreground/80">
          {error.message || "Something went wrong loading the race."}
          {error.digest ? (
            <span className="mt-3 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Trace · {error.digest}
            </span>
          ) : null}
        </AlertDescription>
      </Alert>
      <Button
        onClick={reset}
        variant="outline"
        className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em]"
      >
        <RotateCw className="mr-1.5 size-3.5" strokeWidth={1.5} aria-hidden />
        Try again
      </Button>
    </main>
  );
}
