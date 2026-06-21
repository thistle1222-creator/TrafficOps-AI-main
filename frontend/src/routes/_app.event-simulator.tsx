import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { computeRisk, severityFromScore, severityColor, recommendationFor, CAUSES, ZONES, type CauseName, type Zone } from "@/lib/mock-data";
import { WhyScore } from "@/components/WhyScore";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/_app/event-simulator")({
  head: () => ({ meta: [{ title: "Event Simulator — TrafficOps AI" }] }),
  component: EventSim,
});

const STEPS = ["Collecting Context", "Analyzing Weather", "Running Predictive Models", "Calculating Risk", "Generating Recommendations"];

function EventSim() {
  const [cause, setCause] = useState<CauseName>("Public Gathering");
  const [zone, setZone] = useState<Zone>("MG Road");
  const [crowd, setCrowd] = useState(5000);
  const [hour, setHour] = useState(18);
  const [weather, setWeather] = useState("Clear");
  const [closure, setClosure] = useState(true);
  const [duration, setDuration] = useState(120);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof computeRisk> | null>(null);

  function analyze() {
    setRunning(true); setResult(null); setStep(0);
    let s = 0;
    const t = setInterval(() => {
      s++; setStep(s);
      if (s >= STEPS.length) {
        clearInterval(t);
        const r = computeRisk({ cause, durationMin: duration, requiresClosure: closure, hour, isWeekend: false });
        // crowd factor
        const crowdBoost = Math.min(20, Math.floor(crowd / 1000));
        r.score = Math.min(100, r.score + crowdBoost);
        r.factors.push({ label: `Crowd: ${crowd.toLocaleString()}`, value: crowdBoost });
        if (weather === "Heavy Rain") { r.score = Math.min(100, r.score + 10); r.factors.push({ label: "Weather: Heavy Rain", value: 10 }); }
        setResult(r);
        setRunning(false);
      }
    }, 600);
  }

  const sev = result ? severityFromScore(result.score) : null;

  return (
    <>
      <PageHeader title="Event Impact Simulator" subtitle="MODEL EVENTS BEFORE THEY HAPPEN · PRE-DISPATCH PLANNING" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="hud-card p-5 lg:col-span-1 space-y-4">
          <h3 className="mono text-xs tracking-wider text-muted-foreground">EVENT PARAMETERS</h3>
          <Field label="EVENT TYPE">
            <select value={cause} onChange={(e) => setCause(e.target.value as CauseName)} className="input">
              {CAUSES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="VENUE / ZONE">
            <select value={zone} onChange={(e) => setZone(e.target.value as Zone)} className="input">
              {ZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
          </Field>
          <Field label={`EXPECTED CROWD · ${crowd.toLocaleString()}`}>
            <input type="range" min={500} max={50000} step={500} value={crowd} onChange={(e) => setCrowd(+e.target.value)} className="w-full accent-[var(--primary)]" />
          </Field>
          <Field label={`HOUR (${String(hour).padStart(2, "0")}:00)`}>
            <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(+e.target.value)} className="w-full accent-[var(--primary)]" />
          </Field>
          <Field label={`DURATION · ${duration}min`}>
            <input type="range" min={15} max={240} value={duration} onChange={(e) => setDuration(+e.target.value)} className="w-full accent-[var(--primary)]" />
          </Field>
          <Field label="WEATHER">
            <select value={weather} onChange={(e) => setWeather(e.target.value)} className="input">
              <option>Clear</option><option>Cloudy</option><option>Light Rain</option><option>Heavy Rain</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-xs mono">
            <input type="checkbox" checked={closure} onChange={(e) => setClosure(e.target.checked)} />
            Requires road closure
          </label>
          <button
            onClick={analyze}
            disabled={running}
            className="w-full py-3 rounded mono text-sm font-medium transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: "linear-gradient(180deg, #FF5454, #C42626)", color: "white" }}
          >
            <Zap className="inline h-4 w-4 mr-1" /> ⚡ ANALYZE TRAFFIC IMPACT
          </button>
        </div>

        <div className="hud-card p-5 lg:col-span-2 min-h-[520px]">
          {running && (
            <div className="space-y-3">
              <h3 className="mono text-xs tracking-wider text-muted-foreground mb-4">RUNNING ANALYSIS...</h3>
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full" style={{ background: i < step ? "var(--success)" : i === step ? "var(--warning)" : "var(--border)" }} />
                  <span className={i <= step ? "" : "text-muted-foreground"}>{s}</span>
                  {i < step && <span className="mono text-[10px]" style={{ color: "var(--success)" }}>✓ DONE</span>}
                </div>
              ))}
            </div>
          )}

          {!running && !result && (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <p className="mono text-xs text-muted-foreground">Configure event parameters and run analysis.</p>
                <p className="text-[10px] mono text-muted-foreground/60 mt-2">AI Agent is monitoring traffic activity.</p>
              </div>
            </div>
          )}

          {result && sev && (
            <div className="fade-up">
              <div className="flex items-center gap-6 mb-6">
                <RiskGauge score={result.score} />
                <div>
                  <div className="text-[10px] mono text-muted-foreground tracking-wider">SEVERITY</div>
                  <div className="mono text-3xl" style={{ color: severityColor(sev) }}>{sev.toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-md">{recommendationFor(cause, sev)}</div>
                  <WhyScore factors={result.factors} />
                </div>
              </div>

              <h4 className="mono text-xs text-muted-foreground tracking-wider mb-3">RESOURCE PLANNER</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { l: "Officers", v: Math.ceil(result.score / 10), unit: "personnel" },
                  { l: "Barricades", v: closure ? 8 : 2, unit: "units" },
                  { l: "Diversions", v: closure ? 3 : 1, unit: "routes" },
                  { l: "Tow Vehicles", v: Math.ceil(result.score / 25), unit: "units" },
                ].map((r, i) => (
                  <div key={r.l} className="hud-card p-3 fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="text-[10px] mono text-muted-foreground">{r.l.toUpperCase()}</div>
                    <div className="mono text-2xl mt-1">{r.v}</div>
                    <div className="text-[10px] mono text-muted-foreground">{r.unit}</div>
                  </div>
                ))}
              </div>

              <h4 className="mono text-xs text-muted-foreground tracking-wider mb-3">FORECAST TIMELINE</h4>
              <div className="grid grid-cols-4 gap-3">
                {["Now", "+2H", "+6H", "+12H"].map((t, i) => {
                  const v = Math.max(10, result.score - i * 15);
                  return (
                    <div key={t} className="hud-card p-3">
                      <div className="text-[10px] mono text-muted-foreground">{t}</div>
                      <div className="mono text-xl mt-1" style={{ color: severityColor(severityFromScore(v)) }}>{v.toFixed(0)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`.input{width:100%;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:4px;padding:6px 8px;font-family:var(--font-mono);font-size:12px;color:var(--foreground)}`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] mono text-muted-foreground tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  );
}

function RiskGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 86 ? "var(--critical)" : score >= 66 ? "var(--warning)" : score >= 41 ? "var(--accent-cyan)" : "var(--success)";
  return (
    <svg width={160} height={100} viewBox="0 0 160 100">
      <path d="M 20 90 A 60 60 0 0 1 140 90" fill="none" stroke="var(--border)" strokeWidth="10" />
      <path d="M 20 90 A 60 60 0 0 1 60 35" fill="none" stroke="var(--success)" strokeWidth="10" />
      <path d="M 60 35 A 60 60 0 0 1 100 35" fill="none" stroke="var(--warning)" strokeWidth="10" />
      <path d="M 100 35 A 60 60 0 0 1 140 90" fill="none" stroke="var(--critical)" strokeWidth="10" />
      <line x1="80" y1="90" x2="80" y2="40" stroke={color} strokeWidth="3" transform={`rotate(${angle} 80 90)`} style={{ transition: "transform 800ms" }} />
      <circle cx="80" cy="90" r="5" fill={color} />
      <text x="80" y="75" textAnchor="middle" fontSize="22" fill={color} fontFamily="JetBrains Mono">{score.toFixed(0)}</text>
    </svg>
  );
}