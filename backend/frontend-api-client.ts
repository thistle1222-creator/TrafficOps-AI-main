const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`TrafficOps API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const trafficOpsApi = {
  login: (officerId: string, password: string, role: string) =>
    api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ officer_id: officerId, password, role }),
    }),
  state: () => api("/state"),
  events: () => api("/events"),
  simulateEvent: (payload: unknown) => api("/events/simulate", { method: "POST", body: JSON.stringify(payload) }),
  acknowledge: (eventId: string, actor: unknown) =>
    api(`/events/${eventId}/acknowledge`, { method: "POST", body: JSON.stringify({ actor }) }),
  assignUnit: (eventId: string, unit: string, actor: unknown) =>
    api(`/events/${eventId}/assign`, { method: "POST", body: JSON.stringify({ unit, actor }) }),
  setStatus: (eventId: string, status: string, actor: unknown) =>
    api(`/events/${eventId}/status`, { method: "POST", body: JSON.stringify({ status, actor }) }),
  agentChat: (message: string, context = {}, actor?: unknown) =>
    api("/agent/chat", { method: "POST", body: JSON.stringify({ message, context, actor }) }),
  systemHealth: () => api("/system-health"),
  diagnostics: () => api("/system-health/diagnostics", { method: "POST" }),
  advisory: () => api("/advisory"),
  activity: () => api("/activity"),
  updateSettings: (patch: Record<string, unknown>, actor: unknown) =>
    api("/settings", { method: "PATCH", body: JSON.stringify({ patch, actor }) }),
  setDegradedMode: (on: boolean, actor: unknown) =>
    api("/settings/degraded", { method: "POST", body: JSON.stringify({ on, actor }) }),
};
