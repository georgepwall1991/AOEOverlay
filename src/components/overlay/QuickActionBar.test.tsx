import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QuickActionBar } from "./QuickActionBar";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  logTelemetryEvent: vi.fn(),
}));

// Mock stores
const mockNextStep = vi.fn();
const mockPreviousStep = vi.fn();
const mockResetSteps = vi.fn();
const mockCycleBuildOrder = vi.fn();
const mockResetBadges = vi.fn();

vi.mock("@/stores", () => ({
  useBuildOrderStore: vi.fn(() => ({
    currentStepIndex: 1,
    nextStep: mockNextStep,
    previousStep: mockPreviousStep,
    resetSteps: mockResetSteps,
    cycleBuildOrder: mockCycleBuildOrder,
  })),
  useConfigStore: vi.fn(() => ({
    config: {
      hotkeys: {
        previous_step: "F2",
        next_step: "F3",
        toggle_pause: "F1",
        reset_build_order: "F9",
        cycle_build_order: "F4",
      },
    },
  })),
  useActiveSteps: vi.fn(() => [
    { id: "1", description: "Step 1" },
    { id: "2", description: "Step 2" },
    { id: "3", description: "Step 3" },
  ]),
  useBadgeStore: vi.fn(() => ({
    resetBadges: mockResetBadges,
  })),
  useMatchupStore: vi.fn(() => ({
    isOpen: false,
    toggle: vi.fn(),
  })),
}));

// Mock hooks
const mockStart = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();
const mockReset = vi.fn();

vi.mock("@/hooks", () => ({
  useTimer: vi.fn(() => ({
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
    lastDelta: null,
    timerDisplay: "0:00",
    deltaDisplay: null,
    deltaCompact: null,
    deltaStatus: null,
    start: mockStart,
    stop: vi.fn(),
    pause: mockPause,
    resume: mockResume,
    toggle: vi.fn(),
    reset: mockReset,
    recordStep: vi.fn(),
  })),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  SkipBack: ({ className }: { className?: string }) => (
    <span data-testid="skip-back" className={className}>⏮</span>
  ),
  ChevronLeft: ({ className }: { className?: string }) => (
    <span data-testid="chevron-left" className={className}>◀</span>
  ),
  Play: ({ className }: { className?: string }) => (
    <span data-testid="play" className={className}>▶</span>
  ),
  Pause: ({ className }: { className?: string }) => (
    <span data-testid="pause" className={className}>⏸</span>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <span data-testid="chevron-right" className={className}>▶</span>
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <span data-testid="refresh" className={className}>🔄</span>
  ),
  Lock: ({ className }: { className?: string }) => (
    <span data-testid="lock" className={className}>🔒</span>
  ),
  Unlock: ({ className }: { className?: string }) => (
    <span data-testid="unlock" className={className}>🔓</span>
  ),
  Shield: ({ className }: { className?: string }) => (
    <span data-testid="shield" className={className}>🛡️</span>
  ),
}));

