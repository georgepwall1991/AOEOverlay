/**
 * Age4Builder.com JSON converter
 * Converts build orders from age4builder.com format to our overlay format
 */

import type { BuildOrder, BuildOrderStep, Civilization } from "@/types";
import { BuildOrderSchema } from "@/types";

// Maximum allowed steps in a build order to prevent performance issues
export const MAX_BUILD_ORDER_STEPS = 200;

// Icon mapping from age4builder paths to our icon types
const ICON_MAP: Record<string, string> = {
  // Units
  "unit_worker/villager.png": "villager",
  "unit_cavalry/scout.png": "scout",
  "unit_cavalry/knight.png": "knight",
  "unit_cavalry/knight-2.png": "knight",
  "unit_cavalry/horseman.png": "horseman",
  "unit_infantry/spearman.png": "spearman",
  "unit_infantry/man-at-arms.png": "man_at_arms",
  "unit_infantry/pikeman.png": "pikeman",
  "unit_ranged/archer.png": "archer",
  "unit_ranged/crossbowman.png": "crossbowman",
  "unit_ranged/handcannoneer.png": "handcannoneer",
  "unit_religious/monk.png": "monk",

  // Economy buildings
  "building_economy/house.png": "house",
  "building_economy/lumber-camp.png": "lumber_camp",
  "building_economy/mining-camp.png": "mining_camp",
  "building_economy/mill.png": "mill",
  "building_economy/farm.png": "farm",
  "building_economy/market.png": "market",
  "building_economy/dock.png": "dock",
  "building_economy/town-center.png": "town_center",

  // Military buildings
  "building_military/barracks.png": "barracks",
  "building_military/archery-range.png": "archery_range",
  "building_military/stable.png": "stable",
  "building_military/siege-workshop.png": "siege_workshop",
  "building_military/blacksmith.png": "blacksmith",
  "building_military/monastery.png": "monastery",
  "building_military/university.png": "university",
  "building_military/keep.png": "keep",
  "building_military/outpost.png": "outpost",

  // Civ-specific buildings
  "building_rus/hunting-cabin.png": "hunting_cabin",
  "building_chinese/village.png": "village",
  "building_hre/meinwerk-palace.png": "landmark",
  "building_mongol/ger.png": "ger",

  // Resources
  "resource/food.png": "food",
  "resource/resource_food.png": "food",
  "resource/wood.png": "wood",
  "resource/resource_wood.png": "wood",
  "resource/gold.png": "gold",
  "resource/resource_gold.png": "gold",
  "resource/stone.png": "stone",
  "resource/resource_stone.png": "stone",
  "resource/sheep.png": "sheep",
  "resource/deer.png": "deer",
  "resource/boar.png": "boar",
  "resource/wolf.png": "wolf",
  "resource/fish.png": "fish",
  "resource/berries.png": "berries",

  // Technologies
  "technology_economy/wheelbarrow.png": "wheelbarrow",
  "technology_economy/double-broadaxe.png": "upgrade",
  "technology_economy/specialized-pick.png": "upgrade",
  "technology_economy/horticulture.png": "upgrade",

  // Ages/Landmarks (generic)
  "age/age_1.png": "dark_age",
  "age/age_2.png": "feudal_age",
  "age/age_3.png": "castle_age",
  "age/age_4.png": "imperial_age",
};

// Match any landmark to our generic landmark/feudal_age icon
const LANDMARK_PATTERN = /landmark_\w+\/[\w-]+\.png/;

interface Age4BuilderStep {
  age: number;
  population_count: number;
  villager_count: number;
  resources: {
    food: number;
    wood: number;
    gold: number;
    stone: number;
  };
  notes: string[];
}

interface Age4BuilderFormat {
  civilization: string;
  name: string;
  author: string;
  source: string;
  build_order: Age4BuilderStep[];
}

function convertIconSyntax(text: string): string {
  // Replace @path/to/icon.png@ with [icon:type]
  return text.replace(/@([^@]+)@/g, (match, iconPath) => {
    // Check direct mapping
    if (ICON_MAP[iconPath]) {
      return `[icon:${ICON_MAP[iconPath]}]`;
    }

    // Check if it's a landmark
    if (LANDMARK_PATTERN.test(iconPath)) {
      return "[icon:feudal_age]"; // Use age icon for landmarks
    }

    // Try to extract a meaningful name from the path
    const filename = iconPath
      .split("/")
      .pop()
      ?.replace(".png", "")
      .replace(/-/g, "_");
    if (filename) {
      // Check if we have this icon defined
      const knownIcons = [
        "villager",
        "scout",
        "knight",
        "house",
        "sheep",
        "wood",
        "gold",
        "food",
        "stone",
      ];
      if (knownIcons.includes(filename)) {
        return `[icon:${filename}]`;
      }
      console.warn(`Unknown icon: ${iconPath} -> using [icon:${filename}]`);
      return `[icon:${filename}]`;
    }

    // Keep original if we can't map it
    console.warn(`Could not map icon: ${iconPath}`);
    return match;
  });
}

