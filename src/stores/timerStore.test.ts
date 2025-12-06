import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  parseTimingToSeconds,
  formatTime,
  formatDelta,
  formatDeltaCompact,
  useTimerStore,
  useIsTimerRunning,
  useIsTimerPaused,
  useElapsedSeconds,
  useLastDelta,
  useTimerDisplay,
  useDeltaDisplay,
  useAccumulatedDrift,
} from "./timerStore";

describe("timerStore utilities", () => {
  describe("parseTimingToSeconds", () => {
    it("parses mm:ss format correctly", () => {
      expect(parseTimingToSeconds("3:30")).toBe(210);
      expect(parseTimingToSeconds("0:45")).toBe(45);
      expect(parseTimingToSeconds("10:00")).toBe(600);
      expect(parseTimingToSeconds("1:05")).toBe(65);
    });

    it("handles zero values", () => {
      expect(parseTimingToSeconds("0:00")).toBe(0);
      expect(parseTimingToSeconds("0:01")).toBe(1);
    });

    it("returns null for undefined input", () => {
      expect(parseTimingToSeconds(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseTimingToSeconds("")).toBeNull();
    });

    it("returns null for invalid format", () => {
      expect(parseTimingToSeconds("invalid")).toBeNull();
      expect(parseTimingToSeconds("3")).toBeNull();
      expect(parseTimingToSeconds("abc:def")).toBeNull();
      expect(parseTimingToSeconds("1:2:3:4")).toBeNull(); // Too many parts
    });

    it("handles large minute values", () => {
      expect(parseTimingToSeconds("60:00")).toBe(3600);
      expect(parseTimingToSeconds("120:30")).toBe(7230);
    });

    it("parses hh:mm:ss format correctly", () => {
      expect(parseTimingToSeconds("1:00:00")).toBe(3600);
      expect(parseTimingToSeconds("1:30:00")).toBe(5400);
      expect(parseTimingToSeconds("2:15:30")).toBe(8130);
      expect(parseTimingToSeconds("0:45:30")).toBe(2730);
    });

    it("handles edge cases in hh:mm:ss format", () => {
      expect(parseTimingToSeconds("0:00:00")).toBe(0);
      expect(parseTimingToSeconds("0:00:01")).toBe(1);
      expect(parseTimingToSeconds("10:00:00")).toBe(36000);
    });

    it("returns null for invalid hh:mm:ss format", () => {
      expect(parseTimingToSeconds("a:00:00")).toBeNull();
      expect(parseTimingToSeconds("1:b:00")).toBeNull();
      expect(parseTimingToSeconds("1:00:c")).toBeNull();
    });
  });

  describe("formatTime", () => {
    it("formats seconds to mm:ss", () => {
      expect(formatTime(0)).toBe("0:00");
      expect(formatTime(45)).toBe("0:45");
      expect(formatTime(90)).toBe("1:30");
      expect(formatTime(600)).toBe("10:00");
    });

    it("pads single-digit seconds with zero", () => {
      expect(formatTime(5)).toBe("0:05");
      expect(formatTime(65)).toBe("1:05");
      expect(formatTime(605)).toBe("10:05");
    });

    it("handles large values", () => {
      expect(formatTime(3600)).toBe("60:00");
      expect(formatTime(3661)).toBe("61:01");
    });
  });

  describe("formatDelta", () => {
    it("formats negative delta (ahead of schedule)", () => {
      expect(formatDelta(-15)).toBe("-0:15");
      expect(formatDelta(-90)).toBe("-1:30");
      expect(formatDelta(-5)).toBe("-0:05");
    });

    it("formats positive delta (behind schedule)", () => {
      expect(formatDelta(15)).toBe("+0:15");
      expect(formatDelta(90)).toBe("+1:30");
      expect(formatDelta(5)).toBe("+0:05");
    });

    it("handles zero delta", () => {
      expect(formatDelta(0)).toBe("0:00");
    });
  });

  describe("formatDeltaCompact", () => {
    it("formats negative delta (ahead)", () => {
      expect(formatDeltaCompact(-15)).toBe("-15s");
      expect(formatDeltaCompact(-90)).toBe("-90s");
    });

    it("formats positive delta (behind)", () => {
      expect(formatDeltaCompact(15)).toBe("+15s");
      expect(formatDeltaCompact(30)).toBe("+30s");
    });

    it("handles zero delta", () => {
      expect(formatDeltaCompact(0)).toBe("0s");
    });
  });
});

describe("timerStore state management", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store state before each test
    const { result } = renderHook(() => useTimerStore());
    act(() => {
      result.current.resetTimer();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("starts with correct default values", () => {
      const { result } = renderHook(() => useTimerStore());

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.startedAt).toBeNull();
      expect(result.current.accumulatedTime).toBe(0);
      expect(result.current.elapsedSeconds).toBe(0);
      expect(result.current.lastStepTime).toBeNull();
      expect(result.current.lastDelta).toBeNull();
      expect(result.current.accumulatedDrift).toBe(0);
    });
  });

  describe("startTimer", () => {
    it("starts timer and sets running state", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.startedAt).not.toBeNull();
    });

    it("does not restart if already running", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
      });

      const firstStartTime = result.current.startedAt;

      act(() => {
        vi.advanceTimersByTime(1000);
        result.current.startTimer();
      });

      expect(result.current.startedAt).toBe(firstStartTime);
    });

    it("resets state when starting fresh", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
      });

      expect(result.current.elapsedSeconds).toBe(0);
      expect(result.current.lastStepTime).toBeNull();
      expect(result.current.lastDelta).toBeNull();
    });
  });

  describe("pauseTimer", () => {
    it("pauses running timer and saves accumulated time", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
        result.current.tick();
      });

      expect(result.current.elapsedSeconds).toBe(5);

      act(() => {
        result.current.pauseTimer();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(true);
      expect(result.current.startedAt).toBeNull();
      expect(result.current.accumulatedTime).toBeGreaterThan(0);
    });

    it("does nothing if timer is not running", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.pauseTimer();
      });

      expect(result.current.isPaused).toBe(false);
      expect(result.current.accumulatedTime).toBe(0);
    });
  });

  describe("resumeTimer", () => {
    it("resumes from paused state", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(3000);
        result.current.tick();
        result.current.pauseTimer();
      });

      const accumulatedBeforeResume = result.current.accumulatedTime;

      act(() => {
        vi.advanceTimersByTime(5000); // Time passes while paused
        result.current.resumeTimer();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.startedAt).not.toBeNull();
      expect(result.current.accumulatedTime).toBe(accumulatedBeforeResume);
    });

    it("does nothing if not paused", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.resumeTimer();
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe("togglePause", () => {
    it("pauses running timer", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
      });

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(true);
    });

    it("resumes paused timer", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        result.current.pauseTimer();
      });

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });

    it("does nothing if timer not started", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe("stopTimer", () => {
    it("stops running timer", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(3000);
        result.current.tick();
      });

      act(() => {
        result.current.stopTimer();
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe("resetTimer", () => {
    it("resets all timer state to initial values", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(5000);
        result.current.tick();
        result.current.recordStepTime("0:10");
      });

      act(() => {
        result.current.resetTimer();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.startedAt).toBeNull();
      expect(result.current.accumulatedTime).toBe(0);
      expect(result.current.elapsedSeconds).toBe(0);
      expect(result.current.lastStepTime).toBeNull();
      expect(result.current.lastDelta).toBeNull();
      expect(result.current.accumulatedDrift).toBe(0);
    });
  });

  describe("tick", () => {
    it("updates elapsed seconds while running", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
        result.current.tick();
      });

      expect(result.current.elapsedSeconds).toBe(3);

      act(() => {
        vi.advanceTimersByTime(2000);
        result.current.tick();
      });

      expect(result.current.elapsedSeconds).toBe(5);
    });

    it("does nothing if not running", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        vi.advanceTimersByTime(3000);
        result.current.tick();
      });

      expect(result.current.elapsedSeconds).toBe(0);
    });

    it("accounts for accumulated time from pause", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(3000);
        result.current.tick();
        result.current.pauseTimer();
      });

      expect(result.current.elapsedSeconds).toBe(3);

      act(() => {
        vi.advanceTimersByTime(5000); // Time passes while paused
        result.current.resumeTimer();
        vi.advanceTimersByTime(2000);
        result.current.tick();
      });

      // Should be 3s (before pause) + 2s (after resume) = 5s
      expect(result.current.elapsedSeconds).toBe(5);
    });
  });

  describe("recordStepTime", () => {
    it("records step time and calculates positive delta (behind)", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(150000); // 2:30 elapsed
        result.current.tick();
      });

      act(() => {
        result.current.recordStepTime("2:00"); // Suggested timing was 2:00
      });

      expect(result.current.lastStepTime).toBe(150);
      expect(result.current.lastDelta).toBe(30); // 30s behind
      expect(result.current.accumulatedDrift).toBe(30);
    });

    it("calculates negative delta (ahead of schedule)", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(90000); // 1:30 elapsed
        result.current.tick();
      });

      act(() => {
        result.current.recordStepTime("2:00"); // Suggested timing was 2:00
      });

      expect(result.current.lastStepTime).toBe(90);
      expect(result.current.lastDelta).toBe(-30); // 30s ahead
      expect(result.current.accumulatedDrift).toBe(-30);
    });

    it("handles undefined timing", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(5000);
        result.current.tick();
      });

      act(() => {
        result.current.recordStepTime(undefined);
      });

      expect(result.current.lastStepTime).toBe(5);
      expect(result.current.lastDelta).toBeNull();
    });

    it("records step time even when not running", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.recordStepTime("1:00");
      });

      expect(result.current.lastStepTime).toBe(0);
      expect(result.current.lastDelta).toBe(-60); // 60s ahead
    });
  });
});

