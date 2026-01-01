import { create } from 'zustand';

export interface StepRecord {
  stepId: string;
  description: string;
  expectedTiming: string;
  actualTiming: number; // seconds
  delta: number; // seconds
}

export interface SessionRecord {
  id: string;
  buildOrderId: string;
  buildOrderName: string;
  timestamp: number;
  steps: StepRecord[];
}

interface SessionState {
  currentSession: SessionRecord | null;
  history: SessionRecord[];
  isReportOpen: boolean;
  
  startSession: (buildOrderId: string, buildOrderName: string) => void;
  recordStep: (step: StepRecord) => void;
  endSession: () => void;
  clearHistory: () => void;
  setReportOpen: (open: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  history: [],
  isReportOpen: false,

  startSession: (buildOrderId, buildOrderName) => set({
    currentSession: {
      id: `session-${Date.now()}`,
      buildOrderId,
      buildOrderName,
      timestamp: Date.now(),
      steps: [],
    },
    isReportOpen: false,
  }),

  recordStep: (step) => set((state) => {
    if (!state.currentSession) return state;
    return {
      currentSession: {
        ...state.currentSession,
        steps: [...state.currentSession.steps, step],
      }
    };
  }),

  endSession: () => set((state) => {
    if (!state.currentSession || state.currentSession.steps.length === 0) {
      return { currentSession: null };
    }
    return {
      history: [state.currentSession, ...state.history].slice(0, 50), // Keep last 50
      currentSession: null,
      isReportOpen: true,
    };
  }),

  clearHistory: () => set({ history: [] }),
  setReportOpen: (isReportOpen) => set({ isReportOpen }),
}));
