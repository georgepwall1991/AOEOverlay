import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { KeyboardShortcutsOverlay } from "./KeyboardShortcutsOverlay";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

// Mock stores
vi.mock("@/stores", () => ({
  useConfigStore: vi.fn(() => ({
    config: {
      hotkeys: {
        previous_step: "Ctrl+Alt+F2",
        next_step: "Ctrl+Alt+F3",
        reset_build_order: "R",
        cycle_build_order: "Ctrl+Alt+F4",
        toggle_pause: "Ctrl+Alt+F1",
        toggle_overlay: "Ctrl+Alt+F7",
        toggle_compact: "Ctrl+Alt+F6",
        toggle_click_through: "Ctrl+Alt+F5",
      },
    },
  })),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  X: ({ className }: { className?: string }) => (
    <span data-testid="x-icon" className={className}>×</span>
  ),
  Keyboard: ({ className }: { className?: string }) => (
    <span data-testid="keyboard-icon" className={className}>⌨</span>
  ),
  Lightbulb: ({ className }: { className?: string }) => (
    <span data-testid="lightbulb-icon" className={className}>💡</span>
  ),
}));

describe("KeyboardShortcutsOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("closed state", () => {
    it("renders keyboard button when closed", () => {
      render(<KeyboardShortcutsOverlay />);
      expect(screen.getByTitle("Keyboard Shortcuts (?)")).toBeInTheDocument();
    });

    it("renders keyboard icon", () => {
      render(<KeyboardShortcutsOverlay />);
      expect(screen.getByTestId("keyboard-icon")).toBeInTheDocument();
    });

    it("shows practice hints initially", () => {
      render(<KeyboardShortcutsOverlay />);
      expect(screen.getByText("Practice hints")).toBeInTheDocument();
    });

    it("shows hotkeys in practice hints", () => {
      render(<KeyboardShortcutsOverlay />);
      expect(screen.getByText("Next step")).toBeInTheDocument();
      expect(screen.getByText("Previous step")).toBeInTheDocument();
      expect(screen.getByText("Pause timer")).toBeInTheDocument();
      expect(screen.getByText("Click-through")).toBeInTheDocument();
    });

    it("hides practice hints when 'Got it' clicked", () => {
      render(<KeyboardShortcutsOverlay />);
      const gotItButton = screen.getByText("Got it");

      fireEvent.click(gotItButton);

      expect(screen.queryByText("Practice hints")).not.toBeInTheDocument();
    });

    it("hides practice hints after 60 seconds", async () => {
      render(<KeyboardShortcutsOverlay />);

      await act(async () => {
        vi.advanceTimersByTime(61_000);
      });

      expect(screen.queryByText("Practice hints")).not.toBeInTheDocument();
    });

    it("hides practice hints on first keypress", async () => {
      render(<KeyboardShortcutsOverlay />);

      await act(async () => {
        fireEvent.keyDown(window, { key: "a" });
      });

      expect(screen.queryByText("Practice hints")).not.toBeInTheDocument();
    });
  });

  describe("opening overlay", () => {
    it("opens when keyboard button clicked", () => {
      render(<KeyboardShortcutsOverlay />);
      const button = screen.getByTitle("Keyboard Shortcuts (?)");

      fireEvent.click(button);

      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });

    it("opens when ? key pressed", () => {
      render(<KeyboardShortcutsOverlay />);

      fireEvent.keyDown(document, { key: "?" });

      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });

    it("opens when Shift+/ pressed", () => {
      render(<KeyboardShortcutsOverlay />);

      fireEvent.keyDown(document, { key: "/", shiftKey: true });

      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });
  });

  describe("open state content", () => {
    beforeEach(() => {
      render(<KeyboardShortcutsOverlay />);
      fireEvent.click(screen.getByTitle("Keyboard Shortcuts (?)"));
    });

    it("shows overlay header", () => {
      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });

    it("shows navigation section", () => {
      expect(screen.getByText("Navigation")).toBeInTheDocument();
    });

    it("shows timer section", () => {
      expect(screen.getByText("Timer")).toBeInTheDocument();
    });

    it("shows display section", () => {
      expect(screen.getByText("Display")).toBeInTheDocument();
    });

    it("shows help section", () => {
      expect(screen.getByText("Help")).toBeInTheDocument();
    });

    it("shows navigation shortcuts", () => {
      expect(screen.getByText("Previous Step")).toBeInTheDocument();
      expect(screen.getByText("Next Step")).toBeInTheDocument();
      expect(screen.getByText("Reset to Step 1")).toBeInTheDocument();
      expect(screen.getByText("Cycle Build Order")).toBeInTheDocument();
    });

    it("shows timer shortcuts", () => {
      expect(screen.getByText("Start/Pause Timer")).toBeInTheDocument();
    });

    it("shows display shortcuts", () => {
      expect(screen.getByText("Show/Hide Overlay")).toBeInTheDocument();
      expect(screen.getByText("Toggle Compact Mode")).toBeInTheDocument();
      expect(screen.getByText("Toggle Click-Through")).toBeInTheDocument();
    });

  it("shows hotkey values", () => {
    render(<KeyboardShortcutsOverlay />);
    fireEvent.click(screen.getByTitle("Keyboard Shortcuts (?)"));
    expect(screen.getAllByText("Ctrl+Alt+F2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ctrl+Alt+F3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("R").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ctrl+Alt+F4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ctrl+Alt+F1").length).toBeGreaterThan(0);
  });

    it("shows close button", () => {
      expect(screen.getByTestId("x-icon")).toBeInTheDocument();
    });

    it("shows footer hint", () => {
      expect(screen.getByText(/Press/)).toBeInTheDocument();
      expect(screen.getByText("Esc")).toBeInTheDocument();
    });
  });

  describe("closing overlay", () => {
    beforeEach(() => {
      render(<KeyboardShortcutsOverlay />);
      fireEvent.click(screen.getByTitle("Keyboard Shortcuts (?)"));
    });

    it("closes when X button clicked", () => {
      const closeButton = screen.getByTestId("x-icon").closest("button")!;

      fireEvent.click(closeButton);

      expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
    });

    it("closes when Escape pressed", () => {
      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
    });

    it("closes when ? pressed again", () => {
      fireEvent.keyDown(document, { key: "?" });

      expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
    });
  });

  describe("keyboard icon button", () => {
    it("has hover state tooltip", () => {
      render(<KeyboardShortcutsOverlay />);
      const button = screen.getByTitle("Keyboard Shortcuts (?)");
      expect(button).toBeInTheDocument();
    });
  });
});

