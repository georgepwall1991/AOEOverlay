import { create } from "zustand";
import type { Civilization } from "@/types";
import { aoe4worldApi } from "@/lib/aoe4world";

interface MatchupState {
  isOpen: boolean;
  opponentCiv?: Civilization;
  opponentByCiv: Partial<Record<Civilization, Civilization>>;
  isDetecting: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setOpponent: (playerCiv: Civilization, civ?: Civilization) => void;
  getOpponentFor: (playerCiv: Civilization) => Civilization | undefined;
  detectMatch: (profileId: number, playerCiv: Civilization) => Promise<boolean>;
}

export const useMatchupStore = create<MatchupState>((set, get) => ({
  isOpen: false,
  opponentCiv: undefined,
  opponentByCiv: {},
  isDetecting: false,
  setOpen: (isOpen) => set({ isOpen }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpponent: (playerCiv, civ) =>
    set((state) => ({
      opponentCiv: civ,
      opponentByCiv: { ...state.opponentByCiv, [playerCiv]: civ },
    })),
  getOpponentFor: (playerCiv) => get().opponentByCiv[playerCiv] ?? get().opponentCiv,

  detectMatch: async (profileId, playerCiv) => {
    set({ isDetecting: true });
    try {
      const liveMatch = await aoe4worldApi.getLiveMatch(profileId);
      if (liveMatch) {
        // Find the opponent team (the team where our player is NOT present)
        const opponentTeam = liveMatch.teams.find((team: any[]) => 
          !team.some((p: any) => p.profile_id === profileId)
        );
        
        if (opponentTeam && opponentTeam[0]) {
          const civ = opponentTeam[0].civilization;
          // Capitalize first letter to match our type
          const formattedCiv = (civ.charAt(0).toUpperCase() + civ.slice(1)) as Civilization;
          get().setOpponent(playerCiv, formattedCiv);
          set({ isDetecting: false, isOpen: true });
          return true;
        }
      }
    } catch (error) {
      console.error("Match detection failed:", error);
    }
    set({ isDetecting: false });
    return false;
  }
}));

export const useMatchupPanelState = () =>
  useMatchupStore((state) => ({
    isOpen: state.isOpen,
    opponentCiv: state.opponentCiv,
    opponentByCiv: state.opponentByCiv,
  }));


