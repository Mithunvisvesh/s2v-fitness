import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    env: {
      SUPABASE_URL: "https://dummy-supabase-url.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "dummy-service-role-key",
      AUTH_SECRET: "dummy-auth-secret",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
