import { useState, useCallback } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BuildOrderMetadata } from "./BuildOrderMetadata";
import { StepEditor } from "./StepEditor";
import { BranchEditor } from "./BranchEditor";
import type { BuildOrder, BuildOrderBranch, BuildOrderStep, Resources } from "@/types";

interface BuildOrderEditorProps {
  buildOrder: BuildOrder;
  onSave: (order: BuildOrder) => void;
  onCancel: () => void;
  isNew: boolean;
}

export function BuildOrderEditor({
  buildOrder,
  onSave,
  onCancel,
  isNew,
}: BuildOrderEditorProps) {
  const [order, setOrder] = useState<BuildOrder>({
    ...buildOrder,
    branches: buildOrder.branches ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateOrder = useCallback((updates: Partial<BuildOrder>) => {
    setOrder((prev) => ({ ...prev, ...updates }));
    // Clear related errors
    Object.keys(updates).forEach((key) => {
      setErrors((prev) => {
        if (prev[key]) {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        }
        return prev;
      });
    });
  }, []);

  // Step management for main steps
  const addStep = useCallback(() => {
    const newStep: BuildOrderStep = {
      id: `step-${Date.now()}`,
      description: "",
      timing: "",
      resources: undefined,
    };
    updateOrder({ steps: [...order.steps, newStep] });
  }, [order.steps, updateOrder]);

  const updateStep = useCallback(
    (index: number, updates: Partial<BuildOrderStep>) => {
      const newSteps = [...order.steps];
      newSteps[index] = { ...newSteps[index], ...updates };
      updateOrder({ steps: newSteps });
    },
    [order.steps, updateOrder]
  );

  const removeStep = useCallback(
    (index: number) => {
      updateOrder({ steps: order.steps.filter((_, i) => i !== index) });
    },
    [order.steps, updateOrder]
  );

  const moveStep = useCallback(
    (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= order.steps.length) return;
      const newSteps = [...order.steps];
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      updateOrder({ steps: newSteps });
    },
    [order.steps, updateOrder]
  );

  const updateStepResources = useCallback(
    (index: number, resource: keyof Resources, value: string) => {
      const numValue = value === "" ? undefined : parseInt(value, 10);
      const step = order.steps[index];
      const resources = step.resources || {};

      if (numValue === undefined || isNaN(numValue)) {
        const newResources = { ...resources };
        delete newResources[resource];
        if (Object.keys(newResources).length === 0) {
          updateStep(index, { resources: undefined });
        } else {
          updateStep(index, { resources: newResources });
        }
      } else {
        updateStep(index, { resources: { ...resources, [resource]: numValue } });
      }
    },
    [order.steps, updateStep]
  );

  const appendIconToStep = useCallback(
    (index: number, icon: string) => {
      const step = order.steps[index];
      const nextDescription = `${step.description} [icon:${icon}]`.trim();
      updateStep(index, { description: nextDescription });
    },
    [order.steps, updateStep]
  );

  // Branch management
  const addBranch = useCallback(() => {
    const newBranch: BuildOrderBranch = {
      id: `branch-${Date.now()}`,
      name: "New branch",
      trigger: "",
      startStepIndex: Math.max(0, order.steps.length - 1),
      steps: [],
    };
    updateOrder({ branches: [...(order.branches ?? []), newBranch] });
  }, [order.steps.length, order.branches, updateOrder]);

  const updateBranch = useCallback(
    (branchId: string, updates: Partial<BuildOrderBranch>) => {
      const branches = order.branches ?? [];
      updateOrder({
        branches: branches.map((b) => (b.id === branchId ? { ...b, ...updates } : b)),
      });
    },
    [order.branches, updateOrder]
  );

  const removeBranch = useCallback(
    (branchId: string) => {
      updateOrder({ branches: (order.branches ?? []).filter((b) => b.id !== branchId) });
    },
    [order.branches, updateOrder]
  );

  const addBranchStep = useCallback(
    (branchId: string) => {
      const branches = order.branches ?? [];
      const index = branches.findIndex((b) => b.id === branchId);
      if (index === -1) return;
      const newStep: BuildOrderStep = {
        id: `step-${Date.now()}`,
        description: "",
        timing: "",
        resources: undefined,
      };
      const updated = [...branches];
      updated[index] = { ...branches[index], steps: [...branches[index].steps, newStep] };
      updateOrder({ branches: updated });
    },
    [order.branches, updateOrder]
  );

  const updateBranchStep = useCallback(
    (branchId: string, stepIndex: number, updates: Partial<BuildOrderStep>) => {
      const branches = order.branches ?? [];
      const branchIndex = branches.findIndex((b) => b.id === branchId);
      if (branchIndex === -1) return;
      const branch = branches[branchIndex];
      const steps = [...branch.steps];
      steps[stepIndex] = { ...steps[stepIndex], ...updates };
      const updated = [...branches];
      updated[branchIndex] = { ...branch, steps };
      updateOrder({ branches: updated });
    },
    [order.branches, updateOrder]
  );

  const removeBranchStep = useCallback(
    (branchId: string, stepIndex: number) => {
      const branches = order.branches ?? [];
      const branchIndex = branches.findIndex((b) => b.id === branchId);
      if (branchIndex === -1) return;
      const branch = branches[branchIndex];
      const updated = [...branches];
      updated[branchIndex] = { ...branch, steps: branch.steps.filter((_, i) => i !== stepIndex) };
      updateOrder({ branches: updated });
    },
    [order.branches, updateOrder]
  );

  const moveBranchStep = useCallback(
    (branchId: string, stepIndex: number, direction: "up" | "down") => {
      const branches = order.branches ?? [];
      const branchIndex = branches.findIndex((b) => b.id === branchId);
      if (branchIndex === -1) return;
      const branch = branches[branchIndex];
      const newIndex = direction === "up" ? stepIndex - 1 : stepIndex + 1;
      if (newIndex < 0 || newIndex >= branch.steps.length) return;
      const steps = [...branch.steps];
      [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]];
      const updated = [...branches];
      updated[branchIndex] = { ...branch, steps };
      updateOrder({ branches: updated });
    },
    [order.branches, updateOrder]
  );

  const updateBranchStepResources = useCallback(
    (branchId: string, index: number, resource: keyof Resources, value: string) => {
      const branches = order.branches ?? [];
      const branchIndex = branches.findIndex((b) => b.id === branchId);
      if (branchIndex === -1) return;
      const branch = branches[branchIndex];
      const steps = [...branch.steps];
      const step = steps[index];
      const resources = step.resources || {};
      const numValue = value === "" ? undefined : parseInt(value, 10);

      if (numValue === undefined || isNaN(numValue)) {
        const newResources = { ...resources };
        delete (newResources as Record<typeof resource, number | undefined>)[resource];
        if (Object.keys(newResources).length === 0) {
          steps[index] = { ...step, resources: undefined };
        } else {
          steps[index] = { ...step, resources: newResources };
        }
      } else {
        steps[index] = { ...step, resources: { ...resources, [resource]: numValue } };
      }

      const updated = [...branches];
      updated[branchIndex] = { ...branch, steps };
      updateOrder({ branches: updated });
    },
    [order.branches, updateOrder]
  );

  const appendIconToBranchStep = useCallback(
    (branchId: string, index: number, icon: string) => {
      const branch = order.branches?.find((b) => b.id === branchId);
      if (!branch) return;
      const step = branch.steps[index];
      const nextDescription = `${step.description} [icon:${icon}]`.trim();
      updateBranchStep(branchId, index, { description: nextDescription });
    },
    [order.branches, updateBranchStep]
  );

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!order.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (order.steps.length === 0) {
      newErrors.steps = "At least one step is required";
    }

    order.steps.forEach((step, index) => {
      if (!step.description.trim()) {
        newErrors[`step-${index}`] = "Step description is required";
      }
    });

    (order.branches ?? []).forEach((branch) => {
      branch.steps.forEach((step, idx) => {
        if (!step.description.trim()) {
          newErrors[`branch-${branch.id}-step-${idx}`] = "Description required";
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [order]);

  const handleSave = useCallback(() => {
    if (validate()) {
      onSave(order);
    }
  }, [validate, onSave, order]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {isNew ? "New Build Order" : "Edit Build Order"}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Metadata form */}
        <BuildOrderMetadata order={order} errors={errors} onUpdate={updateOrder} />

        <Separator />

        {/* Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Steps *</Label>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="w-4 h-4 mr-1" />
              Add Step
            </Button>
          </div>

          {errors.steps && <p className="text-xs text-destructive">{errors.steps}</p>}

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {order.steps.map((step, index) => (
                <StepEditor
                  key={step.id}
                  step={step}
                  index={index}
                  totalSteps={order.steps.length}
                  error={errors[`step-${index}`]}
                  onUpdate={(updates) => updateStep(index, updates)}
                  onRemove={() => removeStep(index)}
                  onMove={(dir) => moveStep(index, dir)}
                  onUpdateResources={(res, val) => updateStepResources(index, res, val)}
                  onAppendIcon={(icon) => appendIconToStep(index, icon)}
                />
              ))}

              {order.steps.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p className="text-sm">No steps yet</p>
                  <p className="text-xs mt-1">Click "Add Step" to begin</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <Separator />

      {/* Branches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Branches (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Create defensive/aggressive forks that replace steps from a given point.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addBranch}>
            <Plus className="w-4 h-4 mr-1" />
            Add Branch
          </Button>
        </div>

        {(order.branches ?? []).length === 0 && (
          <div className="text-xs text-muted-foreground border-2 border-dashed rounded-lg p-4">
            No branches yet. Add one to handle reactions (e.g., defense vs rush).
          </div>
        )}

        <div className="space-y-3">
          {(order.branches ?? []).map((branch) => (
            <BranchEditor
              key={branch.id}
              branch={branch}
              maxStartStepIndex={order.steps.length}
              errors={errors}
              onUpdate={(updates) => updateBranch(branch.id, updates)}
              onRemove={() => removeBranch(branch.id)}
              onAddStep={() => addBranchStep(branch.id)}
              onUpdateStep={(idx, upd) => updateBranchStep(branch.id, idx, upd)}
              onRemoveStep={(idx) => removeBranchStep(branch.id, idx)}
              onMoveStep={(idx, dir) => moveBranchStep(branch.id, idx, dir)}
              onUpdateStepResources={(idx, res, val) =>
                updateBranchStepResources(branch.id, idx, res, val)
              }
              onAppendIconToStep={(idx, icon) => appendIconToBranchStep(branch.id, idx, icon)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>{isNew ? "Create" : "Save Changes"}</Button>
      </div>
    </div>
  );
}
