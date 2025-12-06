import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Overlay, AnimatedOverlay } from "@/components/overlay";
import { SettingsWindow } from "@/components/settings";
import { useGlobalHotkeys, useBuildOrders, useConfig, useWindowSize } from "@/hooks";
import { useConfigStore } from "@/stores";

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const { config } = useConfigStore();

  // Initialize hooks
  useGlobalHotkeys();
  useBuildOrders();
  useConfig();
  useWindowSize();

  useEffect(() => {
    const initWindow = async () => {
      const win = getCurrentWindow();
      setWindowLabel(win.label);
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
