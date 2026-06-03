import { describe, it, expect } from "vitest";
import {
  monitorToBounds,
  isRectVisible,
  clampOntoMonitor,
  keepOnScreen,
  inferCorner,
  anchorResize,
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

  describe("inferCorner", () => {
    it("anchors a top-left window to its top-left corner", () => {
      expect(inferCorner({ x: 50, y: 50, width: 500, height: 600 }, FHD)).toBe("top-left");
    });

    it("anchors a top-right window to its top-right corner", () => {
      expect(inferCorner({ x: 1400, y: 50, width: 500, height: 600 }, FHD)).toBe("top-right");
    });

    it("anchors a bottom-left window to its bottom-left corner", () => {
      expect(inferCorner({ x: 50, y: 500, width: 500, height: 500 }, FHD)).toBe("bottom-left");
    });

    it("anchors a bottom-right window to its bottom-right corner", () => {
      expect(inferCorner({ x: 1400, y: 600, width: 500, height: 400 }, FHD)).toBe("bottom-right");
    });

    it("resolves a dead-centered window to top-left", () => {
      // Center exactly on the monitor center (960, 540)
      expect(inferCorner({ x: 710, y: 240, width: 500, height: 600 }, FHD)).toBe("top-left");
    });

    it("uses the window's own monitor coordinate space", () => {
      // Right monitor center is 2880; this window's center (3490) is to its right.
      expect(inferCorner({ x: 3300, y: 50, width: 380, height: 600 }, RIGHT)).toBe("top-right");
    });
  });

  describe("anchorResize", () => {
    it("keeps the top-left fixed when shrinking a top-left overlay", () => {
      const before: Rect = { x: 100, y: 100, width: 500, height: 600 };
      expect(anchorResize(before, { width: 400, height: 450 }, "top-left", FHD)).toEqual({ x: 100, y: 100 });
    });

    it("holds the right edge when a top-right overlay shrinks (closes the gap)", () => {
      // right edge = 1000 + 500 = 1500; after shrink to 400 wide, x = 1500 - 400 = 1100
      const before: Rect = { x: 1000, y: 100, width: 500, height: 600 };
      expect(anchorResize(before, { width: 400, height: 600 }, "top-right", FHD)).toEqual({ x: 1100, y: 100 });
    });

    it("holds the right edge when a top-right overlay grows", () => {
      // right edge 1500 stays; growing to 700 wide pushes x left to 800
      const before: Rect = { x: 1000, y: 100, width: 500, height: 600 };
      expect(anchorResize(before, { width: 700, height: 600 }, "top-right", FHD)).toEqual({ x: 800, y: 100 });
    });

    it("holds the bottom-right corner for a bottom-right overlay", () => {
      // corner = (1500, 1000); shrink to 400x400 -> x=1100, y=600
      const before: Rect = { x: 1000, y: 400, width: 500, height: 600 };
      expect(anchorResize(before, { width: 400, height: 400 }, "bottom-right", FHD)).toEqual({ x: 1100, y: 600 });
    });

    it("holds the bottom edge for a bottom-left overlay", () => {
      // bottom = 1000; shrink height to 400 -> y = 600, x stays 100
      const before: Rect = { x: 100, y: 400, width: 500, height: 600 };
      expect(anchorResize(before, { width: 500, height: 400 }, "bottom-left", FHD)).toEqual({ x: 100, y: 600 });
    });

    it("clamps back on-screen when holding an edge would push it off", () => {
      // Right-anchored growth wider than the monitor would put x negative; clamp to 0.
      const before: Rect = { x: 0, y: 100, width: 1900, height: 600 };
      expect(anchorResize(before, { width: 2000, height: 600 }, "top-right", FHD)).toEqual({ x: 0, y: 100 });
    });
  });
});
