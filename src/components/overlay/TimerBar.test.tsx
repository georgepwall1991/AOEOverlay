import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TimerBar } from "./TimerBar";

// Mock saveConfig
vi.mock("@/lib/tauri", () => ({
  saveConfig: vi.fn().mockResolvedValue(undefined),
}));

// Mock stores
const mockUpdateConfig = vi.fn();
vi.mock("@/stores", () => ({
  useConfigStore: vi.fn(() => ({
    config: {
      voice: { enabled: true },
      timerDrift: { enabled: false },
    },
    updateConfig: mockUpdateConfig,
  })),
  useAccumulatedDrift: vi.fn(() => 0),
}));

// Mock hooks
const mockStopSpeaking = vi.fn();
vi.mock("@/hooks", () => ({
  useTimer: vi.fn(() => ({
    isRunning: true,
    isPaused: false,
    timerDisplay: "2:30",
    deltaDisplay: "+0:05",
    deltaStatus: "ahead",
  })),
  useTTS: vi.fn(() => ({
    stopSpeaking: mockStopSpeaking,
  })),
}));

// Mock timerStore exports
vi.mock("@/stores/timerStore", () => ({
  parseTimingToSeconds: vi.fn((t: string) => {
    const parts = t.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }),
  formatTime: vi.fn((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  logTelemetryEvent: vi.fn(),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Clock: ({ className }: { className?: string }) => (
    <span data-testid="clock-icon" className={className}>🕐</span>
  ),
  Volume2: ({ className }: { className?: string }) => (
    <span data-testid="volume-on" className={className}>🔊</span>
  ),
  VolumeX: ({ className }: { className?: string }) => (
    <span data-testid="volume-off" className={className}>🔇</span>
  ),
  ChevronUp: ({ className }: { className?: string }) => (
    <span data-testid="chevron-up" className={className}>▲</span>
  ),
  ChevronDown: ({ className }: { className?: string }) => (
    <span data-testid="chevron-down" className={className}>▼</span>
  ),
  Pause: ({ className }: { className?: string }) => (
    <span data-testid="pause-icon" className={className}>⏸</span>
  ),
}));

describe("TimerBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("full mode rendering", () => {
    it("renders timer display", () => {
      render(<TimerBar />);
      expect(screen.getByText("2:30")).toBeInTheDocument();
    });

    it("renders clock icon when running", () => {
      render(<TimerBar />);
      expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
    });

    it("renders delta display when ahead", () => {
      render(<TimerBar />);
      expect(screen.getByText("+0:05")).toBeInTheDocument();
    });

    it("renders chevron up icon when ahead", () => {
      render(<TimerBar />);
      expect(screen.getByTestId("chevron-up")).toBeInTheDocument();
    });

    it("renders voice toggle button", () => {
      render(<TimerBar />);
      const muteButton = screen.getByTitle("Mute voice coaching");
      expect(muteButton).toBeInTheDocument();
    });

    it("renders volume on icon when voice enabled", () => {
      render(<TimerBar />);
      expect(screen.getByTestId("volume-on")).toBeInTheDocument();
    });
  });

  describe("compact mode", () => {
    it("renders compact timer display", () => {
      render(<TimerBar compact />);
      expect(screen.getByText("2:30")).toBeInTheDocument();
    });

    it("renders compact delta display", () => {
      render(<TimerBar compact />);
      expect(screen.getByText("+0:05")).toBeInTheDocument();
    });

    it("renders clock icon in compact mode", () => {
      render(<TimerBar compact />);
      expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
    });
  });

  describe("voice toggle", () => {
    it("toggles voice when button is clicked", async () => {
      render(<TimerBar />);
      const muteButton = screen.getByTitle("Mute voice coaching");

      await act(async () => {
        fireEvent.click(muteButton);
      });

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        voice: expect.objectContaining({ enabled: false }),
      });
    });

    it("stops speaking when voice is disabled", async () => {
      render(<TimerBar />);
      const muteButton = screen.getByTitle("Mute voice coaching");

      await act(async () => {
        fireEvent.click(muteButton);
      });

      expect(mockStopSpeaking).toHaveBeenCalled();
    });
  });

  describe("target timing", () => {
    it("renders target timing when provided", () => {
      render(<TimerBar targetTiming="3:00" />);
      expect(screen.getByText("Target:")).toBeInTheDocument();
      expect(screen.getByText("3:00")).toBeInTheDocument();
    });

    it("does not render target timing when not provided", () => {
      render(<TimerBar />);
      expect(screen.queryByText("Target:")).not.toBeInTheDocument();
    });
  });

  describe("delta pulse animation", () => {
    it("triggers pulse animation when delta changes", async () => {
      const { rerender } = render(<TimerBar />);

      // Trigger a re-render with different delta
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      rerender(<TimerBar />);

      // Delta should still be displayed
      expect(screen.getByText("+0:05")).toBeInTheDocument();
    });
  });
});