function cleanupText(text: string): string {
  // Convert icon syntax
  let result = convertIconSyntax(text);

  // Clean up spacing around icons
  result = result.replace(/\]\s*\[/g, "] [");

  // Add space after ] if followed by lowercase letter (word continues)
  result = result.replace(/\]([a-z])/g, "] $1");

  // Add space before [ if preceded by a letter/word
  result = result.replace(/([a-zA-Z])\[/g, "$1 [");

  // Fix common issues - normalize whitespace
  result = result.replace(/\s+/g, " ").trim();

  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1);

  return result;
}

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function estimateTiming(stepIndex: number): string {
  // Rough timing estimates based on step position
  const seconds = stepIndex * 30;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Convert age4builder.com JSON format to our overlay format
 * @throws Error if the build order exceeds MAX_BUILD_ORDER_STEPS
 */
export function convertAge4Builder(input: Age4BuilderFormat): BuildOrder {
  const steps: BuildOrderStep[] = [];
  let stepNumber = 1;

  for (const step of input.build_order) {
    // Each note becomes a separate step for clarity
    for (const note of step.notes) {
      const description = cleanupText(note);

      // Skip empty notes
      if (!description) continue;

      // Validate step count limit
      if (stepNumber > MAX_BUILD_ORDER_STEPS) {
        throw new Error(
          `Build order exceeds maximum of ${MAX_BUILD_ORDER_STEPS} steps. ` +
          `This build has been truncated for performance reasons.`
        );
      }

      const ourStep: BuildOrderStep = {
        id: `step-${stepNumber}`,
        description,
        timing: estimateTiming(stepNumber - 1),
      };

      // Include resources if they're meaningful (not all -1)
      if (
        step.resources.food >= 0 ||
        step.resources.wood >= 0 ||
        step.resources.gold >= 0 ||
        step.resources.stone >= 0
      ) {
        ourStep.resources = {
          food: Math.max(0, step.resources.food),
          wood: Math.max(0, step.resources.wood),
          gold: Math.max(0, step.resources.gold),
          stone: Math.max(0, step.resources.stone),
        };
      }

      steps.push(ourStep);
      stepNumber++;
    }
  }

  // Build a description that includes author and source info
  const descParts = ["Imported from age4builder.com"];
  if (input.author && input.author !== "Anonymous") {
    descParts.push(`Author: ${input.author}`);
  }
  if (input.source && input.source !== "unknown") {
    descParts.push(`Source: ${input.source}`);
  }

  const converted: BuildOrder = {
    id: generateId(input.name),
    name: input.name,
    civilization: input.civilization as Civilization,
    description: descParts.join(". "),
    difficulty: "Intermediate",
    enabled: true,
    steps,
  };

  return BuildOrderSchema.parse(converted) as BuildOrder;
}

/**
 * Parse and validate age4builder JSON
 * Returns the parsed object or throws an error with a helpful message
 */
export function parseAge4BuilderJson(jsonString: string): Age4BuilderFormat {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON format. Please paste the raw JSON from age4builder.com");
  }

  // Validate structure
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid format: expected an object");
  }

  const obj = parsed as Record<string, unknown>;

  if (!obj.name || typeof obj.name !== "string") {
    throw new Error('Missing or invalid "name" field');
  }

  if (!obj.civilization || typeof obj.civilization !== "string") {
    throw new Error('Missing or invalid "civilization" field');
  }

  if (!Array.isArray(obj.build_order)) {
    throw new Error('Missing or invalid "build_order" array');
  }

  if (obj.build_order.length === 0) {
    throw new Error("Build order has no steps");
  }

  return parsed as Age4BuilderFormat;
}

/**
 * Full import: parse JSON string and convert to our format
 */
export function importAge4Builder(jsonString: string): BuildOrder {
  const parsed = parseAge4BuilderJson(jsonString);
  return convertAge4Builder(parsed);
}
