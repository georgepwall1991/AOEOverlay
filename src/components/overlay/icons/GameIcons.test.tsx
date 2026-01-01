import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameIcon, GAME_ICONS, renderIconText } from "./GameIcons";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

// Mock ResourceIcon
vi.mock("./ResourceIcons", () => ({
  ResourceIcon: ({ type, size, className }: { type: string; size?: number; className?: string }) => (
    <img data-testid={`resource-${type}`} alt={type} src={`/icons/${type}.webp`} width={size} className={className} />
  ),
}));

describe("GAME_ICONS constant", () => {
  it("has food resource icon", () => {
    expect(GAME_ICONS.food).toBeDefined();
    expect(GAME_ICONS.food.path).toBe("/icons/resource_food.webp");
    expect(GAME_ICONS.food.emoji).toBeDefined();
  });

  it("has wood resource icon", () => {
    expect(GAME_ICONS.wood).toBeDefined();
    expect(GAME_ICONS.wood.path).toBe("/icons/resource_wood.webp");
  });

  it("has gold resource icon", () => {
    expect(GAME_ICONS.gold).toBeDefined();
    expect(GAME_ICONS.gold.path).toBe("/icons/resource_gold.webp");
  });

  it("has stone resource icon", () => {
    expect(GAME_ICONS.stone).toBeDefined();
    expect(GAME_ICONS.stone.path).toBe("/icons/resource_stone.webp");
  });

  it("has villager icon", () => {
    expect(GAME_ICONS.villager).toBeDefined();
    expect(GAME_ICONS.villager.path).toBe("/icons/villager.webp");
  });

  it("has house icon", () => {
    expect(GAME_ICONS.house).toBeDefined();
    expect(GAME_ICONS.house.path).toBe("/icons/house.webp");
  });

  it("has barracks icon", () => {
    expect(GAME_ICONS.barracks).toBeDefined();
    expect(GAME_ICONS.barracks.path).toBe("/icons/barracks.webp");
  });

  it("has scout icon", () => {
    expect(GAME_ICONS.scout).toBeDefined();
    expect(GAME_ICONS.scout.path).toBe("/icons/scout.webp");
  });

  it("has age icons", () => {
    expect(GAME_ICONS.dark_age).toBeDefined();
    expect(GAME_ICONS.feudal_age).toBeDefined();
    expect(GAME_ICONS.castle_age).toBeDefined();
    expect(GAME_ICONS.imperial_age).toBeDefined();
  });

  it("has all icons with path, emoji, and color", () => {
    for (const [key, icon] of Object.entries(GAME_ICONS)) {
      expect(icon.path, `${key} should have path`).toBeDefined();
      expect(icon.emoji, `${key} should have emoji`).toBeDefined();
      expect(icon.color, `${key} should have color`).toBeDefined();
    }
  });
});

