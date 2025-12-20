import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BuildOrderStep, Resources } from "@/types";

const ICON_OPTIONS = [
  "villager",
  "scout",
  "spearman",
  "archer",
  "knight",
  "barracks",
  "archery_range",
  "stable",
  "house",
  "town_center",
  "food",
  "wood",
  "gold",
  "stone",
];

interface StepEditorProps {
  step: BuildOrderStep;
  index: number;
  totalSteps: number;
  error?: string;
  onUpdate: (updates: Partial<BuildOrderStep>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  onUpdateResources: (resource: keyof Resources, value: string) => void;
  onAppendIcon: (icon: string) => void;
}

export function StepEditor({
  step,
  index,
  totalSteps,
  error,
  onUpdate,
  onRemove,
  onMove,
  onUpdateResources,
  onAppendIcon,
}: StepEditorProps) {
  return (
    <div className="p-3 rounded-lg border bg-card space-y-3">
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
          onClick={() => onMove("up")}
          disabled={index === 0}
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onMove("down")}
          disabled={index === totalSteps - 1}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Step content */}
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr,120px,80px] gap-2">
          <Input
            value={step.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Step description..."
            className={error ? "border-destructive" : ""}
          />
          <Select onValueChange={onAppendIcon}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Insert icon" />
            </SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  {icon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={step.timing || ""}
            onChange={(e) => onUpdate({ timing: e.target.value || undefined })}
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
              onChange={(e) => onUpdateResources("food", e.target.value)}
              placeholder="-"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-green-400">Wood</Label>
            <Input
              type="number"
              value={step.resources?.wood ?? ""}
              onChange={(e) => onUpdateResources("wood", e.target.value)}
              placeholder="-"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-yellow-400">Gold</Label>
            <Input
              type="number"
              value={step.resources?.gold ?? ""}
              onChange={(e) => onUpdateResources("gold", e.target.value)}
              placeholder="-"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Stone</Label>
            <Input
              type="number"
              value={step.resources?.stone ?? ""}
              onChange={(e) => onUpdateResources("stone", e.target.value)}
              placeholder="-"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
