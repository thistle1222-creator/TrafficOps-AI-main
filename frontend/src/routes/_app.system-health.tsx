import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { useStore, hasRole } from "@/lib/store";
import { Restricted } from "@/components/Restricted";

export const Route = createFileRoute("/_app/system-health")({
  head: () => ({ meta: [{ title: "System Health — TrafficOps AI" }] }),
  component: SystemHealth,
});

function SystemHealth() {
  const { state } = useStore();
  const [diagLines, setDiagLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  if (!hasRole(state.user, "Zone Commander")) return <Restricted requires="Zone Commander" />;

  function runDiag() {
    setRunning(true); setDiagLines([]);
    const lines = ["Pinging signal network...", "Verifying model checksum...", "Testing data pipelines...", "Sampling CCTV feeds...", state.degraded ? "⚠ Anomaly: cached data on Traffic Signal Network" : "All systems nominal."];
    let i = 0;
    const t = setInterval(() => {
      setDiagLines((arr) => [...arr, lines[i]]);
      i++;
      if (i >= lines.length) { clearInterval(t); setRunning(false); }
    }, 500);
  }

  const sources = [
    { name: "Traffic Signal Network", detail: "142/150 signals reporting", status: state.degraded ? "amber" : "green" },
    { name: "Weather API", detail: "BMRDA feed · 15s polling", status: "green" },
    { name: "CCTV Feed Network", detail: "142/150 cameras online", status: "amber" },
    { name: "GPS Unit Tracking", detail: "127 units active", status: "green" },
    { name: "Historical Database", detail: "PostgreSQL · 4.2TB", status: "green" },
  ];

  return (
    <>
      <PageHeader title="System Health & Data Sources" subtitle="MODEL · INFRASTRUCTURE · TELEMETRY" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {[
          { l: "MODEL VERSION", v: "TrafficBERT v3.1" },
          { l: "LAST TRAINING", v: "2026-06-14" },
          { l: "UPTIME", v: "99.97%", c: "var(--success)" },
          { l: "AVG INFERENCE LATENCY", v: "1.2s", c: "var(--accent-cyan)" },
        ].map((s) => (
          <div key={s.l} className="hud-card p-4">
            <div className="text-[10px] mono text-muted-foreground tracking-wider">{s.l}</div>
            <div className="mono text-2xl mt-1" style={{ color: s.c as string }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="hud-card p-4 mb-4">
        <h3 className="mono text-xs text-muted-foreground tracking-wider mb-3">DATA SOURCES</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sources.map((s) => (
            <div key={s.name} className="p-3 rounded border bg-black/30" style={{ borderColor: s.status === "green" ? "var(--success)" : s.status === "amber" ? "var(--warning)" : "var(--critical)" }}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full pulse-dot" style={{ background: s.status === "green" ? "var(--success)" : s.status === "amber" ? "var(--warning)" : "var(--critical)" }} />
                <span className="text-sm">{s.name}</span>
              </div>
              <div className="text-[11px] mono text-muted-foreground mt-1">{s.detail}</div>
              {s.status === "amber" && <div className="text-[10px] mono mt-1" style={{ color: "var(--warning)" }}>Last sync: 90s ago — using cached data</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="hud-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="mono text-xs text-muted-foreground tracking-wider">DIAGNOSTICS</h3>
          <button onClick={runDiag} disabled={running} className="mono text-xs px-3 py-1.5 rounded border border-border hover:border-primary disabled:opacity-50">
            {running ? "RUNNING..." : "RUN DIAGNOSTICS"}
          </button>
        </div>
        <div className="bg-black/60 p-3 rounded border border-border min-h-[140px] mono text-xs space-y-1">
          {diagLines.length === 0 && <div className="text-muted-foreground">$ awaiting command...</div>}
          {diagLines.map((l, i) => <div key={i} style={{ color: l.includes("⚠") ? "var(--warning)" : "var(--success)" }}>$ {l}</div>)}
        </div>
      </div>
    </>
  );
}