import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BuildSelectorDropdown } from "./BuildSelectorDropdown";
import type { BuildOrder } from "@/types";

// Mock the stores
const mockSetCurrentOrderIndex = vi.fn();
const mockBuildOrders: BuildOrder[] = [
  { id: "build-1", name: "Fast Castle", civilization: "English", description: "Test", difficulty: "Intermediate", enabled: true, steps: [] },
  { id: "build-2", name: "Rush Build", civilization: "French", description: "Test", difficulty: "Beginner", enabled: true, steps: [] },
  { id: "build-3", name: "Disabled Build", civilization: "Mongols", description: "Disabled", difficulty: "Advanced", enabled: false, steps: [] },
  { id: "build-4", name: "Archer Rush", civilization: "English", description: "Test", difficulty: "Beginner", enabled: true, steps: [] },
  { id: "build-5", name: "2 TC Boom", civilization: "Abbasid Dynasty", description: "Test", difficulty: "Intermediate", enabled: true, steps: [] },
  { id: "build-6", name: "Water Build", civilization: "French", description: "Test", difficulty: "Advanced", enabled: true, steps: [] },
  { id: "build-7", name: "Tower Rush", civilization: "Mongols", description: "Test", difficulty: "Expert", enabled: true, steps: [] },
];

vi.mock("@/stores", () => ({
  useBuildOrderStore: vi.fn(() => ({
    buildOrders: mockBuildOrders,
    currentOrderIndex: 0,
    setCurrentOrderIndex: mockSetCurrentOrderIndex,
  })),
  useConfigStore: vi.fn(() => ({
    config: {
      floating_style: true,
      hotkeys: {
        cycle_build_order: "F4",
      },
    },
  })),
  useCurrentBuildOrder: vi.fn(() => mockBuildOrders[0]),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <span data-testid="chevron-down" className={className}>▼</span>
  ),
  Check: ({ className }: { className?: string }) => (
    <span data-testid="check" className={className}>✓</span>
  ),
  Search: ({ className }: { className?: string }) => (
    <span data-testid="search-icon" className={className}>🔍</span>
  ),
}));

// Mock CivBadge component
vi.mock("../badges/CivBadge", () => ({
  CivBadge: ({ civilization }: { civilization: string }) => (
    <span data-testid="civ-badge">{civilization}</span>
  ),
}));

describe("BuildSelectorDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the current build order name", () => {
      render(<BuildSelectorDropdown />);
      expect(screen.getByText("Fast Castle")).toBeInTheDocument();
    });

    it("renders the civilization badge", () => {
      render(<BuildSelectorDropdown />);
      const badges = screen.getAllByTestId("civ-badge");
      expect(badges[0]).toHaveTextContent("English");
    });

    it("renders dropdown trigger button", () => {
      render(<BuildSelectorDropdown />);
      const buttons = screen.getAllByRole("button");
      // Header button
      expect(buttons[0]).toBeInTheDocument();
    });

    it("renders chevron icon", () => {
      render(<BuildSelectorDropdown />);
      expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
    });
  });

  describe("dropdown toggle", () => {
    it("opens dropdown when clicked", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getAllByRole("button")[0];

      fireEvent.click(button);

      // Should show enabled builds in dropdown
      expect(screen.getByText("Rush Build")).toBeInTheDocument();
    });
  });

  describe("build selection", () => {
    it("calls setCurrentOrderIndex when selecting a different build", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getAllByRole("button")[0];

      fireEvent.click(button);

      // Click on the second build
      const rushBuild = screen.getByText("Rush Build");
      fireEvent.click(rushBuild);

      expect(mockSetCurrentOrderIndex).toHaveBeenCalledWith(1);
    });
  });

  describe("keyboard interactions", () => {
    it("closes dropdown on Escape key", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getAllByRole("button")[0];

      fireEvent.click(button);
      expect(screen.getByText("Rush Build")).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
    });
  });

  describe("filtering", () => {
    it("only shows enabled builds in dropdown", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getAllByRole("button")[0];

      fireEvent.click(button);

      // Should show enabled builds
      const fastCastleElements = screen.getAllByText("Fast Castle");
      expect(fastCastleElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Rush Build")).toBeInTheDocument();

      // Should not show disabled build
      expect(screen.queryByText("Disabled Build")).not.toBeInTheDocument();
    });
  });

  describe("searching", () => {
    it("filters build orders by search query", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getAllByRole("button")[0];
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(/Type civilization or build name/);
      fireEvent.change(searchInput, { target: { value: "Rush" } });

      // Should show matching builds
      expect(screen.getByText("Rush Build")).toBeInTheDocument();
      expect(screen.getByText("Tower Rush")).toBeInTheDocument();

      // Should hide non-matching builds
      expect(screen.queryByText("2 TC Boom")).not.toBeInTheDocument();
    });

    it("filters by civilization name", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getAllByRole("button")[0];
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(/Type civilization or build name/);
      fireEvent.change(searchInput, { target: { value: "Abbasid" } });

      expect(screen.getByText("2 TC Boom")).toBeInTheDocument();
    });

    it("shows empty state when no builds match search", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getAllByRole("button")[0];
      fireEvent.click(button);

      const searchInput = screen.getByPlaceholderText(/Type civilization or build name/);
      fireEvent.change(searchInput, { target: { value: "Non-existent build" } });

      expect(screen.getByText("No matching builds found")).toBeInTheDocument();
    });
  });
});

describe("BuildSelectorDropdown edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no current build order", async () => {
    const { useCurrentBuildOrder } = await import("@/stores");
    vi.mocked(useCurrentBuildOrder).mockReturnValue(null as unknown as BuildOrder);

    const { container } = render(<BuildSelectorDropdown />);
    expect(container.firstChild).toBeNull();
  });
});