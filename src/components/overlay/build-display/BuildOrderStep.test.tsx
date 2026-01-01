import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BuildOrderStep } from "./BuildOrderStep";
import type { BuildOrderStep as StepType } from "@/types";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

// Mock stores
vi.mock("@/stores", () => ({
  useConfigStore: vi.fn(() => ({
    config: {
      floating_style: false,
    },
  })),
}));

// Mock hooks
vi.mock("@/hooks/useStepHighlight", () => ({
  useStepHighlight: vi.fn(() => false),
}));

vi.mock("@/hooks/useAdjustedTiming", () => ({
  useAdjustedTiming: vi.fn((step) => ({
    displayTiming: step.timing,
    showDriftIndicator: false,
  })),
}));

// Mock sub-components
vi.mock("../indicators/ResourceIndicator", () => ({
  ResourceIndicator: ({ resources }: { resources?: unknown }) => (
    resources ? <div data-testid="resource-indicator">Resources</div> : null
  ),
}));

vi.mock("../indicators/VillagerDistributionBar", () => ({
  VillagerDistributionBar: () => (
    <div data-testid="distribution-bar">Bar</div>
  ),
}));

vi.mock("../icons/GameIcons", () => ({
  renderIconText: (text: string) => text,
}));

describe("BuildOrderStep", () => {
  const mockStep: StepType = {
    id: "step-1",
    description: "Build 2 houses",
    timing: "0:30",
    resources: { food: 100, wood: 50 },
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders step description", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText("Build 2 houses")).toBeInTheDocument();
    });

    it("renders step timing", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText("0:30")).toBeInTheDocument();
    });

    it("renders resource indicator when resources exist", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByTestId("resource-indicator")).toBeInTheDocument();
    });

    it("renders as a button element", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("click handling", () => {
    it("calls onClick when clicked", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      fireEvent.click(screen.getByRole("button"));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("active state", () => {
    it("applies active class and renders distribution bar", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          isActive={true}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      const button = screen.getByRole("button");
      expect(button.className).toContain("step-entry-active");
      expect(screen.getByTestId("distribution-bar")).toBeInTheDocument();
    });
  });

  describe("past state", () => {
    it("applies reduced opacity when past", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          isActive={false}
          isPast={true}
          onClick={mockOnClick}
        />
      );
      const button = screen.getByRole("button");
      expect(button.className).toContain("opacity-30");
    });
  });
});

describe("BuildOrderStep with hooks", () => {
  const mockStep: StepType = {
    id: "step-1",
    description: "Build houses",
    timing: "0:30",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows highlight animation when useStepHighlight returns true", async () => {
    const { useStepHighlight } = await import("@/hooks/useStepHighlight");
    vi.mocked(useStepHighlight).mockReturnValue(true);

    render(
      <BuildOrderStep
        step={mockStep}
        isActive={true}
        isPast={false}
        onClick={vi.fn()}
      />
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("animate-scale-in");
  });

  it("uses adjusted timing from hook", async () => {
    const { useAdjustedTiming } = await import("@/hooks/useAdjustedTiming");
    vi.mocked(useAdjustedTiming).mockReturnValue({
      displayTiming: "0:35",
      showDriftIndicator: true,
    });

    render(
      <BuildOrderStep
        step={mockStep}
        isActive={false}
        isPast={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText("0:35")).toBeInTheDocument();
  });
});
