import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepEditor } from "./StepEditor";
import type { BuildOrderBranch, BuildOrderStep, Resources } from "@/types";

interface BranchEditorProps {
  branch: BuildOrderBranch;
  maxStartStepIndex: number;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<BuildOrderBranch>) => void;
  onRemove: () => void;
  onAddStep: () => void;
  onUpdateStep: (stepIndex: number, updates: Partial<BuildOrderStep>) => void;
  onRemoveStep: (stepIndex: number) => void;
  onMoveStep: (stepIndex: number, direction: "up" | "down") => void;
  onUpdateStepResources: (
    stepIndex: number,
    resource: keyof Resources,
    value: string
  ) => void;
  onAppendIconToStep: (stepIndex: number, icon: string) => void;
}

export function BranchEditor({
  branch,
  maxStartStepIndex,
  errors,
  onUpdate,
  onRemove,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
  onMoveStep,
  onUpdateStepResources,
  onAppendIconToStep,
}: BranchEditorProps) {
  return (
    <div className="p-3 rounded-lg border bg-card space-y-3">
      <div className="flex items-start gap-3">
        <div className="grid gap-2 flex-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Branch Name</Label>
              <Input
                value={branch.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Defense, Aggression..."
              />
            </div>
            <div className="space-y-1">
              <Label>Trigger (hint)</Label>
              <Input
                value={branch.trigger ?? ""}
                onChange={(e) => onUpdate({ trigger: e.target.value })}
                placeholder="e.g., Rushed or Ahead"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Start at Step #</Label>
              <Input
                type="number"
                min={0}
                max={maxStartStepIndex}
                value={branch.startStepIndex}
                onChange={(e) =>
                  onUpdate({
                    startStepIndex: Math.max(
                      0,
                      Math.min(maxStartStepIndex, parseInt(e.target.value, 10) || 0)
                    ),
                  })
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Replaces steps from this position onward
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Branch Steps</Label>
          <Button variant="outline" size="sm" onClick={onAddStep}>
            <Plus className="w-4 h-4 mr-1" />
            Add Step
          </Button>
        </div>

        {branch.steps.length === 0 ? (
          <p className="text-xs text-muted-foreground border border-dashed rounded p-3">
            No branch steps yet.
          </p>
        ) : (
          <div className="space-y-2">
            {branch.steps.map((step, index) => (
              <StepEditor
                key={step.id}
                step={step}
                index={index}
                totalSteps={branch.steps.length}
                error={errors[`branch-${branch.id}-step-${index}`]}
                onUpdate={(updates) => onUpdateStep(index, updates)}
                onRemove={() => onRemoveStep(index)}
                onMove={(direction) => onMoveStep(index, direction)}
                onUpdateResources={(resource, value) =>
                  onUpdateStepResources(index, resource, value)
                }
                onAppendIcon={(icon) => onAppendIconToStep(index, icon)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
