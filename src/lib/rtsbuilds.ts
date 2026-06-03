import { z } from "zod";
import type { BuildOrder, BuildOrderStep, Civilization, Difficulty } from "@/types";
import { BuildOrderSchema } from "@/types";
import { sanitizeTiming } from "@/stores/timerStore";
import { IntelligentConverter } from "./intelligentConverter";

const RTS_BUILDS_BASE = "https://craftysalamander.github.io/rtsbuilds/api/builds/aoe4";
const MAX_BUILD_ORDER_STEPS = 200;

const RtsBuildsResourcesSchema = z.object({
  food: z.number().optional(),
  wood: z.number().optional(),
  gold: z.number().optional(),
  stone: z.number().optional(),
  builder: z.number().optional(),
});

const RtsBuildsStepSchema = z.object({
  age: z.number().optional(),
  population_count: z.number().optional(),
  villager_count: z.number().optional(),
  resources: RtsBuildsResourcesSchema.optional(),
  notes: z.array(z.string()).optional(),
  time: z.string().optional(),
});

const RtsBuildsBuildSchema = z.object({
  civilization: z.string(),
  name: z.string(),
  author: z.string().optional(),
  source: z.string().optional(),
  build_order: z.array(RtsBuildsStepSchema).min(1),
});

type RtsBuildsBuild = z.infer<typeof RtsBuildsBuildSchema>;

const CIVILIZATION_ALIASES: Record<string, Civilization> = {
  "abbasid dynasty": "Abbasid Dynasty",
  abbasid: "Abbasid Dynasty",
  ayyubids: "Ayyubids",
  byzantines: "Byzantines",
  chinese: "Chinese",
  "delhi sultanate": "Delhi Sultanate",
  delhi: "Delhi Sultanate",
  english: "English",
  french: "French",
  "golden horde": "Golden Horde",
  "house of lancaster": "House of Lancaster",
  "holy roman empire": "Holy Roman Empire",
  hre: "Holy Roman Empire",
  japanese: "Japanese",
  "jeanne d'arc": "Jeanne d'Arc",
  "jin dynasty": "Jin Dynasty",
  "knights templar": "Knights Templar",
  "macedonian dynasty": "Macedonian Dynasty",
  malians: "Malians",
  mongols: "Mongols",
  "order of the dragon": "Order of the Dragon",
  ottomans: "Ottomans",
  rus: "Rus",
  "sengoku daimyo": "Sengoku Daimyo",
  "tughlaq dynasty": "Tughlaq Dynasty",
  "zhu xi's legacy": "Zhu Xi's Legacy",
};

const ICON_ALIASES: Record<string, string> = {
  "resource_food": "food",
  "resource_wood": "wood",
  "resource_gold": "gold",
  "resource_stone": "stone",
  "berrybush": "berries",
  "villager-abbasid": "villager",
  "villager-china": "villager",
  "villager-delhi": "villager",
  "villager-japanese": "villager",
  "villager-malians": "villager",
  "villager-mongols": "villager",
  "villager-ottomans": "villager",
  "town-center": "town_center",
  "mining-camp": "mining_camp",
  "lumber-camp": "lumber_camp",
  "archery-range": "archery_range",
  "siege-workshop": "siege_workshop",
  "meinwerk-palace": "meinwerk_palace",
  "school-of-cavalry": "school_of_cavalry",
  "council-hall": "council_hall",
  "double-broadaxe": "double_broadaxe",
  "survival-techniques": "survival_techniques",
  "professional-scouts": "professional_scouts",
  "wheelbarrow": "wheelbarrow",
};

function normalizeCivilization(value: string): Civilization {
  const key = value.trim().toLowerCase();
  return CIVILIZATION_ALIASES[key] ?? (value as Civilization);
}

function slugifyBuildName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractFilenameIcon(path: string): string {
  const filename = path.split("/").pop()?.replace(/\.(webp|png|jpg|jpeg)$/i, "") ?? path;
  const normalized = filename.toLowerCase().replace(/_/g, "-");
  return ICON_ALIASES[normalized] ?? ICON_ALIASES[filename] ?? filename.replace(/-/g, "_");
}

function convertRtsIconMarkers(note: string): string {
  return note.replace(/@([^@]+)@/g, (_, path: string) => `[icon:${extractFilenameIcon(path)}]`);
}

