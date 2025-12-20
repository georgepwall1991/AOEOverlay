import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { BuildOrder, BuildOrderStep } from "@/types";

interface BuildOrderState {
  buildOrders: BuildOrder[];
  currentOrderIndex: number;
  currentStepIndex: number;
  activeBranchId: string | null;
  isLoading: boolean;

  // Actions
  setBuildOrders: (orders: BuildOrder[]) => void;
  setCurrentOrderIndex: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  cycleBuildOrder: () => void;
  resetSteps: () => void;
  goToStep: (index: number) => void;
  setActiveBranch: (branchId: string | null) => void;
}

export const resolveActiveSteps = (
  order: BuildOrder | undefined,
  activeBranchId: string | null
): BuildOrderStep[] => {
  if (!order) return [];
  const baseSteps = order.steps || [];
  if (!activeBranchId) return baseSteps;

  const branch = order.branches?.find((b) => b.id === activeBranchId);
  if (!branch) return baseSteps;

  const startIndex = Math.min(
    Math.max(branch.startStepIndex ?? 0, 0),
    Math.max(baseSteps.length, 0)
  );
  return [...baseSteps.slice(0, startIndex), ...(branch.steps || [])];
};

export const useBuildOrderStore = create<BuildOrderState>((set, get) => ({
  buildOrders: [],
  currentOrderIndex: 0,
  currentStepIndex: 0,
  activeBranchId: null,
  isLoading: true,

  setBuildOrders: (orders) =>
    set(() => {
      const pinnedIndex = orders.findIndex((o) => o.pinned);
      return {
        buildOrders: orders,
        isLoading: false,
        currentOrderIndex: pinnedIndex >= 0 ? pinnedIndex : 0,
        currentStepIndex: 0,
        activeBranchId: null,
      };
    }),

  setCurrentOrderIndex: (index) =>
    set({
      currentOrderIndex: index,
      currentStepIndex: 0,
      activeBranchId: null,
    }),

  nextStep: () => {
    const { buildOrders, currentOrderIndex, currentStepIndex, activeBranchId } = get();
    const currentOrder = buildOrders[currentOrderIndex];
    if (!currentOrder) return;

    const steps = resolveActiveSteps(currentOrder, activeBranchId);
    const maxStep = steps.length - 1;
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
      activeBranchId: null,
    });
  },

  resetSteps: () => set({ currentStepIndex: 0 }),

  goToStep: (index) => {
    const { buildOrders, currentOrderIndex, activeBranchId } = get();
    const currentOrder = buildOrders[currentOrderIndex];
    if (!currentOrder) return;

    const steps = resolveActiveSteps(currentOrder, activeBranchId);
    const maxStep = steps.length - 1;
    if (index >= 0 && index <= maxStep) {
      set({ currentStepIndex: index });
    }
  },

  setActiveBranch: (branchId) => {
    const { buildOrders, currentOrderIndex, currentStepIndex } = get();
    const currentOrder = buildOrders[currentOrderIndex];
    const steps = resolveActiveSteps(currentOrder, branchId);
    const clampedIndex = Math.min(currentStepIndex, Math.max(steps.length - 1, 0));
    set({ activeBranchId: branchId, currentStepIndex: clampedIndex });
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
    const steps = resolveActiveSteps(order, state.activeBranchId);
    return steps[state.currentStepIndex] ?? null;
  });

export const useEnabledBuildOrders = () =>
  useBuildOrderStore(useShallow((state) => state.buildOrders.filter((o) => o.enabled)));

export const useActiveSteps = () =>
  useBuildOrderStore(
    useShallow((state) =>
      resolveActiveSteps(
        state.buildOrders[state.currentOrderIndex],
        state.activeBranchId
      )
    )
  );

export const useActiveBranchId = () =>
  useBuildOrderStore((state) => state.activeBranchId);