describe("timerStore selectors", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTimerStore());
    act(() => {
      result.current.resetTimer();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("useIsTimerRunning returns running state", () => {
    const { result: storeResult } = renderHook(() => useTimerStore());
    const { result: selectorResult } = renderHook(() => useIsTimerRunning());

    expect(selectorResult.current).toBe(false);

    act(() => {
      storeResult.current.startTimer();
    });

    expect(selectorResult.current).toBe(true);
  });

  it("useIsTimerPaused returns paused state", () => {
    const { result: storeResult } = renderHook(() => useTimerStore());
    const { result: selectorResult } = renderHook(() => useIsTimerPaused());

    expect(selectorResult.current).toBe(false);

    act(() => {
      storeResult.current.startTimer();
      storeResult.current.pauseTimer();
    });

    expect(selectorResult.current).toBe(true);
  });

  it("useElapsedSeconds returns elapsed time", () => {
    const { result: storeResult } = renderHook(() => useTimerStore());
    const { result: selectorResult } = renderHook(() => useElapsedSeconds());

    expect(selectorResult.current).toBe(0);

    act(() => {
      storeResult.current.startTimer();
      vi.advanceTimersByTime(5000);
      storeResult.current.tick();
    });

    expect(selectorResult.current).toBe(5);
  });

  it("useLastDelta returns delta value", () => {
    const { result: storeResult } = renderHook(() => useTimerStore());
    const { result: selectorResult } = renderHook(() => useLastDelta());

    expect(selectorResult.current).toBeNull();

    act(() => {
      storeResult.current.startTimer();
      vi.advanceTimersByTime(90000);
      storeResult.current.tick();
      storeResult.current.recordStepTime("2:00");
    });

    expect(selectorResult.current).toBe(-30);
  });

  it("useTimerDisplay returns formatted time", () => {
    const { result: storeResult } = renderHook(() => useTimerStore());
    const { result: selectorResult } = renderHook(() => useTimerDisplay());

    expect(selectorResult.current).toBe("0:00");

    act(() => {
      storeResult.current.startTimer();
      vi.advanceTimersByTime(95000);
      storeResult.current.tick();
    });

    expect(selectorResult.current).toBe("1:35");
  });

  it("useDeltaDisplay returns formatted delta or null", () => {
    const { result: storeResult } = renderHook(() => useTimerStore());
    const { result: selectorResult } = renderHook(() => useDeltaDisplay());

    expect(selectorResult.current).toBeNull();

    act(() => {
      storeResult.current.startTimer();
      vi.advanceTimersByTime(150000);
      storeResult.current.tick();
      storeResult.current.recordStepTime("2:00");
    });

    expect(selectorResult.current).toBe("+0:30");
  });

  it("useAccumulatedDrift returns drift value", () => {
    const { result: storeResult } = renderHook(() => useTimerStore());
    const { result: selectorResult } = renderHook(() => useAccumulatedDrift());

    expect(selectorResult.current).toBe(0);

    act(() => {
      storeResult.current.startTimer();
      vi.advanceTimersByTime(150000);
      storeResult.current.tick();
      storeResult.current.recordStepTime("2:00");
    });

    expect(selectorResult.current).toBe(30);
  });
});
