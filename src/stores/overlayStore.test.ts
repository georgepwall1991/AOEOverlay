import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOverlayStore } from "./overlayStore";

describe("overlayStore", () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useOverlayStore());
    act(() => {
      result.current.setVisible(true);
      result.current.setDragging(false);
      result.current.setAnimating(false);
    });
  });

  describe("initial state", () => {
    it("starts with overlay visible", () => {
      const { result } = renderHook(() => useOverlayStore());
      expect(result.current.isVisible).toBe(true);
    });

    it("starts not animating", () => {
      const { result } = renderHook(() => useOverlayStore());
      expect(result.current.isAnimating).toBe(false);
    });

    it("starts not dragging", () => {
      const { result } = renderHook(() => useOverlayStore());
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("setVisible", () => {
    it("sets visibility to false", () => {
      const { result } = renderHook(() => useOverlayStore());

      act(() => {
        result.current.setVisible(false);
      });

      expect(result.current.isVisible).toBe(false);
    });

    it("sets visibility to true", () => {
      const { result } = renderHook(() => useOverlayStore());

      act(() => {
        result.current.setVisible(false);
        result.current.setVisible(true);
      });

      expect(result.current.isVisible).toBe(true);
    });
  });

  describe("toggleVisibility", () => {
    it("toggles from visible to hidden", () => {
      const { result } = renderHook(() => useOverlayStore());

      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.toggleVisibility();
      });

      expect(result.current.isVisible).toBe(false);
    });

    it("toggles from hidden to visible", () => {
      const { result } = renderHook(() => useOverlayStore());

      act(() => {
        result.current.setVisible(false);
      });

      expect(result.current.isVisible).toBe(false);

      act(() => {
        result.current.toggleVisibility();
      });

      expect(result.current.isVisible).toBe(true);
    });

    it("toggles multiple times", () => {
      const { result } = renderHook(() => useOverlayStore());

      act(() => {
        result.current.toggleVisibility();
        result.current.toggleVisibility();
        result.current.toggleVisibility();
      });

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe("setDragging", () => {
    it("sets dragging to true", () => {
      const { result } = renderHook(() => useOverlayStore());

      act(() => {
        result.current.setDragging(true);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it("sets dragging to false", () => {
      const { result } = renderHook(() => useOverlayStore());

      act(() => {
        result.current.setDragging(true);
        result.current.setDragging(false);
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("setAnimating", () => {
    it("sets animating to true", () => {
      const { result } = renderHook(() => useOverlayStore());

      act(() => {
        result.current.setAnimating(true);
      });

      expect(result.current.isAnimating).toBe(true);
    });

    it("sets animating to false", () => {
      const { result } = renderHook(() => useOverlayStore());

      act(() => {
        result.current.setAnimating(true);
        result.current.setAnimating(false);
      });

      expect(result.current.isAnimating).toBe(false);
    });
  });
});
