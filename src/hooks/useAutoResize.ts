import { useEffect, useRef, useCallback } from "react";
import { getCurrentWindow, LogicalSize, getCurrentMonitor, setWindowPosition } from "@/lib/tauri";
import { anchorResize, inferCorner, monitorToBounds, type Rect } from "@/lib/windowBounds";

// Window interface with setSize accepting LogicalSize
interface ResizableWindow {
  setSize: (size: LogicalSize) => Promise<void>;
  outerPosition?: () => Promise<{ x: number; y: number }>;
  outerSize?: () => Promise<{ width: number; height: number }>;
}

/**
 * After a resize, hold the overlay's anchored corner fixed — inferred from which
 * corner of the monitor the window sits in. A top-right overlay grows leftward
 * and shrinks back toward the top-right instead of leaving a gap; the result is
 * still clamped on-screen. `before` is the window rect captured before the
 * resize. No-op in mock/test, where physical position/size aren't available.
 */
async function reanchorAfterResize(win: ResizableWindow, before: Rect | null) {
  if (!before || !win.outerPosition || !win.outerSize) return;
  const monitor = await getCurrentMonitor();
  if (!monitor) return;
  const newSize = await win.outerSize();
  const bounds = monitorToBounds(monitor);
  const corner = inferCorner(before, bounds);
  const next = anchorResize(before, newSize, corner, bounds);
  const cur = await win.outerPosition();
  if (next.x !== cur.x || next.y !== cur.y) {
    await setWindowPosition(next.x, next.y);
  }
}

export function useAutoResize() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const resizeTimeoutRef = useRef<number | null>(null);
  const MIN_WIDTH = 400;
  const MIN_HEIGHT = 180;

  const resize = useCallback(async () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    // Avoid shrinking to a tiny window before layout is ready (notably on Windows/WebView2).
    if (!rect.width || !rect.height) return;
    // Add generous padding for window chrome and shadows
    const newWidth = Math.max(MIN_WIDTH, Math.ceil(rect.width) + 12);
    const newHeight = Math.max(MIN_HEIGHT, Math.ceil(rect.height) + 12);

    // Only resize if dimensions changed significantly (more than 2px)
    if (
      Math.abs(newWidth - lastSizeRef.current.width) > 2 ||
      Math.abs(newHeight - lastSizeRef.current.height) > 2
    ) {
      lastSizeRef.current = { width: newWidth, height: newHeight };

      try {
        const win = getCurrentWindow() as ResizableWindow;

        // Capture the pre-resize rect (physical px) so the anchored corner can
        // stay put once the new size is applied.
        let before: Rect | null = null;
        if (win.outerPosition && win.outerSize) {
          const p = await win.outerPosition();
          const s = await win.outerSize();
          before = { x: p.x, y: p.y, width: s.width, height: s.height };
        }

        await win.setSize(new LogicalSize(newWidth, newHeight));
        await reanchorAfterResize(win, before);
      } catch (e) {
        console.error("Failed to resize window:", e);
      }
    }
  }, []);

  useEffect(() => {
    // Initial resize after mount
    const initialTimeout = setTimeout(resize, 150);

    // Setup ResizeObserver for content changes
    const observer = new ResizeObserver(() => {
      // Debounce resize calls
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(resize, 16);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(initialTimeout);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      observer.disconnect();
    };
  }, [resize]);

  return containerRef;
}
