import { useState, useCallback } from "react";
import type { BuildOrderStep, Resources } from "@/types";

export interface StepManagementActions {
  addStep: () => void;
  updateStep: (index: number, updates: Partial<BuildOrderStep>) => void;
  removeStep: (index: number) => void;
  moveStep: (index: number, direction: "up" | "down") => void;
  updateStepResources: (
    index: number,
    resource: keyof Resources,
    value: string
  ) => void;
  appendIconToStep: (index: number, icon: string) => void;
}

export interface UseStepManagementResult extends StepManagementActions {
  steps: BuildOrderStep[];
  setSteps: (steps: BuildOrderStep[]) => void;
}

/**
 * Hook for managing build order steps with CRUD operations.
 * Used by both main steps and branch steps in BuildOrderEditor.
 */
export function useStepManagement(
  initialSteps: BuildOrderStep[],
  onChange?: (steps: BuildOrderStep[]) => void
): UseStepManagementResult {
  const [steps, setStepsInternal] = useState<BuildOrderStep[]>(initialSteps);

  const setSteps = useCallback(
    (newSteps: BuildOrderStep[]) => {
      setStepsInternal(newSteps);
      onChange?.(newSteps);
    },
    [onChange]
  );

  const addStep = useCallback(() => {
    const newStep: BuildOrderStep = {
      id: `step-${Date.now()}`,
      description: "",
      timing: "",
      resources: undefined,
    };
    setSteps([...steps, newStep]);
  }, [steps, setSteps]);

  const updateStep = useCallback(
    (index: number, updates: Partial<BuildOrderStep>) => {
      const newSteps = [...steps];
      newSteps[index] = { ...newSteps[index], ...updates };
      setSteps(newSteps);
    },
    [steps, setSteps]
  );

  const removeStep = useCallback(
    (index: number) => {
      setSteps(steps.filter((_, i) => i !== index));
    },
    [steps, setSteps]
  );

  const moveStep = useCallback(
    (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= steps.length) return;

      const newSteps = [...steps];
      [newSteps[index], newSteps[newIndex]] = [
        newSteps[newIndex],
        newSteps[index],
      ];
      setSteps(newSteps);
    },
    [steps, setSteps]
  );

  const updateStepResources = useCallback(
    (index: number, resource: keyof Resources, value: string) => {
      const numValue = value === "" ? undefined : parseInt(value, 10);
      const step = steps[index];
      const resources = step.resources || {};

      if (numValue === undefined || isNaN(numValue)) {
        const newResources = { ...resources };
        delete newResources[resource];
        // If all resources are empty, set to undefined
        if (Object.keys(newResources).length === 0) {
          updateStep(index, { resources: undefined });
        } else {
          updateStep(index, { resources: newResources });
        }
      } else {
        updateStep(index, {
          resources: { ...resources, [resource]: numValue },
        });
      }
    },
    [steps, updateStep]
  );

  const appendIconToStep = useCallback(
    (index: number, icon: string) => {
      const step = steps[index];
      const nextDescription = `${step.description} [icon:${icon}]`.trim();
      updateStep(index, { description: nextDescription });
    },
    [steps, updateStep]
  );

  return {
    steps,
    setSteps,
    addStep,
    updateStep,
    removeStep,
    moveStep,
    updateStepResources,
    appendIconToStep,
  };
}
