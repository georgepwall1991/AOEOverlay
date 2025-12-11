import { useCallback, useRef } from "react";
import { getCurrentWindow } from "@/lib/tauri";
import { useOverlayStore } from "@/stores";

export function useWindowDrag() {
  const { setDragging } = useOverlayStore();
  // Prevent multiple concurrent drag operations
  const isDraggingRef = useRef(false);

  const startDrag = useCallback(
    async (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click

      // Prevent multiple simultaneous drag operations
      if (isDraggingRef.current) return;
      isDraggingRef.current = true;

      setDragging(true);
      try {
        const window = getCurrentWindow();
        await window.startDragging();
      } catch (error) {
        console.error("Failed to start window drag:", error);
      } finally {
        // Always reset state, even if dragging fails
        isDraggingRef.current = false;
        setDragging(false);
      }
    },
    [setDragging]
  );

  return { startDrag };
}
