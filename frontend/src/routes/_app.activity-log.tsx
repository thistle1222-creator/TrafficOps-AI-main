import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { Radio, User } from "lucide-react";

export const Route = createFileRoute("/_app/activity-log")({
  head: () => ({ meta: [{ title: "Activity Log — TrafficOps AI" }] }),
  component: ActivityLog,
});

const FILTERS = ["All", "Alerts", "Detections", "Recommendations", "System", "Human Actions"] as const;

function ActivityLog() {
  const { state } = useStore();
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [q, setQ] = useState("");

  const map: Record<typeof FILTERS[number], (k: typeof state.activity[number]) => boolean> = {
    All: () => true,
    Alerts: (a) => a.type === "Alert",
    Detections: (a) => a.type === "Detection",
    Recommendations: (a) => a.type === "Recommendation",
    System: (a) => a.type === "System",
    "Human Actions": (a) => a.kind === "human",
  };

  const list = state.activity.filter(map[filter]).filter((a) => q === "" || a.message.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Activity Log" subtitle="● STREAMING LIVE · SYSTEM + HUMAN AUDIT TRAIL" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { l: "TOTAL DECISIONS TODAY", v: state.counters.decisions },
          { l: "ACCURACY RATE", v: "94.2%", c: "var(--success)" },
          { l: "AVG RESPONSE TIME", v: "1.4s", c: "var(--accent-cyan)" },
          { l: "ALERTS PREVENTED", v: 87, c: "var(--warning)" },
        ].map((s) => (
          <div key={s.l} className="hud-card p-3">
            <div className="text-[10px] mono text-muted-foreground tracking-wider">{s.l}</div>
            <div className="mono text-2xl" style={{ color: s.c as string }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="hud-card p-4 mb-4 flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search log..." className="flex-1 min-w-[200px] bg-black/40 border border-border rounded px-2 py-1.5 mono text-xs" />
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`mono text-[10px] px-2 py-1 rounded border ${filter === f ? "border-primary" : "border-border"}`} style={filter === f ? { color: "var(--primary)" } : undefined}>{f.toUpperCase()}</button>
        ))}
      </div>

      <div className="hud-card p-2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] mono text-muted-foreground border-b border-border">
              <th className="py-2 px-2">TIME</th><th>TYPE</th><th>LOCATION</th><th>EVENT</th><th>CONF</th><th>ACTOR</th>
            </tr>
          </thead>
          <tbody className="mono">
            {list.map((a) => (
              <tr key={a.id} className="border-b border-border/40 hover:bg-white/5">
                <td className="py-2 px-2 text-muted-foreground">{new Date(a.ts).toLocaleTimeString()}</td>
                <td>
                  <span className="inline-flex items-center gap-1">
                    {a.kind === "human" ? <User className="h-3 w-3" style={{ color: "var(--warning)" }} /> : <Radio className="h-3 w-3" style={{ color: "var(--accent-cyan)" }} />}
                    {a.type}
                  </span>
                </td>
                <td>{a.location ?? "—"}</td>
                <td className="text-foreground/80">{a.message}</td>
                <td>{a.confidence ? `${a.confidence}%` : "—"}</td>
                <td>{a.actor ?? "—"}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">AI Agent is monitoring traffic activity.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}