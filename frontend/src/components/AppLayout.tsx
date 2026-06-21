import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity, Radio, Sparkles, CalendarClock, TrendingUp, Bell, FileText, Map, ScrollText,
  HeartPulse, Megaphone, Settings as SettingsIcon, Lock, LogOut, MessageSquare, X, Send,
} from "lucide-react";
import { useStore, hasRole, type Role } from "@/lib/store";
import { RadarLogo } from "./RadarLogo";
import { LiveClock } from "./LiveClock";
import { StartupAnimation } from "./StartupAnimation";

const NAV: { to: string; label: string; icon: typeof Activity; minRole?: Role }[] = [
  { to: "/command", label: "Command", icon: Radio },
  { to: "/agent-center", label: "Agent Center", icon: Sparkles },
  { to: "/event-simulator", label: "Event Simulator", icon: CalendarClock },
  { to: "/forecast", label: "Forecast", icon: TrendingUp },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/incident-records", label: "Incident Records", icon: FileText, minRole: "Zone Commander" },
  { to: "/heatmap", label: "Heatmap", icon: Map },
  { to: "/activity-log", label: "Activity Log", icon: ScrollText },
  { to: "/system-health", label: "System Health", icon: HeartPulse, minRole: "Zone Commander" },
  { to: "/advisory", label: "Public Advisory", icon: Megaphone },
  { to: "/settings", label: "Settings", icon: SettingsIcon, minRole: "Control Room Admin" },
];

export function AppLayout() {
  const { state, logout } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!state.user) navigate({ to: "/login" });
  }, [state.user, navigate]);

  if (!state.user) return null;
  if (!state.startupSeen) return <StartupAnimation />;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="group fixed left-0 top-0 bottom-0 z-40 w-[60px] hover:w-[220px] transition-all duration-250 bg-sidebar border-r border-border flex flex-col">
        <div className="h-14 flex items-center px-3 border-b border-border">
          <RadarLogo size={32} />
          <span className="ml-2 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            TrafficOps <span style={{ color: "var(--primary)" }}>AI</span>
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            const locked = item.minRole && !hasRole(state.user, item.minRole);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center h-10 px-4 mx-1 my-0.5 rounded text-sm transition-colors relative
                  ${active ? "bg-primary/10 border-l-2" : "hover:bg-white/5 border-l-2 border-transparent"}`}
                style={active ? { borderLeftColor: "var(--primary)", boxShadow: "inset 4px 0 12px -8px var(--primary)" } : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: active ? "var(--primary)" : undefined }} />
                <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-2">
                  {item.label}
                  {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3 flex items-center text-xs mono">
          <span
            className="h-2 w-2 rounded-full pulse-dot shrink-0"
            style={{ background: state.degraded ? "var(--warning)" : "var(--success)" }}
          />
          <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ color: state.degraded ? "var(--warning)" : "var(--success)" }}>
            {state.degraded ? "DEGRADED MODE" : "SYSTEM NOMINAL"}
          </span>
        </div>
      </aside>

      <div className="flex-1 ml-[60px] flex flex-col min-w-0">
        <header className="glass-hud sticky top-0 z-30 h-14 flex items-center px-6 gap-6">
          <div className="flex items-center gap-2 text-xs mono">
            <span className="h-2 w-2 rounded-full pulse-dot" style={{ background: "var(--success)" }} />
            <span style={{ color: "var(--success)" }}>AGENT · MONITORING</span>
          </div>
          {state.degraded && (
            <div className="text-xs mono px-3 py-1 rounded border" style={{ borderColor: "var(--warning)", color: "var(--warning)" }}>
              ⚠ Operating on cached data — one or more feeds delayed
            </div>
          )}
          <div className="flex-1" />
          <div className="text-xs mono text-muted-foreground hidden md:block">
            OFFICER {state.user.name.toUpperCase()} · <span style={{ color: "var(--accent-cyan)" }}>{state.user.role.toUpperCase()}</span>
          </div>
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="text-xs mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            title="Switch role / logout"
          >
            <LogOut className="h-3 w-3" /> SWITCH
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs mono text-muted-foreground">BENGALURU · IST</span>
            <LiveClock />
          </div>
        </header>

        <main className="flex-1 p-6 relative">
          <Outlet />
        </main>
      </div>

      <Copilot />
    </div>
  );
}

function Copilot() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [thread, setThread] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Copilot online. Ask about silk board, risk, weather, resources, or any officer." },
  ]);

  function send() {
    if (!msg.trim()) return;
    const m = msg.trim();
    setMsg("");
    setThread((t) => [...t, { role: "user", text: m }]);
    const lower = m.toLowerCase();
    let reply = "Acknowledged. I will continue monitoring and surface relevant signals.";
    if (lower.includes("silk board")) reply = "Silk Board: current density 84%, 2 active incidents. Recommended: hold 2 patrol units at Madiwala Signal.";
    else if (lower.includes("risk")) reply = "Live risk model (TrafficBERT v3.1) using cause, duration, closure, time-of-day, weekend factors. Confidence ≥ 80% on last 24h decisions.";
    else if (lower.includes("weather")) reply = "BMRDA weather feed: clear, 26°C, no precipitation. Risk multiplier nominal.";
    else if (lower.includes("resource") || lower.includes("officer")) reply = "127 GPS-tracked units active. 18 on standby. Suggest pre-positioning at Hebbal & KR Puram for evening peak.";
    setTimeout(() => setThread((t) => [...t, { role: "bot", text: reply }]), 400);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 mono text-xs px-4 py-3 rounded-full border bg-card hover:scale-105 transition-transform"
        style={{ borderColor: "var(--accent-cyan)", boxShadow: "0 0 16px rgba(0,212,255,0.3)" }}
      >
        <MessageSquare className="inline h-3 w-3 mr-2" style={{ color: "var(--accent-cyan)" }} />
        ✦ Copilot
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] hud-card glow-cyan fade-up flex flex-col" style={{ maxHeight: "60vh" }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 mono text-xs">
          <Sparkles className="h-3 w-3" style={{ color: "var(--accent-cyan)" }} /> COPILOT
        </div>
        <button onClick={() => setOpen(false)}><X className="h-3 w-3" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {thread.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.role === "user" ? "ml-auto text-right" : ""}`}>
            <div className={`inline-block px-3 py-2 rounded text-xs ${m.role === "user" ? "bg-primary/15 border border-primary/30" : "bg-black/40 border border-border"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-border flex gap-1">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the agent..."
          className="flex-1 bg-black/40 border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-accent-cyan"
        />
        <button onClick={send} className="px-2 py-1 border border-border rounded hover:border-primary"><Send className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs mono text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}