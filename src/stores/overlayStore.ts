import { create } from "zustand";

interface OverlayState {
  isVisible: boolean;
  isAnimating: boolean;
  isDragging: boolean;

  // Actions
  setVisible: (visible: boolean) => void;
  toggleVisibility: () => void;
  setDragging: (dragging: boolean) => void;
  setAnimating: (animating: boolean) => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isVisible: true,
  isAnimating: false,
  isDragging: false,

  setVisible: (isVisible) => set({ isVisible }),

  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),

  setDragging: (isDragging) => set({ isDragging }),

  setAnimating: (isAnimating) => set({ isAnimating }),
}));