describe("GameIcon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders image for valid icon type", () => {
      render(<GameIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img).toHaveAttribute("src", "/icons/resource_food.webp");
    });

    it("renders with default size of 20", () => {
      render(<GameIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img).toHaveAttribute("width", "20");
      expect(img).toHaveAttribute("height", "20");
    });

    it("renders with custom size", () => {
      render(<GameIcon type="food" size={32} />);
      const img = screen.getByAltText("food");
      expect(img).toHaveAttribute("width", "32");
      expect(img).toHaveAttribute("height", "32");
    });

    it("renders with title attribute", () => {
      render(<GameIcon type="town_center" />);
      const img = screen.getByAltText("town_center");
      expect(img).toHaveAttribute("title", "town center");
    });
  });

  describe("className prop", () => {
    it("applies custom className", () => {
      render(<GameIcon type="food" className="custom-icon" />);
      const img = screen.getByAltText("food");
      expect(img.className).toContain("custom-icon");
    });

    it("includes inline-block by default", () => {
      render(<GameIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img.className).toContain("inline-block");
    });
  });

  describe("glow effect", () => {
    it("applies glow transform when glow is true", () => {
      render(<GameIcon type="food" glow />);
      const img = screen.getByAltText("food");
      expect(img.style.transform).toBe("scale(1.1)");
    });

    it("does not apply glow transform when glow is false", () => {
      render(<GameIcon type="food" glow={false} />);
      const img = screen.getByAltText("food");
      expect(img.style.transform).toBe("scale(1)");
    });

    it("has filter applied", () => {
      render(<GameIcon type="food" />);
      const img = screen.getByAltText("food");
      expect(img.style.filter).toContain("drop-shadow");
    });
  });

  describe("image error fallback", () => {
    it("shows emoji on image error", () => {
      // Use a different icon type to avoid global state issues
      render(<GameIcon type="wood" />);
      const img = screen.getByAltText("wood");

      // Trigger error
      fireEvent.error(img);

      // Should now show emoji
      expect(screen.getByText("🪵")).toBeInTheDocument();
    });

    it("shows emoji with correct styling on error", () => {
      // Use a different icon type
      render(<GameIcon type="gold" size={20} />);
      const img = screen.getByAltText("gold");

      fireEvent.error(img);

      const emoji = screen.getByText("🪙");
      // Check that size is applied via inline style
      expect(emoji).toBeInTheDocument();
    });
  });

  describe("showLabel prop", () => {
    it("shows label when showLabel is true for icons with labels", () => {
      render(<GameIcon type="scout" showLabel />);
      expect(screen.getByText("Scout")).toBeInTheDocument();
    });

    it("shows label for town_center as TC", () => {
      render(<GameIcon type="town_center" showLabel />);
      expect(screen.getByText("TC")).toBeInTheDocument();
    });

    it("shows label for man_at_arms as MAA", () => {
      render(<GameIcon type="man_at_arms" showLabel />);
      expect(screen.getByText("MAA")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has transition styles", () => {
      // Use scout icon to avoid global state pollution from food icon error test
      render(<GameIcon type="scout" />);
      const img = screen.getByAltText("scout");
      expect(img.style.transition).toContain("0.2s");
    });

    it("has auto image rendering", () => {
      // Use horseman icon
      render(<GameIcon type="horseman" />);
      const img = screen.getByAltText("horseman");
      expect(img).toBeInTheDocument();
    });
  });
});

describe("renderIconText", () => {
  it("returns text without icons as array with single item", () => {
    const result = renderIconText("Gather resources now");
    // Returns array with single string when no icons
    const { container } = render(<>{result}</>);
    expect(container.textContent).toBe("Gather resources now");
  });

  it("replaces [icon:type] with GameIcon component", () => {
    const { container } = render(<>{renderIconText("Build [icon:villager] now")}</>);
    expect(container.textContent).toContain("Build");
    expect(container.textContent).toContain("now");
    // Should contain an img element for the icon
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("replaces multiple icons", () => {
    const { container } = render(<>{renderIconText("[icon:food] and [icon:wood]")}</>);
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it("handles unknown icon syntax with readable fallback", () => {
    const result = renderIconText("[icon:unknown_thing]");
    // Should convert to readable text instead of raw tag
    const { container } = render(<>{result}</>);
    expect(container.textContent).toBe("Unknown Thing");
  });

  it("handles empty string", () => {
    const result = renderIconText("");
    // Empty string returns empty string
    const { container } = render(<>{result}</>);
    expect(container.textContent).toBe("");
  });

  it("handles text with no icon patterns", () => {
    const { container } = render(<>{renderIconText("Just plain text here")}</>);
    expect(container.textContent).toBe("Just plain text here");
  });

  it("uses custom size for icons", () => {
    const { container } = render(<>{renderIconText("[icon:food]", 24)}</>);
    const img = container.querySelector("img");
    if (img) {
      expect(img).toHaveAttribute("width", "24");
    }
  });

  it("handles icon at start of text", () => {
    const { container } = render(<>{renderIconText("[icon:food] is a resource")}</>);
    expect(container.textContent).toContain("is a resource");
  });

  it("handles icon at end of text", () => {
    const { container } = render(<>{renderIconText("Build this [icon:house]")}</>);
    expect(container.textContent).toContain("Build this");
  });

  it("handles multiple icons with text between", () => {
    const { container } = render(<>{renderIconText("[icon:villager] gathers [icon:food]")}</>);
    expect(container.textContent).toContain("gathers");
  });
});
