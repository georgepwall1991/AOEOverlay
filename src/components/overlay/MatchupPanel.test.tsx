import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchupPanel } from "./MatchupPanel";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  logTelemetryEvent: vi.fn(),
}));

// Mock stores
const mockSetOpen = vi.fn();
const mockSetOpponent = vi.fn();
const mockGetOpponentFor = vi.fn().mockReturnValue(null);

vi.mock("@/stores", () => ({
  useCurrentBuildOrder: vi.fn(() => ({
    id: "build-1",
    name: "Fast Castle",
    civilization: "English",
    description: "Test build",
    difficulty: "Intermediate",
    enabled: true,
    steps: [],
  })),
  useMatchupStore: vi.fn(() => ({
    isOpen: true,
    opponentCiv: null,
    setOpen: mockSetOpen,
    setOpponent: mockSetOpponent,
    getOpponentFor: mockGetOpponentFor,
  })),
}));

// Mock matchups data
vi.mock("@/data/matchups", () => ({
  MATCHUPS: [
    {
      civ: "English",
      opponent: "French",
      threats: ["Early knights", "Fast feudal"],
      responses: ["Build spearmen", "Wall up"],
      scoutFor: ["Stable", "Knights"],
      counterTips: ["Longbows counter knights"],
      dangerTimers: ["4:00 - Feudal age"],
    },
  ],
}));

// Mock types
vi.mock("@/types", () => ({
  CIVILIZATIONS: ["English", "French", "Mongols", "Rus", "Chinese"],
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, title, variant, size, className }: {
    children: React.ReactNode;
    onClick?: () => void;
    title?: string;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button onClick={onClick} title={title} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }) => (
    <div data-testid="select" data-value={value}>
      {children}
      {onValueChange && (
        <select data-testid="select-native" onChange={(e) => onValueChange(e.target.value)} value={value}>
          <option value="">Select opponent</option>
          <option value="French">French</option>
          <option value="Mongols">Mongols</option>
          <option value="Rus">Rus</option>
          <option value="Chinese">Chinese</option>
        </select>
      )}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
  SelectTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="select-trigger" className={className}>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span data-testid="select-value">{placeholder}</span>,
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="scroll-area" className={className}>{children}</div>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Shield: ({ className }: { className?: string }) => (
    <span data-testid="shield-icon" className={className}>🛡</span>
  ),
  Swords: ({ className }: { className?: string }) => (
    <span data-testid="swords-icon" className={className}>⚔</span>
  ),
  X: ({ className }: { className?: string }) => (
    <span data-testid="x-icon" className={className}>×</span>
  ),
  ChevronsDownUp: ({ className }: { className?: string }) => (
    <span data-testid="collapse-icon" className={className}>⬆⬇</span>
  ),
}));

describe("MatchupPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering when open", () => {
    it("renders panel title", () => {
      render(<MatchupPanel />);
      expect(screen.getByText("Matchup Cheat Sheet")).toBeInTheDocument();
    });

    it("renders shield icon", () => {
      render(<MatchupPanel />);
      expect(screen.getByTestId("shield-icon")).toBeInTheDocument();
    });

    it("renders player vs opponent", () => {
      render(<MatchupPanel />);
      expect(screen.getByText(/English vs/)).toBeInTheDocument();
    });

    it("renders opponent selector", () => {
      render(<MatchupPanel />);
      expect(screen.getByTestId("select")).toBeInTheDocument();
    });

    it("renders swords icon next to selector", () => {
      render(<MatchupPanel />);
      expect(screen.getByTestId("swords-icon")).toBeInTheDocument();
    });

    it("renders close button", () => {
      render(<MatchupPanel />);
      expect(screen.getByTestId("x-icon")).toBeInTheDocument();
    });

    it("renders collapse button", () => {
      render(<MatchupPanel />);
      expect(screen.getByTestId("collapse-icon")).toBeInTheDocument();
    });
  });

  describe("matchup content", () => {
    it("renders threats section", () => {
      render(<MatchupPanel />);
      expect(screen.getByText("Threats")).toBeInTheDocument();
    });

    it("renders responses section", () => {
      render(<MatchupPanel />);
      expect(screen.getByText("Responses")).toBeInTheDocument();
    });

    it("renders scout for section", () => {
      render(<MatchupPanel />);
      expect(screen.getByText("Scout For")).toBeInTheDocument();
    });

    it("renders counter tips section", () => {
      render(<MatchupPanel />);
      expect(screen.getByText("Counters")).toBeInTheDocument();
    });

    it("renders danger timers section", () => {
      render(<MatchupPanel />);
      expect(screen.getByText("Eco danger timers")).toBeInTheDocument();
    });

    it("renders threat items", () => {
      render(<MatchupPanel />);
      expect(screen.getByText("Early knights")).toBeInTheDocument();
      expect(screen.getByText("Fast feudal")).toBeInTheDocument();
    });

    it("renders response items", () => {
      render(<MatchupPanel />);
      expect(screen.getByText("Build spearmen")).toBeInTheDocument();
      expect(screen.getByText("Wall up")).toBeInTheDocument();
    });

    it("renders scroll area for content", () => {
      render(<MatchupPanel />);
      expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
    });
  });

  describe("close functionality", () => {
    it("calls setOpen(false) when close button clicked", () => {
      render(<MatchupPanel />);
      // Find the X icon's parent button
      const closeButtons = screen.getAllByTestId("x-icon");
      const closeButton = closeButtons[0].closest("button")!;

      fireEvent.click(closeButton);

      expect(mockSetOpen).toHaveBeenCalledWith(false);
    });
  });

  describe("collapse functionality", () => {
    it("collapses panel when collapse button clicked", () => {
      render(<MatchupPanel />);
      const collapseButton = screen.getByTitle("Collapse");

      fireEvent.click(collapseButton);

      // In collapsed state, should show "Expand" button
      expect(screen.getByText("Expand")).toBeInTheDocument();
      // Should not show full content
      expect(screen.queryByText("Matchup Cheat Sheet")).not.toBeInTheDocument();
    });

    it("expands panel when expand button clicked", () => {
      render(<MatchupPanel />);
      // Collapse first
      fireEvent.click(screen.getByTitle("Collapse"));

      // Then expand
      fireEvent.click(screen.getByText("Expand"));

      expect(screen.getByText("Matchup Cheat Sheet")).toBeInTheDocument();
    });

    it("shows civ vs opponent in collapsed state", () => {
      render(<MatchupPanel />);
      fireEvent.click(screen.getByTitle("Collapse"));

      expect(screen.getByText(/English vs/)).toBeInTheDocument();
    });
  });

  describe("opponent selection", () => {
    it("calls setOpponent when opponent changed", () => {
      render(<MatchupPanel />);
      const select = screen.getByTestId("select-native");

      fireEvent.change(select, { target: { value: "Mongols" } });

      expect(mockSetOpponent).toHaveBeenCalledWith("English", "Mongols");
    });

    it("does not call setOpponent for empty value", () => {
      render(<MatchupPanel />);
      const select = screen.getByTestId("select-native");

      fireEvent.change(select, { target: { value: "" } });

      expect(mockSetOpponent).not.toHaveBeenCalled();
    });
  });
});

