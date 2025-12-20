import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResourceIndicator } from "./ResourceIndicator";
import type { Resources } from "@/types";

describe("ResourceIndicator", () => {
  describe("rendering", () => {
    it("renders nothing when resources is undefined", () => {
      const { container } = render(<ResourceIndicator resources={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when resources is empty object", () => {
      const { container } = render(<ResourceIndicator resources={{}} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when all resources are zero", () => {
      const resources: Resources = { food: 0, wood: 0, gold: 0, stone: 0 };
      const { container } = render(<ResourceIndicator resources={resources} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders food resource", () => {
      const resources: Resources = { food: 100 };
      render(<ResourceIndicator resources={resources} />);

      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("renders wood resource", () => {
      const resources: Resources = { wood: 50 };
      render(<ResourceIndicator resources={resources} />);

      expect(screen.getByText("50")).toBeInTheDocument();
    });

    it("renders gold resource", () => {
      const resources: Resources = { gold: 200 };
      render(<ResourceIndicator resources={resources} />);

      expect(screen.getByText("200")).toBeInTheDocument();
    });

    it("renders stone resource", () => {
      const resources: Resources = { stone: 75 };
      render(<ResourceIndicator resources={resources} />);

      expect(screen.getByText("75")).toBeInTheDocument();
    });

    it("renders multiple resources", () => {
      const resources: Resources = { food: 100, wood: 50, gold: 25 };
      render(<ResourceIndicator resources={resources} />);

      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
    });

    it("filters out zero values", () => {
      const resources: Resources = { food: 100, wood: 0, gold: 50 };
      render(<ResourceIndicator resources={resources} />);

      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("filters out null/undefined values", () => {
      const resources: Resources = { food: 100 };
      render(<ResourceIndicator resources={resources} />);

      expect(screen.getByText("100")).toBeInTheDocument();
      // Only one value should be rendered
      expect(screen.getAllByText(/\d+/)).toHaveLength(1);
    });
  });

  describe("compact mode", () => {
    it("applies compact styles when compact prop is true", () => {
      const resources: Resources = { food: 100 };
      const { container } = render(
        <ResourceIndicator resources={resources} compact />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("gap-3");
    });

    it("applies non-compact styles when compact is false", () => {
      const resources: Resources = { food: 100 };
      const { container } = render(
        <ResourceIndicator resources={resources} compact={false} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("gap-4");
    });
  });

  describe("glow effects", () => {
    it("applies glow class when glow prop is true", () => {
      const resources: Resources = { food: 100 };
      const { container } = render(
        <ResourceIndicator resources={resources} glow />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("resource-icon-glow");
    });

    it("does not apply glow class when glow is false", () => {
      const resources: Resources = { food: 100 };
      const { container } = render(
        <ResourceIndicator resources={resources} glow={false} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveClass("resource-icon-glow");
    });
  });

  describe("className prop", () => {
    it("applies custom className", () => {
      const resources: Resources = { food: 100 };
      const { container } = render(
        <ResourceIndicator resources={resources} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("preserves default classes with custom className", () => {
      const resources: Resources = { food: 100 };
      const { container } = render(
        <ResourceIndicator resources={resources} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("custom-class");
    });
  });
});
