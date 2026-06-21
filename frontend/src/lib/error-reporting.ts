/**
 * Error reporting utility for TrafficOps AI
 * Handles and logs application errors
 */

type ErrorReportingOptions = {
  boundary?: string;
  source?: string;
};

export function reportError(error: unknown, context: ErrorReportingOptions = {}) {
  if (typeof window === "undefined") return;
  
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error("[TrafficOps Error]", errorInfo);
  }
  
  // TODO: Integrate with error tracking service (Sentry, etc.) when needed
}