function stepDescription(step: z.infer<typeof RtsBuildsStepSchema>, index: number): string {
  const notes = step.notes?.map(convertRtsIconMarkers).filter(Boolean) ?? [];
  const ageText = step.age && step.age > 0 ? `Age ${step.age}` : null;
  const fallback = ageText ? `${ageText} checkpoint` : `Step ${index + 1}`;
  return notes.length > 0 ? notes.join(" | ") : fallback;
}

function convertBuild(build: RtsBuildsBuild, sourceUrl: string): BuildOrder {
  if (build.build_order.length > MAX_BUILD_ORDER_STEPS) {
    throw new Error(`Build order exceeds maximum of ${MAX_BUILD_ORDER_STEPS} steps.`);
  }

  const intelligentConverter = new IntelligentConverter();
  const steps: BuildOrderStep[] = build.build_order.map((step, index) => {
    const resources: BuildOrderStep["resources"] = {};
    if (step.resources?.food !== undefined && step.resources.food >= 0) resources.food = step.resources.food;
    if (step.resources?.wood !== undefined && step.resources.wood >= 0) resources.wood = step.resources.wood;
    if (step.resources?.gold !== undefined && step.resources.gold >= 0) resources.gold = step.resources.gold;
    if (step.resources?.stone !== undefined && step.resources.stone >= 0) resources.stone = step.resources.stone;
    if (step.resources?.builder !== undefined && step.resources.builder >= 0) resources.builders = step.resources.builder;
    if (step.villager_count !== undefined && step.villager_count >= 0) resources.villagers = step.villager_count;

    const convertedStep: BuildOrderStep = {
      id: `step-${index + 1}`,
      description: stepDescription(step, index),
    };

    const timing = sanitizeTiming(step.time ?? "");
    if (timing) convertedStep.timing = timing;
    if (Object.keys(resources).length > 0) convertedStep.resources = resources;

    return intelligentConverter.processStep(convertedStep, index);
  });

  const descriptionParts = ["Imported from RTS Builds"];
  if (build.author) descriptionParts.push(`Author: ${build.author}`);
  if (build.source) descriptionParts.push(`Source: ${build.source}`);

  return BuildOrderSchema.parse({
    id: `rtsbuilds-${slugifyBuildName(build.name)}`,
    name: build.name,
    civilization: normalizeCivilization(build.civilization),
    description: descriptionParts.join(". "),
    difficulty: "Intermediate" satisfies Difficulty,
    enabled: true,
    steps,
    source: {
      type: "rtsbuilds",
      url: sourceUrl,
      importedAt: new Date().toISOString(),
      rawCivilization: build.civilization,
    },
    contentVersion: "2026-05-07",
  }) as BuildOrder;
}

export function extractRtsBuildsId(urlOrName: string): string | null {
  const input = urlOrName.trim();
  if (!input) return null;

  const directJson = input.match(/rtsbuilds\/api\/builds\/aoe4\/([a-z0-9]+)\.json/i);
  if (directJson) return directJson[1];

  try {
    const parsed = new URL(input);
    if (!/craftysalamander\.github\.io$/i.test(parsed.hostname)) return null;
    const buildOrderId = parsed.searchParams.get("buildOrderId");
    const gameId = parsed.searchParams.get("gameId");
    if (gameId && gameId !== "aoe4") return null;
    if (buildOrderId && /^[a-z0-9]+$/i.test(buildOrderId)) return buildOrderId.toLowerCase();
  } catch {
    // Fall through to pasted build-name support.
  }

  if (/^[a-z0-9]+$/i.test(input)) return input.toLowerCase();
  return slugifyBuildName(input);
}

export async function importRtsBuildsBuild(urlOrName: string): Promise<BuildOrder> {
  const buildId = extractRtsBuildsId(urlOrName);
  if (!buildId) {
    throw new Error("Invalid RTS Builds link. Use an AoE4 RTS Builds page, JSON URL, or build name.");
  }

  const apiUrl = `${RTS_BUILDS_BASE}/${buildId}.json`;
  const response = await fetch(apiUrl, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Build "${buildId}" not found on RTS Builds.`);
  }

  const data = RtsBuildsBuildSchema.parse(await response.json());
  return convertBuild(data, apiUrl);
}
