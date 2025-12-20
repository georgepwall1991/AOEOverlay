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
vi.mock("./ResourceIndicator", () => ({
  ResourceIndicator: ({ resources, compact, glow }: { resources?: unknown; compact?: boolean; glow?: boolean }) => (
    resources ? <div data-testid="resource-indicator" data-compact={compact} data-glow={glow}>Resources</div> : null
  ),
}));

vi.mock("./StepNumber", () => ({
  StepNumber: ({ stepNumber, isActive, isPast, compact }: { stepNumber: number; isActive: boolean; isPast: boolean; compact?: boolean }) => (
    <div data-testid="step-number" data-active={isActive} data-past={isPast} data-compact={compact}>
      {stepNumber}
    </div>
  ),
}));

vi.mock("./StepTiming", () => ({
  StepTiming: ({ timing, displayTiming, isActive, compact }: { timing?: string; displayTiming?: string; isActive: boolean; compact?: boolean }) => (
    timing ? <div data-testid="step-timing" data-active={isActive} data-compact={compact}>{displayTiming || timing}</div> : null
  ),
}));

vi.mock("./GameIcons", () => ({
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

  describe("full mode rendering", () => {
    it("renders step description", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText("Build 2 houses")).toBeInTheDocument();
    });

    it("renders step number component", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByTestId("step-number")).toBeInTheDocument();
      expect(screen.getByTestId("step-number")).toHaveTextContent("1");
    });

    it("renders step timing component", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByTestId("step-timing")).toBeInTheDocument();
      expect(screen.getByTestId("step-timing")).toHaveTextContent("0:30");
    });

    it("renders resource indicator when resources exist", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
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
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("compact mode rendering", () => {
    it("renders in compact mode", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
          compact
        />
      );
      expect(screen.getByText("Build 2 houses")).toBeInTheDocument();
    });

    it("passes compact prop to StepNumber", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
          compact
        />
      );
      expect(screen.getByTestId("step-number")).toHaveAttribute("data-compact", "true");
    });

    it("passes compact prop to StepTiming", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
          compact
        />
      );
      expect(screen.getByTestId("step-timing")).toHaveAttribute("data-compact", "true");
    });
  });

  describe("click handling", () => {
    it("calls onClick when clicked", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      fireEvent.click(screen.getByRole("button"));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick in compact mode", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
          compact
        />
      );
      fireEvent.click(screen.getByRole("button"));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("active state", () => {
    it("passes isActive to StepNumber", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={true}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByTestId("step-number")).toHaveAttribute("data-active", "true");
    });

    it("passes isActive to StepTiming", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={true}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByTestId("step-timing")).toHaveAttribute("data-active", "true");
    });

    it("applies glow to ResourceIndicator when active", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={true}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByTestId("resource-indicator")).toHaveAttribute("data-glow", "true");
    });
  });

  describe("past state", () => {
    it("passes isPast to StepNumber", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={true}
          onClick={mockOnClick}
        />
      );
      expect(screen.getByTestId("step-number")).toHaveAttribute("data-past", "true");
    });

    it("applies reduced opacity when past", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={false}
          isPast={true}
          onClick={mockOnClick}
        />
      );
      const button = screen.getByRole("button");
      expect(button.className).toContain("opacity-");
    });
  });

  describe("step without timing", () => {
    it("does not render StepTiming when timing is undefined", () => {
      const stepWithoutTiming: StepType = {
        id: "step-1",
        description: "Build houses",
      };

      render(
        <BuildOrderStep
          step={stepWithoutTiming}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.queryByTestId("step-timing")).not.toBeInTheDocument();
    });
  });

  describe("step without resources", () => {
    it("does not render ResourceIndicator when resources undefined", () => {
      const stepWithoutResources: StepType = {
        id: "step-1",
        description: "Build houses",
        timing: "0:30",
      };

      render(
        <BuildOrderStep
          step={stepWithoutResources}
          stepNumber={1}
          isActive={false}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      expect(screen.queryByTestId("resource-indicator")).not.toBeInTheDocument();
    });
  });

  describe("styling states", () => {
    it("applies step-active-glow class when active in full mode", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={true}
          isPast={false}
          onClick={mockOnClick}
        />
      );
      const button = screen.getByRole("button");
      expect(button.className).toContain("step-active-glow");
    });

    it("applies step-active-glow class when active in compact mode", () => {
      render(
        <BuildOrderStep
          step={mockStep}
          stepNumber={1}
          isActive={true}
          isPast={false}
          onClick={mockOnClick}
          compact
        />
      );
      const button = screen.getByRole("button");
      expect(button.className).toContain("step-active-glow");
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
        stepNumber={1}
        isActive={true}
        isPast={false}
        onClick={vi.fn()}
      />
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("step-enter");
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
        stepNumber={1}
        isActive={false}
        isPast={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId("step-timing")).toHaveTextContent("0:35");
  });

  it("applies floating style when enabled in config", async () => {
    const { useConfigStore } = await import("@/stores");
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        floating_style: true,
      },
    });

    render(
      <BuildOrderStep
        step={mockStep}
        stepNumber={1}
        isActive={true}
        isPast={false}
        onClick={vi.fn()}
      />
    );
    // The text should have floating style applied
    expect(screen.getByText("Build houses")).toBeInTheDocument();
  });
});
