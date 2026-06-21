import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { RadarLogo } from "./RadarLogo";

const LINES = [
  "Initializing Traffic Intelligence Agent",
  "Monitoring Bengaluru Traffic Network...",
];

export function StartupAnimation() {
  const { markStartupSeen } = useStore();
  const [lineIdx, setLineIdx] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const target = LINES[lineIdx];
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(target.slice(0, i));
      if (i >= target.length) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [lineIdx]);

  useEffect(() => {
    const t1 = setTimeout(() => setLineIdx(1), 1500);
    const t2 = setTimeout(() => markStartupSeen(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center fade-up">
      <RadarLogo size={96} />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        TrafficOps <span style={{ color: "var(--primary)" }}>AI</span>
      </h1>
      <p className="mt-1 text-xs mono tracking-widest text-muted-foreground">BENGALURU COMMAND CENTER</p>
      <div className="mt-10 mono text-xs" style={{ color: "var(--accent-cyan)" }}>
        &gt; {typed}
        <span className="inline-block w-1.5 h-3 bg-current ml-0.5 align-middle pulse-dot" />
      </div>
      {lineIdx === 1 && (
        <div className="mt-2 mono text-xs text-muted-foreground fade-up">
          &gt; {LINES[0]}
        </div>
      )}
    </div>
  );
}