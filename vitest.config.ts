import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "src-tauri", "tests"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/components/ui/**",
        "src/**/*.stories.tsx",
        "src/App.tsx",
        "src/components/settings/**",
        "src/hooks/**",
        "src/types/index.ts",
        "src/types/aoe4world.ts",
        "src/stores/index.ts",
        "src/stores/playerStore.ts",
        "src/components/overlay/index.ts",
        "src/components/overlay/AnimatedOverlay.tsx",
        "src/components/overlay/BuildOrderDisplay.tsx",
        "src/components/overlay/BuildOrderStep.tsx",
        "src/components/overlay/CivBadge.tsx",
        "src/components/overlay/CompactOverlay.tsx",
        "src/components/overlay/GameIcons.tsx",
        "src/components/overlay/Overlay.tsx",
        "src/components/overlay/ResourceIcons.tsx",
        "src/components/overlay/TimerBar.tsx",
        "src/components/overlay/UpgradeBadges.tsx",
        "src/lib/tauri.ts",
      ],
      all: true,
      thresholds: {
        lines: 60,
        functions: 50,
        branches: 45,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
