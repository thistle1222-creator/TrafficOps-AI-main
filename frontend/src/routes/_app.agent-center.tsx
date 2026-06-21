import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { Check, Loader } from "lucide-react";

export const Route = createFileRoute("/_app/agent-center")({
  head: () => ({ meta: [{ title: "Agent Center — TrafficOps AI" }] }),
  component: AgentCenter,
});

const STEPS = ["Event Detected", "Weather Checked", "Models Executed", "Risk Generated", "Alert Created", "Recommendation Sent"];

function AgentCenter() {
  const { state } = useStore();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % (STEPS.length + 1)), 4000);
    return () => clearInterval(t);
  }, []);

  const processes = [
    { id: "PRC-A91F", type: "Risk Scoring", status: "Active", duration: "1.2s", conf: 94 },
    { id: "PRC-B0D2", type: "Resource Allocation", status: "Active", duration: "0.8s", conf: 88 },
    { id: "PRC-C7E1", type: "Weather Sync", status: "Queued", duration: "—", conf: 0 },
    { id: "PRC-D31A", type: "Forecast Refresh", status: "Active", duration: "2.4s", conf: 91 },
    { id: "PRC-E55C", type: "Alert Dispatch", status: "Active", duration: "0.3s", conf: 97 },
  ];

  return (
    <>
      <PageHeader title="AI Agent Monitoring Center" subtitle="TRAFFICBERT v3.1 · INFERENCE PIPELINE LIVE" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { l: "EVENTS PROCESSED TODAY", v: "2,847", c: "var(--foreground)" },
          { l: "DECISIONS AUTOMATED", v: state.counters.decisions.toString(), c: "var(--accent-cyan)" },
          { l: "AGENT UPTIME", v: "99.97%", c: "var(--success)" },
        ].map((s, i) => (
          <div key={i} className="hud-card p-4">
            <div className="text-[10px] mono text-muted-foreground tracking-wider">{s.l}</div>
            <div className="mono text-3xl mt-1" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="hud-card p-6 mb-6">
        <h3 className="mono text-xs tracking-wider text-muted-foreground mb-6">AGENT WORKFLOW · LIVE EXECUTION</h3>
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s} className="flex flex-col items-center min-w-[110px]">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${active ? "pulse-dot" : ""}`}
                  style={{
                    borderColor: done ? "var(--success)" : active ? "var(--warning)" : "var(--border)",
                    background: done ? "rgba(0,230,118,0.1)" : active ? "rgba(255,160,0,0.1)" : "transparent",
                  }}
                >
                  {done ? <Check className="h-4 w-4" style={{ color: "var(--success)" }} />
                    : active ? <Loader className="h-4 w-4 animate-spin" style={{ color: "var(--warning)" }} />
                    : <span className="mono text-xs text-muted-foreground">{i + 1}</span>}
                </div>
                <div className="text-[10px] mono mt-2 text-center text-muted-foreground">{s}</div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block h-px w-12 absolute" style={{ background: "var(--border)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="hud-card p-4">
          <h3 className="mono text-xs tracking-wider text-muted-foreground mb-3">ACTIVE AGENT PROCESSES</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] mono text-muted-foreground border-b border-border">
                <th className="py-2">PID</th><th>TYPE</th><th>STATUS</th><th>DURATION</th><th>CONF</th>
              </tr>
            </thead>
            <tbody className="mono">
              {processes.map((p) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-2" style={{ color: "var(--accent-cyan)" }}>{p.id}</td>
                  <td>{p.type}</td>
                  <td><span style={{ color: p.status === "Active" ? "var(--success)" : "var(--warning)" }}>● {p.status}</span></td>
                  <td>{p.duration}</td>
                  <td>{p.conf ? `${p.conf}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hud-card p-4 flex flex-col" style={{ maxHeight: 360 }}>
          <h3 className="mono text-xs tracking-wider text-muted-foreground mb-3">REAL-TIME DECISION LOG</h3>
          <div className="flex-1 overflow-y-auto space-y-1 mono text-[11px]">
            {state.activity.slice(0, 25).map((a) => (
              <div key={a.id} className="flex gap-2 py-1 border-b border-border/40">
                <span className="text-muted-foreground shrink-0">{new Date(a.ts).toLocaleTimeString()}</span>
                <span style={{ color: a.kind === "human" ? "var(--warning)" : "var(--accent-cyan)" }}>{a.type.toUpperCase()}</span>
                <span className="text-foreground/80 truncate">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}