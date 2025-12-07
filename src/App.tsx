import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
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
      if (import.meta.env.VITE_MOCK_TAURI === 'true') {
        setWindowLabel("overlay");
        return;
      }
      const win = getCurrentWindow();
      setWindowLabel(win.label);

      // Windows-specific fix for transparent window white flash
      // The window is configured as visible=true in tauri.conf.json
      // On Windows, transparent windows show a white flash if not hidden initially
      if (win.label === "overlay" && navigator.userAgent.includes("Windows")) {
        await win.hide(); // Hide immediately to prevent flash
        // Wait for React to render and styles to apply, then show
        setTimeout(async () => {
          await win.show();
          // Ensure alwaysOnTop is set after showing, in case it was reset by hide/show cycle
          await win.setAlwaysOnTop(true);
        }, 100);
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
    return null;
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
