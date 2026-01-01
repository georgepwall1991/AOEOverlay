import { create } from 'zustand';

interface MetronomeRuntimeState {
  lastTickTimestamp: number;
  isPulsing: boolean;
  currentTaskIndex: number;
  recordTick: (timestamp: number) => void;
  setPulsing: (isPulsing: boolean) => void;
  nextTask: () => void;
  resetTasks: () => void;
}

export const useMetronomeStore = create<MetronomeRuntimeState>((set) => ({
  lastTickTimestamp: 0,
  isPulsing: false,
  currentTaskIndex: 0,
  recordTick: (lastTickTimestamp) => set({ lastTickTimestamp }),
  setPulsing: (isPulsing) => set({ isPulsing }),
  nextTask: () => set((state) => ({ currentTaskIndex: (state.currentTaskIndex + 1) % 4 })),
  resetTasks: () => set({ currentTaskIndex: 0 }),
}));
