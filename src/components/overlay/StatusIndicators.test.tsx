import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StatusIndicators } from "./StatusIndicators";

// Mock saveConfig from tauri lib
vi.mock("@/lib/tauri", () => ({
  saveConfig: vi.fn().mockResolvedValue(undefined),
}));

// Mock the stores
const mockUpdateConfig = vi.fn();
const mockToggleMatchup = vi.fn();

vi.mock("@/stores", () => ({
  useConfigStore: vi.fn(() => ({
    config: {
      voice: { enabled: true },
      click_through: false,
      compact_mode: false,
      hotkeys: {
        toggle_click_through: "F5",
        toggle_compact: "F6",
      },
    },
    updateConfig: mockUpdateConfig,
  })),
  useMatchupStore: vi.fn(() => ({
    isOpen: false,
    toggle: mockToggleMatchup,
  })),
}));

// Mock useTTS hook
const mockIsSpeaking = vi.fn(() => false);
vi.mock("@/hooks", () => ({
  useTTS: vi.fn(() => ({
    isSpeaking: mockIsSpeaking,
  })),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  logTelemetryEvent: vi.fn(),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Volume2: ({ className }: { className?: string }) => (
    <span data-testid="volume-on" className={className}>🔊</span>
  ),
  VolumeX: ({ className }: { className?: string }) => (
    <span data-testid="volume-off" className={className}>🔇</span>
  ),
  MousePointer2Off: ({ className }: { className?: string }) => (
    <span data-testid="click-through-on" className={className}>🖱️</span>
  ),
  MousePointer2: ({ className }: { className?: string }) => (
    <span data-testid="click-through-off" className={className}>🖱</span>
  ),
  Minimize2: ({ className }: { className?: string }) => (
    <span data-testid="compact-on" className={className}>⬜</span>
  ),
  Maximize2: ({ className }: { className?: string }) => (
    <span data-testid="compact-off" className={className}>⬛</span>
  ),
  Swords: ({ className }: { className?: string }) => (
    <span data-testid="swords" className={className}>⚔️</span>
  ),
}));