describe("ShortcutRow component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hotkey and description correctly", () => {
    render(<KeyboardShortcutsOverlay />);
    fireEvent.click(screen.getByTitle("Keyboard Shortcuts (?)"));

    // Check that F2 is rendered as a kbd element with the description
    const previousStepRow = screen.getByText("Previous Step");
    expect(previousStepRow).toBeInTheDocument();

          const f2Key = screen.getByText("Ctrl+Alt+F2");    expect(f2Key.tagName).toBe("KBD");
  });

  it("renders help shortcut", () => {
    render(<KeyboardShortcutsOverlay />);
    fireEvent.click(screen.getByTitle("Keyboard Shortcuts (?)"));

    expect(screen.getByText("Show This Help")).toBeInTheDocument();
    // The ? shortcut may appear multiple times (header hint, footer, etc)
    const questionMarks = screen.getAllByText("?");
    expect(questionMarks.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Practice hints visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows lightbulb icon in practice hints", () => {
    render(<KeyboardShortcutsOverlay />);
    expect(screen.getByTestId("lightbulb-icon")).toBeInTheDocument();
  });

  it("has Keep visible button", () => {
    render(<KeyboardShortcutsOverlay />);
    expect(screen.getByText("Keep visible")).toBeInTheDocument();
  });

  it("keeps hints visible when Keep visible clicked", async () => {
    render(<KeyboardShortcutsOverlay />);
    const keepButton = screen.getByText("Keep visible");

    fireEvent.click(keepButton);

    // Should still be visible
    expect(screen.getByText("Practice hints")).toBeInTheDocument();
  });
});
