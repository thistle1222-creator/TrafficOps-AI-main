import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { HeatmapSvg } from "@/components/HeatmapSvg";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_app/heatmap")({
  head: () => ({ meta: [{ title: "Heatmap — TrafficOps AI" }] }),
  component: HeatPage,
});

function HeatPage() {
  const { state } = useStore();
  const high = state.events.filter((e) => e.severity === "High" || e.severity === "Critical").length;
  return (
    <>
      <PageHeader title="Bengaluru Heatmap" subtitle="15 ZONES MONITORED · LIVE TELEMETRY" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3"><HeatmapSvg height={620} /></div>
        <div className="space-y-3">
          {[
            { l: "ZONES MONITORED", v: 15, c: "var(--accent-cyan)" },
            { l: "HIGH RISK ZONES", v: high, c: "var(--critical)" },
            { l: "OFFICERS DEPLOYED", v: 127, c: "var(--foreground)" },
            { l: "INCIDENTS ACTIVE", v: state.events.filter((e) => e.status !== "Resolved").length, c: "var(--warning)" },
            { l: "DATA UPDATED", v: "LIVE", c: "var(--success)" },
          ].map((s) => (
            <div key={s.l} className="hud-card p-4">
              <div className="text-[10px] mono text-muted-foreground tracking-wider">{s.l}</div>
              <div className="mono text-2xl mt-1" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}