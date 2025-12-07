import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FirstLaunchOnboarding, resetOnboarding } from "./FirstLaunchOnboarding";

// Create localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock the stores
vi.mock("@/stores", () => ({
  useConfigStore: vi.fn(() => ({
    config: {
      hotkeys: {
        previous_step: "F2",
        next_step: "F3",
        toggle_click_through: "F5",
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
  ChevronRight: ({ className }: { className?: string }) => (
    <span data-testid="chevron-right-icon" className={className}>→</span>
  ),
  Volume2: ({ className }: { className?: string }) => (
    <span data-testid="volume-icon" className={className}>🔊</span>
  ),
  MousePointer2Off: ({ className }: { className?: string }) => (
    <span data-testid="mouse-icon" className={className}>🖱</span>
  ),
}));

describe("FirstLaunchOnboarding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("visibility", () => {
    it("shows onboarding after delay when not seen before", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<FirstLaunchOnboarding />);

      // Initially not visible
      expect(screen.queryByText("Welcome to AoE4 Overlay!")).not.toBeInTheDocument();

      // Advance timers past the 500ms delay
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // Now visible
      expect(screen.getByText("Welcome to AoE4 Overlay!")).toBeInTheDocument();
    });

    it("does not show onboarding if already seen", async () => {
      localStorageMock.getItem.mockReturnValue("true");

      render(<FirstLaunchOnboarding />);

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(screen.queryByText("Welcome to AoE4 Overlay!")).not.toBeInTheDocument();
    });
  });

  describe("content", () => {
    beforeEach(async () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<FirstLaunchOnboarding />);
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
    });

    it("renders title and subtitle", () => {
      expect(screen.getByText("Welcome to AoE4 Overlay!")).toBeInTheDocument();
      expect(
        screen.getByText("Here's how to get the most out of your build order assistant")
      ).toBeInTheDocument();
    });

    it("renders navigation tip", () => {
      expect(screen.getByText("Navigate Steps")).toBeInTheDocument();
    });

    it("renders quick help tip", () => {
      expect(screen.getByText("Quick Help")).toBeInTheDocument();
    });

    it("renders voice narration tip", () => {
      expect(screen.getByText("Voice Narration")).toBeInTheDocument();
    });

    it("renders click-through tip", () => {
      expect(screen.getByText("Click-Through Mode")).toBeInTheDocument();
    });

    it("renders dismiss button", () => {
      expect(screen.getByText("Got it, let's go!")).toBeInTheDocument();
    });

    it("renders close X button", () => {
      expect(screen.getByTestId("x-icon")).toBeInTheDocument();
    });
  });

  describe("dismissal", () => {
    beforeEach(async () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<FirstLaunchOnboarding />);
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
    });

    it("dismisses when clicking main button", () => {
      const button = screen.getByText("Got it, let's go!");
      fireEvent.click(button);

      expect(screen.queryByText("Welcome to AoE4 Overlay!")).not.toBeInTheDocument();
    });

    it("dismisses when clicking X button", () => {
      const closeButton = screen.getByTestId("x-icon").closest("button")!;
      fireEvent.click(closeButton);

      expect(screen.queryByText("Welcome to AoE4 Overlay!")).not.toBeInTheDocument();
    });

    it("sets localStorage when dismissed", () => {
      const button = screen.getByText("Got it, let's go!");
      fireEvent.click(button);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "aoe4-overlay-onboarding-seen",
        "true"
      );
    });
  });
});

describe("resetOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes the onboarding seen flag from localStorage", () => {
    resetOnboarding();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("aoe4-overlay-onboarding-seen");
  });
});

describe("Tip component rendering", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    localStorageMock.getItem.mockReturnValue(null);
    render(<FirstLaunchOnboarding />);
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders all four tips", () => {
    expect(screen.getByText("Navigate Steps")).toBeInTheDocument();
    expect(screen.getByText("Quick Help")).toBeInTheDocument();
    expect(screen.getByText("Voice Narration")).toBeInTheDocument();
    expect(screen.getByText("Click-Through Mode")).toBeInTheDocument();
  });

  it("renders tip icons", () => {
    expect(screen.getByTestId("chevron-right-icon")).toBeInTheDocument();
    expect(screen.getByTestId("keyboard-icon")).toBeInTheDocument();
    expect(screen.getByTestId("volume-icon")).toBeInTheDocument();
    expect(screen.getByTestId("mouse-icon")).toBeInTheDocument();
  });
});
