/**
 * Pure geometry helpers for keeping the overlay window on a visible monitor.
 *
 * All coordinates are in the same physical-pixel space that Tauri's
 * `outerPosition()`, `outerSize()` and `Monitor.position/size` report, so callers
 * can pass those values straight through without DPI conversion.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MonitorLike {
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/** Converts a Tauri `Monitor` (position + size) into a flat bounds rect. */
export function monitorToBounds(monitor: MonitorLike): Rect {
  return {
    x: monitor.position.x,
    y: monitor.position.y,
    width: monitor.size.width,
    height: monitor.size.height,
  };
}

/** Overlap (in px) between two rects on each axis; negative means a gap. */
function overlap(a: Rect, b: Rect): { x: number; y: number } {
  const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return { x, y };
}

/**
 * True if at least a grabbable slice of `rect` (default ~80×30px — enough to
 * reach the drag header) is visible on any of the given monitors.
 */
export function isRectVisible(
  rect: Rect,
  monitors: Rect[],
  minVisible: { width: number; height: number } = { width: 80, height: 30 }
): boolean {
  if (monitors.length === 0) return true; // unknown setup — don't move anything
  return monitors.some((m) => {
    const o = overlap(rect, m);
    return o.x >= minVisible.width && o.y >= minVisible.height;
  });
}

/**
 * Relocates a (presumably off-screen) window so it sits fully inside `monitor`,
 * keeping a small margin. If the window is larger than the monitor it is pinned
 * to the top-left margin.
 */
export function clampOntoMonitor(rect: Rect, monitor: Rect, margin = 24): { x: number; y: number } {
  const fitsWidth = rect.width + 2 * margin < monitor.width;
  const fitsHeight = rect.height + 2 * margin < monitor.height;

  const x = fitsWidth
    ? clamp(rect.x, monitor.x + margin, monitor.x + monitor.width - rect.width - margin)
    : monitor.x + margin;
  const y = fitsHeight
    ? clamp(rect.y, monitor.y + margin, monitor.y + monitor.height - rect.height - margin)
    : monitor.y + margin;

  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Nudges a window inward only when it spills past the right/bottom edge of its
 * monitor — so as the overlay grows it anchors to the nearest edge instead of
 * creeping off-screen. A window already comfortably inside is returned unchanged.
 */
export function keepOnScreen(rect: Rect, monitor: Rect): { x: number; y: number } {
  let x = rect.x;
  let y = rect.y;

  if (x + rect.width > monitor.x + monitor.width) {
    x = monitor.x + monitor.width - rect.width;
  }
  if (y + rect.height > monitor.y + monitor.height) {
    y = monitor.y + monitor.height - rect.height;
  }
  // Never push past the top/left edge (covers windows wider/taller than the monitor).
  if (x < monitor.x) x = monitor.x;
  if (y < monitor.y) y = monitor.y;

  return { x: Math.round(x), y: Math.round(y) };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
