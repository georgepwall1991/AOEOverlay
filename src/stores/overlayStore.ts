import { create } from "zustand";

interface OverlayState {
  isVisible: boolean;
  isDragging: boolean;

  // Actions
  setVisible: (visible: boolean) => void;
  toggleVisibility: () => void;
  setDragging: (dragging: boolean) => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isVisible: true,
  isDragging: false,

  setVisible: (isVisible) => set({ isVisible }),

  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),

  setDragging: (isDragging) => set({ isDragging }),
}));
