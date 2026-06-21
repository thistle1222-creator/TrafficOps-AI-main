import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { Role } from "@/lib/store";

export function Restricted({ requires }: { requires: Role }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 fade-up">
      <div className="hud-card glow-warning p-8 max-w-md">
        <Lock className="mx-auto h-10 w-10 mb-4" style={{ color: "var(--warning)" }} />
        <h2 className="text-xl font-semibold mb-2">Restricted Access</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This module is restricted to <span className="mono" style={{ color: "var(--warning)" }}>{requires}</span> and above.
          Your current role does not have clearance to view this page.
        </p>
        <Link
          to="/login"
          className="inline-block mono text-xs px-4 py-2 border border-border rounded hover:border-primary transition-colors"
        >
          Switch Role
        </Link>
      </div>
    </div>
  );
}