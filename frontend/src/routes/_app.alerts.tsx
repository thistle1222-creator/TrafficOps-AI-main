import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { severityColor, severityGlowClass, UNITS } from "@/lib/mock-data";
import { WhyScore } from "@/components/WhyScore";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({ meta: [{ title: "Alerts — TrafficOps AI" }] }),
  component: AlertsPage,
});

const STATUS_STEPS = ["Unassigned", "Dispatched", "On Scene", "Resolved"] as const;

function AlertsPage() {
  const { state, acknowledgeEvent, assignUnit, setStatus } = useStore();
  const [filter, setFilter] = useState<"All" | "Critical" | "High" | "Medium">("All");

  const list = state.events.filter((e) => filter === "All" ? e.severity !== "Normal" : e.severity === filter);
  const counts = {
    Critical: state.events.filter((e) => e.severity === "Critical").length,
    High: state.events.filter((e) => e.severity === "High").length,
    Medium: state.events.filter((e) => e.severity === "Medium").length,
    Resolved: state.events.filter((e) => e.status === "Resolved").length,
  };

  return (
    <>
      <PageHeader title="Alerts Management" subtitle="LIVE QUEUE · ASSIGNMENT WORKFLOW · AUTO-REFRESH 5s" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="hud-card p-3">
            <div className="text-[10px] mono text-muted-foreground tracking-wider">{k.toUpperCase()}</div>
            <div className="mono text-2xl" style={{ color: k === "Resolved" ? "var(--success)" : severityColor(k) }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {(["All", "Critical", "High", "Medium"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`mono text-xs px-3 py-1.5 rounded border ${filter === f ? "border-primary" : "border-border"}`} style={filter === f ? { color: "var(--primary)" } : undefined}>{f.toUpperCase()}</button>
        ))}
        <div className="flex-1" />
        <div className="text-[10px] mono text-muted-foreground self-center">● AUTO-REFRESH ACTIVE</div>
      </div>

      {list.length === 0 ? (
        <div className="hud-card p-10 text-center text-sm text-muted-foreground">AI Agent is monitoring traffic activity. <span className="pulse-dot inline-block w-2 h-2 rounded-full ml-2" style={{ background: "var(--success)" }} /></div>
      ) : (
        <div className="space-y-3">
          {list.map((ev) => {
            const isFresh = Date.now() - ev.ts < 10000 && ev.type === "Unplanned";
            const stepIdx = STATUS_STEPS.indexOf(ev.status);
            return (
              <div key={ev.id} className={`hud-card p-4 fade-up ${isFresh ? "glow-signature" : severityGlowClass(ev.severity)}`} style={{ borderLeftWidth: 3, borderLeftColor: isFresh ? "var(--signature)" : severityColor(ev.severity) }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center gap-3">
                      <span className="mono text-[10px] tracking-wider" style={{ color: isFresh ? "var(--signature)" : severityColor(ev.severity) }}>
                        {isFresh ? "🔴 LIVE EVENT" : ev.severity.toUpperCase()}
                      </span>
                      <span className="mono text-[10px] text-muted-foreground">{ev.id}</span>
                      <span className="mono text-[10px] text-muted-foreground">{new Date(ev.ts).toLocaleString()}</span>
                    </div>
                    <div className="text-base mt-1">{ev.cause} — {ev.zone}</div>
                    <div className="text-xs text-muted-foreground mono">{ev.junction} · {ev.direction} · {ev.durationMin}min{ev.requiresClosure ? " · closure" : ""}</div>
                    <div className="text-xs mt-2">{ev.recommendation}</div>
                    <WhyScore label="Why this alert?" factors={ev.factors} />
                  </div>
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <select
                      value={ev.assignedUnit ?? ""}
                      onChange={(e) => assignUnit(ev.id, e.target.value)}
                      className="bg-black/40 border border-border rounded px-2 py-1.5 mono text-xs"
                    >
                      <option value="">— Assign Unit —</option>
                      {UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                    {/* status stepper */}
                    <div className="flex items-center gap-1">
                      {STATUS_STEPS.map((s, i) => (
                        <button key={s} onClick={() => setStatus(ev.id, s)} className="flex-1 text-[9px] mono py-1 rounded border"
                          style={{ borderColor: i <= stepIdx ? severityColor(ev.severity) : "var(--border)", color: i <= stepIdx ? severityColor(ev.severity) : "var(--muted-foreground)" }}>
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {!ev.acknowledged && (
                      <button onClick={() => acknowledgeEvent(ev.id)} className="py-1.5 rounded mono text-xs" style={{ background: "var(--primary)", color: "white" }}>
                        ACKNOWLEDGE
                      </button>
                    )}
                    {ev.acknowledged && <div className="text-[10px] mono text-center" style={{ color: "var(--success)" }}>✓ ACKNOWLEDGED</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}