import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@lo-ink/ui": fileURLToPath(
        new URL("./packages/ui/src/index.ts", import.meta.url),
      ),
      "@lo-ink/design-tokens": fileURLToPath(
        new URL("./packages/design-tokens/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: [
        "packages/ui/src/**/*.{ts,tsx}",
        "packages/design-tokens/src/**/*.ts",
      ],
      reporter: ["text", "json-summary", "lcov"],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 80 },
    },
  },
});
