import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { generateEvent, type DisruptionEvent, type Zone } from "./mock-data";

export type Role = "Duty Officer" | "Zone Commander" | "Control Room Admin";

export interface User {
  officerId: string;
  name: string;
  role: Role;
}

export interface ActivityEntry {
  id: string;
  ts: number;
  kind: "system" | "human";
  type: "Alert" | "Detection" | "Recommendation" | "System" | "Action";
  location?: string;
  message: string;
  confidence?: number;
  actor?: string;
}

interface State {
  user: User | null;
  events: DisruptionEvent[];
  activity: ActivityEntry[];
  degraded: boolean;
  startupSeen: boolean;
  settings: {
    criticalThreshold: number;
    highThreshold: number;
    soundAlerts: boolean;
    autoAck: boolean;
    smsDispatch: boolean;
    whatsapp: boolean;
    heatmapInterval: number;
    alertInterval: number;
    weatherInterval: number;
    autonomousMode: boolean;
    confidenceThreshold: number;
    maxConcurrent: number;
  };
  counters: {
    detected: number;
    predictions: number;
    decisions: number;
  };
  recentShockwave: { zone: Zone; ts: number } | null;
}

type Action =
  | { type: "LOGIN"; user: User }
  | { type: "LOGOUT" }
  | { type: "STARTUP_DONE" }
  | { type: "ADD_EVENT"; event: DisruptionEvent }
  | { type: "UPDATE_EVENT"; id: string; patch: Partial<DisruptionEvent> }
  | { type: "LOG"; entry: ActivityEntry }
  | { type: "SET_DEGRADED"; on: boolean }
  | { type: "UPDATE_SETTINGS"; patch: Partial<State["settings"]> }
  | { type: "BUMP_COUNTERS"; patch: Partial<State["counters"]> }
  | { type: "CLEAR_SHOCKWAVE" };

const initial: State = {
  user: null,
  events: [],
  activity: [],
  degraded: false,
  startupSeen: false,
  settings: {
    criticalThreshold: 86,
    highThreshold: 66,
    soundAlerts: true,
    autoAck: false,
    smsDispatch: true,
    whatsapp: false,
    heatmapInterval: 5,
    alertInterval: 5,
    weatherInterval: 60,
    autonomousMode: true,
    confidenceThreshold: 75,
    maxConcurrent: 12,
  },
  counters: { detected: 12847, predictions: 5612, decisions: 248 },
  recentShockwave: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.user };
    case "LOGOUT":
      return { ...initial, startupSeen: false };
    case "STARTUP_DONE":
      return { ...state, startupSeen: true };
    case "ADD_EVENT":
      return {
        ...state,
        events: [action.event, ...state.events].slice(0, 500),
        recentShockwave: { zone: action.event.zone, ts: action.event.ts },
      };
    case "UPDATE_EVENT":
      return {
        ...state,
        events: state.events.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)),
      };
    case "LOG":
      return { ...state, activity: [action.entry, ...state.activity].slice(0, 500) };
    case "SET_DEGRADED":
      return { ...state, degraded: action.on };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "BUMP_COUNTERS":
      return { ...state, counters: { ...state.counters, ...action.patch } };
    case "CLEAR_SHOCKWAVE":
      return { ...state, recentShockwave: null };
    default:
      return state;
  }
}

