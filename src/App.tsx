import { useEffect, useState } from "react";
import { getCurrentWindow } from "@/lib/tauri";
import { Overlay, AnimatedOverlay } from "@/components/overlay";
import { SettingsWindow } from "@/components/settings";
import { useGlobalHotkeys, useBuildOrders, useConfig, useWindowSize, useReminders } from "@/hooks";
import { useConfigStore } from "@/stores";

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const { config } = useConfigStore();

  // Initialize hooks
  useGlobalHotkeys();
  useBuildOrders();
  useConfig();
  useWindowSize();
  useReminders(); // Run reminders even when overlay UI is hidden

  useEffect(() => {
    const initWindow = async () => {
      try {
        const win = getCurrentWindow();
        // On some Windows builds the initial label can be "main" or briefly unavailable.
        // Treat those cases as the overlay window so we don't render a blank transparent window.
        const searchLabel =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("window")
            : null;
        const rawLabel = searchLabel || (win as { label?: string }).label;
        const label =
          !rawLabel || rawLabel === "main" ? "overlay" : rawLabel;
        setWindowLabel(label);
      } catch (error) {
        console.error("Failed to get window label, defaulting to overlay:", error);
        setWindowLabel("overlay");
      }
    };
    initWindow();
  }, []);

  // Apply theme to document (runs on mount and theme change)
  useEffect(() => {
    const root = document.documentElement;
    if (config.theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else if (config.theme === "dark") {
      root.classList.remove("light");
      root.classList.add("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    }
  }, [config.theme]);

  if (!windowLabel) {
    // Avoid returning null (invisible transparent window) while label resolves.
    return (
      <div className="w-full h-full p-2">
        <div className="floating-panel-pro px-3 py-2 text-xs text-white/70">
          Loading overlay…
        </div>
      </div>
    );
  }

  if (windowLabel === "overlay") {
    return (
      <AnimatedOverlay>
        <Overlay />
      </AnimatedOverlay>
    );
  }

  if (windowLabel === "settings") {
    return <SettingsWindow />;
  }

  // Default/unknown window
  return (
    <div className="w-full h-full p-4 bg-background">
      <h1 className="text-2xl font-bold mb-4">AoE4 Overlay</h1>
      <p className="text-muted-foreground">Window: {windowLabel}</p>
    </div>
  );
}

export default App;