describe("StatusIndicators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders voice status icon", () => {
      render(<StatusIndicators />);
      expect(screen.getByTestId("volume-on")).toBeInTheDocument();
    });

    it("renders click-through status icon", () => {
      render(<StatusIndicators />);
      expect(screen.getByTestId("click-through-off")).toBeInTheDocument();
    });

    it("renders compact mode status icon", () => {
      render(<StatusIndicators />);
      expect(screen.getByTestId("compact-off")).toBeInTheDocument();
    });

    it("renders matchup toggle icon", () => {
      render(<StatusIndicators />);
      expect(screen.getByTestId("swords")).toBeInTheDocument();
    });
  });

  describe("voice toggle", () => {
    it("toggles voice when clicking voice icon", () => {
      render(<StatusIndicators />);

      const voiceButton = screen.getByTitle("Voice On");
      fireEvent.click(voiceButton);

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        voice: expect.objectContaining({ enabled: false }),
      });
    });
  });

  describe("click-through toggle", () => {
    it("calls onToggleClickThrough prop if provided", () => {
      const mockToggle = vi.fn();
      render(<StatusIndicators onToggleClickThrough={mockToggle} />);

      const clickThroughButton = screen.getByTitle("Click-Through Off (F5)");
      fireEvent.click(clickThroughButton);

      expect(mockToggle).toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    });

    it("updates config directly if no onToggleClickThrough prop", async () => {
      render(<StatusIndicators />);

      const clickThroughButton = screen.getByTitle("Click-Through Off (F5)");
      fireEvent.click(clickThroughButton);

      expect(mockUpdateConfig).toHaveBeenCalledWith({ click_through: true });
    });
  });

  describe("compact mode toggle", () => {
    it("toggles compact mode when clicked", async () => {
      render(<StatusIndicators />);

      const compactButton = screen.getByTitle("Expanded Mode (F6)");
      fireEvent.click(compactButton);

      expect(mockUpdateConfig).toHaveBeenCalledWith({ compact_mode: true });
    });
  });

  describe("matchup toggle", () => {
    it("toggles matchup panel when clicked", () => {
      render(<StatusIndicators />);

      const matchupButton = screen.getByTitle("Matchup cheat sheet");
      fireEvent.click(matchupButton);

      expect(mockToggleMatchup).toHaveBeenCalled();
    });
  });

  describe("speaking indicator", () => {
    it("shows speaking indicator when TTS is active", () => {
      mockIsSpeaking.mockReturnValue(true);

      render(<StatusIndicators />);

      // Advance timer to trigger the interval check
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(screen.getByText("Speaking")).toBeInTheDocument();
    });

    it("does not show speaking indicator when TTS is inactive", () => {
      mockIsSpeaking.mockReturnValue(false);

      render(<StatusIndicators />);

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(screen.queryByText("Speaking")).not.toBeInTheDocument();
    });
  });

  describe("undo click-through button", () => {
    it("renders undo button when clickThroughUndoActive is true", () => {
      const mockUndo = vi.fn();
      render(
        <StatusIndicators
          clickThroughUndoActive={true}
          onUndoClickThrough={mockUndo}
        />
      );

      expect(screen.getByText("Undo click-through")).toBeInTheDocument();
    });

    it("does not render undo button when clickThroughUndoActive is false", () => {
      const mockUndo = vi.fn();
      render(
        <StatusIndicators
          clickThroughUndoActive={false}
          onUndoClickThrough={mockUndo}
        />
      );

      expect(screen.queryByText("Undo click-through")).not.toBeInTheDocument();
    });

    it("calls onUndoClickThrough when undo button is clicked", () => {
      const mockUndo = vi.fn();
      render(
        <StatusIndicators
          clickThroughUndoActive={true}
          onUndoClickThrough={mockUndo}
        />
      );

      fireEvent.click(screen.getByText("Undo click-through"));

      expect(mockUndo).toHaveBeenCalled();
    });

    it("does not render undo button without onUndoClickThrough callback", () => {
      render(<StatusIndicators clickThroughUndoActive={true} />);

      expect(screen.queryByText("Undo click-through")).not.toBeInTheDocument();
    });
  });

  describe("hotkey hints", () => {
    it("shows hotkey in click-through button title", () => {
      render(<StatusIndicators />);
      expect(screen.getByTitle("Click-Through Off (F5)")).toBeInTheDocument();
    });

    it("shows hotkey in compact mode button title", () => {
      render(<StatusIndicators />);
      expect(screen.getByTitle("Expanded Mode (F6)")).toBeInTheDocument();
    });
  });
});

describe("StatusIndicators with different config states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows voice disabled icon when voice is off", async () => {
    const { useConfigStore } = await import("@/stores");
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        voice: { enabled: false },
        click_through: false,
        compact_mode: false,
        hotkeys: { toggle_click_through: "F5", toggle_compact: "F6" },
      },
      updateConfig: mockUpdateConfig,
    });

    render(<StatusIndicators />);
    expect(screen.getByTestId("volume-off")).toBeInTheDocument();
  });

  it("shows click-through enabled icon when active", async () => {
    const { useConfigStore } = await import("@/stores");
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        voice: { enabled: true },
        click_through: true,
        compact_mode: false,
        hotkeys: { toggle_click_through: "F5", toggle_compact: "F6" },
      },
      updateConfig: mockUpdateConfig,
    });

    render(<StatusIndicators />);
    expect(screen.getByTestId("click-through-on")).toBeInTheDocument();
  });

  it("shows compact mode icon when active", async () => {
    const { useConfigStore } = await import("@/stores");
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        voice: { enabled: true },
        click_through: false,
        compact_mode: true,
        hotkeys: { toggle_click_through: "F5", toggle_compact: "F6" },
      },
      updateConfig: mockUpdateConfig,
    });

    render(<StatusIndicators />);
    expect(screen.getByTestId("compact-on")).toBeInTheDocument();
  });

  it("handles null voice config gracefully", async () => {
    const { useConfigStore } = await import("@/stores");
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        voice: null,
        click_through: false,
        compact_mode: false,
        hotkeys: { toggle_click_through: "F5", toggle_compact: "F6" },
      },
      updateConfig: mockUpdateConfig,
    });

    render(<StatusIndicators />);
    // Should show volume off when voice is null
    expect(screen.getByTestId("volume-off")).toBeInTheDocument();
  });
});
