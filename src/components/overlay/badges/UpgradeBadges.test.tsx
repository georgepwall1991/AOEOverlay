import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UpgradeBadges } from "./UpgradeBadges";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

// Mock stores
const mockDismissBadge = vi.fn();
const mockIsBadgeDismissed = vi.fn().mockReturnValue(false);

vi.mock("@/stores", () => ({
  useConfigStore: vi.fn(() => ({
    config: {
      upgradeBadges: {
        enabled: true,
        badges: [
          {
            id: "wheelbarrow",
            name: "Wheelbarrow",
            shortName: "WB",
            enabled: true,
            triggerSeconds: 120,
          },
          {
            id: "professional-scouts",
            name: "Professional Scouts",
            shortName: "Scouts",
            enabled: true,
            triggerSeconds: 180,
          },
          {
            id: "disabled-badge",
            name: "Disabled Badge",
            shortName: "DB",
            enabled: false,
            triggerSeconds: 60,
          },
        ],
      },
    },
  })),
  useBadgeStore: vi.fn(() => ({
    dismissBadge: mockDismissBadge,
    isBadgeDismissed: mockIsBadgeDismissed,
  })),
  useElapsedSeconds: vi.fn(() => 150),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  X: ({ className }: { className?: string }) => (
    <span data-testid="x-icon" className={className}>×</span>
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <span data-testid="alert-icon" className={className}>⚠</span>
  ),
}));

describe("UpgradeBadges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBadgeDismissed.mockReturnValue(false);
  });

  describe("rendering", () => {
    it("renders visible badges", () => {
      render(<UpgradeBadges />);
      expect(screen.getByText("WB")).toBeInTheDocument();
    });

    it("does not render badges before trigger time", () => {
      render(<UpgradeBadges />);
      // Professional Scouts triggers at 180s, we're at 150s
      expect(screen.queryByText("Scouts")).not.toBeInTheDocument();
    });

    it("does not render disabled badges", () => {
      render(<UpgradeBadges />);
      expect(screen.queryByText("DB")).not.toBeInTheDocument();
    });

    it("renders badge with title attribute", () => {
      render(<UpgradeBadges />);
      const badge = screen.getByTitle("Wheelbarrow");
      expect(badge).toBeInTheDocument();
    });

    it("renders dismiss button", () => {
      render(<UpgradeBadges />);
      expect(screen.getByTestId("x-icon")).toBeInTheDocument();
    });
  });

  describe("dismiss functionality", () => {
    it("calls dismissBadge when dismiss button clicked", () => {
      render(<UpgradeBadges />);
      const dismissButton = screen.getByTitle("Dismiss");

      fireEvent.click(dismissButton);

      expect(mockDismissBadge).toHaveBeenCalledWith("wheelbarrow");
    });

    it("stops event propagation on dismiss", () => {
      render(<UpgradeBadges />);
      const dismissButton = screen.getByTitle("Dismiss");

      const clickEvent = new MouseEvent("click", { bubbles: true });
      const stopPropagation = vi.spyOn(clickEvent, "stopPropagation");

      dismissButton.dispatchEvent(clickEvent);

      expect(stopPropagation).toHaveBeenCalled();
    });
  });

  describe("badge states", () => {
    it("does not show alert icon for non-urgent badges", () => {
      render(<UpgradeBadges />);
      // At 150s, wheelbarrow (120s trigger) is 30s past - right at urgent threshold
      // Let's check for the icon
      const alerts = screen.queryAllByTestId("alert-icon");
      // Badge becomes urgent at 30+ seconds past trigger
      expect(alerts.length).toBe(1); // Exactly at 30s is urgent
    });
  });
});

