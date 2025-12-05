import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlayerProfile, PlayerSearchResult } from "@/types";
import { aoe4worldApi } from "@/lib/aoe4world";

interface PlayerState {
  // Current player profile
  currentPlayer: PlayerProfile | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Search
  searchResults: PlayerSearchResult[];
  searchQuery: string;
  isSearching: boolean;

  // Saved profile ID
  savedProfileId: number | null;

  // Actions
  setCurrentPlayer: (player: PlayerProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSavedProfileId: (profileId: number | null) => void;

  // Async actions
  searchPlayers: (query: string) => Promise<void>;
  fetchPlayer: (profileId: number) => Promise<void>;
  refreshPlayer: () => Promise<void>;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentPlayer: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      searchResults: [],
      searchQuery: "",
      isSearching: false,
      savedProfileId: null,

      setCurrentPlayer: (currentPlayer) => set({ currentPlayer, lastUpdated: Date.now() }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSavedProfileId: (savedProfileId) => set({ savedProfileId }),

      searchPlayers: async (query: string) => {
        if (!query.trim()) {
          set({ searchResults: [], searchQuery: "" });
          return;
        }

        set({ isSearching: true, searchQuery: query });

        try {
          const response = await aoe4worldApi.searchPlayers(query, 5);
          set({ searchResults: response.players || [], isSearching: false });
        } catch (error) {
          console.error("Failed to search players:", error);
          set({ searchResults: [], isSearching: false });
        }
      },

      fetchPlayer: async (profileId: number) => {
        set({ isLoading: true, error: null });

        try {
          const player = await aoe4worldApi.getPlayer(profileId);
          set({
            currentPlayer: player,
            savedProfileId: profileId,
            isLoading: false,
            error: null,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch player";
          set({ isLoading: false, error: message });
        }
      },

      refreshPlayer: async () => {
        const { savedProfileId } = get();
        if (!savedProfileId) return;

        set({ isLoading: true, error: null });

        try {
          const player = await aoe4worldApi.getPlayer(savedProfileId);
          set({
            currentPlayer: player,
            isLoading: false,
            error: null,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to refresh player";
          set({ isLoading: false, error: message });
        }
      },

      clearPlayer: () => {
        set({
          currentPlayer: null,
          savedProfileId: null,
          error: null,
          lastUpdated: null,
          searchResults: [],
          searchQuery: "",
        });
      },
    }),
    {
      name: "aoe4-player-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedProfileId: state.savedProfileId,
      }),
    }
  )
);

// Helper hook to get win rate - accepts any GameMode
export const usePlayerWinRate = (mode: string = "rm_solo") => {
  const player = usePlayerStore((s) => s.currentPlayer);
  const stats = player?.modes?.[mode as keyof typeof player.modes];

  if (!stats || stats.games_count === 0) return null;

  return Math.round((stats.wins_count / stats.games_count) * 100);
};