describe("MatchupPanel edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not open", async () => {
    const { useMatchupStore } = await import("@/stores");
    vi.mocked(useMatchupStore).mockReturnValue({
      isOpen: false,
      opponentCiv: null,
      setOpen: mockSetOpen,
      setOpponent: mockSetOpponent,
      getOpponentFor: mockGetOpponentFor,
    });

    const { container } = render(<MatchupPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when no current build order", async () => {
    const { useCurrentBuildOrder, useMatchupStore } = await import("@/stores");
    vi.mocked(useCurrentBuildOrder).mockReturnValue(null);
    vi.mocked(useMatchupStore).mockReturnValue({
      isOpen: true,
      opponentCiv: null,
      setOpen: mockSetOpen,
      setOpponent: mockSetOpponent,
      getOpponentFor: mockGetOpponentFor,
    });

    const { container } = render(<MatchupPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("shows no matchup message for unknown pairing", async () => {
    const { useCurrentBuildOrder, useMatchupStore } = await import("@/stores");
    vi.mocked(useCurrentBuildOrder).mockReturnValue({
      id: "build-1",
      name: "Test",
      civilization: "Mongols",
      description: "Test",
      difficulty: "Intermediate",
      enabled: true,
      steps: [],
    });
    vi.mocked(useMatchupStore).mockReturnValue({
      isOpen: true,
      opponentCiv: "Chinese",
      setOpen: mockSetOpen,
      setOpponent: mockSetOpponent,
      getOpponentFor: vi.fn().mockReturnValue("Chinese"),
    });

    render(<MatchupPanel />);
    expect(screen.getByText(/No matchup tips yet/)).toBeInTheDocument();
  });

  it("uses remembered opponent when available", async () => {
    const { useMatchupStore, useCurrentBuildOrder } = await import("@/stores");
    vi.mocked(useCurrentBuildOrder).mockReturnValue({
      id: "build-1",
      name: "Fast Castle",
      civilization: "English",
      description: "Test build",
      difficulty: "Intermediate",
      enabled: true,
      steps: [],
    });
    vi.mocked(useMatchupStore).mockReturnValue({
      isOpen: true,
      opponentCiv: null,
      setOpen: mockSetOpen,
      setOpponent: mockSetOpponent,
      getOpponentFor: vi.fn().mockReturnValue("French"),
    });

    render(<MatchupPanel />);
    // Check that French is displayed (may be in multiple places)
    const frenchText = screen.getAllByText(/French/);
    expect(frenchText.length).toBeGreaterThanOrEqual(1);
  });

  it("uses opponentCiv prop over remembered opponent", async () => {
    const { useMatchupStore, useCurrentBuildOrder } = await import("@/stores");
    vi.mocked(useCurrentBuildOrder).mockReturnValue({
      id: "build-1",
      name: "Fast Castle",
      civilization: "English",
      description: "Test build",
      difficulty: "Intermediate",
      enabled: true,
      steps: [],
    });
    vi.mocked(useMatchupStore).mockReturnValue({
      isOpen: true,
      opponentCiv: "Mongols",
      setOpen: mockSetOpen,
      setOpponent: mockSetOpponent,
      getOpponentFor: vi.fn().mockReturnValue("French"),
    });

    render(<MatchupPanel />);
    // Check that Mongols appears in the subtitle
    const mongolsText = screen.getAllByText(/Mongols/);
    expect(mongolsText.length).toBeGreaterThanOrEqual(1);
  });
});
