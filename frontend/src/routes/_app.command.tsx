import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { useStore, hasRole } from "@/lib/store";
import { severityColor, severityGlowClass, generateEvent, ZONES, CAUSES } from "@/lib/mock-data";
import { WhyScore } from "@/components/WhyScore";
import { HeatmapSvg } from "@/components/HeatmapSvg";
import { Activity, AlertTriangle, ShieldAlert, TrendingDown, X } from "lucide-react";

export const Route = createFileRoute("/_app/command")({
  head: () => ({ meta: [{ title: "Command — TrafficOps AI" }] }),
  component: CommandPage,
});

function CountUp({ to, color }: { to: number; color?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(to * (0.5 - Math.cos(Math.PI * p) / 2)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <span className="mono text-2xl" style={{ color }}>{n.toLocaleString()}</span>;
}

function CommandPage() {
  const { state, injectEvent, acknowledgeEvent } = useStore();
  const [showSim, setShowSim] = useState(false);
  const isAdmin = hasRole(state.user, "Control Room Admin");

  const activeAlerts = state.events.filter((e) => !e.acknowledged && e.severity !== "Normal");
  const critical = state.events.filter((e) => e.severity === "Critical").length;

  const kpis = [
    { label: "Total Incidents (24H)", value: state.events.length + 142, delta: "▲ 8% vs last Friday", color: "var(--accent-cyan)" },
    { label: "Active Alerts", value: activeAlerts.length, delta: "▼ 4% vs last Friday", color: "var(--warning)" },
    { label: "Critical Zones", value: critical, delta: "▲ 1 since 09:00", color: "var(--critical)" },
    { label: "Avg Resolution Time", value: "14m", delta: "▼ 23% vs last Friday", color: "var(--success)" },
  ];

  return (
    <>
      <PageHeader
        title={<>TrafficOps <span style={{ color: "var(--primary)" }}>AI</span></>}
        subtitle={<>● LIVE · BENGALURU · SECTOR 360°</>}
        right={isAdmin && (
          <button
            onClick={() => setShowSim(true)}
            className="mono text-xs px-3 py-2 border border-dashed border-border hover:border-primary rounded transition-colors"
            style={{ color: "var(--accent-cyan)" }}
          >
            &gt; trigger_event() — Simulate Live Disruption
          </button>
        )}
      />

      <p className="text-sm text-muted-foreground -mt-3 mb-6">Autonomous Traffic Intelligence Platform</p>

      {/* Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Events Detected", v: state.counters.detected, c: "var(--foreground)" },
          { l: "Active Alerts", v: activeAlerts.length, c: "var(--warning)" },
          { l: "Critical Incidents", v: critical, c: "var(--critical)" },
          { l: "Predictions Generated", v: state.counters.predictions, c: "var(--accent-cyan)" },
        ].map((s, i) => (
          <div key={s.l} className="hud-card p-4 fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="text-[10px] mono text-muted-foreground tracking-wider">{s.l.toUpperCase()}</div>
            <div className="mt-1"><CountUp to={typeof s.v === "number" ? s.v : 0} color={s.c} /></div>
          </div>
        ))}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <div key={k.label} className="hud-card p-4 fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] mono text-muted-foreground tracking-wider">{k.label.toUpperCase()}</span>
              {i === 0 ? <Activity className="h-3 w-3 text-muted-foreground" /> :
               i === 1 ? <AlertTriangle className="h-3 w-3" style={{ color: "var(--warning)" }} /> :
               i === 2 ? <ShieldAlert className="h-3 w-3" style={{ color: "var(--critical)" }} /> :
               <TrendingDown className="h-3 w-3" style={{ color: "var(--success)" }} />}
            </div>
            <div className="mono text-3xl" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[10px] mono text-muted-foreground mt-1">{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <HeatmapSvg height={480} />
        </div>
        <div className="hud-card p-4 flex flex-col" style={{ maxHeight: 480 }}>
          <h3 className="mono text-xs tracking-wider text-muted-foreground mb-3">LIVE ALERT FEED</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {state.events.slice(0, 12).map((ev) => {
              const isFresh = Date.now() - ev.ts < 10000 && ev.type === "Unplanned";
              return (
                <div
                  key={ev.id}
                  className={`p-3 rounded border bg-black/30 fade-up ${isFresh ? "glow-signature" : severityGlowClass(ev.severity)}`}
                  style={{ borderLeftWidth: 3, borderLeftColor: isFresh ? "var(--signature)" : severityColor(ev.severity) }}
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-[10px]" style={{ color: isFresh ? "var(--signature)" : severityColor(ev.severity) }}>
                      {isFresh ? "🔴 LIVE EVENT" : ev.severity.toUpperCase()} · {ev.id}
                    </span>
                    <span className="mono text-[10px] text-muted-foreground">{new Date(ev.ts).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm mt-1">{ev.cause} — {ev.zone}</div>
                  <div className="text-xs text-muted-foreground mono">{ev.junction} · score {ev.score}</div>
                  <WhyScore factors={ev.factors} />
                  {!ev.acknowledged && (
                    <button
                      onClick={() => acknowledgeEvent(ev.id)}
                      className="mt-2 text-[10px] mono px-2 py-1 border border-border rounded hover:border-primary"
                    >
                      ACKNOWLEDGE
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hud-card p-4 fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] mono text-muted-foreground tracking-wider">AGENT DECISIONS TODAY</div>
            <div className="mono text-3xl mt-1" style={{ color: "var(--accent-cyan)" }}>{state.counters.decisions}</div>
          </div>
          <div className="text-xs text-muted-foreground max-w-md text-right">
            Autonomous routing, alert prioritization, resource allocation — TrafficBERT v3.1 inference layer.
          </div>
        </div>
      </div>

      {showSim && <SimModal onClose={() => setShowSim(false)} onFire={(o) => { injectEvent("manual", o); setShowSim(false); }} />}
    </>
  );
}

function SimModal({ onClose, onFire }: { onClose: () => void; onFire: (o: Parameters<typeof generateEvent>[1]) => void }) {
  const [cause, setCause] = useState<string>(CAUSES[0].name);
  const [zone, setZone] = useState<string>(ZONES[0]);
  const [sev, setSev] = useState<"auto" | "Critical" | "High" | "Medium">("auto");

  function fire(rand: boolean) {
    if (rand) return onFire(undefined as never);
    const overrides: Record<string, unknown> = { cause, zone };
    if (sev === "Critical") { overrides.durationMin = 180; overrides.requiresClosure = true; }
    if (sev === "High") { overrides.durationMin = 120; overrides.requiresClosure = true; }
    if (sev === "Medium") { overrides.durationMin = 60; overrides.requiresClosure = false; }
    onFire(overrides as never);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="hud-card glow-critical w-full max-w-md p-6 fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="mono text-sm" style={{ color: "var(--primary)" }}>&gt; trigger_event()</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] mono text-muted-foreground">CAUSE</label>
            <select value={cause} onChange={(e) => setCause(e.target.value)} className="w-full bg-black/50 border border-border rounded px-2 py-1.5 mono text-xs">
              {CAUSES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] mono text-muted-foreground">ZONE</label>
            <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full bg-black/50 border border-border rounded px-2 py-1.5 mono text-xs">
              {ZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] mono text-muted-foreground">SEVERITY</label>
            <div className="grid grid-cols-4 gap-1 p-1 border border-border rounded">
              {["auto", "Medium", "High", "Critical"].map((s) => (
                <button key={s} onClick={() => setSev(s as never)} className={`text-[10px] mono py-1.5 rounded ${sev === s ? "bg-primary/15" : ""}`}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => fire(false)} className="flex-1 py-2 mono text-xs rounded" style={{ background: "var(--primary)", color: "white" }}>FIRE</button>
            <button onClick={() => fire(true)} className="flex-1 py-2 mono text-xs rounded border border-border hover:border-accent">RANDOMIZE</button>
          </div>
        </div>
      </div>
    </div>
  );
}