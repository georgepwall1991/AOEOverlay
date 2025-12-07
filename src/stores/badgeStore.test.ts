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

  describe("edge cases", () => {
    it("handles empty string badge id", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("");
      });

      expect(result.current.dismissedBadges.has("")).toBe(true);
      expect(result.current.isBadgeDismissed("")).toBe(true);
    });

    it("handles badge id with special characters", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("badge-with-dashes");
        result.current.dismissBadge("badge_with_underscores");
        result.current.dismissBadge("badge.with.dots");
      });

      expect(result.current.isBadgeDismissed("badge-with-dashes")).toBe(true);
      expect(result.current.isBadgeDismissed("badge_with_underscores")).toBe(true);
      expect(result.current.isBadgeDismissed("badge.with.dots")).toBe(true);
    });

    it("handles very long badge ids", () => {
      const { result } = renderHook(() => useBadgeStore());
      const longId = "a".repeat(1000);

      act(() => {
        result.current.dismissBadge(longId);
      });

      expect(result.current.isBadgeDismissed(longId)).toBe(true);
    });

    it("handles unicode badge ids", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("badge_émoji_🎮");
        result.current.dismissBadge("日本語バッジ");
      });

      expect(result.current.isBadgeDismissed("badge_émoji_🎮")).toBe(true);
      expect(result.current.isBadgeDismissed("日本語バッジ")).toBe(true);
    });

    it("is case sensitive", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        result.current.dismissBadge("Wheelbarrow");
      });

      expect(result.current.isBadgeDismissed("Wheelbarrow")).toBe(true);
      expect(result.current.isBadgeDismissed("wheelbarrow")).toBe(false);
      expect(result.current.isBadgeDismissed("WHEELBARROW")).toBe(false);
    });

    it("handles dismissing many badges", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.dismissBadge(`badge_${i}`);
        }
      });

      expect(result.current.dismissedBadges.size).toBe(100);
      expect(result.current.isBadgeDismissed("badge_0")).toBe(true);
      expect(result.current.isBadgeDismissed("badge_99")).toBe(true);
    });

    it("reset works with many dismissed badges", () => {
      const { result } = renderHook(() => useBadgeStore());

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.dismissBadge(`badge_${i}`);
        }
      });

      expect(result.current.dismissedBadges.size).toBe(50);

      act(() => {
        result.current.resetBadges();
      });

      expect(result.current.dismissedBadges.size).toBe(0);
      expect(result.current.isBadgeDismissed("badge_0")).toBe(false);
    });
  });
});
