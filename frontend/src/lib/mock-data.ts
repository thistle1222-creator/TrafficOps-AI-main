export const ZONES = [
  "Silk Board", "KR Puram", "Indiranagar", "Marathahalli", "Hebbal",
  "MG Road", "Yeshwantpur", "Yelahanka", "Peenya", "Banashankari",
  "Rajajinagar", "Koramangala", "Jayanagar", "Electronic City", "Whitefield",
] as const;
export type Zone = (typeof ZONES)[number];

export const ZONE_COORDS: Record<Zone, { x: number; y: number }> = {
  "Silk Board": { x: 520, y: 540 },
  "KR Puram": { x: 680, y: 320 },
  "Indiranagar": { x: 560, y: 360 },
  "Marathahalli": { x: 680, y: 400 },
  "Hebbal": { x: 460, y: 180 },
  "MG Road": { x: 480, y: 340 },
  "Yeshwantpur": { x: 340, y: 260 },
  "Yelahanka": { x: 440, y: 80 },
  "Peenya": { x: 260, y: 200 },
  "Banashankari": { x: 360, y: 540 },
  "Rajajinagar": { x: 320, y: 320 },
  "Koramangala": { x: 500, y: 440 },
  "Jayanagar": { x: 420, y: 480 },
  "Electronic City": { x: 580, y: 640 },
  "Whitefield": { x: 760, y: 380 },
};

export const CAUSES = [
  { name: "Accident", base: 45 },
  { name: "Fire Department Response", base: 50 },
  { name: "VIP Movement", base: 35 },
  { name: "Protest", base: 40 },
  { name: "Waterlogging", base: 30 },
  { name: "Signal Failure", base: 25 },
  { name: "Tree Fall", base: 28 },
  { name: "Vehicle Breakdown", base: 15 },
  { name: "Public Gathering", base: 20 },
  { name: "Stray Animal Crossing", base: 10 },
  { name: "Road Repair", base: 20 },
  { name: "Political Rally", base: 42 },
] as const;
export type CauseName = (typeof CAUSES)[number]["name"];

export const JUNCTIONS: Record<Zone, string[]> = {
  "Silk Board": ["Silk Board Junction", "Madiwala Signal", "BTM Layout"],
  "KR Puram": ["KR Puram Bridge", "Tin Factory", "Hoodi Junction"],
  "Indiranagar": ["100ft Road", "CMH Road", "Old Madras Road"],
  "Marathahalli": ["Marathahalli Bridge", "Outer Ring Road", "Kundalahalli Gate"],
  "Hebbal": ["Hebbal Flyover", "Esteem Mall Jn", "Mekhri Circle"],
  "MG Road": ["Trinity Circle", "Brigade Road Jn", "Anil Kumble Circle"],
  "Yeshwantpur": ["Yeshwantpur Circle", "Goraguntepalya", "Mathikere"],
  "Yelahanka": ["Yelahanka Gate", "Air Force Jn", "Doddaballapur Road"],
  "Peenya": ["Peenya Junction", "8th Mile", "Jalahalli Cross"],
  "Banashankari": ["Banashankari Bus Stand", "Devegowda Petrol Pump", "BSK 3rd Stage"],
  "Rajajinagar": ["Navrang Circle", "Industrial Town", "ESI"],
  "Koramangala": ["Sony World Jn", "Forum Mall", "80ft Road"],
  "Jayanagar": ["Jayanagar 4th Block", "South End Circle", "Ashoka Pillar"],
  "Electronic City": ["E-City Toll", "Hosur Road", "Bommanahalli"],
  "Whitefield": ["ITPL Main Gate", "Hope Farm Jn", "Varthur Kodi"],
};

export const UNITS = [
  "Unit 14 — Silk Board Patrol",
  "Unit 22 — KR Puram Bike Squad",
  "Unit 09 — Indiranagar Mobile",
  "Unit 31 — Hebbal Highway",
  "Unit 47 — Whitefield Patrol",
  "Unit 18 — MG Road Foot Patrol",
  "Unit 26 — E-City Response",
  "Unit 12 — Central Reserve",
];

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function severityFromScore(score: number): "Normal" | "Medium" | "High" | "Critical" {
  if (score >= 86) return "Critical";
  if (score >= 66) return "High";
  if (score >= 41) return "Medium";
  return "Normal";
}

