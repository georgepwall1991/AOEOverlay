import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepNumber } from "./StepNumber";

describe("StepNumber", () => {
  describe("basic rendering", () => {
    it("renders the step number", () => {
      render(
        <StepNumber stepNumber={1} isActive={false} isPast={false} />
      );
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("renders two-digit step numbers", () => {
      render(
        <StepNumber stepNumber={15} isActive={false} isPast={false} />
      );
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("renders three-digit step numbers", () => {
      render(
        <StepNumber stepNumber={100} isActive={false} isPast={false} />
      );
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("renders step number 0", () => {
      render(
        <StepNumber stepNumber={0} isActive={false} isPast={false} />
      );
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("active state", () => {
    it("applies active styles when isActive is true", () => {
      render(
        <StepNumber stepNumber={1} isActive={true} isPast={false} />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("step-number-glow");
      expect(element).toHaveClass("text-black");
    });

    it("does not apply active styles when isActive is false", () => {
      render(
        <StepNumber stepNumber={1} isActive={false} isPast={false} />
      );
      const element = screen.getByText("1");
      expect(element).not.toHaveClass("step-number-glow");
    });
  });

  describe("past state", () => {
    it("applies past styles when isPast is true and not active", () => {
      render(
        <StepNumber stepNumber={1} isActive={false} isPast={true} />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("bg-white/10");
      expect(element).toHaveClass("text-white/40");
    });

    it("active takes precedence over past", () => {
      render(
        <StepNumber stepNumber={1} isActive={true} isPast={true} />
      );
      const element = screen.getByText("1");
      // Active should take precedence
      expect(element).toHaveClass("step-number-glow");
    });
  });

  describe("future state (not active, not past)", () => {
    it("applies future styles", () => {
      render(
        <StepNumber stepNumber={1} isActive={false} isPast={false} />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("bg-white/15");
      expect(element).toHaveClass("text-white/60");
    });
  });

  describe("highlight state", () => {
    it("applies highlight animation when showHighlight is true in compact mode", () => {
      render(
        <StepNumber
          stepNumber={1}
          isActive={true}
          isPast={false}
          showHighlight={true}
          compact={true}
        />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("step-number-pop-enter");
    });

    it("does not apply highlight animation when showHighlight is false", () => {
      render(
        <StepNumber
          stepNumber={1}
          isActive={true}
          isPast={false}
          showHighlight={false}
          compact={true}
        />
      );
      const element = screen.getByText("1");
      expect(element).not.toHaveClass("step-number-pop-enter");
    });

    it("defaults showHighlight to false", () => {
      render(
        <StepNumber stepNumber={1} isActive={true} isPast={false} compact={true} />
      );
      const element = screen.getByText("1");
      expect(element).not.toHaveClass("step-number-pop-enter");
    });

    it("showHighlight only works in compact mode", () => {
      // In non-compact mode, showHighlight is ignored
      render(
        <StepNumber
          stepNumber={1}
          isActive={true}
          isPast={false}
          showHighlight={true}
          compact={false}
        />
      );
      const element = screen.getByText("1");
      // Non-compact mode doesn't use step-number-pop-enter
      expect(element).not.toHaveClass("step-number-pop-enter");
    });
  });

  describe("compact mode", () => {
    it("applies compact sizing when compact is true", () => {
      render(
        <StepNumber
          stepNumber={1}
          isActive={false}
          isPast={false}
          compact={true}
        />
      );
      const element = screen.getByText("1");
      // Compact uses w-8 h-8 and text-sm
      expect(element).toHaveClass("w-8");
      expect(element).toHaveClass("h-8");
      expect(element).toHaveClass("text-sm");
    });

    it("applies regular sizing when compact is false", () => {
      render(
        <StepNumber
          stepNumber={1}
          isActive={false}
          isPast={false}
          compact={false}
        />
      );
      const element = screen.getByText("1");
      // Regular uses w-7 h-7 and text-xs
      expect(element).toHaveClass("w-7");
      expect(element).toHaveClass("h-7");
      expect(element).toHaveClass("text-xs");
    });

    it("defaults compact to false", () => {
      render(
        <StepNumber stepNumber={1} isActive={false} isPast={false} />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("w-7");
      expect(element).toHaveClass("h-7");
    });

    it("applies active styles in compact mode", () => {
      render(
        <StepNumber
          stepNumber={1}
          isActive={true}
          isPast={false}
          compact={true}
        />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("step-number-glow");
      expect(element).toHaveClass("w-8");
    });

    it("applies past styles in compact mode", () => {
      render(
        <StepNumber
          stepNumber={1}
          isActive={false}
          isPast={true}
          compact={true}
        />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("bg-white/10");
      expect(element).toHaveClass("text-white/30"); // Compact has different opacity
    });

    it("applies highlight in compact mode", () => {
      render(
        <StepNumber
          stepNumber={1}
          isActive={false}
          isPast={false}
          compact={true}
          showHighlight={true}
        />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("step-number-pop-enter");
    });
  });

  describe("element structure", () => {
    it("renders as a span element", () => {
      render(
        <StepNumber stepNumber={1} isActive={false} isPast={false} />
      );
      const element = screen.getByText("1");
      expect(element.tagName).toBe("SPAN");
    });

    it("has flex centering classes", () => {
      render(
        <StepNumber stepNumber={1} isActive={false} isPast={false} />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("flex");
      expect(element).toHaveClass("items-center");
      expect(element).toHaveClass("justify-center");
    });

    it("has rounded-full for circular shape", () => {
      render(
        <StepNumber stepNumber={1} isActive={false} isPast={false} />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("rounded-full");
    });

    it("has font-black for bold text", () => {
      render(
        <StepNumber stepNumber={1} isActive={false} isPast={false} />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("font-black");
    });
  });

  describe("edge cases", () => {
    it("handles negative step numbers", () => {
      render(
        <StepNumber stepNumber={-1} isActive={false} isPast={false} />
      );
      expect(screen.getByText("-1")).toBeInTheDocument();
    });

    it("handles large step numbers", () => {
      render(
        <StepNumber stepNumber={9999} isActive={false} isPast={false} />
      );
      expect(screen.getByText("9999")).toBeInTheDocument();
    });

    it("handles all states being false", () => {
      render(
        <StepNumber
          stepNumber={1}
          isActive={false}
          isPast={false}
          showHighlight={false}
          compact={false}
        />
      );
      const element = screen.getByText("1");
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass("bg-white/15");
    });

    it("handles all boolean props being true (active takes precedence)", () => {
      render(
        <StepNumber
          stepNumber={1}
          isActive={true}
          isPast={true}
          showHighlight={true}
          compact={true}
        />
      );
      const element = screen.getByText("1");
      expect(element).toHaveClass("step-number-glow");
      expect(element).toHaveClass("step-number-pop-enter");
      expect(element).toHaveClass("w-8"); // compact
    });
  });
});
