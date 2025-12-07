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
    vi.spyOn(performance, "now").mockImplementation(() => Date.now());
    // Reset store state before each test
    const { result } = renderHook(() => useTimerStore());
    act(() => {
      result.current.resetTimer();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    it("stops running timer and clears accumulated time", () => {
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
      expect(result.current.isPaused).toBe(false);
      expect(result.current.elapsedSeconds).toBe(0);
      expect(result.current.accumulatedTime).toBe(0);
      expect(result.current.lastStepTime).toBeNull();
      expect(result.current.lastDelta).toBeNull();
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
    vi.spyOn(performance, "now").mockImplementation(() => Date.now());
    const { result } = renderHook(() => useTimerStore());
    act(() => {
      result.current.resetTimer();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("useIsTimerRunning returns running state", () => {
    const { result: selectorResult } = renderHook(() => useIsTimerRunning());

    expect(selectorResult.current).toBe(false);

    act(() => {
      useTimerStore.getState().startTimer();
    });

    expect(selectorResult.current).toBe(true);
  });

  it("useIsTimerPaused returns paused state", () => {
    const { result: selectorResult } = renderHook(() => useIsTimerPaused());

    expect(selectorResult.current).toBe(false);

    act(() => {
      useTimerStore.getState().startTimer();
      useTimerStore.getState().pauseTimer();
    });

    expect(selectorResult.current).toBe(true);
  });

  it("useElapsedSeconds returns elapsed time", () => {
    const { result: selectorResult } = renderHook(() => useElapsedSeconds());

    expect(selectorResult.current).toBe(0);

    act(() => {
      useTimerStore.getState().startTimer();
      vi.advanceTimersByTime(5000);
      useTimerStore.getState().tick();
    });

    expect(selectorResult.current).toBe(5);
  });

  it("useLastDelta returns delta value", () => {
    const { result: selectorResult } = renderHook(() => useLastDelta());

    expect(selectorResult.current).toBeNull();

    act(() => {
      useTimerStore.getState().startTimer();
      vi.advanceTimersByTime(90000);
      useTimerStore.getState().tick();
      useTimerStore.getState().recordStepTime("2:00");
    });

    expect(selectorResult.current).toBe(-30);
  });

  it("useTimerDisplay returns formatted time", () => {
    const { result: selectorResult } = renderHook(() => useTimerDisplay());

    expect(selectorResult.current).toBe("0:00");

    act(() => {
      useTimerStore.getState().startTimer();
      vi.advanceTimersByTime(95000);
      useTimerStore.getState().tick();
    });

    expect(selectorResult.current).toBe("1:35");
  });

  it("useDeltaDisplay returns formatted delta or null", () => {
    const { result: selectorResult } = renderHook(() => useDeltaDisplay());

    expect(selectorResult.current).toBeNull();

    act(() => {
      useTimerStore.getState().startTimer();
      vi.advanceTimersByTime(150000);
      useTimerStore.getState().tick();
      useTimerStore.getState().recordStepTime("2:00");
    });

    expect(selectorResult.current).toBe("+0:30");
  });

  it("useAccumulatedDrift returns drift value", () => {
    const { result: selectorResult } = renderHook(() => useAccumulatedDrift());

    expect(selectorResult.current).toBe(0);

    act(() => {
      useTimerStore.getState().startTimer();
      vi.advanceTimersByTime(150000);
      useTimerStore.getState().tick();
      useTimerStore.getState().recordStepTime("2:00");
    });

    expect(selectorResult.current).toBe(30);
  });
});

describe("timerStore edge cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockImplementation(() => Date.now());
    const { result } = renderHook(() => useTimerStore());
    act(() => {
      result.current.resetTimer();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("parseTimingToSeconds edge cases", () => {
    it("handles whitespace in timing string", () => {
      // parseInt trims leading/trailing whitespace, so these are valid
      expect(parseTimingToSeconds(" 1:30")).toBe(90);
      expect(parseTimingToSeconds("1:30 ")).toBe(90);
    });

    it("handles negative numbers", () => {
      // parseInt handles negative numbers, so -1:30 = -1*60 + 30 = -30
      expect(parseTimingToSeconds("-1:30")).toBe(-30);
    });

    it("handles decimal numbers", () => {
      // parseInt truncates decimals, so 1.5:30 parses as 1:30 = 90
      expect(parseTimingToSeconds("1.5:30")).toBe(90);
    });

    it("handles very large numbers", () => {
      expect(parseTimingToSeconds("9999:59")).toBe(9999 * 60 + 59);
    });

    it("returns null for completely invalid input", () => {
      expect(parseTimingToSeconds("abc:def")).toBeNull();
      expect(parseTimingToSeconds("::")).toBeNull();
    });
  });

  describe("formatDelta edge cases", () => {
    it("handles zero delta", () => {
      expect(formatDelta(0)).toBe("0:00");
    });

    it("handles exactly -1 second", () => {
      expect(formatDelta(-1)).toBe("-0:01");
    });

    it("handles exactly +1 second", () => {
      expect(formatDelta(1)).toBe("+0:01");
    });

    it("handles large negative delta", () => {
      expect(formatDelta(-3600)).toBe("-60:00");
    });

    it("handles large positive delta", () => {
      expect(formatDelta(3600)).toBe("+60:00");
    });
  });

  describe("formatDeltaCompact edge cases", () => {
    it("handles zero", () => {
      expect(formatDeltaCompact(0)).toBe("0s");
    });

    it("handles negative seconds", () => {
      expect(formatDeltaCompact(-30)).toBe("-30s");
    });

    it("handles positive seconds", () => {
      expect(formatDeltaCompact(30)).toBe("+30s");
    });

    it("handles large values", () => {
      expect(formatDeltaCompact(3600)).toBe("+3600s");
      expect(formatDeltaCompact(-3600)).toBe("-3600s");
    });
  });

  describe("startTimer edge cases", () => {
    it("does nothing when already running", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
      });
      const startedAt1 = result.current.startedAt;

      act(() => {
        vi.advanceTimersByTime(1000);
        result.current.startTimer();
      });

      // Should not reset startedAt
      expect(result.current.startedAt).toBe(startedAt1);
      expect(result.current.isRunning).toBe(true);
    });

    it("resumes from accumulated time when not fresh start", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(5000);
        result.current.tick();
        result.current.pauseTimer();
      });

      expect(result.current.elapsedSeconds).toBe(5);
      expect(result.current.accumulatedTime).toBeGreaterThan(0);

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(3000);
        result.current.tick();
      });

      expect(result.current.elapsedSeconds).toBe(8);
    });
  });

  describe("pauseTimer edge cases", () => {
    it("does nothing when not running", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.pauseTimer();
      });

      expect(result.current.isPaused).toBe(false);
      expect(result.current.isRunning).toBe(false);
    });

    it("does nothing when startedAt is null", () => {
      const { result } = renderHook(() => useTimerStore());

      // Force an invalid state
      act(() => {
        useTimerStore.setState({ isRunning: true, startedAt: null });
        result.current.pauseTimer();
      });

      // Should handle gracefully
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe("resumeTimer edge cases", () => {
    it("does nothing when not paused", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.resumeTimer();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe("togglePause edge cases", () => {
    it("does nothing when timer has not started", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });

    it("pauses when running", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        result.current.togglePause();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(true);
    });

    it("resumes when paused", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        result.current.pauseTimer();
        result.current.togglePause();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe("tick edge cases", () => {
    it("does nothing when not running", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.tick();
      });

      expect(result.current.elapsedSeconds).toBe(0);
    });

    it("does nothing when startedAt is null", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        useTimerStore.setState({ isRunning: true, startedAt: null });
        result.current.tick();
      });

      expect(result.current.elapsedSeconds).toBe(0);
    });
  });

  describe("recordStepTime edge cases", () => {
    it("accumulates drift across multiple steps", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(70000); // 1:10
        result.current.tick();
        result.current.recordStepTime("1:00"); // 10s behind
      });

      expect(result.current.accumulatedDrift).toBe(10);

      act(() => {
        vi.advanceTimersByTime(50000); // now at 2:00
        result.current.tick();
        result.current.recordStepTime("2:30"); // 30s ahead
      });

      // 10 + (-30) = -20
      expect(result.current.accumulatedDrift).toBe(-20);
    });

    it("handles invalid timing string", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(5000);
        result.current.tick();
        result.current.recordStepTime("invalid");
      });

      expect(result.current.lastStepTime).toBe(5);
      expect(result.current.lastDelta).toBeNull();
    });
  });

  describe("stopTimer", () => {
    it("resets all state", () => {
      const { result } = renderHook(() => useTimerStore());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(10000);
        result.current.tick();
        result.current.recordStepTime("0:30");
      });

      expect(result.current.elapsedSeconds).toBe(10);
      expect(result.current.accumulatedDrift).not.toBe(0);

      act(() => {
        result.current.stopTimer();
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
});