interface StoreCtx {
  state: State;
  login: (u: User) => void;
  logout: () => void;
  markStartupSeen: () => void;
  injectEvent: (
    source?: "auto" | "manual",
    overrides?: Partial<DisruptionEvent>,
  ) => DisruptionEvent;
  acknowledgeEvent: (id: string) => void;
  assignUnit: (id: string, unit: string) => void;
  setStatus: (id: string, status: DisruptionEvent["status"]) => void;
  setDegraded: (on: boolean) => void;
  updateSettings: (
    patch: Partial<State["settings"]>,
    label?: string,
    oldNew?: { old: unknown; new: unknown },
  ) => void;
  log: (entry: Omit<ActivityEntry, "id" | "ts">) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Restore user from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("trafficops-user");
    if (raw) {
      try {
        dispatch({ type: "LOGIN", user: JSON.parse(raw) });
      } catch {
        /* ignore */
      }
    }
    const startup = sessionStorage.getItem("trafficops-startup");
    if (startup === "1") dispatch({ type: "STARTUP_DONE" });
  }, []);

  function log(entry: Omit<ActivityEntry, "id" | "ts">) {
    dispatch({
      type: "LOG",
      entry: {
        ...entry,
        id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ts: Date.now(),
      },
    });
  }

  function injectEvent(source: "auto" | "manual" = "auto", overrides?: Partial<DisruptionEvent>) {
    const ev = generateEvent(source, overrides);
    dispatch({ type: "ADD_EVENT", event: ev });
    dispatch({
      type: "BUMP_COUNTERS",
      patch: {
        detected: stateRef.current.counters.detected + 1,
        predictions: stateRef.current.counters.predictions + 1,
        decisions: stateRef.current.counters.decisions + 1,
      },
    });
    log({
      kind: "system",
      type: source === "manual" ? "Action" : "Detection",
      location: `${ev.zone} · ${ev.junction}`,
      message:
        source === "manual"
          ? `Admin-triggered simulation: ${ev.cause} (${ev.severity}, score ${ev.score})`
          : `${ev.cause} detected — risk ${ev.score} (${ev.severity})`,
      confidence: 80 + Math.floor(Math.random() * 18),
      actor: source === "manual" ? stateRef.current.user?.name : "AI Agent",
    });
    if (ev.severity === "Critical") {
      toast.error(`Copilot: Critical event at ${ev.zone}`, {
        description: `${ev.cause} — score ${ev.score}. Immediate response advised.`,
      });
    }
    setTimeout(() => dispatch({ type: "CLEAR_SHOCKWAVE" }), 1400);
    return ev;
  }

  // Background disruption injector
  useEffect(() => {
    if (!state.user) return;
    let cancelled = false;
    function schedule() {
      const delay = 25000 + Math.random() * 20000;
      const t = setTimeout(() => {
        if (cancelled) return;
        injectEvent("auto");
        schedule();
      }, delay);
      return t;
    }
    const t = schedule();
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user]);

  // Seed initial events on login
  useEffect(() => {
    if (state.user && state.events.length === 0) {
      for (let i = 0; i < 8; i++) {
        const ev = generateEvent("auto");
        ev.ts = Date.now() - i * 60000 * 3;
        dispatch({ type: "ADD_EVENT", event: ev });
      }
      log({
        kind: "system",
        type: "System",
        message: "TrafficOps AI online — agent monitoring 15 zones.",
        actor: "System",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user]);

  const value = useMemo<StoreCtx>(
    () => ({
      state,
      login(user) {
        if (typeof window !== "undefined")
          sessionStorage.setItem("trafficops-user", JSON.stringify(user));
        dispatch({ type: "LOGIN", user });
      },
      logout() {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("trafficops-user");
          sessionStorage.removeItem("trafficops-startup");
        }
        dispatch({ type: "LOGOUT" });
      },
      markStartupSeen() {
        if (typeof window !== "undefined") sessionStorage.setItem("trafficops-startup", "1");
        dispatch({ type: "STARTUP_DONE" });
      },
      injectEvent,
      acknowledgeEvent(id) {
        const ev = stateRef.current.events.find((e) => e.id === id);
        if (!ev) return;
        dispatch({
          type: "UPDATE_EVENT",
          id,
          patch: {
            acknowledged: true,
            status: ev.status === "Unassigned" ? "Dispatched" : ev.status,
          },
        });
        const u = stateRef.current.user;
        log({
          kind: "human",
          type: "Action",
          location: `${ev.zone} · ${ev.junction}`,
          message: `Acknowledged alert ${ev.id} (${ev.cause})`,
          actor: u ? `${u.name} (${u.role})` : "Officer",
        });
      },
      assignUnit(id, unit) {
        const ev = stateRef.current.events.find((e) => e.id === id);
        if (!ev) return;
        dispatch({
          type: "UPDATE_EVENT",
          id,
          patch: { assignedUnit: unit, status: "Dispatched" },
        });
        const u = stateRef.current.user;
        log({
          kind: "human",
          type: "Action",
          location: `${ev.zone} · ${ev.junction}`,
          message: `Assigned ${unit} to ${ev.id}`,
          actor: u ? `${u.name} (${u.role})` : "Officer",
        });
      },
      setStatus(id, status) {
        dispatch({ type: "UPDATE_EVENT", id, patch: { status } });
        const ev = stateRef.current.events.find((e) => e.id === id);
        const u = stateRef.current.user;
        log({
          kind: "human",
          type: "Action",
          location: ev ? `${ev.zone} · ${ev.junction}` : undefined,
          message: `Status changed to ${status} for ${id}`,
          actor: u ? `${u.name} (${u.role})` : "Officer",
        });
      },
      setDegraded(on) {
        dispatch({ type: "SET_DEGRADED", on });
        const u = stateRef.current.user;
        log({
          kind: on ? "human" : "human",
          type: "Action",
          message: on ? "Degraded mode simulation enabled" : "Connections restored — nominal mode",
          actor: u ? `${u.name} (${u.role})` : "System",
        });
      },
      updateSettings(patch, label, oldNew) {
        dispatch({ type: "UPDATE_SETTINGS", patch });
        const u = stateRef.current.user;
        log({
          kind: "human",
          type: "Action",
          message: label
            ? `Setting "${label}" changed${oldNew ? `: ${String(oldNew.old)} → ${String(oldNew.new)}` : ""}`
            : "Settings updated",
          actor: u ? `${u.name} (${u.role})` : "Admin",
        });
      },
      log,
    }),
    [state, dispatch, injectEvent, log],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within AppStoreProvider");
  return v;
}

/* eslint-disable react-refresh/only-export-components */

export const ROLE_RANK: Record<Role, number> = {
  "Duty Officer": 1,
  "Zone Commander": 2,
  "Control Room Admin": 3,
};

export function hasRole(user: User | null, min: Role): boolean {
  if (!user) return false;
  return ROLE_RANK[user.role] >= ROLE_RANK[min];
}

/* eslint-enable react-refresh/only-export-components */
