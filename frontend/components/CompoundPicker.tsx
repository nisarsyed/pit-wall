"use client";

const COMPOUND_COLOUR: Record<string, string> = {
  SOFT: "bg-red-500 text-white",
  MEDIUM: "bg-yellow-400 text-black",
  HARD: "bg-gray-200 text-black",
  INTERMEDIATE: "bg-green-500 text-white",
  WET: "bg-blue-500 text-white",
};

interface Props {
  current: string;
  available: string[];
  onSelect: (compound: string) => void;
}

export function CompoundPicker({ current, available, onSelect }: Props): React.ReactNode {
  return (
    <div className="flex gap-2" role="group" aria-label="compound selector">
      {available.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onSelect(c)}
          aria-pressed={c === current}
          className={`rounded-md px-3 py-1 text-sm font-medium transition ${
            COMPOUND_COLOUR[c] ?? "bg-gray-500 text-white"
          } ${c === current ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
