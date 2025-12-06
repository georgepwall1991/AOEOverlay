import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBadgeStore } from "./badgeStore";

describe("badgeStore", () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useBadgeStore());
    act(() => {
      result.current.resetBadges();
    });
  });

  describe("initial state", () => {
    it("starts with empty dismissed badges", () => {
      const { result } = renderHook(() => useBadgeStore());
      expect(result.current.dismissedBadges.size).toBe(0);
    });
  });

  describe("dismissBadge", () => {
    it("adds badge to dismissed set", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("wheelbarrow");
      });

      expect(result.current.dismissedBadges.has("wheelbarrow")).toBe(true);
    });

    it("dismisses multiple badges", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("wheelbarrow");
        result.current.dismissBadge("textiles");
        result.current.dismissBadge("blacksmith_attack");
      });

      expect(result.current.dismissedBadges.size).toBe(3);
      expect(result.current.dismissedBadges.has("wheelbarrow")).toBe(true);
      expect(result.current.dismissedBadges.has("textiles")).toBe(true);
      expect(result.current.dismissedBadges.has("blacksmith_attack")).toBe(true);
    });

    it("does not duplicate when dismissing same badge twice", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("wheelbarrow");
        result.current.dismissBadge("wheelbarrow");
      });

      expect(result.current.dismissedBadges.size).toBe(1);
    });
  });

  describe("resetBadges", () => {
    it("clears all dismissed badges", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("wheelbarrow");
        result.current.dismissBadge("textiles");
      });

      expect(result.current.dismissedBadges.size).toBe(2);

      act(() => {
        result.current.resetBadges();
      });

      expect(result.current.dismissedBadges.size).toBe(0);
    });

    it("works when already empty", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.resetBadges();
      });

      expect(result.current.dismissedBadges.size).toBe(0);
    });
  });

  describe("isBadgeDismissed", () => {
    it("returns false for non-dismissed badge", () => {
      const { result } = renderHook(() => useBadgeStore());

      expect(result.current.isBadgeDismissed("wheelbarrow")).toBe(false);
    });

    it("returns true for dismissed badge", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("wheelbarrow");
      });

      expect(result.current.isBadgeDismissed("wheelbarrow")).toBe(true);
    });

    it("returns false after reset", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("wheelbarrow");
      });

      expect(result.current.isBadgeDismissed("wheelbarrow")).toBe(true);

      act(() => {
        result.current.resetBadges();
      });

      expect(result.current.isBadgeDismissed("wheelbarrow")).toBe(false);
    });
  });
});
