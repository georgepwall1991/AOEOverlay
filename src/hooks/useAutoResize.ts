import { useEffect, useRef, useCallback } from "react";
import { getCurrentWindow, LogicalSize } from "@/lib/tauri";

export function useAutoResize() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const resizeTimeoutRef = useRef<number | null>(null);
  const MIN_WIDTH = 320;
  const MIN_HEIGHT = 200;

  const resize = useCallback(async () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    // Avoid shrinking to a tiny window before layout is ready (notably on Windows/WebView2).
    if (!rect.width || !rect.height) return;
    // Add small padding for window chrome
    const newWidth = Math.max(MIN_WIDTH, Math.ceil(rect.width) + 4);
    const newHeight = Math.max(MIN_HEIGHT, Math.ceil(rect.height) + 4);

    // Only resize if dimensions changed significantly (more than 2px)
    if (
      Math.abs(newWidth - lastSizeRef.current.width) > 2 ||
      Math.abs(newHeight - lastSizeRef.current.height) > 2
    ) {
      lastSizeRef.current = { width: newWidth, height: newHeight };

      try {
        const window = getCurrentWindow();
        await window.setSize(new LogicalSize(newWidth, newHeight) as any);
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
