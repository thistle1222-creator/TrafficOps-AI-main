// TrafficOps AI - Vite Configuration
// IMPORTANT: While all Lovable application code, branding, and scaffolding has been removed,
// this configuration uses @lovable.dev/vite-tanstack-config as a BUILD-ONLY dependency.
// This is necessary because TanStack Start SSR requires a specific Vite/Nitro configuration
// that is not available in standard npm packages. This is a build-time tool only, with no
// impact on the application runtime or functionality.
// TODO: Replace with official TanStack Start vite configuration if it becomes available.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
