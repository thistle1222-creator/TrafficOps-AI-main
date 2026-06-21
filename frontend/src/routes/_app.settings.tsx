import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppLayout";
import { useStore, hasRole } from "@/lib/store";
import { Restricted } from "@/components/Restricted";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — TrafficOps AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, updateSettings, setDegraded } = useStore();

  if (!hasRole(state.user, "Control Room Admin")) return <Restricted requires="Control Room Admin" />;

  const s = state.settings;
  const [local, setLocal] = useState(s);

  function save() {
    const changes: { key: string; old: unknown; new: unknown }[] = [];
    Object.entries(local).forEach(([k, v]) => {
      if ((s as Record<string, unknown>)[k] !== v) changes.push({ key: k, old: (s as Record<string, unknown>)[k], new: v });
    });
    if (changes.length === 0) { toast("No changes"); return; }
    changes.forEach((c) => updateSettings({ [c.key]: c.new } as Partial<typeof s>, c.key, { old: c.old, new: c.new }));
    toast.success("Settings saved", { description: `${changes.length} change(s) logged to audit trail.` });
  }

  return (
    <>
      <PageHeader title="System Settings" subtitle="ADMIN CONTROL · ALL CHANGES LOGGED" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="SYSTEM INFO">
          <Row k="Version" v="TrafficOps AI 1.0.0" />
          <Row k="Jurisdiction" v="Bengaluru City Police" />
          <Row k="Model" v="TrafficBERT v3.1" />
          <Row k="Last Updated" v={new Date().toLocaleString()} />
        </Card>

        <Card title="DEGRADED MODE">
          <p className="text-xs text-muted-foreground mb-3">Simulate loss of one or more data feeds. The platform continues using last-known cached data.</p>
          {state.degraded ? (
            <button onClick={() => setDegraded(false)} className="mono text-xs px-3 py-2 rounded border" style={{ borderColor: "var(--success)", color: "var(--success)" }}>RESTORE CONNECTION</button>
          ) : (
            <button onClick={() => setDegraded(true)} className="mono text-xs px-3 py-2 rounded border" style={{ borderColor: "var(--warning)", color: "var(--warning)" }}>SIMULATE DEGRADED MODE</button>
          )}
        </Card>

        <Card title="ALERT THRESHOLDS">
          <Slider label={`Critical cutoff · ${local.criticalThreshold}`} value={local.criticalThreshold} min={70} max={100} onChange={(v) => setLocal((p) => ({ ...p, criticalThreshold: v }))} />
          <Slider label={`High cutoff · ${local.highThreshold}`} value={local.highThreshold} min={40} max={90} onChange={(v) => setLocal((p) => ({ ...p, highThreshold: v }))} />
        </Card>

        <Card title="NOTIFICATIONS">
          <Toggle label="Sound alerts" v={local.soundAlerts} onChange={(v) => setLocal((p) => ({ ...p, soundAlerts: v }))} />
          <Toggle label="Auto-acknowledge low severity" v={local.autoAck} onChange={(v) => setLocal((p) => ({ ...p, autoAck: v }))} />
          <Toggle label="SMS dispatch" v={local.smsDispatch} onChange={(v) => setLocal((p) => ({ ...p, smsDispatch: v }))} />
          <Toggle label="WhatsApp" v={local.whatsapp} onChange={(v) => setLocal((p) => ({ ...p, whatsapp: v }))} />
        </Card>

        <Card title="DATA REFRESH INTERVALS (seconds)">
          <Select label="Heatmap" v={local.heatmapInterval} opts={[2, 5, 10, 30]} onChange={(v) => setLocal((p) => ({ ...p, heatmapInterval: v }))} />
          <Select label="Alert feed" v={local.alertInterval} opts={[2, 5, 10, 30]} onChange={(v) => setLocal((p) => ({ ...p, alertInterval: v }))} />
          <Select label="Weather model" v={local.weatherInterval} opts={[30, 60, 120, 300]} onChange={(v) => setLocal((p) => ({ ...p, weatherInterval: v }))} />
        </Card>

        <Card title="AGENT CONFIGURATION">
          <Toggle label="Autonomous mode" v={local.autonomousMode} onChange={(v) => setLocal((p) => ({ ...p, autonomousMode: v }))} />
          <Slider label={`Confidence threshold · ${local.confidenceThreshold}%`} value={local.confidenceThreshold} min={50} max={99} onChange={(v) => setLocal((p) => ({ ...p, confidenceThreshold: v }))} />
          <Slider label={`Max concurrent analyses · ${local.maxConcurrent}`} value={local.maxConcurrent} min={1} max={24} onChange={(v) => setLocal((p) => ({ ...p, maxConcurrent: v }))} />
        </Card>

        <div className="md:col-span-2 hud-card p-4">
          <h3 className="mono text-xs text-muted-foreground tracking-wider mb-2">DATA RETENTION & PRIVACY</h3>
          <p className="text-xs text-muted-foreground">
            Incident and audit data is retained for 90 days for operational review, in accordance with departmental data handling policy.
            Access is role-restricted and logged. Officer PII is never exported. Anonymized aggregates may be retained indefinitely for model training.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={save} className="px-6 py-2 rounded mono text-sm" style={{ background: "var(--primary)", color: "white" }}>SAVE SETTINGS</button>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="hud-card p-4">
      <h3 className="mono text-xs text-muted-foreground tracking-wider mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="mono">{v}</span></div>;
}
function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between text-xs cursor-pointer">
      <span>{label}</span>
      <button type="button" onClick={() => onChange(!v)} className="w-10 h-5 rounded-full relative transition-colors" style={{ background: v ? "var(--primary)" : "var(--border)" }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: v ? "calc(100% - 18px)" : "2px" }} />
      </button>
    </label>
  );
}
function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="text-xs mb-1">{label}</div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--primary)]" />
    </div>
  );
}
function Select({ label, v, opts, onChange }: { label: string; v: number; opts: number[]; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span>{label}</span>
      <select value={v} onChange={(e) => onChange(+e.target.value)} className="bg-black/40 border border-border rounded px-2 py-1 mono">
        {opts.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}