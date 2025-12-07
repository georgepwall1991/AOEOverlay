import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResourceIcon, FoodIcon, WoodIcon, GoldIcon, StoneIcon } from "./ResourceIcons";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

describe("ResourceIcon", () => {
  describe("rendering", () => {
    it("renders food icon with correct src", () => {
      render(<ResourceIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img).toHaveAttribute("src", "/icons/resource_food.webp");
    });

    it("renders wood icon with correct src", () => {
      render(<ResourceIcon type="wood" />);
      const img = screen.getByAltText("wood");
      expect(img).toHaveAttribute("src", "/icons/resource_wood.webp");
    });

    it("renders gold icon with correct src", () => {
      render(<ResourceIcon type="gold" />);
      const img = screen.getByAltText("gold");
      expect(img).toHaveAttribute("src", "/icons/resource_gold.webp");
    });

    it("renders stone icon with correct src", () => {
      render(<ResourceIcon type="stone" />);
      const img = screen.getByAltText("stone");
      expect(img).toHaveAttribute("src", "/icons/resource_stone.webp");
    });

    it("renders as an img element", () => {
      render(<ResourceIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img.tagName).toBe("IMG");
    });
  });

  describe("size prop", () => {
    it("defaults to 20px size", () => {
      render(<ResourceIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img).toHaveAttribute("width", "20");
      expect(img).toHaveAttribute("height", "20");
    });

    it("applies custom size", () => {
      render(<ResourceIcon type="food" size={32} />);
      const img = screen.getByAltText("food");
      expect(img).toHaveAttribute("width", "32");
      expect(img).toHaveAttribute("height", "32");
    });

    it("applies small size", () => {
      render(<ResourceIcon type="food" size={12} />);
      const img = screen.getByAltText("food");
      expect(img).toHaveAttribute("width", "12");
      expect(img).toHaveAttribute("height", "12");
    });

    it("applies large size", () => {
      render(<ResourceIcon type="food" size={48} />);
      const img = screen.getByAltText("food");
      expect(img).toHaveAttribute("width", "48");
      expect(img).toHaveAttribute("height", "48");
    });
  });

  describe("className prop", () => {
    it("applies custom className", () => {
      render(<ResourceIcon type="food" className="custom-class" />);
      const img = screen.getByAltText("food");
      expect(img.className).toContain("custom-class");
    });

    it("includes inline-block by default", () => {
      render(<ResourceIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img.className).toContain("inline-block");
    });

    it("includes transition classes", () => {
      render(<ResourceIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img.className).toContain("transition-all");
      expect(img.className).toContain("duration-300");
    });
  });

  describe("glow effect", () => {
    it("does not apply glow by default", () => {
      render(<ResourceIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img.style.transform).toBe("scale(1)");
    });

    it("applies glow transform when glow is true", () => {
      render(<ResourceIcon type="food" glow />);
      const img = screen.getByAltText("food");
      expect(img.style.transform).toBe("scale(1.1)");
    });

    it("has filter applied", () => {
      render(<ResourceIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img.style.filter).toContain("drop-shadow");
    });

    it("has enhanced filter when glow is true", () => {
      render(<ResourceIcon type="food" glow />);
      const img = screen.getByAltText("food");
      expect(img.style.filter).toContain("drop-shadow");
      expect(img.style.filter).toContain("0.8");
    });
  });

  describe("image rendering", () => {
    it("has auto image rendering", () => {
      render(<ResourceIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img.style.imageRendering).toBe("auto");
    });
  });
});

describe("FoodIcon", () => {
  it("renders food resource icon", () => {
    render(<FoodIcon />);
    const img = screen.getByAltText("food");
    expect(img).toHaveAttribute("src", "/icons/resource_food.webp");
  });

  it("defaults to size 20", () => {
    render(<FoodIcon />);
    const img = screen.getByAltText("food");
    expect(img).toHaveAttribute("width", "20");
    expect(img).toHaveAttribute("height", "20");
  });

  it("applies custom size", () => {
    render(<FoodIcon size={24} />);
    const img = screen.getByAltText("food");
    expect(img).toHaveAttribute("width", "24");
  });

  it("applies custom className", () => {
    render(<FoodIcon className="food-custom" />);
    const img = screen.getByAltText("food");
    expect(img.className).toContain("food-custom");
  });
});

describe("WoodIcon", () => {
  it("renders wood resource icon", () => {
    render(<WoodIcon />);
    const img = screen.getByAltText("wood");
    expect(img).toHaveAttribute("src", "/icons/resource_wood.webp");
  });

  it("defaults to size 20", () => {
    render(<WoodIcon />);
    const img = screen.getByAltText("wood");
    expect(img).toHaveAttribute("width", "20");
  });

  it("applies custom size", () => {
    render(<WoodIcon size={16} />);
    const img = screen.getByAltText("wood");
    expect(img).toHaveAttribute("width", "16");
  });

  it("applies custom className", () => {
    render(<WoodIcon className="wood-custom" />);
    const img = screen.getByAltText("wood");
    expect(img.className).toContain("wood-custom");
  });
});

describe("GoldIcon", () => {
  it("renders gold resource icon", () => {
    render(<GoldIcon />);
    const img = screen.getByAltText("gold");
    expect(img).toHaveAttribute("src", "/icons/resource_gold.webp");
  });

  it("defaults to size 20", () => {
    render(<GoldIcon />);
    const img = screen.getByAltText("gold");
    expect(img).toHaveAttribute("width", "20");
  });

  it("applies custom size", () => {
    render(<GoldIcon size={28} />);
    const img = screen.getByAltText("gold");
    expect(img).toHaveAttribute("width", "28");
  });

  it("applies custom className", () => {
    render(<GoldIcon className="gold-custom" />);
    const img = screen.getByAltText("gold");
    expect(img.className).toContain("gold-custom");
  });
});

describe("StoneIcon", () => {
  it("renders stone resource icon", () => {
    render(<StoneIcon />);
    const img = screen.getByAltText("stone");
    expect(img).toHaveAttribute("src", "/icons/resource_stone.webp");
  });

  it("defaults to size 20", () => {
    render(<StoneIcon />);
    const img = screen.getByAltText("stone");
    expect(img).toHaveAttribute("width", "20");
  });

  it("applies custom size", () => {
    render(<StoneIcon size={36} />);
    const img = screen.getByAltText("stone");
    expect(img).toHaveAttribute("width", "36");
  });

  it("applies custom className", () => {
    render(<StoneIcon className="stone-custom" />);
    const img = screen.getByAltText("stone");
    expect(img.className).toContain("stone-custom");
  });
});
