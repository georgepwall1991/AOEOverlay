import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Overlay } from "@/components/overlay";
import { SettingsWindow } from "@/components/settings";
import { useGlobalHotkeys, useBuildOrders, useConfig } from "@/hooks";

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  // Initialize hooks
  useGlobalHotkeys();
  useBuildOrders();
  useConfig();

  useEffect(() => {
    const initWindow = async () => {
      const win = getCurrentWindow();
      setWindowLabel(win.label);
    };
    initWindow();
  }, []);

  if (!windowLabel) {
    return null;
  }

  if (windowLabel === "overlay") {
    return <Overlay />;
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
