import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useBuildOrderStore,
  useCurrentBuildOrder,
  useCurrentStep,
  resolveActiveSteps,
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

  const branchyOrder: BuildOrder = {
    id: "branched",
    name: "Branch Demo",
    civilization: "English",
    description: "Has branches",
    difficulty: "Beginner",
    enabled: true,
    steps: [
      { id: "b1", description: "Step 1" },
      { id: "b2", description: "Step 2" },
      { id: "b3", description: "Step 3" },
    ],
    branches: [
      {
        id: "defense",
        name: "Defense",
        trigger: "rushed",
        startStepIndex: 2,
        steps: [
          { id: "d1", description: "Drop tower" },
          { id: "d2", description: "Mass spears" },
        ],
      },
    ],
  };

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

  describe("branches", () => {
    it("merges branch steps starting at startStepIndex", () => {
      const storeHook = renderHook(() => useBuildOrderStore());

      act(() => {
        storeHook.result.current.setBuildOrders([branchyOrder]);
        storeHook.result.current.setActiveBranch("defense");
      });

      const activeSteps = resolveActiveSteps(
        storeHook.result.current.buildOrders[storeHook.result.current.currentOrderIndex],
        storeHook.result.current.activeBranchId
      );

      expect(activeSteps.length).toBe(4); // two base steps + two branch steps
      expect(activeSteps[1].description).toBe("Step 2");
      expect(activeSteps[2].description).toBe("Drop tower");
    });

    it("clamps current step when branch shortens path", () => {
      const { result } = renderHook(() => useBuildOrderStore());

      act(() => {
        result.current.setBuildOrders([branchyOrder]);
        result.current.goToStep(2);
        result.current.setActiveBranch("defense");
      });

      expect(result.current.currentStepIndex).toBeLessThanOrEqual(3);
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

describe("buildOrderStore edge cases", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useBuildOrderStore());
    act(() => {
      result.current.setBuildOrders([]);
    });
  });

  describe("resolveActiveSteps edge cases", () => {
    it("handles undefined order", () => {
      const steps = resolveActiveSteps(undefined, null);
      expect(steps).toEqual([]);
    });

    it("handles order with undefined steps", () => {
      const order = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
      } as BuildOrder;
      const steps = resolveActiveSteps(order, null);
      expect(steps).toEqual([]);
    });

    it("handles branch with undefined steps", () => {
      const order: BuildOrder = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [{ id: "s1", description: "Step 1" }],
        branches: [
          {
            id: "branch1",
            name: "Branch",
            startStepIndex: 0,
          } as any,
        ],
      };
      const steps = resolveActiveSteps(order, "branch1");
      expect(steps).toEqual([]);
    });

    it("handles branch with startStepIndex beyond steps length", () => {
      const order: BuildOrder = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [{ id: "s1", description: "Step 1" }],
        branches: [
          {
            id: "branch1",
            name: "Branch",
            startStepIndex: 100,
            steps: [{ id: "b1", description: "Branch Step" }],
          },
        ],
      };
      const steps = resolveActiveSteps(order, "branch1");
      // Should clamp startStepIndex to steps.length
      expect(steps).toHaveLength(2);
    });

    it("handles branch with negative startStepIndex", () => {
      const order: BuildOrder = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [
          { id: "s1", description: "Step 1" },
          { id: "s2", description: "Step 2" },
        ],
        branches: [
          {
            id: "branch1",
            name: "Branch",
            startStepIndex: -5,
            steps: [{ id: "b1", description: "Branch Step" }],
          },
        ],
      };
      const steps = resolveActiveSteps(order, "branch1");
      // Should clamp to 0
      expect(steps[0].id).toBe("b1");
    });

    it("handles non-existent branch id", () => {
      const order: BuildOrder = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [{ id: "s1", description: "Step 1" }],
        branches: [
          {
            id: "branch1",
            name: "Branch",
            startStepIndex: 0,
            steps: [{ id: "b1", description: "Branch Step" }],
          },
        ],
      };
      const steps = resolveActiveSteps(order, "nonexistent");
      expect(steps).toHaveLength(1);
      expect(steps[0].id).toBe("s1");
    });

    it("handles order with empty branches array", () => {
      const order: BuildOrder = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [{ id: "s1", description: "Step 1" }],
        branches: [],
      };
      const steps = resolveActiveSteps(order, "any");
      expect(steps).toHaveLength(1);
    });
  });

  describe("setBuildOrders with pinned orders", () => {
    it("sets currentOrderIndex to pinned order", () => {
      const { result } = renderHook(() => useBuildOrderStore());
      const ordersWithPinned: BuildOrder[] = [
        {
          id: "order-1",
          name: "First",
          civilization: "English",
          description: "",
          difficulty: "Beginner",
          enabled: true,
          steps: [],
          pinned: false,
        },
        {
          id: "order-2",
          name: "Pinned",
          civilization: "French",
          description: "",
          difficulty: "Beginner",
          enabled: true,
          steps: [],
          pinned: true,
        },
        {
          id: "order-3",
          name: "Third",
          civilization: "Mongols",
          description: "",
          difficulty: "Beginner",
          enabled: true,
          steps: [],
          pinned: false,
        },
      ];

      act(() => {
        result.current.setBuildOrders(ordersWithPinned);
      });

      expect(result.current.currentOrderIndex).toBe(1);
    });

    it("uses first pinned if multiple pinned", () => {
      const { result } = renderHook(() => useBuildOrderStore());
      const ordersWithMultiplePinned: BuildOrder[] = [
        {
          id: "order-1",
          name: "First",
          civilization: "English",
          description: "",
          difficulty: "Beginner",
          enabled: true,
          steps: [],
          pinned: false,
        },
        {
          id: "order-2",
          name: "Pinned 1",
          civilization: "French",
          description: "",
          difficulty: "Beginner",
          enabled: true,
          steps: [],
          pinned: true,
        },
        {
          id: "order-3",
          name: "Pinned 2",
          civilization: "Mongols",
          description: "",
          difficulty: "Beginner",
          enabled: true,
          steps: [],
          pinned: true,
        },
      ];

      act(() => {
        result.current.setBuildOrders(ordersWithMultiplePinned);
      });

      expect(result.current.currentOrderIndex).toBe(1);
    });
  });

  describe("cycleBuildOrder edge cases", () => {
    it("handles cycling when current order is not in enabled list", () => {
      const { result } = renderHook(() => useBuildOrderStore());
      const orders: BuildOrder[] = [
        {
          id: "disabled",
          name: "Disabled",
          civilization: "English",
          description: "",
          difficulty: "Beginner",
          enabled: false,
          steps: [],
        },
        {
          id: "enabled-1",
          name: "Enabled 1",
          civilization: "French",
          description: "",
          difficulty: "Beginner",
          enabled: true,
          steps: [],
        },
      ];

      act(() => {
        result.current.setBuildOrders(orders);
        // Current is index 0 (disabled order)
      });

      act(() => {
        result.current.cycleBuildOrder();
      });

      // Should cycle to next enabled
      expect(result.current.currentOrderIndex).toBe(1);
    });
  });

  describe("setActiveBranch edge cases", () => {
    it("clamps step index when branch has fewer steps", () => {
      const { result } = renderHook(() => useBuildOrderStore());
      const order: BuildOrder = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [
          { id: "s1", description: "Step 1" },
          { id: "s2", description: "Step 2" },
          { id: "s3", description: "Step 3" },
          { id: "s4", description: "Step 4" },
        ],
        branches: [
          {
            id: "short-branch",
            name: "Short",
            startStepIndex: 1,
            steps: [{ id: "b1", description: "Branch Step" }],
          },
        ],
      };

      act(() => {
        result.current.setBuildOrders([order]);
        result.current.goToStep(3); // Go to step 4
      });

      expect(result.current.currentStepIndex).toBe(3);

      act(() => {
        result.current.setActiveBranch("short-branch");
      });

      // Branch has only 2 steps (1 base + 1 branch), so index should clamp to 1
      expect(result.current.currentStepIndex).toBeLessThanOrEqual(1);
    });

    it("clears branch when setting to null", () => {
      const { result } = renderHook(() => useBuildOrderStore());
      const order: BuildOrder = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [{ id: "s1", description: "Step 1" }],
        branches: [
          {
            id: "branch1",
            name: "Branch",
            startStepIndex: 0,
            steps: [{ id: "b1", description: "Branch Step" }],
          },
        ],
      };

      act(() => {
        result.current.setBuildOrders([order]);
        result.current.setActiveBranch("branch1");
      });

      expect(result.current.activeBranchId).toBe("branch1");

      act(() => {
        result.current.setActiveBranch(null);
      });

      expect(result.current.activeBranchId).toBeNull();
    });
  });

  describe("goToStep edge cases", () => {
    it("ignores goToStep when steps array is empty", () => {
      const { result } = renderHook(() => useBuildOrderStore());
      const emptyOrder: BuildOrder = {
        id: "empty",
        name: "Empty",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [],
      };

      act(() => {
        result.current.setBuildOrders([emptyOrder]);
        result.current.goToStep(5);
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it("handles goToStep to exact last index", () => {
      const { result } = renderHook(() => useBuildOrderStore());
      const order: BuildOrder = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [
          { id: "s1", description: "Step 1" },
          { id: "s2", description: "Step 2" },
          { id: "s3", description: "Step 3" },
        ],
      };

      act(() => {
        result.current.setBuildOrders([order]);
        result.current.goToStep(2); // Last valid index
      });

      expect(result.current.currentStepIndex).toBe(2);
    });
  });

  describe("nextStep edge cases", () => {
    it("handles nextStep with active branch", () => {
      const { result } = renderHook(() => useBuildOrderStore());
      const order: BuildOrder = {
        id: "test",
        name: "Test",
        civilization: "English",
        description: "",
        difficulty: "Beginner",
        enabled: true,
        steps: [
          { id: "s1", description: "Step 1" },
          { id: "s2", description: "Step 2" },
        ],
        branches: [
          {
            id: "branch1",
            name: "Branch",
            startStepIndex: 1,
            steps: [
              { id: "b1", description: "Branch 1" },
              { id: "b2", description: "Branch 2" },
            ],
          },
        ],
      };

      act(() => {
        result.current.setBuildOrders([order]);
        result.current.setActiveBranch("branch1");
      });

      // Branch has 3 steps: s1 + b1 + b2
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.currentStepIndex).toBe(1);

      act(() => {
        result.current.nextStep();
      });
      expect(result.current.currentStepIndex).toBe(2);

      act(() => {
        result.current.nextStep();
      });
      // Should not advance past last
      expect(result.current.currentStepIndex).toBe(2);
    });
  });
});
