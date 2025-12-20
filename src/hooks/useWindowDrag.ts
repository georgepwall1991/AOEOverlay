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
      e.stopPropagation();

      // Prevent multiple simultaneous drag operations
      if (isDraggingRef.current) return;
      isDraggingRef.current = true;

      setDragging(true);
      try {
        const window = getCurrentWindow();
        // Check if startDragging exists (it might not in all mock/test environments)
        if (typeof (window as any).startDragging === 'function') {
          await (window as any).startDragging();
        } else {
          console.warn("[useWindowDrag] startDragging not supported on current window");
        }
      } catch (error) {
        console.error("Failed to start window drag:", error);
      } finally {
        // Always reset state, even if dragging fails or completes
        isDraggingRef.current = false;
        setDragging(false);
      }
    },
    [setDragging]
  );

  return { startDrag };
}
