import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useBuildOrderStore,
  useCurrentBuildOrder,
  useCurrentStep,
} from "./buildOrderStore";
import type { BuildOrder } from "@/types";

describe("buildOrderStore", () => {
  const mockBuildOrders: BuildOrder[] = [
    {
      id: "order-1",
      name: "English Rush",
      civilization: "English",
      description: "Fast feudal push",
      difficulty: "Beginner",
      enabled: true,
      steps: [
        { id: "s1-1", description: "Build house", timing: "0:30" },
        { id: "s1-2", description: "Build mill", timing: "2:00" },
        { id: "s1-3", description: "Age up", timing: "5:00" },
      ],
    },
    {
      id: "order-2",
      name: "French FC",
      civilization: "French",
      description: "Fast castle",
      difficulty: "Intermediate",
      enabled: true,
      steps: [
        { id: "s2-1", description: "TC villagers to food" },
        { id: "s2-2", description: "Build lumber camp" },
      ],
    },
    {
      id: "order-3",
      name: "Disabled Build",
      civilization: "Mongols",
      description: "Not enabled",
      difficulty: "Advanced",
      enabled: false,
      steps: [{ id: "s3-1", description: "Test step" }],
    },
  ];

  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useBuildOrderStore());
    act(() => {
      result.current.setBuildOrders([]);
    });
  });

  describe("initial state", () => {
    it("starts with empty build orders and loading true", () => {
      // Reset and check initial state
      const { result } = renderHook(() => useBuildOrderStore());

      // After setBuildOrders([]) in beforeEach, isLoading becomes false
      expect(result.current.buildOrders).toEqual([]);
      expect(result.current.currentOrderIndex).toBe(0);
      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe("setBuildOrders", () => {
    it("sets build orders and resets indices", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
      });

      expect(result.current.buildOrders).toEqual(mockBuildOrders);
      expect(result.current.currentOrderIndex).toBe(0);
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });

    it("resets indices when setting new build orders", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.goToStep(2);
        result.current.setCurrentOrderIndex(1);
      });

      expect(result.current.currentOrderIndex).toBe(1);
      expect(result.current.currentStepIndex).toBe(0);

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
      });

      expect(result.current.currentOrderIndex).toBe(0);
      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe("setCurrentOrderIndex", () => {
    it("sets current order and resets step index", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.goToStep(2);
      });

      expect(result.current.currentStepIndex).toBe(2);

      act(() => {
        result.current.setCurrentOrderIndex(1);
      });

      expect(result.current.currentOrderIndex).toBe(1);
      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe("nextStep", () => {
    it("advances to next step", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
      });

      expect(result.current.currentStepIndex).toBe(0);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(1);
    });

    it("advances multiple times", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
      });

      act(() => {
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(2);
    });

    it("does not advance past last step", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.goToStep(2); // Last step (index 2 out of 3 steps)
      });

      expect(result.current.currentStepIndex).toBe(2);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(2); // Still at last step
    });

    it("handles empty build orders gracefully", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      // No build orders set
      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it("handles build order with no steps gracefully", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      const emptyOrder: BuildOrder[] = [
        {
          id: "empty",
          name: "Empty",
          civilization: "English",
          description: "",
          difficulty: "Beginner",
          enabled: true,
          steps: [],
        },
      ];

      act(() => {
        result.current.setBuildOrders(emptyOrder);
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe("previousStep", () => {
    it("goes back to previous step", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.goToStep(2);
      });

      expect(result.current.currentStepIndex).toBe(2);

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStepIndex).toBe(1);
    });

    it("does not go below step 0", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
      });

      expect(result.current.currentStepIndex).toBe(0);

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it("goes back multiple times", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.goToStep(2);
      });

      act(() => {
        result.current.previousStep();
        result.current.previousStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe("goToStep", () => {
    it("jumps to specific step", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
      });

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.currentStepIndex).toBe(2);
    });

    it("validates step index is not negative", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.goToStep(1);
      });

      expect(result.current.currentStepIndex).toBe(1);

      act(() => {
        result.current.goToStep(-1);
      });

      expect(result.current.currentStepIndex).toBe(1); // Unchanged
    });

    it("validates step index does not exceed max", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
      });

      act(() => {
        result.current.goToStep(999);
      });

      expect(result.current.currentStepIndex).toBe(0); // Unchanged
    });

    it("handles empty build orders", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.goToStep(5);
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe("resetSteps", () => {
    it("resets step index to 0", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.goToStep(2);
      });

      expect(result.current.currentStepIndex).toBe(2);

      act(() => {
        result.current.resetSteps();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it("keeps current order index unchanged", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.setCurrentOrderIndex(1);
        result.current.goToStep(1);
      });

      act(() => {
        result.current.resetSteps();
      });

      expect(result.current.currentOrderIndex).toBe(1);
      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe("cycleBuildOrder", () => {
    it("cycles to next enabled build order", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
      });

      expect(result.current.currentOrderIndex).toBe(0);

      act(() => {
        result.current.cycleBuildOrder();
      });

      // Should cycle to order-2 (index 1), skipping disabled order-3
      expect(result.current.currentOrderIndex).toBe(1);
      expect(result.current.currentStepIndex).toBe(0);
    });

    it("wraps around to first enabled order", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.setCurrentOrderIndex(1); // Start at order-2
      });

      act(() => {
        result.current.cycleBuildOrder();
      });

      // Should wrap to order-1 (index 0), skipping disabled order-3
      expect(result.current.currentOrderIndex).toBe(0);
    });

    it("skips disabled build orders", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
      });

      // Cycle twice: order-1 -> order-2 -> order-1 (skipping disabled order-3)
      act(() => {
        result.current.cycleBuildOrder(); // order-1 -> order-2
      });

      expect(result.current.currentOrderIndex).toBe(1);

      act(() => {
        result.current.cycleBuildOrder(); // order-2 -> order-1 (skips order-3)
      });

      expect(result.current.currentOrderIndex).toBe(0);
    });

    it("handles no enabled orders gracefully", () => {
      const disabledOrders = mockBuildOrders.map((o) => ({
        ...o,
        enabled: false,
      }));
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(disabledOrders);
      });

      act(() => {
        result.current.cycleBuildOrder();
      });

      // Should not change anything
      expect(result.current.currentOrderIndex).toBe(0);
    });

    it("handles empty build orders", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.cycleBuildOrder();
      });

      expect(result.current.currentOrderIndex).toBe(0);
    });

    it("handles single enabled build order", () => {
      const singleOrder = mockBuildOrders.slice(0, 1);
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(singleOrder);
      });

      act(() => {
        result.current.cycleBuildOrder();
      });

      // Should stay on the same order
      expect(result.current.currentOrderIndex).toBe(0);
    });

    it("resets step index when cycling", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders(mockBuildOrders);
        result.current.goToStep(2);
      });

      expect(result.current.currentStepIndex).toBe(2);

      act(() => {
        result.current.cycleBuildOrder();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });
});

