import { create } from 'zustand';

interface MetronomeRuntimeState {
  lastTickTimestamp: number;
  isPulsing: boolean;
  recordTick: (timestamp: number) => void;
  setPulsing: (isPulsing: boolean) => void;
}

export const useMetronomeStore = create<MetronomeRuntimeState>((set) => ({
  lastTickTimestamp: 0,
  isPulsing: false,
  recordTick: (lastTickTimestamp) => set({ lastTickTimestamp }),
  setPulsing: (isPulsing) => set({ isPulsing }),
}));
