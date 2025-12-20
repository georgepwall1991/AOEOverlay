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
import type { BuildOrder, Civilization, Difficulty } from "@/types";
import { CIVILIZATIONS, DIFFICULTIES } from "@/types";

interface BuildOrderMetadataProps {
  order: BuildOrder;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<BuildOrder>) => void;
}

export function BuildOrderMetadata({
  order,
  errors,
  onUpdate,
}: BuildOrderMetadataProps) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={order.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
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
            onValueChange={(value) =>
              onUpdate({ civilization: value as Civilization })
            }
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
            onValueChange={(value) =>
              onUpdate({ difficulty: value as Difficulty })
            }
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
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Brief description of this build order..."
          rows={2}
        />
      </div>
    </div>
  );
}
