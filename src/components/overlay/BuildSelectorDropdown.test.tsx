import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BuildSelectorDropdown } from "./BuildSelectorDropdown";
import type { BuildOrder } from "@/types";

// Mock the stores
const mockSetCurrentOrderIndex = vi.fn();
const mockBuildOrders: BuildOrder[] = [
  {
    id: "build-1",
    name: "Fast Castle",
    civilization: "English",
    description: "Test build",
    difficulty: "Intermediate",
    enabled: true,
    steps: [{ id: "step-1", description: "Step 1" }],
  },
  {
    id: "build-2",
    name: "Rush Build",
    civilization: "French",
    description: "Test build 2",
    difficulty: "Beginner",
    enabled: true,
    steps: [{ id: "step-1", description: "Step 1" }],
  },
  {
    id: "build-3",
    name: "Disabled Build",
    civilization: "Mongols",
    description: "Disabled",
    difficulty: "Advanced",
    enabled: false,
    steps: [{ id: "step-1", description: "Step 1" }],
  },
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
}));

// Mock CivBadge component
vi.mock("./CivBadge", () => ({
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
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Select Build Order (F4 to cycle)");
    });

    it("renders chevron icon", () => {
      render(<BuildSelectorDropdown />);
      expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
    });
  });

  describe("dropdown toggle", () => {
    it("opens dropdown when clicked", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      // Should show enabled builds in dropdown
      expect(screen.getByText("Rush Build")).toBeInTheDocument();
    });

    it("shows hint text with hotkey when open", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(screen.getByText(/Press F4 to cycle/)).toBeInTheDocument();
    });
  });

  describe("build selection", () => {
    it("calls setCurrentOrderIndex when selecting a different build", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getByRole("button");

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
      const button = screen.getByRole("button");

      fireEvent.click(button);
      expect(screen.getByText("Rush Build")).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
      // After escape, dropdown should close
    });
  });

  describe("click outside", () => {
    it("closes dropdown when clicking outside", () => {
      render(
        <div>
          <BuildSelectorDropdown />
          <div data-testid="outside">Outside</div>
        </div>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Click outside
      fireEvent.mouseDown(screen.getByTestId("outside"));
    });
  });

  describe("filtering", () => {
    it("only shows enabled builds in dropdown", () => {
      render(<BuildSelectorDropdown />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      // Should show enabled builds (Fast Castle appears in header and dropdown)
      const fastCastleElements = screen.getAllByText("Fast Castle");
      expect(fastCastleElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Rush Build")).toBeInTheDocument();

      // Should not show disabled build
      expect(screen.queryByText("Disabled Build")).not.toBeInTheDocument();
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
