import type { BuildOrderStep, Resources } from "@/types";

/**
 * Intelligent Build Order Engine (IBOE)
 * Uses state tracking and NLP to infer missing data and cleanup guides.
 */
export class IntelligentConverter {
  private currentResources: Resources = {
    food: 0,
    wood: 0,
    gold: 0,
    stone: 0,
    villagers: 0,
    builders: 0,
  };

  /**
   * Refine a step by analyzing its text and existing data
   */
  public processStep(step: BuildOrderStep, _index: number): BuildOrderStep {
    // 1. Refine the description text first
    const refinedDescription = this.refineDescription(step.description);

    // Start with a clean copy of current state or step resources
    const mergedResources: Resources = { 
      ...this.currentResources,
      ...(step.resources || {}) 
    };

    // Remove icon markers for clean text analysis
    const cleanText = refinedDescription.replace(/\[icon:[^\]]+\]/g, "");

    // 2. Infer absolute counts from text
    this.inferAbsoluteCounts(cleanText, mergedResources);

    // 3. Process relative changes
    this.processRelativeChanges(cleanText, mergedResources);

    // 4. Ensure total villager count is calculated if possible
    const hasGatherers = 
      (mergedResources.food ?? 0) > 0 || 
      (mergedResources.wood ?? 0) > 0 || 
      (mergedResources.gold ?? 0) > 0 || 
      (mergedResources.stone ?? 0) > 0;

    if (hasGatherers && !step.resources?.villagers) {
      mergedResources.villagers = (mergedResources.food || 0) + 
                                  (mergedResources.wood || 0) + 
                                  (mergedResources.gold || 0) + 
                                  (mergedResources.stone || 0);
    }

    // 5. Update persistent state for next step
    this.updateState(mergedResources);

    // 6. Clean final object: remove undefined or 0 fields that weren't in source or inferred
    const finalResources: Resources = {};
    const keys: (keyof Resources)[] = ['food', 'wood', 'gold', 'stone', 'villagers', 'builders'];
    
    keys.forEach(key => {
      if (mergedResources[key] !== undefined && mergedResources[key] !== null) {
        // Only include if it's non-zero, OR if it was explicitly provided in the step
        if (mergedResources[key]! > 0 || (step.resources && step.resources[key] !== undefined)) {
          finalResources[key] = mergedResources[key] as any;
        }
      }
    });

    return {
      ...step,
      description: refinedDescription,
      resources: Object.keys(finalResources).length > 0 ? finalResources : undefined,
    };
  }

  private refineDescription(text: string): string {
    if (!text) return "";

    // 1. Identify existing icons so we don't accidentally expand them
    const iconMarkers: string[] = [];
    let processed = text.replace(/\[icon:(\w+)\]/g, (match) => {
      iconMarkers.push(match);
      return `__IBOE_ICON_${iconMarkers.length - 1}__`;
    });

    // 2. Expand common abbreviations
    const abbreviations: Record<string, string> = {
      "TC": "Town Center",
      "IO": "Imperial Official",
      "MAA": "Man-at-Arms",
      "WB": "Wheelbarrow",
      "LC": "Lumber Camp",
      "MC": "Mining Camp",
      "AR": "Archery Range",
      "Rax": "Barracks",
      "SW": "Siege Workshop",
      "vills": "villagers",
      "vill": "villager",
      "FC": "Fast Castle",
    };

    for (const [abbr, full] of Object.entries(abbreviations)) {
      const re = new RegExp(`\\b${abbr}\\b`, "g");
      processed = processed.replace(re, full);
    }

    // 3. Normalize phrasing patterns
    // "6 to sheep" -> "6 villagers to sheep"
    processed = processed.replace(/^(\d+)\s+(?:to|on|at)\s+/i, "$1 villagers to ");
    
    // "next 2 to gold" -> "Send next 2 villagers to gold"
    processed = processed.replace(/\bnext\s+(\d+)\s+(?:to|on|at)\s+/i, "Send next $1 villagers to ");

    // 4. Restore preserved icons
    processed = processed.replace(/__IBOE_ICON_(\d+)__/g, (_, index) => {
      return iconMarkers[parseInt(index, 10)];
    });

    // 5. Clean up formatting
    processed = processed
      .replace(/\s+/g, " ")
      .trim();

    // 6. Ensure capitalization
    if (processed.length > 0) {
      processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    }

    return processed;
  }

  private inferAbsoluteCounts(text: string, res: Resources) {
    // "6 to sheep", "6 on food", "6 at berries", "6 villagers to sheep"
    const foodMatch = text.match(/(\d+)\s*(?:vills?|villagers?|workers?)?\s*(?:to|on|at)\s*(?:sheep|food|berries|hunt|fish|boar|deer)/i);
    if (foodMatch) res.food = parseInt(foodMatch[1], 10);

    const woodMatch = text.match(/(\d+)\s*(?:vills?|villagers?|workers?)?\s*(?:to|on|at)\s*(?:wood|lumber|trees)/i);
    if (woodMatch) res.wood = parseInt(woodMatch[1], 10);

    const goldMatch = text.match(/(\d+)\s*(?:vills?|villagers?|workers?)?\s*(?:to|on|at)\s*(?:gold|mining|mine)/i);
    if (goldMatch) res.gold = parseInt(goldMatch[1], 10);

    const stoneMatch = text.match(/(\d+)\s*(?:vills?|villagers?|workers?)?\s*(?:to|on|at)\s*(?:stone|rock)/i);
    if (stoneMatch) res.stone = parseInt(stoneMatch[1], 10);
  }

  private processRelativeChanges(text: string, _res: Resources) {
    // "Add 3 to gold"
    const addMatch = text.match(/(?:add|send|rally)\s+(\d+)\s+(?:new\s+)?(?:vills?\s+)?(?:to|on|at)\s+(\w+)/i);
    if (addMatch) {
      // Logic for relative additions could be added here
    }
  }

  private updateState(res: Resources) {
    if (res.food !== undefined) this.currentResources.food = res.food;
    if (res.wood !== undefined) this.currentResources.wood = res.wood;
    if (res.gold !== undefined) this.currentResources.gold = res.gold;
    if (res.stone !== undefined) this.currentResources.stone = res.stone;
    if (res.villagers !== undefined) this.currentResources.villagers = res.villagers;
    if (res.builders !== undefined) this.currentResources.builders = res.builders;
  }
}