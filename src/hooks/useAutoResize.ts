import { useEffect, useRef, useCallback } from "react";
import { getCurrentWindow, LogicalSize, getCurrentMonitor, setWindowPosition } from "@/lib/tauri";
import { keepOnScreen, monitorToBounds } from "@/lib/windowBounds";

// Window interface with setSize accepting LogicalSize
interface ResizableWindow {
  setSize: (size: LogicalSize) => Promise<void>;
  outerPosition?: () => Promise<{ x: number; y: number }>;
  outerSize?: () => Promise<{ width: number; height: number }>;
}

/**
 * After a resize, nudge the window inward if it now spills past the right/bottom
 * edge of its monitor, so the overlay anchors to the nearest edge instead of
 * creeping off-screen as build-order steps grow/shrink. No-op in mock/test.
 */
async function anchorOnScreen(win: ResizableWindow) {
  const monitor = await getCurrentMonitor();
  if (!monitor || !win.outerPosition || !win.outerSize) return;
  const pos = await win.outerPosition();
  const size = await win.outerSize();
  const next = keepOnScreen(
    { x: pos.x, y: pos.y, width: size.width, height: size.height },
    monitorToBounds(monitor)
  );
  if (next.x !== pos.x || next.y !== pos.y) {
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
        await win.setSize(new LogicalSize(newWidth, newHeight));
        await anchorOnScreen(win);
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