export function severityColor(sev: string): string {
  switch (sev) {
    case "Critical": return "var(--critical)";
    case "High": return "var(--warning)";
    case "Medium": return "var(--accent-cyan)";
    default: return "var(--success)";
  }
}

export function severityGlowClass(sev: string): string {
  switch (sev) {
    case "Critical": return "glow-critical";
    case "High": return "glow-warning";
    case "Medium": return "glow-cyan";
    default: return "glow-success";
  }
}

export interface RiskFactor {
  label: string;
  value: number;
}

export interface DisruptionEvent {
  id: string;
  ts: number;
  type: "Planned" | "Unplanned";
  cause: CauseName;
  zone: Zone;
  junction: string;
  direction: "Inbound" | "Outbound" | "Both";
  durationMin: number;
  requiresClosure: boolean;
  hour: number;
  isWeekend: boolean;
  score: number;
  severity: "Normal" | "Medium" | "High" | "Critical";
  factors: RiskFactor[];
  recommendation: string;
  status: "Unassigned" | "Dispatched" | "On Scene" | "Resolved";
  assignedUnit?: string;
  acknowledged?: boolean;
  source: "auto" | "manual";
}

export function computeRisk(opts: {
  cause: CauseName;
  durationMin: number;
  requiresClosure: boolean;
  hour: number;
  isWeekend: boolean;
}): { score: number; factors: RiskFactor[] } {
  const base = CAUSES.find((c) => c.name === opts.cause)!.base;
  const dur = +((opts.durationMin / 60) * 8).toFixed(1);
  const closure = opts.requiresClosure ? 25 : 0;
  const peak = [8, 9, 10, 17, 18, 19, 20].includes(opts.hour) ? 15 : 0;
  const weekend = opts.isWeekend ? -10 : 0;
  const score = Math.max(0, Math.min(100, base + dur + closure + peak + weekend));
  const factors: RiskFactor[] = [
    { label: `Cause: ${opts.cause}`, value: base },
    { label: `Duration: ${opts.durationMin}min`, value: dur },
  ];
  if (closure) factors.push({ label: "Road closure required", value: closure });
  if (peak) factors.push({ label: `Peak hour: ${String(opts.hour).padStart(2, "0")}:00`, value: peak });
  if (weekend) factors.push({ label: "Weekend adjustment", value: weekend });
  return { score: +score.toFixed(0), factors };
}

export function recommendationFor(cause: CauseName, severity: string): string {
  if (severity === "Critical") return `Immediate dispatch: 3+ units, divert traffic, alert hospitals for ${cause}.`;
  if (severity === "High") return `Dispatch 2 units, prepare diversion plan for ${cause}.`;
  if (severity === "Medium") return `Dispatch 1 patrol, monitor for escalation.`;
  return `Log and monitor — no dispatch required.`;
}

let _id = 1000;
export function nextId(): string {
  _id += 1;
  return `EVT-${_id.toString(36).toUpperCase()}`;
}

export function generateEvent(source: "auto" | "manual" = "auto", overrides?: Partial<DisruptionEvent>): DisruptionEvent {
  const cause = overrides?.cause ?? (pick(CAUSES).name as CauseName);
  const zone = overrides?.zone ?? pick(ZONES);
  const junction = overrides?.junction ?? pick(JUNCTIONS[zone]);
  const direction = overrides?.direction ?? pick(["Inbound", "Outbound", "Both"] as const);
  const durationMin = overrides?.durationMin ?? (15 + Math.floor(Math.random() * 226));
  const requiresClosure = overrides?.requiresClosure ?? Math.random() < 0.35;
  const now = new Date();
  const hour = overrides?.hour ?? now.getHours();
  const isWeekend = overrides?.isWeekend ?? [0, 6].includes(now.getDay());
  const { score, factors } = computeRisk({ cause, durationMin, requiresClosure, hour, isWeekend });
  const severity = severityFromScore(score);
  return {
    id: nextId(),
    ts: Date.now(),
    type: ["VIP Movement", "Road Repair", "Political Rally", "Public Gathering"].includes(cause) ? "Planned" : "Unplanned",
    cause,
    zone,
    junction,
    direction,
    durationMin,
    requiresClosure,
    hour,
    isWeekend,
    score,
    severity,
    factors,
    recommendation: recommendationFor(cause, severity),
    status: "Unassigned",
    source,
    ...overrides,
  };
}