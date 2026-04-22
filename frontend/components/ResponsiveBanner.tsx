"use client";

import { MonitorSmartphone } from "lucide-react";

export function ResponsiveBanner(): React.ReactNode {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-md border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-foreground/90 lg:hidden">
      <MonitorSmartphone
        className="mt-0.5 size-4 flex-shrink-0 text-warn"
        strokeWidth={1.5}
        aria-hidden
      />
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-warn">
          Desktop recommended
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The lap-timeline drag needs a pointer device. You can still read the data, but
          the interactive editor is best on a wide viewport.
        </p>
      </div>
    </div>
  );
}