describe("TimerBar with different states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows pause icon when paused", async () => {
    const { useTimer } = await import("@/hooks");
    vi.mocked(useTimer).mockReturnValue({
      isRunning: false,
      isPaused: true,
      elapsedSeconds: 150,
      lastDelta: null,
      timerDisplay: "2:30",
      deltaDisplay: null,
      deltaCompact: null,
      deltaStatus: null,
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      toggle: vi.fn(),
      reset: vi.fn(),
      recordStep: vi.fn(),
    });

    render(<TimerBar />);
    expect(screen.getByTestId("pause-icon")).toBeInTheDocument();
    expect(screen.getByText(/PAUSED/)).toBeInTheDocument();
  });

  it("shows behind status with chevron down", async () => {
    const { useTimer } = await import("@/hooks");
    vi.mocked(useTimer).mockReturnValue({
      isRunning: true,
      isPaused: false,
      elapsedSeconds: 150,
      lastDelta: -10,
      timerDisplay: "2:30",
      deltaDisplay: "-0:10",
      deltaCompact: "-10s",
      deltaStatus: "behind",
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      toggle: vi.fn(),
      reset: vi.fn(),
      recordStep: vi.fn(),
    });

    render(<TimerBar />);
    expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
    expect(screen.getByText("-0:10")).toBeInTheDocument();
  });

  it("shows on-pace status without chevron", async () => {
    const { useTimer } = await import("@/hooks");
    vi.mocked(useTimer).mockReturnValue({
      isRunning: true,
      isPaused: false,
      elapsedSeconds: 150,
      lastDelta: 0,
      timerDisplay: "2:30",
      deltaDisplay: "0:00",
      deltaCompact: "0s",
      deltaStatus: "on-pace",
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      toggle: vi.fn(),
      reset: vi.fn(),
      recordStep: vi.fn(),
    });

    render(<TimerBar />);
    expect(screen.queryByTestId("chevron-up")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chevron-down")).not.toBeInTheDocument();
  });

  it("shows volume off icon when voice disabled", async () => {
    const { useConfigStore } = await import("@/stores");
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        voice: { enabled: false },
        timerDrift: { enabled: false },
      },
      updateConfig: mockUpdateConfig,
    });

    render(<TimerBar />);
    expect(screen.getByTestId("volume-off")).toBeInTheDocument();
    expect(screen.getByTitle("Enable voice coaching")).toBeInTheDocument();
  });

  it("shows compact paused state", async () => {
    const { useTimer } = await import("@/hooks");
    vi.mocked(useTimer).mockReturnValue({
      isRunning: false,
      isPaused: true,
      elapsedSeconds: 105,
      lastDelta: null,
      timerDisplay: "1:45",
      deltaDisplay: null,
      deltaCompact: null,
      deltaStatus: null,
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      toggle: vi.fn(),
      reset: vi.fn(),
      recordStep: vi.fn(),
    });

    render(<TimerBar compact />);
    expect(screen.getByText("PAUSED")).toBeInTheDocument();
    expect(screen.getByTestId("pause-icon")).toBeInTheDocument();
  });

  it("shows dash when no delta display", async () => {
    const { useTimer } = await import("@/hooks");
    vi.mocked(useTimer).mockReturnValue({
      isRunning: true,
      isPaused: false,
      elapsedSeconds: 30,
      lastDelta: null,
      timerDisplay: "0:30",
      deltaDisplay: null,
      deltaCompact: null,
      deltaStatus: null,
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      toggle: vi.fn(),
      reset: vi.fn(),
      recordStep: vi.fn(),
    });

    render(<TimerBar />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