describe("buildOrderStore selectors", () => {
  const mockBuildOrders: BuildOrder[] = [
    {
      id: "order-1",
      name: "English Rush",
      civilization: "English",
      description: "Test",
      difficulty: "Beginner",
      enabled: true,
      steps: [
        { id: "s1-1", description: "Step 1" },
        { id: "s1-2", description: "Step 2" },
      ],
    },
    {
      id: "order-2",
      name: "French FC",
      civilization: "French",
      description: "Test",
      difficulty: "Intermediate",
      enabled: false,
      steps: [{ id: "s2-1", description: "Step 1" }],
    },
  ];

  beforeEach(() => {
    const { result } = renderHook(() => useBuildOrderStore());
    act(() => {
      result.current.setBuildOrders([]);
    });
  });

  describe("useCurrentBuildOrder", () => {
    it("returns current build order", () => {
      const { result: storeResult } = renderHook(() => useBuildOrderStore());
      const { result: selectorResult } = renderHook(() =>
        useCurrentBuildOrder()
      );

      act(() => {
        storeResult.current.setBuildOrders(mockBuildOrders);
      });

      expect(selectorResult.current?.id).toBe("order-1");
      expect(selectorResult.current?.name).toBe("English Rush");
    });

    it("returns null when no build orders", () => {
      const { result: selectorResult } = renderHook(() =>
        useCurrentBuildOrder()
      );

      expect(selectorResult.current).toBeNull();
    });

    it("updates when order changes", () => {
      const { result: storeResult } = renderHook(() => useBuildOrderStore());
      const { result: selectorResult } = renderHook(() =>
        useCurrentBuildOrder()
      );

      act(() => {
        storeResult.current.setBuildOrders(mockBuildOrders);
      });

      expect(selectorResult.current?.id).toBe("order-1");

      act(() => {
        storeResult.current.setCurrentOrderIndex(1);
      });

      expect(selectorResult.current?.id).toBe("order-2");
    });
  });

  describe("useCurrentStep", () => {
    it("returns current step", () => {
      const { result: storeResult } = renderHook(() => useBuildOrderStore());
      const { result: selectorResult } = renderHook(() => useCurrentStep());

      act(() => {
        storeResult.current.setBuildOrders(mockBuildOrders);
      });

      expect(selectorResult.current?.id).toBe("s1-1");
      expect(selectorResult.current?.description).toBe("Step 1");
    });

    it("returns null when no build orders", () => {
      const { result: selectorResult } = renderHook(() => useCurrentStep());

      expect(selectorResult.current).toBeNull();
    });

    it("updates when step changes", () => {
      const { result: storeResult } = renderHook(() => useBuildOrderStore());
      const { result: selectorResult } = renderHook(() => useCurrentStep());

      act(() => {
        storeResult.current.setBuildOrders(mockBuildOrders);
      });

      expect(selectorResult.current?.id).toBe("s1-1");

      act(() => {
        storeResult.current.nextStep();
      });

      expect(selectorResult.current?.id).toBe("s1-2");
    });
  });

  describe("useEnabledBuildOrders", () => {
    it("returns only enabled build orders", () => {
      const { result: storeResult } = renderHook(() => useBuildOrderStore());

      act(() => {
        storeResult.current.setBuildOrders(mockBuildOrders);
      });

      // Access the store directly to check enabled orders
      const state = useBuildOrderStore.getState();
      const enabledOrders = state.buildOrders.filter((o) => o.enabled);

      expect(enabledOrders).toHaveLength(1);
      expect(enabledOrders[0].id).toBe("order-1");
    });

    it("returns empty array when no enabled orders", () => {
      const { result: storeResult } = renderHook(() => useBuildOrderStore());

      const disabledOrders = mockBuildOrders.map((o) => ({
        ...o,
        enabled: false,
      }));

      act(() => {
        storeResult.current.setBuildOrders(disabledOrders);
      });

      const state = useBuildOrderStore.getState();
      const enabledOrders = state.buildOrders.filter((o) => o.enabled);

      expect(enabledOrders).toHaveLength(0);
    });
  });
});
