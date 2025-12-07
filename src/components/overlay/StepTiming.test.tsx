import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepTiming } from "./StepTiming";

describe("StepTiming", () => {
  describe("basic rendering", () => {
    it("renders timing when provided", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      expect(screen.getByText("2:30")).toBeInTheDocument();
    });

    it("returns null when timing is undefined", () => {
      const { container } = render(
        <StepTiming
          timing={undefined}
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("returns null when timing is empty string", () => {
      const { container } = render(
        <StepTiming
          timing=""
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      // Empty string is falsy, should return null
      expect(container.firstChild).toBeNull();
    });

    it("displays displayTiming value", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:45"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      expect(screen.getByText("2:45")).toBeInTheDocument();
    });
  });

  describe("active state", () => {
    it("applies active styles when isActive is true", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={true}
          showDriftIndicator={false}
        />
      );
      const element = screen.getByText("2:30");
      expect(element).toHaveClass("timing-badge-glow");
    });

    it("applies non-active styles when isActive is false", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      const element = screen.getByText("2:30");
      expect(element).toHaveClass("timing-badge");
      expect(element).not.toHaveClass("timing-badge-glow");
    });
  });

  describe("drift indicator", () => {
    it("shows tilde prefix when showDriftIndicator is true", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:45"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={true}
        />
      );
      expect(screen.getByText("~2:45")).toBeInTheDocument();
    });

    it("does not show tilde when showDriftIndicator is false", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:45"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      expect(screen.getByText("2:45")).toBeInTheDocument();
      expect(screen.queryByText("~2:45")).not.toBeInTheDocument();
    });

    it("shows drift title attribute when showDriftIndicator is true", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:45"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={true}
        />
      );
      const element = screen.getByText("~2:45");
      expect(element).toHaveAttribute("title", "Adjusted from 2:30");
    });

    it("does not show title when showDriftIndicator is false", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:45"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      const element = screen.getByText("2:45");
      expect(element).not.toHaveAttribute("title");
    });

    it("applies drift styling when showDriftIndicator is true and not active", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:45"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={true}
        />
      );
      const element = screen.getByText("~2:45");
      // Check for amber styling classes
      expect(element.className).toMatch(/amber/);
    });
  });

  describe("compact mode", () => {
    it("applies compact sizing when compact is true", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
          compact={true}
        />
      );
      const element = screen.getByText("2:30");
      expect(element).toHaveClass("text-sm");
      expect(element).toHaveClass("px-2");
      expect(element).toHaveClass("py-0.5");
    });

    it("uses timing-badge class when compact is false", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
          compact={false}
        />
      );
      const element = screen.getByText("2:30");
      expect(element).toHaveClass("timing-badge");
    });

    it("defaults compact to false", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      const element = screen.getByText("2:30");
      expect(element).toHaveClass("timing-badge");
    });

    it("applies active styles in compact mode", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={true}
          showDriftIndicator={false}
          compact={true}
        />
      );
      const element = screen.getByText("2:30");
      expect(element).toHaveClass("bg-amber-500/40");
      expect(element).toHaveClass("text-amber-200");
    });

    it("applies drift indicator in compact mode", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:45"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={true}
          compact={true}
        />
      );
      expect(screen.getByText("~2:45")).toBeInTheDocument();
    });

    it("applies compact text shadow when active", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={true}
          showDriftIndicator={false}
          compact={true}
        />
      );
      const element = screen.getByText("2:30");
      expect(element).toHaveStyle({ textShadow: "0 0 8px rgba(251, 191, 36, 0.8)" });
    });

    it("does not apply text shadow when not active in compact mode", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
          compact={true}
        />
      );
      const element = screen.getByText("2:30");
      expect(element).not.toHaveStyle({ textShadow: "0 0 8px rgba(251, 191, 36, 0.8)" });
    });
  });

  describe("element structure", () => {
    it("renders as a span element", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      const element = screen.getByText("2:30");
      expect(element.tagName).toBe("SPAN");
    });

    it("has font-mono class for monospace timing", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:30"
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
          compact={true}
        />
      );
      const element = screen.getByText("2:30");
      expect(element).toHaveClass("font-mono");
    });
  });

  describe("timing formats", () => {
    it("handles minute:second format", () => {
      render(
        <StepTiming
          timing="5:30"
          displayTiming="5:30"
          originalTiming="5:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      expect(screen.getByText("5:30")).toBeInTheDocument();
    });

    it("handles hour:minute:second format", () => {
      render(
        <StepTiming
          timing="1:05:30"
          displayTiming="1:05:30"
          originalTiming="1:05:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      expect(screen.getByText("1:05:30")).toBeInTheDocument();
    });

    it("handles zero times", () => {
      render(
        <StepTiming
          timing="0:00"
          displayTiming="0:00"
          originalTiming="0:00"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      expect(screen.getByText("0:00")).toBeInTheDocument();
    });

    it("handles text-based timing", () => {
      render(
        <StepTiming
          timing="early"
          displayTiming="early"
          originalTiming="early"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      expect(screen.getByText("early")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles undefined displayTiming", () => {
      const { container } = render(
        <StepTiming
          timing="2:30"
          displayTiming={undefined}
          originalTiming="2:30"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      // Should render but displayTiming will be undefined, the span exists but content is empty/undefined
      const span = container.querySelector("span");
      expect(span).toBeInTheDocument();
    });

    it("handles undefined originalTiming in drift title", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:45"
          originalTiming={undefined}
          isActive={false}
          showDriftIndicator={true}
        />
      );
      const element = screen.getByText("~2:45");
      expect(element).toHaveAttribute("title", "Adjusted from undefined");
    });

    it("combines active and drift states", () => {
      render(
        <StepTiming
          timing="2:30"
          displayTiming="2:45"
          originalTiming="2:30"
          isActive={true}
          showDriftIndicator={true}
        />
      );
      // Active styles should be applied, but still show tilde
      expect(screen.getByText("~2:45")).toBeInTheDocument();
    });

    it("handles long timing strings", () => {
      render(
        <StepTiming
          timing="99:59:59"
          displayTiming="99:59:59"
          originalTiming="99:59:59"
          isActive={false}
          showDriftIndicator={false}
        />
      );
      expect(screen.getByText("99:59:59")).toBeInTheDocument();
    });
  });
});
