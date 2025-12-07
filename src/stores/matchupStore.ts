import { create } from "zustand";
import type { Civilization } from "@/types";

interface MatchupState {
  isOpen: boolean;
  opponentCiv?: Civilization;
  opponentByCiv: Partial<Record<Civilization, Civilization>>;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setOpponent: (playerCiv: Civilization, civ?: Civilization) => void;
  getOpponentFor: (playerCiv: Civilization) => Civilization | undefined;
}

export const useMatchupStore = create<MatchupState>((set, get) => ({
  isOpen: false,
  opponentCiv: undefined,
  opponentByCiv: {},
  setOpen: (isOpen) => set({ isOpen }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpponent: (playerCiv, civ) =>
    set((state) => ({
      opponentCiv: civ,
      opponentByCiv: { ...state.opponentByCiv, [playerCiv]: civ },
    })),
  getOpponentFor: (playerCiv) => get().opponentByCiv[playerCiv] ?? get().opponentCiv,
}));

export const useMatchupPanelState = () =>
  useMatchupStore((state) => ({
    isOpen: state.isOpen,
    opponentCiv: state.opponentCiv,
    opponentByCiv: state.opponentByCiv,
  }));


