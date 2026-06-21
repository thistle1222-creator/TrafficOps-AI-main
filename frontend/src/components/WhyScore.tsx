import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { RiskFactor } from "@/lib/mock-data";

export function WhyScore({ factors, label = "Why this score?" }: { factors: RiskFactor[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const total = factors.reduce((s, f) => s + f.value, 0);
  return (
    <div className="mt-2 text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        {label}
      </button>
      {open && (
        <ul className="mt-2 space-y-1 rounded border border-border bg-black/40 p-2 fade-up">
          {factors.map((f, i) => (
            <li key={i} className="flex items-center justify-between mono">
              <span className="text-muted-foreground">{f.label}</span>
              <span style={{ color: f.value < 0 ? "var(--success)" : "var(--accent-cyan)" }}>
                {f.value > 0 ? "+" : ""}{f.value}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between mono border-t border-border pt-1 mt-1">
            <span className="text-muted-foreground">Total</span>
            <span style={{ color: "var(--primary)" }}>{total.toFixed(0)}</span>
          </li>
        </ul>
      )}
    </div>
  );
}