import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Role } from "@/lib/store";
import { RadarLogo } from "@/components/RadarLogo";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "TrafficOps AI — Sign In" },
      { name: "description", content: "Bengaluru Traffic Police Command Platform — secure officer sign-in." },
    ],
  }),
  component: LoginPage,
});

const ROLES: Role[] = ["Duty Officer", "Zone Commander", "Control Room Admin"];
const MOCK_NAMES = ["R. Kumar", "S. Iyer", "A. Nair", "P. Reddy", "M. Shetty"];

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Control Room Admin");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!officerId.trim() || !password.trim()) {
      setErr("Officer ID and password required.");
      return;
    }
    const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
    login({ officerId: officerId.trim(), name, role });
    navigate({ to: "/command" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="radar-sweep" style={{ opacity: 0.4 }} />
      <div className="hud-card w-full max-w-md p-8 fade-up relative z-10" style={{ boxShadow: "0 0 40px rgba(255,61,61,0.15)" }}>
        <div className="flex flex-col items-center mb-6">
          <RadarLogo size={64} />
          <h1 className="mt-4 text-2xl font-semibold">
            TrafficOps <span style={{ color: "var(--primary)" }}>AI</span>
          </h1>
          <p className="text-xs mono text-muted-foreground mt-1">Bengaluru Traffic Police — Command Platform</p>
          <span className="mt-3 mono text-[10px] tracking-widest px-2 py-1 rounded border" style={{ borderColor: "var(--warning)", color: "var(--warning)" }}>
            PROTOTYPE / DEMONSTRATION SYSTEM
          </span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs mono text-muted-foreground mb-1">OFFICER ID</label>
            <input
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              className="w-full bg-black/40 border border-border rounded px-3 py-2 mono text-sm outline-none focus:border-primary"
              placeholder="OFF-XXXX"
            />
          </div>
          <div>
            <label className="block text-xs mono text-muted-foreground mb-1">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-border rounded px-3 py-2 mono text-sm outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs mono text-muted-foreground mb-1">ROLE</label>
            <div className="grid grid-cols-3 gap-1 p-1 border border-border rounded bg-black/40">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`text-[11px] mono py-2 rounded transition-colors ${role === r ? "bg-primary/15 border border-primary/40" : "hover:bg-white/5"}`}
                  style={role === r ? { color: "var(--primary)" } : undefined}
                >
                  {r.split(" ")[0].toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-[10px] mono text-muted-foreground mt-1">{role}</p>
          </div>
          {err && <p className="text-xs mono" style={{ color: "var(--critical)" }}>{err}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded mono text-sm font-medium transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(180deg, #FF5454, #C42626)", color: "white", boxShadow: "0 0 20px rgba(255,61,61,0.35)" }}
          >
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  );
}