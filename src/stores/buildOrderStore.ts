import { create } from "zustand";
import type { BuildOrder } from "@/types";

interface BuildOrderState {
  buildOrders: BuildOrder[];
  currentOrderIndex: number;
  currentStepIndex: number;
  isLoading: boolean;

  // Actions
  setBuildOrders: (orders: BuildOrder[]) => void;
  setCurrentOrderIndex: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  cycleBuildOrder: () => void;
  resetSteps: () => void;
  goToStep: (index: number) => void;
}

export const useBuildOrderStore = create<BuildOrderState>((set, get) => ({
  buildOrders: [],
  currentOrderIndex: 0,
  currentStepIndex: 0,
  isLoading: true,

  setBuildOrders: (orders) =>
    set({
      buildOrders: orders,
      isLoading: false,
      currentOrderIndex: 0,
      currentStepIndex: 0,
    }),

  setCurrentOrderIndex: (index) =>
    set({
      currentOrderIndex: index,
      currentStepIndex: 0,
    }),

  nextStep: () => {
    const { buildOrders, currentOrderIndex, currentStepIndex } = get();
    const currentOrder = buildOrders[currentOrderIndex];
    if (!currentOrder) return;

    const maxStep = currentOrder.steps.length - 1;
    if (currentStepIndex < maxStep) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  previousStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  cycleBuildOrder: () => {
    const { buildOrders, currentOrderIndex } = get();
    const enabledOrders = buildOrders.filter((o) => o.enabled);
    if (enabledOrders.length === 0) return;

    const currentEnabledIndex = enabledOrders.findIndex(
      (o) => o.id === buildOrders[currentOrderIndex]?.id
    );
    const nextEnabledIndex = (currentEnabledIndex + 1) % enabledOrders.length;
    const nextOrder = enabledOrders[nextEnabledIndex];

    const nextOrderIndex = buildOrders.findIndex((o) => o.id === nextOrder.id);
    set({
      currentOrderIndex: nextOrderIndex,
      currentStepIndex: 0,
    });
  },

  resetSteps: () => set({ currentStepIndex: 0 }),

  goToStep: (index) => {
    const { buildOrders, currentOrderIndex } = get();
    const currentOrder = buildOrders[currentOrderIndex];
    if (!currentOrder) return;

    const maxStep = currentOrder.steps.length - 1;
    if (index >= 0 && index <= maxStep) {
      set({ currentStepIndex: index });
    }
  },
}));

// Selectors
export const useCurrentBuildOrder = () =>
  useBuildOrderStore((state) =>
    state.buildOrders[state.currentOrderIndex] ?? null
  );

export const useCurrentStep = () =>
  useBuildOrderStore((state) => {
    const order = state.buildOrders[state.currentOrderIndex];
    return order?.steps[state.currentStepIndex] ?? null;
  });

export const useEnabledBuildOrders = () =>
  useBuildOrderStore((state) => state.buildOrders.filter((o) => o.enabled));
