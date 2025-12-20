import { useEffect, useState, useRef } from "react";
import { getCurrentWindow } from "@/lib/tauri";
import { Overlay } from "@/components/overlay";
import { SettingsWindow } from "@/components/settings";
import { useGlobalHotkeys, useBuildOrders, useConfig, useWindowSize, useReminders, useMetronome } from "@/hooks";
import { useConfigStore } from "@/stores";

// Extended window interface for Tauri window methods
// Using unknown for methods that may not exist on mock windows
interface TauriWindowExtended {
  label?: string;
  show?: () => Promise<void>;
  outerSize?: () => Promise<{ width: number; height: number }>;
  setSize?: (size: unknown) => Promise<void>;
  setFocus?: () => Promise<void>;
}

function OverlayWithWindowFix() {
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Force window to show and resize (resize triggers WebView2 repaint)
    const forceShowAndRepaint = async () => {
      const win = getCurrentWindow() as TauriWindowExtended;
      try {
        await win.show?.();

        // Get current size, resize slightly, then resize back
        // This forces WebView2 to repaint
        const size = await win.outerSize?.();
        if (size) {
          await win.setSize?.({ type: 'Physical', width: size.width + 1, height: size.height + 1 });
          await new Promise(r => setTimeout(r, 50));
          await win.setSize?.({ type: 'Physical', width: size.width, height: size.height });
        }

        await win.setFocus?.();
      } catch (e) {
        console.error("[OverlayWithWindowFix] Error forcing repaint:", e);
      }
    };

    // Multiple attempts at different delays
    const delays = [100, 500, 1000, 2000, 3000, 5000];
    timeoutIdsRef.current = delays.map((delay) =>
      setTimeout(() => {
        forceShowAndRepaint();
      }, delay)
    );

    return () => {
      // Cleanup all scheduled timeouts on unmount
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
    };
  }, []);

  return (
    <div style={{ minHeight: '100px', minWidth: '100px' }}>
      <Overlay />
    </div>
  );
}

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const { config } = useConfigStore();

  // Initialize hooks
  useGlobalHotkeys();
  useBuildOrders();
  useConfig();
  useWindowSize();
  useReminders(); // Run reminders even when overlay UI is hidden
  useMetronome();

  useEffect(() => {
    const initWindow = async () => {
      try {
        const win = getCurrentWindow();
        const searchLabel = typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("window")
          : null;
        const rawLabel = searchLabel || (win as { label?: string }).label;
        const label = !rawLabel || rawLabel === "main" ? "overlay" : rawLabel;
        setWindowLabel(label);
      } catch (error) {
        console.error("[App] Failed to get window label:", error);
        setWindowLabel("overlay");
      }
    };
    initWindow();
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (config.theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (config.theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
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
    return (
      <div className="w-full h-full p-2">
        <div className="floating-panel-pro px-3 py-2 text-xs text-white/70">
          Loading overlay…
        </div>
      </div>
    );
  }

  if (windowLabel === "overlay") {
    // Wrapper ensures WebView2 renders the transparent content properly
    return <OverlayWithWindowFix />;
  }

  if (windowLabel === "settings") {
    return <SettingsWindow />;
  }

  return (
    <div className="w-full h-full p-4 bg-background">
      <h1 className="text-2xl font-bold mb-4">AoE4 Overlay</h1>
      <p className="text-muted-foreground">Window: {windowLabel}</p>
    </div>
  );
}

export default App;
