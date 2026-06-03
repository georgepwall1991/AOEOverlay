import { describe, it, expect } from "vitest";
import {
  monitorToBounds,
  isRectVisible,
  clampOntoMonitor,
  keepOnScreen,
  type Rect,
} from "./windowBounds";

const FHD: Rect = { x: 0, y: 0, width: 1920, height: 1080 };
// A second monitor to the right (common dual-monitor layout)
const RIGHT: Rect = { x: 1920, y: 0, width: 1920, height: 1080 };

describe("windowBounds", () => {
  describe("monitorToBounds", () => {
    it("flattens a Tauri monitor into a rect", () => {
      const bounds = monitorToBounds({ position: { x: 100, y: 200 }, size: { width: 800, height: 600 } });
      expect(bounds).toEqual({ x: 100, y: 200, width: 800, height: 600 });
    });
  });

  describe("isRectVisible", () => {
    it("returns true for a window fully inside a monitor", () => {
      expect(isRectVisible({ x: 50, y: 50, width: 500, height: 600 }, [FHD])).toBe(true);
    });

    it("returns true when partially visible past the threshold", () => {
      // Window mostly off the left edge but 100px still showing
      expect(isRectVisible({ x: -400, y: 50, width: 500, height: 600 }, [FHD])).toBe(true);
    });

    it("returns false when the window is entirely off all monitors", () => {
      // Saved on a now-disconnected monitor at x=3000
      expect(isRectVisible({ x: 3000, y: 200, width: 500, height: 600 }, [FHD])).toBe(false);
    });

    it("returns false when only a sliver is visible (below threshold)", () => {
      // Only 20px poking onto the screen — not grabbable
      expect(isRectVisible({ x: 1900, y: 50, width: 500, height: 600 }, [FHD])).toBe(false);
    });

    it("considers all monitors", () => {
      expect(isRectVisible({ x: 2000, y: 50, width: 500, height: 600 }, [FHD, RIGHT])).toBe(true);
    });

    it("does nothing (returns visible) when no monitors are known", () => {
      expect(isRectVisible({ x: 9999, y: 9999, width: 500, height: 600 }, [])).toBe(true);
    });
  });

  describe("clampOntoMonitor", () => {
    it("pulls an off-screen window back inside with a margin", () => {
      const result = clampOntoMonitor({ x: 3000, y: 200, width: 500, height: 600 }, FHD);
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.x + 500).toBeLessThanOrEqual(1920);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.y + 600).toBeLessThanOrEqual(1080);
    });

    it("clamps onto a secondary monitor's coordinate space", () => {
      const result = clampOntoMonitor({ x: 5000, y: 200, width: 500, height: 600 }, RIGHT);
      expect(result.x).toBeGreaterThanOrEqual(1920);
      expect(result.x + 500).toBeLessThanOrEqual(3840);
    });

    it("pins to the top-left margin when the window is bigger than the monitor", () => {
      const result = clampOntoMonitor({ x: 9999, y: 9999, width: 4000, height: 3000 }, FHD, 24);
      expect(result).toEqual({ x: 24, y: 24 });
    });

    it("leaves an already-inside window essentially where it is", () => {
      const result = clampOntoMonitor({ x: 100, y: 100, width: 500, height: 600 }, FHD);
      expect(result).toEqual({ x: 100, y: 100 });
    });
  });

  describe("keepOnScreen", () => {
    it("does not move a window that fits", () => {
      const rect: Rect = { x: 100, y: 100, width: 500, height: 600 };
      expect(keepOnScreen(rect, FHD)).toEqual({ x: 100, y: 100 });
    });

    it("anchors to the right edge when growth would overflow it", () => {
      // Right edge would be 1500 + 500 = 2000 > 1920 -> shift left to 1420
      const rect: Rect = { x: 1500, y: 100, width: 500, height: 600 };
      expect(keepOnScreen(rect, FHD)).toEqual({ x: 1420, y: 100 });
    });

    it("anchors to the bottom edge when growth would overflow it", () => {
      // Bottom would be 700 + 600 = 1300 > 1080 -> shift up to 480
      const rect: Rect = { x: 100, y: 700, width: 500, height: 600 };
      expect(keepOnScreen(rect, FHD)).toEqual({ x: 100, y: 480 });
    });

    it("never pushes past the top-left for oversized windows", () => {
      const rect: Rect = { x: 100, y: 100, width: 5000, height: 4000 };
      expect(keepOnScreen(rect, FHD)).toEqual({ x: 0, y: 0 });
    });

    it("respects a secondary monitor's offset", () => {
      // On the right monitor, right edge 3600 + 500 = 4100 > 3840 -> x = 3340
      const rect: Rect = { x: 3600, y: 100, width: 500, height: 600 };
      expect(keepOnScreen(rect, RIGHT)).toEqual({ x: 3340, y: 100 });
    });
  });
});
