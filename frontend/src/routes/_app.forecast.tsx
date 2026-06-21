import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ZONES, severityColor, severityFromScore } from "@/lib/mock-data";
import { WhyScore } from "@/components/WhyScore";

export const Route = createFileRoute("/_app/forecast")({
  head: () => ({ meta: [{ title: "Forecast — TrafficOps AI" }] }),
  component: Forecast,
});

function Forecast() {
  const [range, setRange] = useState<"2H" | "6H" | "12H" | "24H">("12H");

  const data = useMemo(() => {
    const points = range === "2H" ? 8 : range === "6H" ? 12 : range === "12H" ? 24 : 24;
    const stepMin = range === "2H" ? 15 : range === "6H" ? 30 : 30;
    return Array.from({ length: points }).map((_, i) => {
      const t = new Date(Date.now() + i * stepMin * 60000);
      const base = 45 + Math.sin(i / 3) * 20 + Math.random() * 8;
      return {
        t: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
        risk: Math.max(10, Math.min(95, Math.round(base + (i > points / 2 ? 15 : 0)))),
      };
    });
  }, [range]);

  const zoneForecast = ZONES.slice(0, 10).map((z) => {
    const score = 30 + Math.floor(Math.random() * 65);
    const last = score - 5 - Math.floor(Math.random() * 10);
    return { z, score, sev: severityFromScore(score), delta: score - last };
  });

  return (
    <>
      <PageHeader title="Traffic Forecast" subtitle="PREDICTIVE RISK MODELING · TRAFFICBERT v3.1"
        right={
          <div className="flex border border-border rounded overflow-hidden mono text-xs">
            {(["2H", "6H", "12H", "24H"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 ${range === r ? "bg-primary/15" : ""}`} style={range === r ? { color: "var(--primary)" } : undefined}>{r}</button>
            ))}
          </div>
        }
      />

      <div className="hud-card p-4 mb-4">
        <h3 className="mono text-xs text-muted-foreground tracking-wider mb-3">CITY-WIDE RISK PROJECTION</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF3D3D" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#FF3D3D" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#232328" strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke="#8A8A93" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
              <YAxis stroke="#8A8A93" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#15151A", border: "1px solid #232328", fontFamily: "JetBrains Mono", fontSize: 11 }} />
              <ReferenceLine y={70} stroke="#FFA000" strokeDasharray="6 4" label={{ value: "HIGH RISK THRESHOLD", fill: "#FFA000", fontSize: 10, fontFamily: "JetBrains Mono" }} />
              <Area type="monotone" dataKey="risk" stroke="#FF3D3D" fill="url(#riskGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="hud-card p-4 lg:col-span-2">
          <h3 className="mono text-xs text-muted-foreground tracking-wider mb-3">ZONE-BY-ZONE FORECAST</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] mono text-muted-foreground border-b border-border">
                <th className="py-2">ZONE</th><th>RISK</th><th>SEVERITY</th><th>vs LAST HR</th><th>WHY</th>
              </tr>
            </thead>
            <tbody className="mono">
              {zoneForecast.map((z) => (
                <tr key={z.z} className="border-b border-border/40">
                  <td className="py-2">{z.z}</td>
                  <td>{z.score}</td>
                  <td><span style={{ color: severityColor(z.sev) }}>● {z.sev}</span></td>
                  <td style={{ color: z.delta > 0 ? "var(--critical)" : "var(--success)" }}>{z.delta > 0 ? "▲" : "▼"} {Math.abs(z.delta)}</td>
                  <td>
                    <WhyScore label="explain" factors={[
                      { label: "Historic base", value: 30 },
                      { label: "Peak hour", value: 15 },
                      { label: "Weather", value: z.delta },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hud-card p-4">
          <h3 className="mono text-xs text-muted-foreground tracking-wider mb-3">WEATHER IMPACT</h3>
          <div className="text-sm mb-2">Clear · 26°C · NE 8km/h</div>
          <div className="text-xs text-muted-foreground">No precipitation expected through next 12h. Visibility unrestricted.</div>
          <div className="mt-4 p-3 rounded border border-border bg-black/30">
            <div className="mono text-[10px] text-muted-foreground tracking-wider mb-1">AGENT RECOMMENDATION</div>
            <div className="text-xs">Pre-position 4 patrol units at Silk Board and Hebbal between 17:30–20:00 IST.</div>
          </div>
        </div>
      </div>

      <div className="hud-card p-4">
        <h3 className="mono text-xs text-muted-foreground tracking-wider mb-3">PREDICTED EVENTS — NEXT 24H</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between border-b border-border/40 pb-2"><span>RCB Match · Chinnaswamy Stadium</span><span className="mono text-xs" style={{ color: "var(--warning)" }}>19:30 · HIGH</span></li>
          <li className="flex justify-between border-b border-border/40 pb-2"><span>Metro Construction Closure · MG Road</span><span className="mono text-xs" style={{ color: "var(--accent-cyan)" }}>23:00 · MED</span></li>
          <li className="flex justify-between"><span>VIP Movement · Vidhana Soudha → Airport</span><span className="mono text-xs" style={{ color: "var(--critical)" }}>09:00 · CRITICAL</span></li>
        </ul>
      </div>
    </>
  );
}