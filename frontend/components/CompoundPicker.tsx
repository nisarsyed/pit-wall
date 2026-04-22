"use client";

const COMPOUND_CLASS: Record<string, string> = {
  SOFT: "bg-soft text-neutral-950",
  MEDIUM: "bg-medium text-neutral-950",
  HARD: "bg-hard text-neutral-950",
  INTERMEDIATE: "bg-intermediate text-neutral-950",
  WET: "bg-wet text-neutral-50",
};

interface Props {
  current: string;
  available: string[];
  onSelect: (compound: string) => void;
}

export function CompoundPicker({ current, available, onSelect }: Props): React.ReactNode {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="compound selector">
      {available.map((c) => {
        const isActive = c === current;
        const colour = COMPOUND_CLASS[c] ?? "bg-muted text-foreground";
        return (
          <button
            key={c}
            type="button"
            onClick={() => onSelect(c)}
            aria-pressed={isActive}
            className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.15em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${colour} ${
              isActive
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
