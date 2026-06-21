import { ZONES, ZONE_COORDS, severityColor, type Zone } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { useState } from "react";

export function HeatmapSvg({ height = 560 }: { height?: number }) {
  const { state } = useStore();
  const [hover, setHover] = useState<Zone | null>(null);

  const zoneSeverity: Record<Zone, { sev: string; count: number; density: number }> = {} as never;
  for (const z of ZONES) zoneSeverity[z] = { sev: "Normal", count: 0, density: 30 + Math.floor(Math.random() * 30) };
  for (const ev of state.events.slice(0, 60)) {
    const s = zoneSeverity[ev.zone];
    s.count += 1;
    const rank = ["Normal", "Medium", "High", "Critical"];
    if (rank.indexOf(ev.severity) > rank.indexOf(s.sev)) {
      s.sev = ev.severity;
      s.density = Math.min(99, 50 + ev.score / 2);
    }
  }

  // Connection lines: a few strategic pairs
  const links: [Zone, Zone][] = [
    ["Silk Board", "Koramangala"], ["Koramangala", "MG Road"], ["MG Road", "Indiranagar"],
    ["Indiranagar", "KR Puram"], ["KR Puram", "Whitefield"], ["Whitefield", "Marathahalli"],
    ["Marathahalli", "Silk Board"], ["Hebbal", "Yelahanka"], ["Hebbal", "Yeshwantpur"],
    ["Yeshwantpur", "Peenya"], ["Peenya", "Rajajinagar"], ["Rajajinagar", "MG Road"],
    ["Banashankari", "Jayanagar"], ["Jayanagar", "Silk Board"], ["Silk Board", "Electronic City"],
  ];

  return (
    <div className="relative w-full hud-card overflow-hidden" style={{ height }}>
      <div className="radar-sweep" />
      <svg viewBox="0 0 900 720" className="w-full h-full relative z-10">
        {/* Grid */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`gv${i}`} x1={i * 75} y1={0} x2={i * 75} y2={720} stroke="rgba(255,255,255,0.03)" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`gh${i}`} x1={0} y1={i * 72} x2={900} y2={i * 72} stroke="rgba(255,255,255,0.03)" />
        ))}
        {/* Connection lines */}
        {links.map(([a, b], i) => {
          const A = ZONE_COORDS[a], B = ZONE_COORDS[b];
          return (
            <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="rgba(0,212,255,0.25)" strokeWidth={1} className="dash-flow" />
          );
        })}
        {/* Shockwave */}
        {state.recentShockwave && (
          <circle
            cx={ZONE_COORDS[state.recentShockwave.zone].x}
            cy={ZONE_COORDS[state.recentShockwave.zone].y}
            r={8}
            fill="none"
            stroke="var(--signature)"
            strokeWidth={2}
            className="shockwave"
          />
        )}
        {/* Zones */}
        {ZONES.map((z) => {
          const c = ZONE_COORDS[z];
          const s = zoneSeverity[z];
          const col = severityColor(s.sev);
          return (
            <g key={z} onMouseEnter={() => setHover(z)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <circle cx={c.x} cy={c.y} r={s.sev === "Critical" || s.sev === "High" ? 14 : 10} fill={col} fillOpacity={0.18} stroke={col} strokeWidth={1.5}>
                {(s.sev === "Critical" || s.sev === "High") && (
                  <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx={c.x} cy={c.y} r={3} fill={col} />
              <text x={c.x + 12} y={c.y + 4} fill="#F5F5F5" fontSize="10" fontFamily="JetBrains Mono, monospace">{z}</text>
            </g>
          );
        })}
        {hover && (() => {
          const c = ZONE_COORDS[hover];
          const s = zoneSeverity[hover];
          return (
            <g>
              <rect x={c.x + 16} y={c.y + 12} width={180} height={72} fill="#15151A" stroke="var(--border)" rx={4} />
              <text x={c.x + 24} y={c.y + 30} fill="#F5F5F5" fontSize="11" fontFamily="Inter">{hover}</text>
              <text x={c.x + 24} y={c.y + 46} fill="#8A8A93" fontSize="9" fontFamily="JetBrains Mono">Density: {s.density}%</text>
              <text x={c.x + 24} y={c.y + 60} fill={severityColor(s.sev)} fontSize="9" fontFamily="JetBrains Mono">Risk: {s.sev}</text>
              <text x={c.x + 24} y={c.y + 74} fill="#8A8A93" fontSize="9" fontFamily="JetBrains Mono">Active: {s.count}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}