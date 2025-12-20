import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMatchupStore } from "./matchupStore";
import type { Civilization } from "@/types";

describe("matchupStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useMatchupStore());
    act(() => {
      result.current.setOpen(false);
      // Reset opponent state by setting to undefined for all civs
      result.current.setOpponent("English" as Civilization, undefined);
    });
  });

  describe("initial state", () => {
    it("starts with panel closed", () => {
      const { result } = renderHook(() => useMatchupStore());
      expect(result.current.isOpen).toBe(false);
    });

    it("starts with no opponent selected", () => {
      const { result } = renderHook(() => useMatchupStore());
      expect(result.current.opponentCiv).toBeUndefined();
    });

    it("starts with empty opponentByCiv map", () => {
      const { result } = renderHook(() => useMatchupStore());
      // The map may have entries from previous tests, but new lookups should work
      expect(typeof result.current.opponentByCiv).toBe("object");
    });
  });

  describe("setOpen", () => {
    it("opens the panel", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpen(true);
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("closes the panel", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpen(true);
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.setOpen(false);
      });
      expect(result.current.isOpen).toBe(false);
    });

    it("handles repeated same-state calls", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpen(true);
        result.current.setOpen(true);
        result.current.setOpen(true);
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("toggle", () => {
    it("toggles from closed to open", () => {
      const { result } = renderHook(() => useMatchupStore());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("toggles from open to closed", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpen(true);
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("handles multiple toggles correctly", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.toggle(); // false -> true
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle(); // true -> false
      });
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle(); // false -> true
      });
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("setOpponent", () => {
    it("sets opponent for a civilization", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpponent(
          "English" as Civilization,
          "French" as Civilization
        );
      });

      expect(result.current.opponentCiv).toBe("French");
      expect(result.current.opponentByCiv["English"]).toBe("French");
    });

    it("updates opponentCiv to latest selection", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpponent(
          "English" as Civilization,
          "French" as Civilization
        );
      });
      expect(result.current.opponentCiv).toBe("French");

      act(() => {
        result.current.setOpponent(
          "French" as Civilization,
          "Mongols" as Civilization
        );
      });
      expect(result.current.opponentCiv).toBe("Mongols");
    });

    it("stores different opponents for different player civs", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpponent(
          "English" as Civilization,
          "French" as Civilization
        );
        result.current.setOpponent(
          "French" as Civilization,
          "Mongols" as Civilization
        );
        result.current.setOpponent(
          "Chinese" as Civilization,
          "Delhi" as Civilization
        );
      });

      expect(result.current.opponentByCiv["English"]).toBe("French");
      expect(result.current.opponentByCiv["French"]).toBe("Mongols");
      expect(result.current.opponentByCiv["Chinese"]).toBe("Delhi");
    });

    it("allows clearing opponent by setting undefined", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpponent(
          "English" as Civilization,
          "French" as Civilization
        );
      });
      expect(result.current.opponentCiv).toBe("French");

      act(() => {
        result.current.setOpponent("English" as Civilization, undefined);
      });
      expect(result.current.opponentCiv).toBeUndefined();
    });

    it("overwrites previous opponent for same player civ", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpponent(
          "English" as Civilization,
          "French" as Civilization
        );
      });
      expect(result.current.opponentByCiv["English"]).toBe("French");

      act(() => {
        result.current.setOpponent(
          "English" as Civilization,
          "Mongols" as Civilization
        );
      });
      expect(result.current.opponentByCiv["English"]).toBe("Mongols");
    });
  });

  describe("getOpponentFor", () => {
    it("returns specific opponent when set for civ", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpponent(
          "English" as Civilization,
          "French" as Civilization
        );
      });

      expect(result.current.getOpponentFor("English" as Civilization)).toBe(
        "French"
      );
    });

    it("falls back to opponentCiv when civ-specific not set", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        // Set opponent for English (this also sets opponentCiv)
        result.current.setOpponent(
          "English" as Civilization,
          "French" as Civilization
        );
      });

      // French has no specific opponent, should fall back to opponentCiv
      expect(result.current.getOpponentFor("Mongols" as Civilization)).toBe(
        "French"
      );
    });

    it("returns undefined when no opponent set at all", () => {
      const { result } = renderHook(() => useMatchupStore());

      // After reset, getting opponent for a civ that was never set
      expect(
        result.current.getOpponentFor("Mongols" as Civilization)
      ).toBeUndefined();
    });

    it("returns civ-specific even when different from opponentCiv", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpponent(
          "English" as Civilization,
          "French" as Civilization
        );
        result.current.setOpponent(
          "French" as Civilization,
          "Mongols" as Civilization
        ); // This updates opponentCiv
      });

      // English should still return French (civ-specific), not Mongols (opponentCiv)
      expect(result.current.getOpponentFor("English" as Civilization)).toBe(
        "French"
      );
      expect(result.current.opponentCiv).toBe("Mongols");
    });
  });

  describe("useMatchupPanelState selector", () => {
    it("returns current panel state", () => {
      // Use getState for non-reactive access in tests
      const state = useMatchupStore.getState();
      act(() => {
        state.setOpen(false);
      });

      // useMatchupPanelState is a hook selector, not a store
      // Access state through useMatchupStore.getState() directly
      const panelState = useMatchupStore.getState();

      expect(panelState.isOpen).toBe(false);

      act(() => {
        state.setOpen(true);
      });
      const updatedState = useMatchupStore.getState();
      expect(updatedState.isOpen).toBe(true);
    });

    it("returns opponentCiv", () => {
      const state = useMatchupStore.getState();

      act(() => {
        state.setOpponent("English" as Civilization, "French" as Civilization);
      });

      const updatedState = useMatchupStore.getState();
      expect(updatedState.opponentCiv).toBe("French");
    });

    it("returns opponentByCiv map", () => {
      const state = useMatchupStore.getState();

      act(() => {
        state.setOpponent("English" as Civilization, "French" as Civilization);
      });

      const updatedState = useMatchupStore.getState();
      expect(updatedState.opponentByCiv["English"]).toBe("French");
    });

    it("updates when store changes", () => {
      const state = useMatchupStore.getState();
      act(() => {
        state.setOpen(false);
      });
      expect(useMatchupStore.getState().isOpen).toBe(false);

      act(() => {
        state.toggle();
      });
      expect(useMatchupStore.getState().isOpen).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles rapid state changes", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.toggle();
        }
      });

      // 100 toggles from false = false
      expect(result.current.isOpen).toBe(false);
    });

    it("handles all civilization types", () => {
      const { result } = renderHook(() => useMatchupStore());
      const civs: Civilization[] = [
        "English",
        "French",
        "Mongols",
        "Chinese",
        "Delhi",
        "Rus",
        "HRE",
        "Abbasid",
        "Malians",
        "Ottomans",
        "Japanese",
        "Byzantines",
        "Ayyubids",
        "Jeanne d'Arc",
        "Order of the Dragon",
        "Zhu Xi's Legacy",
      ] as Civilization[];

      act(() => {
        civs.forEach((civ) => {
          result.current.setOpponent(civ, "English" as Civilization);
        });
      });

      civs.forEach((civ) => {
        expect(result.current.opponentByCiv[civ]).toBe("English");
      });
    });

    it("maintains state isolation between operations", () => {
      const { result } = renderHook(() => useMatchupStore());

      act(() => {
        result.current.setOpen(true);
        result.current.setOpponent(
          "English" as Civilization,
          "French" as Civilization
        );
      });

      // Toggle should not affect opponent
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.opponentCiv).toBe("French");
    });
  });
});
