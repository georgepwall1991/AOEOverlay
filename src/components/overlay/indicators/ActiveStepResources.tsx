import { useCurrentStep } from "@/stores";
import { ResourceIcon } from "../icons/ResourceIcons";
import { cn } from "@/lib/utils";

export function ActiveStepResources() {
    const currentStep = useCurrentStep();

    if (!currentStep) return null;

    const resources = currentStep.resources || {};
    const { food = 0, wood = 0, gold = 0, stone = 0, villagers, builders } = resources;

    const hasResources = food > 0 || wood > 0 || gold > 0 || stone > 0 || (villagers ?? 0) > 0 || (builders ?? 0) > 0;
    if (!hasResources) return null;

    // Use explicit villager count if provided, otherwise sum up the individual gatherers
    const displayVillagers = villagers ?? (food + wood + gold + stone);
    // Use heuristic to decide if we should show the total (don't show if it looks like resource costs)
    const shouldShowTotal = displayVillagers > 0 && displayVillagers < 100 && food < 50 && wood < 50;

    return (
        <div
            data-testid="active-step-resources"
            className="relative flex items-center gap-6 px-5 py-2.5 bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-xl border-y border-white/10 animate-fade-in shadow-2xl justify-start overflow-hidden group/res"
        >
            {/* Dynamic background accent based on Civ theme */}
            <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_50%_50%,hsl(var(--civ-color)),transparent_70%)]" />

            {/* Decorative top sheen */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="flex items-center gap-4 z-10">
                <ResourceItem type="food" value={food} color="text-red-400" glow="rgba(239,68,68,0.2)" />
                <ResourceItem type="wood" value={wood} color="text-green-400" glow="rgba(34,197,94,0.2)" />
                <ResourceItem type="gold" value={gold} color="text-yellow-400" glow="rgba(234,179,8,0.2)" />
                <ResourceItem type="stone" value={stone} color="text-slate-400" glow="rgba(148,163,184,0.2)" />
            </div>

            {(shouldShowTotal || (builders ?? 0) > 0) && (
                <div className="flex items-center gap-4 border-l border-white/15 pl-4 z-10">
                    {shouldShowTotal && (
                        <ResourceItem type="villager" value={displayVillagers} color="text-amber-200" glow="rgba(251,191,36,0.2)" />
                    )}
                    {(builders ?? 0) > 0 && (
                        <ResourceItem type="builders" value={builders!} color="text-orange-300" glow="rgba(249,115,22,0.2)" />
                    )}
                </div>
            )}

            {/* "Active Link" indicator */}
            <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover/res:opacity-100 transition-opacity duration-500" />
        </div>
    );
}

function ResourceItem({
    type,
    value,
    color,
    glow
}: {
    type: "food" | "wood" | "gold" | "stone" | "villager" | "builders" | "pop";
    value: number;
    color: string;
    glow?: string;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 transition-all duration-500 group/item",
                value === 0 ? "opacity-20 grayscale" : "opacity-100"
            )}
        >
            <div className="relative">
                {value > 0 && (
                    <div
                        className="absolute inset-0 rounded-full blur-[8px] animate-pulse-subtle"
                        style={{ backgroundColor: glow }}
                    />
                )}
                <ResourceIcon
                    type={type}
                    size={22}
                    className={cn(
                        "relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-transform duration-300",
                        value > 0 && "group-hover/item:scale-115 group-hover/item:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    )}
                />
            </div>
            <span className={cn(
                "text-base font-black tabular-nums tracking-pro-tight text-shadow-strong leading-none transition-colors",
                color,
                value > 0 && "group-hover/item:text-white"
            )}>
                {value}
            </span>
        </div>
    );
}
