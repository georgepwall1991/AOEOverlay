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
    const refinedDescription = this.refineDescription(step.description || "");

    // Start with a clean copy of current state or step resources
    const mergedResources: Resources = { 
      ...this.currentResources,
      ...(step.resources || {}) 
    };

    // Remove icon markers for clean text analysis
    const cleanText = refinedDescription.replace(/\[icon:[^\]]+\]/g, "");

    // 2. Infer absolute counts from text (only if not already provided)
    if (!step.resources || step.resources.food === undefined) {
      this.inferAbsoluteCounts(cleanText, mergedResources);
    }

    // 3. Process relative changes (only if not already provided)
    if (!step.resources) {
      this.processRelativeChanges(cleanText, mergedResources);
    }

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
      "FI": "Fast Imperial",
      "BL": "Blacksmith",
      "Stab": "Stable",
      "Mon": "Monastery",
      "Uni": "University",
      "Eco": "Economic",
      "Mil": "Military",
      "Pop": "Population",
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

    const landmarkMappings: Record<string, string> = {
      "Council Hall": "council_hall",
      "School of Cavalry": "school_of_cavalry",
      "Aachen Chapel": "aachen_chapel",
      "Barbican of the Sun": "barbican_of_the_sun",
      "Imperial Academy": "imperial_academy",
      "Regnitz Cathedral": "regnitz_cathedral",
      "Golden Gate": "golden_gate",
      "Deer Stones": "ger",
      "Silver Tree": "market",
      "The White Tower": "white_tower",
      "Kings Palace": "town_center",
      "Berkshire Palace": "white_tower",
      "Cistern": "cistern",
      "Military School": "military_school",
    };

    for (const [name, icon] of Object.entries(landmarkMappings)) {
      const re = new RegExp(`\\b${name}\\b`, "gi");
      if (re.test(processed)) {
        // Only inject if not already has an icon for this landmark
        if (!processed.includes(`[icon:${icon}]`)) {
          processed = processed.replace(re, `[icon:${icon}] ${name}`);
        }
      }
    }

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
    // Helper to extract count for a resource type
    const extract = (pattern: RegExp) => {
      const match = text.match(pattern);
      return match ? parseInt(match[1], 10) : undefined;
    };

    const food = extract(/(\d+)\s*(?:vills?|villagers?|workers?)?\s*(?:to|on|at)\s*(?:sheep|food|berries|hunt|fish|boar|deer|olive)/i);
    if (food !== undefined) res.food = food;

    const wood = extract(/(\d+)\s*(?:vills?|villagers?|workers?)?\s*(?:to|on|at)\s*(?:wood|lumber|trees)/i);
    if (wood !== undefined) res.wood = wood;

    const gold = extract(/(\d+)\s*(?:vills?|villagers?|workers?)?\s*(?:to|on|at)\s*(?:gold|mining|mine)/i);
    if (gold !== undefined) res.gold = gold;

    const stone = extract(/(\d+)\s*(?:vills?|villagers?|workers?)?\s*(?:to|on|at)\s*(?:stone|rock)/i);
    if (stone !== undefined) res.stone = stone;
  }

  private processRelativeChanges(text: string, res: Resources) {
    // 1. Handle "Add X to Y" (e.g., "Add 3 to gold", "Send 2 more to wood")
    const addMatch = text.match(/(?:add|send|rally|put)\s+(\d+)\s+(?:more\s+)?(?:new\s+)?(?:vills?\s+)?(?:to|on|at)\s+(\w+)/i);
    if (addMatch) {
      const amount = parseInt(addMatch[1], 10);
      const target = addMatch[2].toLowerCase();
      
      if (target.includes("food") || target.includes("sheep") || target.includes("berr") || target.includes("hunt")) {
        res.food = (res.food || 0) + amount;
      } else if (target.includes("wood") || target.includes("lumber")) {
        res.wood = (res.wood || 0) + amount;
      } else if (target.includes("gold")) {
        res.gold = (res.gold || 0) + amount;
      } else if (target.includes("stone")) {
        res.stone = (res.stone || 0) + amount;
      }
    }

    // 2. Handle "Move X from Y to Z" (e.g., "Move 2 from food to gold")
    const moveMatch = text.match(/(?:move|shift|transfer)\s+(\d+)\s+(?:vills?\s+)?from\s+(\w+)\s+to\s+(\w+)/i);
    if (moveMatch) {
      const amount = parseInt(moveMatch[1], 10);
      const source = moveMatch[2].toLowerCase();
      const target = moveMatch[3].toLowerCase();

      // Helper to update resource based on name
      const update = (name: string, delta: number) => {
        if (name.includes("food") || name.includes("sheep") || name.includes("berr") || name.includes("hunt")) {
          res.food = Math.max(0, (res.food || 0) + delta);
        } else if (name.includes("wood") || name.includes("lumber")) {
          res.wood = Math.max(0, (res.wood || 0) + delta);
        } else if (name.includes("gold")) {
          res.gold = Math.max(0, (res.gold || 0) + delta);
        } else if (name.includes("stone")) {
          res.stone = Math.max(0, (res.stone || 0) + delta);
        }
      };

      update(source, -amount);
      update(target, amount);
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