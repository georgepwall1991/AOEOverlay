import { useState } from "react";
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { BuildOrder, BuildOrderStep, Civilization, Difficulty } from "@/types";
import { CIVILIZATIONS, DIFFICULTIES } from "@/types";

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
  const [order, setOrder] = useState<BuildOrder>(buildOrder);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateOrder = (updates: Partial<BuildOrder>) => {
    setOrder((prev) => ({ ...prev, ...updates }));
    // Clear related errors
    Object.keys(updates).forEach((key) => {
      if (errors[key]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    });
  };

  const addStep = () => {
    const newStep: BuildOrderStep = {
      id: `step-${Date.now()}`,
      description: "",
      timing: "",
      resources: undefined,
    };
    updateOrder({ steps: [...order.steps, newStep] });
  };

  const updateStep = (index: number, updates: Partial<BuildOrderStep>) => {
    const newSteps = [...order.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateOrder({ steps: newSteps });
  };

  const removeStep = (index: number) => {
    updateOrder({ steps: order.steps.filter((_, i) => i !== index) });
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.steps.length) return;

    const newSteps = [...order.steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    updateOrder({ steps: newSteps });
  };

  const validate = (): boolean => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(order);
    }
  };

  const updateStepResources = (
    index: number,
    resource: "food" | "wood" | "gold" | "stone",
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseInt(value, 10);
    const step = order.steps[index];
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
  };

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
        {/* Basic info */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={order.name}
              onChange={(e) => updateOrder({ name: e.target.value })}
              placeholder="e.g., Fast Castle into Knights"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Civilization</Label>
              <Select
                value={order.civilization}
                onValueChange={(value) => updateOrder({ civilization: value as Civilization })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CIVILIZATIONS.map((civ) => (
                    <SelectItem key={civ} value={civ}>
                      {civ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={order.difficulty}
                onValueChange={(value) => updateOrder({ difficulty: value as Difficulty })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((diff) => (
                    <SelectItem key={diff} value={diff}>
                      {diff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={order.description}
              onChange={(e) => updateOrder({ description: e.target.value })}
              placeholder="Brief description of this build order..."
              rows={2}
            />
          </div>
        </div>

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

          {errors.steps && (
            <p className="text-xs text-destructive">{errors.steps}</p>
          )}

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {order.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="p-3 rounded-lg border bg-card space-y-3"
                >
                  {/* Step header */}
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Step {index + 1}
                    </span>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveStep(index, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveStep(index, "down")}
                      disabled={index === order.steps.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Step content */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr,80px] gap-2">
                      <Input
                        value={step.description}
                        onChange={(e) =>
                          updateStep(index, { description: e.target.value })
                        }
                        placeholder="Step description..."
                        className={
                          errors[`step-${index}`] ? "border-destructive" : ""
                        }
                      />
                      <Input
                        value={step.timing || ""}
                        onChange={(e) =>
                          updateStep(index, { timing: e.target.value || undefined })
                        }
                        placeholder="0:00"
                        className="font-mono text-sm"
                      />
                    </div>

                    {/* Resources */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-red-400">Food</Label>
                        <Input
                          type="number"
                          value={step.resources?.food ?? ""}
                          onChange={(e) =>
                            updateStepResources(index, "food", e.target.value)
                          }
                          placeholder="-"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-green-400">Wood</Label>
                        <Input
                          type="number"
                          value={step.resources?.wood ?? ""}
                          onChange={(e) =>
                            updateStepResources(index, "wood", e.target.value)
                          }
                          placeholder="-"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-yellow-400">Gold</Label>
                        <Input
                          type="number"
                          value={step.resources?.gold ?? ""}
                          onChange={(e) =>
                            updateStepResources(index, "gold", e.target.value)
                          }
                          placeholder="-"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Stone</Label>
                        <Input
                          type="number"
                          value={step.resources?.stone ?? ""}
                          onChange={(e) =>
                            updateStepResources(index, "stone", e.target.value)
                          }
                          placeholder="-"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
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

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {isNew ? "Create" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