describe("QuickActionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders all action buttons", () => {
      render(<QuickActionBar />);
      expect(screen.getByTestId("skip-back")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-left")).toBeInTheDocument();
      expect(screen.getByTestId("play")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-right")).toBeInTheDocument();
      expect(screen.getByTestId("refresh")).toBeInTheDocument();
    });

    it("renders lock button", () => {
      render(<QuickActionBar />);
      expect(screen.getByTestId("unlock")).toBeInTheDocument();
    });

    it("shows hotkey hints in button titles", () => {
      render(<QuickActionBar />);
      expect(screen.getByTitle("Previous Step (F2)")).toBeInTheDocument();
      expect(screen.getByTitle("Next Step (F3)")).toBeInTheDocument();
      expect(screen.getByTitle("Start Timer (F1)")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("calls previousStep when previous button clicked", () => {
      render(<QuickActionBar />);
      const prevButton = screen.getByTitle("Previous Step (F2)");

      fireEvent.click(prevButton);

      expect(mockPreviousStep).toHaveBeenCalled();
    });

    it("calls nextStep when next button clicked", () => {
      render(<QuickActionBar />);
      const nextButton = screen.getByTitle("Next Step (F3)");

      fireEvent.click(nextButton);

      expect(mockNextStep).toHaveBeenCalled();
    });

    it("starts timer when next is clicked and timer not running", () => {
      render(<QuickActionBar />);
      const nextButton = screen.getByTitle("Next Step (F3)");

      fireEvent.click(nextButton);

      expect(mockStart).toHaveBeenCalled();
    });

    it("disables previous button on first step", async () => {
      const { useBuildOrderStore } = await import("@/stores");
      vi.mocked(useBuildOrderStore).mockReturnValue({
        currentStepIndex: 0,
        nextStep: mockNextStep,
        previousStep: mockPreviousStep,
        resetSteps: mockResetSteps,
        cycleBuildOrder: mockCycleBuildOrder,
      });

      render(<QuickActionBar />);
      const prevButton = screen.getByTitle("Previous Step (F2)");

      expect(prevButton).toBeDisabled();
    });

    it("disables next button on last step", async () => {
      const { useBuildOrderStore } = await import("@/stores");
      vi.mocked(useBuildOrderStore).mockReturnValue({
        currentStepIndex: 2, // Last step (0, 1, 2)
        nextStep: mockNextStep,
        previousStep: mockPreviousStep,
        resetSteps: mockResetSteps,
        cycleBuildOrder: mockCycleBuildOrder,
      });

      render(<QuickActionBar />);
      const nextButton = screen.getByTitle("Next Step (F3)");

      expect(nextButton).toBeDisabled();
    });
  });

  describe("timer controls", () => {
    it("starts timer when play button clicked", () => {
      render(<QuickActionBar />);
      const playButton = screen.getByTitle("Start Timer (F1)");

      fireEvent.click(playButton);

      expect(mockStart).toHaveBeenCalled();
    });

    it("pauses timer when running", async () => {
      const { useTimer } = await import("@/hooks");
      vi.mocked(useTimer).mockReturnValue({
        isRunning: true,
        isPaused: false,
        elapsedSeconds: 10,
        lastDelta: null,
        timerDisplay: "0:10",
        deltaDisplay: null,
        deltaCompact: null,
        deltaStatus: null,
        start: mockStart,
        stop: vi.fn(),
        pause: mockPause,
        resume: mockResume,
        toggle: vi.fn(),
        reset: mockReset,
        recordStep: vi.fn(),
      });

      render(<QuickActionBar />);
      expect(screen.getByTestId("pause")).toBeInTheDocument();
      const pauseButton = screen.getByTitle("Pause Timer (F1)");

      fireEvent.click(pauseButton);

      expect(mockPause).toHaveBeenCalled();
    });

    it("resumes timer when paused", async () => {
      const { useTimer } = await import("@/hooks");
      vi.mocked(useTimer).mockReturnValue({
        isRunning: false,
        isPaused: true,
        elapsedSeconds: 10,
        lastDelta: null,
        timerDisplay: "0:10",
        deltaDisplay: null,
        deltaCompact: null,
        deltaStatus: null,
        start: mockStart,
        stop: vi.fn(),
        pause: mockPause,
        resume: mockResume,
        toggle: vi.fn(),
        reset: mockReset,
        recordStep: vi.fn(),
      });

      render(<QuickActionBar />);
      const resumeButton = screen.getByTitle("Resume Timer (F1)");

      fireEvent.click(resumeButton);

      expect(mockResume).toHaveBeenCalled();
    });
  });

  describe("reset functionality", () => {
    it("requires double click to reset (confirmation)", async () => {
      render(<QuickActionBar />);
      // Find button with reset hotkey
      const resetButton = screen.getByTitle(/Reset.*F9/);

      // First click - arm confirmation
      fireEvent.click(resetButton);
      expect(mockResetSteps).not.toHaveBeenCalled();

      // Second click - confirm reset
      fireEvent.click(resetButton);
      expect(mockResetSteps).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();
      expect(mockResetBadges).toHaveBeenCalled();
    });

    it("confirmation times out after 3 seconds", async () => {
      render(<QuickActionBar />);
      const resetButton = screen.getByTitle(/Reset.*F9/);

      // First click - arm confirmation
      fireEvent.click(resetButton);

      // Wait for timeout
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });

      // Click again - should arm again, not reset
      fireEvent.click(resetButton);
      expect(mockResetSteps).not.toHaveBeenCalled();
    });

    it("does not reset when locked", () => {
      render(<QuickActionBar />);

      // Lock first - find button by unlock icon
      const lockButton = screen.getByTestId("unlock").closest("button")!;
      fireEvent.click(lockButton);

      // Try to reset - find by icon
      const resetButton = screen.getByTestId("skip-back").closest("button")!;
      fireEvent.click(resetButton);
      fireEvent.click(resetButton);

      expect(mockResetSteps).not.toHaveBeenCalled();
    });
  });

  describe("lock functionality", () => {
    it("toggles lock state", () => {
      render(<QuickActionBar />);

      // Initially unlocked
      expect(screen.getByTestId("unlock")).toBeInTheDocument();

      // Click to lock - find button by unlock icon
      const lockToggle = screen.getByTestId("unlock").closest("button")!;
      fireEvent.click(lockToggle);

      // Should now show locked icon
      expect(screen.getByTestId("lock")).toBeInTheDocument();
    });

    it("disables reset button when locked", () => {
      render(<QuickActionBar />);

      // Lock - find by icon
      const lockToggle = screen.getByTestId("unlock").closest("button")!;
      fireEvent.click(lockToggle);

      // Reset button should be disabled - find by skip-back icon
      const resetButton = screen.getByTestId("skip-back").closest("button")!;
      expect(resetButton).toBeDisabled();
    });
  });

  describe("cycle build order", () => {
    it("requires double click to cycle (confirmation)", async () => {
      render(<QuickActionBar />);
      const cycleButton = screen.getByTitle("Cycle Build Order (F4)");

      // First click - arm confirmation
      fireEvent.click(cycleButton);
      expect(mockCycleBuildOrder).not.toHaveBeenCalled();

      // Second click - confirm
      fireEvent.click(cycleButton);
      expect(mockCycleBuildOrder).toHaveBeenCalled();
    });

    it("cycle confirmation times out", async () => {
      render(<QuickActionBar />);
      const cycleButton = screen.getByTitle("Cycle Build Order (F4)");

      // First click
      fireEvent.click(cycleButton);

      // Wait for timeout
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });

      // Click again - should arm again
      fireEvent.click(cycleButton);
      expect(mockCycleBuildOrder).not.toHaveBeenCalled();
    });

    it("resets timer and badges on cycle", () => {
      render(<QuickActionBar />);
      const cycleButton = screen.getByTitle("Cycle Build Order (F4)");

      // Double click to confirm
      fireEvent.click(cycleButton);
      fireEvent.click(cycleButton);

      expect(mockReset).toHaveBeenCalled();
      expect(mockResetBadges).toHaveBeenCalled();
    });
  });
});
