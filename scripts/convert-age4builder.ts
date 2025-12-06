#!/usr/bin/env npx ts-node

/**
 * Converts age4builder.com JSON format to our overlay format
 *
 * Usage: npx ts-node scripts/convert-age4builder.ts input.json output.json
 */

// Icon mapping from age4builder paths to our icon types
const ICON_MAP: Record<string, string> = {
  // Units
  'unit_worker/villager.png': 'villager',
  'unit_cavalry/scout.png': 'scout',
  'unit_cavalry/knight.png': 'knight',
  'unit_cavalry/knight-2.png': 'knight',
  'unit_cavalry/horseman.png': 'horseman',
  'unit_infantry/spearman.png': 'spearman',
  'unit_infantry/man-at-arms.png': 'man_at_arms',
  'unit_infantry/pikeman.png': 'pikeman',
  'unit_ranged/archer.png': 'archer',
  'unit_ranged/crossbowman.png': 'crossbowman',
  'unit_ranged/handcannoneer.png': 'handcannoneer',
  'unit_religious/monk.png': 'monk',

  // Economy buildings
  'building_economy/house.png': 'house',
  'building_economy/lumber-camp.png': 'lumber_camp',
  'building_economy/mining-camp.png': 'mining_camp',
  'building_economy/mill.png': 'mill',
  'building_economy/farm.png': 'farm',
  'building_economy/market.png': 'market',
  'building_economy/dock.png': 'dock',
  'building_economy/town-center.png': 'town_center',

  // Military buildings
  'building_military/barracks.png': 'barracks',
  'building_military/archery-range.png': 'archery_range',
  'building_military/stable.png': 'stable',
  'building_military/siege-workshop.png': 'siege_workshop',
  'building_military/blacksmith.png': 'blacksmith',
  'building_military/monastery.png': 'monastery',
  'building_military/university.png': 'university',
  'building_military/keep.png': 'keep',
  'building_military/outpost.png': 'outpost',

  // Civ-specific buildings
  'building_rus/hunting-cabin.png': 'hunting_cabin',
  'building_chinese/village.png': 'village',
  'building_hre/meinwerk-palace.png': 'landmark',
  'building_mongol/ger.png': 'ger',

  // Resources
  'resource/food.png': 'food',
  'resource/resource_food.png': 'food',
  'resource/wood.png': 'wood',
  'resource/resource_wood.png': 'wood',
  'resource/gold.png': 'gold',
  'resource/resource_gold.png': 'gold',
  'resource/stone.png': 'stone',
  'resource/resource_stone.png': 'stone',
  'resource/sheep.png': 'sheep',
  'resource/deer.png': 'deer',
  'resource/boar.png': 'boar',
  'resource/wolf.png': 'wolf',
  'resource/fish.png': 'fish',
  'resource/berries.png': 'berries',

  // Technologies
  'technology_economy/wheelbarrow.png': 'wheelbarrow',
  'technology_economy/double-broadaxe.png': 'upgrade',
  'technology_economy/specialized-pick.png': 'upgrade',
  'technology_economy/horticulture.png': 'upgrade',

  // Ages/Landmarks (generic)
  'age/age_1.png': 'dark_age',
  'age/age_2.png': 'feudal_age',
  'age/age_3.png': 'castle_age',
  'age/age_4.png': 'imperial_age',
};

// Map any landmark to our generic landmark/feudal_age icon
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

interface OurStep {
  id: string;
  description: string;
  timing?: string;
  resources?: {
    food: number;
    wood: number;
    gold: number;
    stone: number;
  };
}

interface OurFormat {
  id: string;
  name: string;
  civilization: string;
  description: string;
  author?: string;
  source?: string;
  difficulty: string;
  enabled: boolean;
  steps: OurStep[];
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
      return '[icon:feudal_age]'; // Use age icon for landmarks
    }

    // Try to extract a meaningful name from the path
    const filename = iconPath.split('/').pop()?.replace('.png', '').replace(/-/g, '_');
    if (filename) {
      // Check if we have this icon defined
      const knownIcons = ['villager', 'scout', 'knight', 'house', 'sheep', 'wood', 'gold', 'food', 'stone'];
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
  result = result.replace(/\]\s*\[/g, '] [');

  // Add space after ] if followed by lowercase letter (word continues)
  result = result.replace(/\]([a-z])/g, '] $1');

  // Add space before [ if preceded by a letter/word
  result = result.replace(/([a-zA-Z])\[/g, '$1 [');

  // Fix common issues - normalize whitespace
  result = result.replace(/\s+/g, ' ').trim();

  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1);

  return result;
}

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function estimateTiming(stepIndex: number): string {
  // Rough timing estimates based on step position
  // Early game: ~25-30 seconds per step
  // Mid game: ~30-45 seconds per step
  const seconds = stepIndex * 30;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function convert(input: Age4BuilderFormat): OurFormat {
  const steps: OurStep[] = [];
  let stepNumber = 1;

  for (const step of input.build_order) {
    // Each note becomes a separate step for clarity
    for (const note of step.notes) {
      const description = cleanupText(note);

      // Skip empty notes
      if (!description) continue;

      const ourStep: OurStep = {
        id: `step-${stepNumber}`,
        description,
        timing: estimateTiming(stepNumber - 1),
      };

      // Include resources if they're meaningful (not all -1)
      if (step.resources.food >= 0 || step.resources.wood >= 0 ||
          step.resources.gold >= 0 || step.resources.stone >= 0) {
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

  return {
    id: generateId(input.name),
    name: input.name,
    civilization: input.civilization,
    description: `Imported from age4builder.com. Author: ${input.author}`,
    author: input.author,
    source: input.source,
    difficulty: 'Intermediate',
    enabled: true,
    steps,
  };
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Read from stdin if no args
    console.log('Paste age4builder JSON (Ctrl+D when done):');
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const inputJson = Buffer.concat(chunks).toString('utf8');
    const input = JSON.parse(inputJson) as Age4BuilderFormat;
    const output = convert(input);
    console.log(JSON.stringify(output, null, 2));
  } else {
    const fs = await import('fs');
    const inputFile = args[0];
    const outputFile = args[1];

    const inputJson = fs.readFileSync(inputFile, 'utf8');
    const input = JSON.parse(inputJson) as Age4BuilderFormat;
    const output = convert(input);

    if (outputFile) {
      fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
      console.log(`Converted ${input.name} -> ${outputFile}`);
    } else {
      console.log(JSON.stringify(output, null, 2));
    }
  }
}

main().catch(console.error);

// Export for use as module
export { convert, convertIconSyntax, ICON_MAP };
