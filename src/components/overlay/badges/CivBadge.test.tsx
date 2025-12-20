import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CivBadge } from "./CivBadge";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

describe("CivBadge", () => {
  describe("rendering", () => {
    it("renders the civilization name", () => {
      render(<CivBadge civilization="English" />);
      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it("renders as a span element", () => {
      render(<CivBadge civilization="French" />);
      const badge = screen.getByText("French");
      expect(badge.tagName).toBe("SPAN");
    });
  });

  describe("civilization colors", () => {
    it("applies English colors", () => {
      render(<CivBadge civilization="English" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("bg-red-500/20");
      expect(badge.className).toContain("text-red-400");
    });

    it("applies French colors", () => {
      render(<CivBadge civilization="French" />);
      const badge = screen.getByText("French");
      expect(badge.className).toContain("bg-blue-500/20");
      expect(badge.className).toContain("text-blue-400");
    });

    it("applies Holy Roman Empire colors", () => {
      render(<CivBadge civilization="Holy Roman Empire" />);
      const badge = screen.getByText("Holy Roman Empire");
      expect(badge.className).toContain("bg-yellow-500/20");
      expect(badge.className).toContain("text-yellow-400");
    });

    it("applies HRE alias colors", () => {
      render(<CivBadge civilization="HRE" />);
      const badge = screen.getByText("HRE");
      expect(badge.className).toContain("bg-yellow-500/20");
    });

    it("applies Mongols colors", () => {
      render(<CivBadge civilization="Mongols" />);
      const badge = screen.getByText("Mongols");
      expect(badge.className).toContain("bg-orange-500/20");
    });

    it("applies Rus colors", () => {
      render(<CivBadge civilization="Rus" />);
      const badge = screen.getByText("Rus");
      expect(badge.className).toContain("bg-green-500/20");
    });

    it("applies Chinese colors", () => {
      render(<CivBadge civilization="Chinese" />);
      const badge = screen.getByText("Chinese");
      expect(badge.className).toContain("bg-red-600/20");
    });

    it("applies Delhi Sultanate colors", () => {
      render(<CivBadge civilization="Delhi Sultanate" />);
      const badge = screen.getByText("Delhi Sultanate");
      expect(badge.className).toContain("bg-emerald-500/20");
    });

    it("applies Delhi alias colors", () => {
      render(<CivBadge civilization="Delhi" />);
      const badge = screen.getByText("Delhi");
      expect(badge.className).toContain("bg-emerald-500/20");
    });

    it("applies Abbasid colors", () => {
      render(<CivBadge civilization="Abbasid" />);
      const badge = screen.getByText("Abbasid");
      expect(badge.className).toContain("bg-amber-500/20");
    });

    it("applies Abbasid Dynasty alias colors", () => {
      render(<CivBadge civilization="Abbasid Dynasty" />);
      const badge = screen.getByText("Abbasid Dynasty");
      expect(badge.className).toContain("bg-amber-500/20");
    });

    it("applies Ottomans colors", () => {
      render(<CivBadge civilization="Ottomans" />);
      const badge = screen.getByText("Ottomans");
      expect(badge.className).toContain("bg-red-500/20");
    });

    it("applies Malians colors", () => {
      render(<CivBadge civilization="Malians" />);
      const badge = screen.getByText("Malians");
      expect(badge.className).toContain("bg-yellow-600/20");
    });

    it("applies Japanese colors", () => {
      render(<CivBadge civilization="Japanese" />);
      const badge = screen.getByText("Japanese");
      expect(badge.className).toContain("bg-pink-500/20");
    });

    it("applies Byzantines colors", () => {
      render(<CivBadge civilization="Byzantines" />);
      const badge = screen.getByText("Byzantines");
      expect(badge.className).toContain("bg-purple-500/20");
    });

    it("applies Order of the Dragon colors", () => {
      render(<CivBadge civilization="Order of the Dragon" />);
      const badge = screen.getByText("Order of the Dragon");
      expect(badge.className).toContain("bg-slate-500/20");
    });

    it("applies Jeanne d'Arc colors", () => {
      render(<CivBadge civilization="Jeanne d'Arc" />);
      const badge = screen.getByText("Jeanne d'Arc");
      expect(badge.className).toContain("bg-indigo-500/20");
    });

    it("applies Zhu Xi's Legacy colors", () => {
      render(<CivBadge civilization="Zhu Xi's Legacy" />);
      const badge = screen.getByText("Zhu Xi's Legacy");
      expect(badge.className).toContain("bg-rose-500/20");
    });

    it("applies Ayyubids colors", () => {
      render(<CivBadge civilization="Ayyubids" />);
      const badge = screen.getByText("Ayyubids");
      expect(badge.className).toContain("bg-lime-500/20");
    });

    it("applies Golden Horde colors", () => {
      render(<CivBadge civilization="Golden Horde" />);
      const badge = screen.getByText("Golden Horde");
      expect(badge.className).toContain("bg-amber-600/20");
    });

    it("applies Macedonian Dynasty colors", () => {
      render(<CivBadge civilization="Macedonian Dynasty" />);
      const badge = screen.getByText("Macedonian Dynasty");
      expect(badge.className).toContain("bg-violet-500/20");
    });

    it("applies Sengoku Daimyo colors", () => {
      render(<CivBadge civilization="Sengoku Daimyo" />);
      const badge = screen.getByText("Sengoku Daimyo");
      expect(badge.className).toContain("bg-red-700/20");
    });

    it("applies Tughlaq Dynasty colors", () => {
      render(<CivBadge civilization="Tughlaq Dynasty" />);
      const badge = screen.getByText("Tughlaq Dynasty");
      expect(badge.className).toContain("bg-teal-500/20");
    });

    it("applies default colors for unknown civilization", () => {
      render(<CivBadge civilization="Unknown Civ" />);
      const badge = screen.getByText("Unknown Civ");
      expect(badge.className).toContain("bg-white/10");
      expect(badge.className).toContain("text-white/70");
    });
  });

  describe("size variants", () => {
    it("defaults to medium size", () => {
      render(<CivBadge civilization="English" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("text-xs");
      expect(badge.className).toContain("px-2");
      expect(badge.className).toContain("py-1");
    });

    it("applies small size when specified", () => {
      render(<CivBadge civilization="English" size="sm" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("text-[10px]");
      expect(badge.className).toContain("px-1.5");
      expect(badge.className).toContain("py-0.5");
    });

    it("applies medium size when specified", () => {
      render(<CivBadge civilization="English" size="md" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("text-xs");
    });
  });

  describe("glow effect", () => {
    it("does not apply glow by default", () => {
      render(<CivBadge civilization="English" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("border");
    });

    it("applies glow styles when glow is true", () => {
      render(<CivBadge civilization="English" glow />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("border-0");
      expect(badge.style.boxShadow).toContain("currentColor");
    });

    it("applies text-shadow when glow is false", () => {
      render(<CivBadge civilization="English" glow={false} />);
      const badge = screen.getByText("English");
      expect(badge.style.textShadow).toContain("rgba(0,0,0,0.8)");
    });

    it("applies text-shadow when glow is true", () => {
      render(<CivBadge civilization="English" glow={true} />);
      const badge = screen.getByText("English");
      expect(badge.style.textShadow).toContain("currentColor");
    });
  });

  describe("className prop", () => {
    it("applies custom className", () => {
      render(<CivBadge civilization="English" className="custom-class" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("custom-class");
    });

    it("merges custom className with default classes", () => {
      render(<CivBadge civilization="English" className="my-custom" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("my-custom");
      expect(badge.className).toContain("rounded");
      expect(badge.className).toContain("font-bold");
    });
  });

  describe("base styling", () => {
    it("has inline-flex display", () => {
      render(<CivBadge civilization="English" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("inline-flex");
    });

    it("has items-center alignment", () => {
      render(<CivBadge civilization="English" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("items-center");
    });

    it("has transition animation", () => {
      render(<CivBadge civilization="English" />);
      const badge = screen.getByText("English");
      expect(badge.className).toContain("transition-all");
      expect(badge.className).toContain("duration-200");
    });
  });
});
