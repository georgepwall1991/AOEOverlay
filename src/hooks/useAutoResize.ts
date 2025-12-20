import { useEffect, useRef, useCallback } from "react";
import { getCurrentWindow, LogicalSize } from "@/lib/tauri";

// Window interface with setSize accepting LogicalSize
interface ResizableWindow {
  setSize: (size: LogicalSize) => Promise<void>;
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
