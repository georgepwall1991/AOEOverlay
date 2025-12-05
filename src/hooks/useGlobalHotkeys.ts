import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useBuildOrderStore, useOverlayStore, useConfigStore } from "@/stores";
import { toggleClickThrough, toggleCompactMode } from "@/lib/tauri";

export function useGlobalHotkeys() {
  const { nextStep, previousStep, cycleBuildOrder } = useBuildOrderStore();
  const { toggleVisibility } = useOverlayStore();
  const { updateConfig } = useConfigStore();

  useEffect(() => {
    const unlistenPromises = [
      listen("hotkey-toggle-overlay", () => {
        toggleVisibility();
      }),
      listen("hotkey-previous-step", () => {
        previousStep();
      }),
      listen("hotkey-next-step", () => {
        nextStep();
      }),
      listen("hotkey-cycle-build-order", () => {
        cycleBuildOrder();
      }),
      listen("hotkey-toggle-click-through", async () => {
        const newState = await toggleClickThrough();
        updateConfig({ click_through: newState });
      }),
      listen("hotkey-toggle-compact", async () => {
        const newState = await toggleCompactMode();
        updateConfig({ compact_mode: newState });
      }),
    ];

    return () => {
      unlistenPromises.forEach((promise) => {
        promise.then((unlisten) => unlisten());
      });
    };
  }, [nextStep, previousStep, cycleBuildOrder, toggleVisibility, updateConfig]);
}
