import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { useStore, hasRole } from "@/lib/store";
import { Restricted } from "@/components/Restricted";
import { severityColor, ZONES, CAUSES } from "@/lib/mock-data";
import { WhyScore } from "@/components/WhyScore";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, X } from "lucide-react";

export const Route = createFileRoute("/_app/incident-records")({
  head: () => ({ meta: [{ title: "Incident Records — TrafficOps AI" }] }),
  component: IncidentRecords,
});

function IncidentRecords() {
  const { state } = useStore();
  const [zoneF, setZoneF] = useState("All");
  const [causeF, setCauseF] = useState("All");
  const [sevF, setSevF] = useState("All");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<string | null>(null);

  if (!hasRole(state.user, "Zone Commander")) return <Restricted requires="Zone Commander" />;

  const filtered = useMemo(() => state.events.filter((e) =>
    (zoneF === "All" || e.zone === zoneF) &&
    (causeF === "All" || e.cause === causeF) &&
    (sevF === "All" || e.severity === sevF) &&
    (q === "" || e.junction.toLowerCase().includes(q.toLowerCase()))
  ), [state.events, zoneF, causeF, sevF, q]);

  const planned = state.events.filter((e) => e.type === "Planned").length;
  const unplanned = state.events.length - planned;

  const causeCounts = CAUSES.map((c) => ({ name: c.name, n: state.events.filter((e) => e.cause === c.name).length })).sort((a, b) => b.n - a.n).slice(0, 5);
  const trend = state.events.slice(0, 20).reverse().map((e, i) => ({ i, score: e.score }));

  function exportCsv() {
    const headers = ["id", "ts", "zone", "junction", "cause", "type", "duration", "closure", "score", "severity", "status"];
    const rows = filtered.map((e) => [e.id, new Date(e.ts).toISOString(), e.zone, e.junction, e.cause, e.type, e.durationMin, e.requiresClosure, e.score, e.severity, e.status].join(","));
    const csv = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `incidents-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const detail = drawer ? state.events.find((e) => e.id === drawer) : null;

  return (
    <>
      <PageHeader title="Incident Records" subtitle="PERMANENT DISRUPTION LOG · RETENTION 90 DAYS"
        right={<button onClick={exportCsv} className="mono text-xs px-3 py-2 border border-border hover:border-primary rounded inline-flex items-center gap-2"><Download className="h-3 w-3" /> EXPORT CSV</button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="hud-card p-4">
          <div className="text-[10px] mono text-muted-foreground tracking-wider">TOTAL RECORDED</div>
          <div className="mono text-3xl mt-1">{state.events.length}</div>
        </div>
        <div className="hud-card p-4">
          <div className="text-[10px] mono text-muted-foreground tracking-wider">PLANNED vs UNPLANNED</div>
          <div style={{ height: 70 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: "Planned", value: planned }, { name: "Unplanned", value: unplanned }]} dataKey="value" innerRadius={20} outerRadius={32}>
                  <Cell fill="var(--accent-cyan)" /><Cell fill="var(--critical)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] mono text-muted-foreground">{planned} planned · {unplanned} unplanned</div>
        </div>
        <div className="hud-card p-4">
          <div className="text-[10px] mono text-muted-foreground tracking-wider">TOP CAUSES</div>
          <div style={{ height: 80 }}>
            <ResponsiveContainer>
              <BarChart data={causeCounts}>
                <Bar dataKey="n" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                <Tooltip contentStyle={{ background: "#15151A", border: "1px solid #232328", fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="hud-card p-4">
          <div className="text-[10px] mono text-muted-foreground tracking-wider">AVG RISK TREND</div>
          <div style={{ height: 80 }}>
            <ResponsiveContainer>
              <LineChart data={trend}>
                <Line type="monotone" dataKey="score" stroke="var(--warning)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="hud-card p-4 mb-4 flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search junction..." className="bg-black/40 border border-border rounded px-2 py-1.5 mono text-xs flex-1 min-w-[160px]" />
        <select value={zoneF} onChange={(e) => setZoneF(e.target.value)} className="bg-black/40 border border-border rounded px-2 py-1.5 mono text-xs">
          <option>All</option>{ZONES.map((z) => <option key={z}>{z}</option>)}
        </select>
        <select value={causeF} onChange={(e) => setCauseF(e.target.value)} className="bg-black/40 border border-border rounded px-2 py-1.5 mono text-xs">
          <option>All</option>{CAUSES.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
        <select value={sevF} onChange={(e) => setSevF(e.target.value)} className="bg-black/40 border border-border rounded px-2 py-1.5 mono text-xs">
          <option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Normal</option>
        </select>
      </div>

      <div className="hud-card p-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] mono text-muted-foreground border-b border-border">
              <th className="py-2">TS</th><th>ZONE</th><th>JUNCTION</th><th>CAUSE</th><th>TYPE</th><th>DUR</th><th>CLOSURE</th><th>SCORE</th><th>SEV</th><th>STATUS</th>
            </tr>
          </thead>
          <tbody className="mono">
            {filtered.slice(0, 100).map((e) => (
              <tr key={e.id} onClick={() => setDrawer(e.id)} className="border-b border-border/40 hover:bg-white/5 cursor-pointer">
                <td className="py-2">{new Date(e.ts).toLocaleTimeString()}</td>
                <td>{e.zone}</td><td>{e.junction}</td><td>{e.cause}</td><td>{e.type}</td>
                <td>{e.durationMin}m</td><td>{e.requiresClosure ? "Y" : "N"}</td>
                <td>{e.score}</td>
                <td><span style={{ color: severityColor(e.severity) }}>● {e.severity}</span></td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawer(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md h-full bg-card border-l border-border p-6 overflow-y-auto fade-up">
            <div className="flex justify-between mb-4">
              <h3 className="mono text-sm" style={{ color: severityColor(detail.severity) }}>{detail.id}</h3>
              <button onClick={() => setDrawer(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <Row k="Zone" v={detail.zone} /><Row k="Junction" v={detail.junction} />
              <Row k="Cause" v={detail.cause} /><Row k="Type" v={detail.type} />
              <Row k="Duration" v={`${detail.durationMin}min`} /><Row k="Closure" v={detail.requiresClosure ? "Required" : "No"} />
              <Row k="Direction" v={detail.direction} />
              <Row k="Risk Score" v={String(detail.score)} /><Row k="Severity" v={detail.severity} />
              <Row k="Status" v={detail.status} /><Row k="Unit" v={detail.assignedUnit ?? "—"} />
            </div>
            <div className="mt-4">
              <WhyScore factors={detail.factors} label="Risk computation" />
            </div>
            <div className="mt-4 p-3 rounded border border-border bg-black/30">
              <div className="mono text-[10px] text-muted-foreground tracking-wider mb-1">RECOMMENDATION</div>
              <div className="text-xs">{detail.recommendation}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b border-border/40 py-1"><span className="text-muted-foreground text-xs">{k}</span><span className="mono text-xs">{v}</span></div>;
}