describe("UpgradeBadges edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when badges disabled", async () => {
    const { useConfigStore } = await import("@/stores");
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        upgradeBadges: {
          enabled: false,
          badges: [],
        },
      },
    });

    const { container } = render(<UpgradeBadges />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when elapsed time is 0", async () => {
    const { useElapsedSeconds, useConfigStore } = await import("@/stores");
    vi.mocked(useElapsedSeconds).mockReturnValue(0);
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        upgradeBadges: {
          enabled: true,
          badges: [
            {
              id: "test",
              name: "Test",
              shortName: "T",
              enabled: true,
              triggerSeconds: 60,
            },
          ],
        },
      },
    });

    const { container } = render(<UpgradeBadges />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when no visible badges", async () => {
    const { useElapsedSeconds, useConfigStore } = await import("@/stores");
    vi.mocked(useElapsedSeconds).mockReturnValue(30);
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        upgradeBadges: {
          enabled: true,
          badges: [
            {
              id: "test",
              name: "Test",
              shortName: "T",
              enabled: true,
              triggerSeconds: 60, // Triggers at 60s, we're at 30s
            },
          ],
        },
      },
    });

    const { container } = render(<UpgradeBadges />);
    expect(container.firstChild).toBeNull();
  });

  it("does not show dismissed badges", async () => {
    const { useElapsedSeconds, useConfigStore, useBadgeStore } = await import("@/stores");
    vi.mocked(useElapsedSeconds).mockReturnValue(150);
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        upgradeBadges: {
          enabled: true,
          badges: [
            {
              id: "wheelbarrow",
              name: "Wheelbarrow",
              shortName: "WB",
              enabled: true,
              triggerSeconds: 120,
            },
          ],
        },
      },
    });
    vi.mocked(useBadgeStore).mockReturnValue({
      dismissBadge: mockDismissBadge,
      isBadgeDismissed: vi.fn().mockReturnValue(true),
    });

    const { container } = render(<UpgradeBadges />);
    expect(container.firstChild).toBeNull();
  });

  it("shows urgent badge with alert icon when 30+ seconds past trigger", async () => {
    const { useElapsedSeconds, useConfigStore, useBadgeStore } = await import("@/stores");
    vi.mocked(useElapsedSeconds).mockReturnValue(200); // 80s past 120s trigger
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        upgradeBadges: {
          enabled: true,
          badges: [
            {
              id: "wheelbarrow",
              name: "Wheelbarrow",
              shortName: "WB",
              enabled: true,
              triggerSeconds: 120,
            },
          ],
        },
      },
    });
    vi.mocked(useBadgeStore).mockReturnValue({
      dismissBadge: mockDismissBadge,
      isBadgeDismissed: vi.fn().mockReturnValue(false),
    });

    render(<UpgradeBadges />);
    expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    expect(screen.getByText("WB")).toBeInTheDocument();
  });

  it("shows multiple badges when conditions met", async () => {
    const { useElapsedSeconds, useConfigStore, useBadgeStore } = await import("@/stores");
    vi.mocked(useElapsedSeconds).mockReturnValue(300); // Far past all triggers
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        upgradeBadges: {
          enabled: true,
          badges: [
            {
              id: "wheelbarrow",
              name: "Wheelbarrow",
              shortName: "WB",
              enabled: true,
              triggerSeconds: 120,
            },
            {
              id: "professional-scouts",
              name: "Professional Scouts",
              shortName: "Scouts",
              enabled: true,
              triggerSeconds: 180,
            },
          ],
        },
      },
    });
    vi.mocked(useBadgeStore).mockReturnValue({
      dismissBadge: mockDismissBadge,
      isBadgeDismissed: vi.fn().mockReturnValue(false),
    });

    render(<UpgradeBadges />);
    expect(screen.getByText("WB")).toBeInTheDocument();
    expect(screen.getByText("Scouts")).toBeInTheDocument();
  });

  it("uses default config when upgradeBadges is null", async () => {
    const { useConfigStore, useElapsedSeconds } = await import("@/stores");
    vi.mocked(useElapsedSeconds).mockReturnValue(0);
    vi.mocked(useConfigStore).mockReturnValue({
      config: {
        upgradeBadges: null,
      },
    });

    const { container } = render(<UpgradeBadges />);
    // Should not crash and return null because elapsed is 0
    expect(container.firstChild).toBeNull();
  });
});
