import { create } from "zustand";

interface CounterGridState {
  isOpen: boolean;
  searchQuery: string;
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
  setSearchQuery: (query: string) => void;
}

export const useCounterGridStore = create<CounterGridState>((set) => ({
  isOpen: false,
  searchQuery: "",
  setOpen: (isOpen) => set({ isOpen }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
