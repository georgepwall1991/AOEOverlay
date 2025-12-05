import { useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useOverlayStore } from "@/stores";

export function useWindowDrag() {
  const { setDragging } = useOverlayStore();

  const startDrag = useCallback(
    async (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click

      setDragging(true);
      const window = getCurrentWindow();
      await window.startDragging();
      setDragging(false);
    },
    [setDragging]
  );

  return { startDrag };
}
