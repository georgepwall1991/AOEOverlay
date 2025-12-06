import { create } from "zustand";

interface BadgeState {
  // Track which badges have been dismissed in current session
  dismissedBadges: Set<string>;

  // Actions
  dismissBadge: (id: string) => void;
  resetBadges: () => void;
  isBadgeDismissed: (id: string) => boolean;
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  dismissedBadges: new Set(),

  dismissBadge: (id: string) => {
    set((state) => ({
      dismissedBadges: new Set([...state.dismissedBadges, id]),
    }));
  },

  resetBadges: () => {
    set({ dismissedBadges: new Set() });
  },

  isBadgeDismissed: (id: string) => {
    return get().dismissedBadges.has(id);
  },
}));

// Selectors
export const useDismissedBadges = () => useBadgeStore((state) => state.dismissedBadges);
