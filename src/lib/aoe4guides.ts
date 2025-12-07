/**
 * AOE4 Guides API Service
 * Handles importing and browsing build orders from aoe4guides.com
 */

import { z } from "zod";
import type { BuildOrder, BuildOrderStep, Civilization, Difficulty } from "@/types";
import { BuildOrderSchema } from "@/types";

// ============================================================================
// Zod Schemas for API Response Validation
// ============================================================================

const Aoe4GuidesStepSchema = z.object({
  description: z.string(),
  time: z.string().optional(),
  villagers: z.string().optional(),
  builders: z.string().optional(),
  food: z.string().optional(),
  wood: z.string().optional(),
  gold: z.string().optional(),
  stone: z.string().optional(),
});

const Aoe4GuidesAgePhaseSchema = z.object({
  type: z.enum(["age", "ageUp"]),
  age: z.number(),
  gameplan: z.string(),
  steps: z.array(Aoe4GuidesStepSchema),
});

const Aoe4GuidesTimestampSchema = z.object({
  _seconds: z.number(),
  _nanoseconds: z.number(),
});

const Aoe4GuidesBuildSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  description: z.string().default(""),
  author: z.string().default(""),
  authorUid: z.string().default(""),
  civ: z.string(),
  strategy: z.string().default(""),
  season: z.string().default(""),
  map: z.string().default(""),
  video: z.string().default(""),
  views: z.number().default(0),
  likes: z.number().default(0),
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  score: z.number().default(0),
  scoreAllTime: z.number().default(0),
  timeCreated: Aoe4GuidesTimestampSchema.optional(),
  timeUpdated: Aoe4GuidesTimestampSchema.optional(),
  steps: z.array(Aoe4GuidesAgePhaseSchema),
  isDraft: z.boolean().default(false),
});

// Lenient schema for browse endpoint - only requires minimal fields
const Aoe4GuidesBuildSummarySchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  description: z.string().default(""),
  author: z.string().default(""),
  civ: z.string().default(""),
  strategy: z.string().default(""),
  season: z.string().default(""),
  views: z.number().default(0),
  likes: z.number().default(0),
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  score: z.number().default(0),
  isDraft: z.boolean().default(false),
});

type Aoe4GuidesBuild = z.infer<typeof Aoe4GuidesBuildSchema>;

const API_BASE = "https://aoe4guides.com/api";

// Maximum allowed steps in a build order to prevent performance issues
export const MAX_BUILD_ORDER_STEPS = 200;
const guidesBuildCache = new Map<string, BuildOrder>();

async function fetchWithTimeout(input: RequestInfo | URL, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

// Summary type for list view (without full steps)
export interface Aoe4GuidesBuildSummary {
  id: string;
  title: string;
  description: string;
  author: string;
  civ: string;
  strategy: string;
  season: string;
  views: number;
  likes: number;
  upvotes: number;
  downvotes: number;
  score: number;
}

// ============================================================================
// Civilization Code Mappings
// ============================================================================

// Map API codes to full civilization names
const CIVILIZATION_CODE_MAP: Record<string, Civilization> = {
  ENG: "English",
  FRE: "French",
  HRE: "Holy Roman Empire",
  RUS: "Rus",
  CHI: "Chinese",
  DEL: "Delhi Sultanate",
  ABB: "Abbasid Dynasty",
  MON: "Mongols",
  OTT: "Ottomans",
  MAL: "Malians",
  BYZ: "Byzantines",
  JAP: "Japanese",
  JDA: "Jeanne d'Arc",
  AYY: "Ayyubids",
  ZXL: "Zhu Xi's Legacy",
  DRA: "Order of the Dragon",
  // Dynasties of the East DLC
  GHO: "Golden Horde",
  MAC: "Macedonian Dynasty",
  SEN: "Sengoku Daimyo",
  TUG: "Tughlaq Dynasty",
};

// Reverse mapping for filtering (full name -> code)
export const CIVILIZATION_TO_CODE: Record<string, string> = {
  English: "ENG",
  French: "FRE",
  "Holy Roman Empire": "HRE",
  Rus: "RUS",
  Chinese: "CHI",
  "Delhi Sultanate": "DEL",
  "Abbasid Dynasty": "ABB",
  Mongols: "MON",
  Ottomans: "OTT",
  Malians: "MAL",
  Byzantines: "BYZ",
  Japanese: "JAP",
  "Jeanne d'Arc": "JDA",
  Ayyubids: "AYY",
  "Zhu Xi's Legacy": "ZXL",
  "Order of the Dragon": "DRA",
  // Dynasties of the East DLC
  "Golden Horde": "GHO",
  "Macedonian Dynasty": "MAC",
  "Sengoku Daimyo": "SEN",
  "Tughlaq Dynasty": "TUG",
};

// Strategy to difficulty mapping
const STRATEGY_DIFFICULTY_MAP: Record<string, Difficulty> = {
  Rush: "Intermediate",
  "Fast Castle": "Intermediate",
  Boom: "Beginner",
  "All-in": "Advanced",
  Cheese: "Expert",
  Timing: "Advanced",
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract build ID from an aoe4guides.com URL
 * Supports:
 * - https://aoe4guides.com/build/ABC123
 * - aoe4guides.com/build/ABC123
 * - Just the ID: ABC123 (alphanumeric, typically 15-30 chars)
 */
export function extractAoe4GuidesId(url: string): string | null {
  const cleanUrl = url.trim();

  // Reject clearly wrong domains to provide actionable feedback
  if (/https?:\/\//i.test(cleanUrl) && !/aoe4guides\.com/i.test(cleanUrl)) {
    return null;
  }

  const patterns = [
    /aoe4guides\.com\/build\/([a-zA-Z0-9]+)/i,
    /^([a-zA-Z0-9]{10,30})$/, // IDs are typically alphanumeric, 10-30 chars
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Normalize civilization code to full name
 */
function normalizeCivilization(civCode: string): Civilization {
  const mapped = CIVILIZATION_CODE_MAP[civCode.toUpperCase()];

  if (!mapped) {
    console.warn(
      `Unknown civilization code "${civCode}" from AOE4 Guides API. ` +
        `Falling back to "English". Please report this if it's a valid civilization.`
    );
    return "English";
  }

  return mapped;
}

/**
 * Map strategy to difficulty level
 */
function strategyToDifficulty(strategy?: string): Difficulty {
  if (!strategy) return "Intermediate";
  return STRATEGY_DIFFICULTY_MAP[strategy] || "Intermediate";
}

/**
 * Parse resource string to number
 */
function parseResource(value?: string): number | undefined {
  if (!value || value === "") return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) || num <= 0 ? undefined : num;
}

/**
 * Get age name for display
 */
function getAgeName(age: number): string {
  const ageNames = ["", "Dark Age", "Feudal Age", "Castle Age", "Imperial Age"];
  return ageNames[age] || `Age ${age}`;
}

/**
 * Map aoe4guides icon paths to our icon names
 * This maps the filenames from aoe4guides.com to our GAME_ICONS keys
 */
const AOE4GUIDES_ICON_MAP: Record<string, string> = {
  // Resources
  sheep: "sheep",
  resource_food: "food",
  resource_wood: "wood",
  resource_gold: "gold",
  resource_stone: "stone",
  gaiatreeprototypetree: "wood",
  berrybush: "berries",
  cattle: "cattle",
  oliveoil: "olive_oil",
  bounty: "bounty",
  // Units - generic
  villager: "villager",
  scout: "scout",
  knight: "knight",
  archer: "archer",
  "archer-2": "archer",
  "archer_2": "archer",
  "man-at-arms": "man_at_arms",
  "man-at-arms-1": "man_at_arms",
  spearman: "spearman",
  "spearman-1": "spearman",
  "spearman_1": "spearman",
  horseman: "horseman",
  "horseman-1": "horseman",
  crossbowman: "crossbowman",
  "crossbowman-3": "crossbowman",
  handcannoneer: "handcannoneer",
  "handcannoneer-4": "handcannoneer",
  monk: "monk",
  "monk-3": "monk",
  trader: "trader",
  // Cavalry
  "knight-2": "knight",
  "lancer-3": "lancer",
  "lancer-4": "lancer",
  // Civ-specific units
  ronin_unit: "ronin",
  ronin: "ronin",
  // Civ-specific villagers -> generic villager
  villager_delhi: "villager",
  villager_abbasid: "villager",
  villager_chinese: "villager",
  villager_english: "villager",
  villager_french: "villager",
  villager_hre: "villager",
  villager_mongol: "villager",
  villager_ottoman: "villager",
  villager_rus: "villager",
  villager_malian: "villager",
  villager_japanese: "villager",
  villager_byzantine: "villager",
  villager_ayyubid: "villager",
  "villager-abbasid": "villager",
  "villager-china": "villager",
  "villager-delhi": "villager",
  "villager-japanese": "villager",
  "villager-malians": "villager",
  "villager-mongols": "villager",
  "villager-ottomans": "villager",
  // Buildings
  house: "house",
  mill: "mill",
  "mining-camp": "mining_camp",
  mining_camp: "mining_camp",
  "lumber-camp": "lumber_camp",
  lumber_camp: "lumber_camp",
  barracks: "barracks",
  archery_range: "archery_range",
  "archery-range": "archery_range",
  stable: "stable",
  blacksmith: "blacksmith",
  market: "market",
  town_center: "town_center",
  "town-center": "town_center",
  dock: "dock",
  outpost: "outpost",
  keep: "keep",
  monastery: "monastery",
  university: "university",
  siege_workshop: "siege_workshop",
  "siege-workshop": "siege_workshop",
  farm: "farm",
  // Ages
  age_1: "dark_age",
  age_2: "feudal_age",
  age_3: "castle_age",
  age_4: "imperial_age",
  // Technologies - Economy
  wheelbarrow: "wheelbarrow",
  "professional-scouts": "professional_scouts",
  "professional_scouts": "professional_scouts",
  horticulture: "horticulture",
  "double-broadaxe": "double_broadaxe",
  "double_broadaxe": "double_broadaxe",
  "survival-techniques": "survival_techniques",
  "survival_techniques": "survival_techniques",
  forestry: "forestry",
  "acid-distillation": "acid_distillation",
  "acid_distillation": "acid_distillation",
  "crosscut-saw": "crosscut_saw",
  "crosscut_saw": "crosscut_saw",
  cupellation: "cupellation",
  "drift-nets": "drift_nets",
  "drift_nets": "drift_nets",
  "extended-lines": "extended_lines",
  "extended_lines": "extended_lines",
  fertilization: "fertilization",
  "precision-cross-breeding": "precision_cross_breeding",
  "precision_cross_breeding": "precision_cross_breeding",
  "specialized-pick": "specialized_pick",
  "specialized_pick": "specialized_pick",
  textiles: "textiles",

  // Technologies - Military
  "iron-undermesh": "iron_undermesh",
  "iron_undermesh": "iron_undermesh",
  "steeled-arrow": "steeled_arrow",
  "steeled_arrow": "steeled_arrow",
  "siege-engineering": "siege_engineering",
  "siege_engineering": "siege_engineering",
  bloomery: "bloomery",
  "fitted-leatherwork": "fitted_leatherwork",
  "fitted_leatherwork": "fitted_leatherwork",
  "balanced-projectiles": "balanced_projectiles",
  "balanced_projectiles": "balanced_projectiles",
  chemistry: "chemistry",
  "damascus-steel": "damascus_steel",
  "damascus_steel": "damascus_steel",
  decarbonization: "decarbonization",
  "elite-army-tactics": "elite_army_tactics",
  "elite_army_tactics": "elite_army_tactics",
  geometry: "geometry",
  "insulated-helm": "insulated_helm",
  "insulated_helm": "insulated_helm",
  "military-academy": "military_academy",
  "military_academy": "military_academy",
  "platecutter-point": "platecutter_point",
  "platecutter_point": "platecutter_point",
  "angled-surfaces": "angled_surfaces",
  "angled_surfaces": "angled_surfaces",
  "master-smiths": "master_smiths",
  "master_smiths": "master_smiths",

  // Unit upgrades
  "hardened-spearmen": "hardened_spearmen",
  "hardened_spearmen": "hardened_spearmen",
  "veteran-spearmen": "veteran_spearmen",
  "veteran_spearmen": "veteran_spearmen",
  "elite-spearmen": "elite_spearmen",
  "elite_spearmen": "elite_spearmen",
  "veteran-archers": "veteran_archers",
  "veteran_archers": "veteran_archers",
  "elite-archers": "elite_archers",
  "elite_archers": "elite_archers",
  "veteran-horsemen": "veteran_horsemen",
  "veteran_horsemen": "veteran_horsemen",
  "elite-horsemen": "elite_horsemen",
  "elite_horsemen": "elite_horsemen",

  // Siege
  ram: "ram",
  "battering-ram": "ram",
  mangonel: "mangonel",
  "mangonel-3": "mangonel",
  springald: "springald",
  trebuchet: "trebuchet",
  bombard: "bombard",
  "siege-tower": "siege_tower",
  siege_tower: "siege_tower",
  "culverin-4": "culverin",
  culverin: "culverin",
  "ribauldequin-4": "ribauldequin",
  ribauldequin: "ribauldequin",
  // Map resources
  deer: "deer",
  boar: "boar",
  fish: "fish",
  relic: "relic",
  relics: "relic",
  sacred_sites: "sacred_site",
  wolf: "wolf",
  // Actions
  rally: "rally",
  repair: "repair",
  time: "time",
};

/**
 * Icons that don't have a good mapping - convert to readable text instead
 * Returns null if we should use the icon marker, or a readable string if we should use text
 */
function getReadableIconName(iconName: string): string | null {
  // Known icons that should be converted to readable text (no icon available)
  // Organized by category, no duplicates
  const TEXT_FALLBACKS: Record<string, string> = {
    // Delhi Sultanate - Elephants
    worker_elephant: "Worker Elephant",
    elephant_raider_age2: "Raider Elephant",
    healer_elephant: "Healer Elephant",
    war_elephant: "War Elephant",
    tower_elephant: "Tower Elephant",
    // Delhi Sultanate - Units & Buildings
    scholar: "Scholar",
    ghazi_raider: "Ghazi Raider",
    tower_of_the_sultan: "Tower of the Sultan",
    compound_of_the_defender: "Compound of the Defender",
    house_of_learning: "House of Learning",
    hisar_academy: "Hisar Academy",
    palace_of_the_sultan: "Palace of the Sultan",
    dome_of_the_faith: "Dome of the Faith",
    // English
    longbowman: "Longbowman",
    council_hall: "Council Hall",
    abbey_of_kings: "Abbey of Kings",
    berkshire_palace: "Berkshire Palace",
    wynguard_palace: "Wynguard Palace",
    kings_palace: "King's Palace",
    white_tower: "White Tower",
    // French
    royal_knight: "Royal Knight",
    arbaletrier: "Arbaletrier",
    royal_cannon: "Royal Cannon",
    school_of_cavalry: "School of Cavalry",
    chamber_of_commerce: "Chamber of Commerce",
    red_palace: "Red Palace",
    college_of_artillery: "College of Artillery",
    // HRE
    landsknecht: "Landsknecht",
    prelate: "Prelate",
    palace_of_swabia: "Palace of Swabia",
    regnitz_cathedral: "Regnitz Cathedral",
    elzbach_palace: "Elzbach Palace",
    meinwerk_palace: "Meinwerk Palace",
    aachen_chapel: "Aachen Chapel",
    burgrave_palace: "Burgrave Palace",
    // Rus
    streltsy: "Streltsy",
    warrior_monk: "Warrior Monk",
    horse_archer: "Horse Archer",
    high_trade_house: "High Trade House",
    kremlin: "Kremlin",
    spasskaya_tower: "Spasskaya Tower",
    abbey_of_the_trinity: "Abbey of the Trinity",
    // Chinese - Units
    zhuge_nu: "Zhuge Nu",
    fire_lancer: "Fire Lancer",
    grenadier: "Grenadier",
    nest_of_bees: "Nest of Bees",
    imperial_official: "Imperial Official",
    // Chinese - Landmarks & Buildings
    imperial_academy: "Imperial Academy",
    barbican_of_the_sun: "Barbican of the Sun",
    astronomical_clocktower: "Astronomical Clocktower",
    imperial_palace: "Imperial Palace",
    great_wall_gatehouse: "Great Wall Gatehouse",
    spirit_way: "Spirit Way",
    enclave_of_the_emperor: "Enclave of the Emperor",
    village: "Village",
    // Mongols
    keshik: "Keshik",
    mangudai: "Mangudai",
    khan: "Khan",
    traction_trebuchet: "Traction Treb",
    deer_stones: "Deer Stones",
    silver_tree: "Silver Tree",
    kurultai: "Kurultai",
    steppe_redoubt: "Steppe Redoubt",
    khaganate_palace: "Khaganate Palace",
    the_white_stupa: "The White Stupa",
    ger: "Ger",
    ovoo: "Ovoo",
    // Abbasid
    camel_archer: "Camel Archer",
    camel_rider: "Camel Rider",
    camel_lancer: "Camel Lancer",
    ghulam: "Ghulam",
    house_of_wisdom: "House of Wisdom",
    prayer_hall_of_uqba: "Prayer Hall of Uqba",
    culture_wing: "Culture Wing",
    economic_wing: "Economic Wing",
    military_wing: "Military Wing",
    trade_wing: "Trade Wing",
    // Ottomans
    janissary: "Janissary",
    sipahi: "Sipahi",
    mehter: "Mehter",
    great_bombard: "Great Bombard",
    grand_galley: "Grand Galley",
    military_school: "Military School",
    istanbul_imperial_palace: "Istanbul Imperial Palace",
    istanbul_observatory: "Istanbul Observatory",
    mehmed_imperial_armory: "Mehmed Imperial Armory",
    sea_gate_castle: "Sea Gate Castle",
    sultanhani_trade_network: "Sultanhani Trade Network",
    twin_minaret_medrese: "Twin Minaret Medrese",
    // Japanese
    samurai: "Samurai",
    shinobi: "Shinobi",
    uma_yari: "Uma Yari",
    onna_musha: "Onna Musha",
    katana_bannerman: "Katana Bannerman",
    yumi_ashigaru: "Yumi Ashigaru",
    ozutsu: "Ozutsu",
    // Malians
    donso: "Donso",
    sofa: "Sofa",
    musofadi_warrior: "Musofadi",
    musofadi_gunner: "Musofadi Gunner",
    javelin_thrower: "Javelin Thrower",
    // Byzantines
    cataphract: "Cataphract",
    varangian_guard: "Varangian Guard",
    limitanei: "Limitanei",
    cheirosiphon: "Cheirosiphon",
    // Ayyubids
    desert_raider: "Desert Raider",
    atabeg: "Atabeg",
    bedouin_swordsman: "Bedouin Swordsman",
    bedouin_skirmisher: "Bedouin Skirmisher",
    tower_of_victory: "Tower of Victory",
  };

  const lowerName = iconName.toLowerCase();

  // Check direct mapping
  if (TEXT_FALLBACKS[lowerName]) {
    return TEXT_FALLBACKS[lowerName];
  }

  // Check if it contains landmark patterns
  if (lowerName.includes("landmark_") || lowerName.includes("_landmark")) {
    // Convert snake_case to Title Case
    return iconName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  return null; // Use icon marker
}

/**
 * Text patterns that should be converted to icons
 * These are common text mentions in build orders that have icon equivalents
 */
const TEXT_TO_ICON_MAP: Array<[RegExp, string]> = [
  // Civ-specific villagers -> generic villager icon
  [/\bVillager\s+Delhi\b/gi, "[icon:villager]"],
  [/\bVillager\s+Abbasid\b/gi, "[icon:villager]"],
  [/\bVillager\s+Chinese\b/gi, "[icon:villager]"],
  [/\bVillager\s+English\b/gi, "[icon:villager]"],
  [/\bVillager\s+French\b/gi, "[icon:villager]"],
  [/\bVillager\s+HRE\b/gi, "[icon:villager]"],
  [/\bVillager\s+Mongol\b/gi, "[icon:villager]"],
  [/\bVillager\s+Ottoman\b/gi, "[icon:villager]"],
  [/\bVillager\s+Rus\b/gi, "[icon:villager]"],
  [/\bVillager\s+Malian\b/gi, "[icon:villager]"],
  [/\bVillager\s+Japanese\b/gi, "[icon:villager]"],
  [/\bVillager\s+Byzantine\b/gi, "[icon:villager]"],
  [/\bVillager\s+Ayyubid\b/gi, "[icon:villager]"],
];

/**
 * Common upgrade/technology names that get concatenated without spaces
 * We add spaces before capital letters that follow lowercase letters
 */
function splitCamelCaseUpgrades(text: string): string {
  // Pattern: lowercase letter followed by uppercase letter (e.g., "ScoutsSurvival" -> "Scouts Survival")
  // But avoid splitting things like "TC" or "MAA"
  return text.replace(/([a-z])([A-Z])/g, "$1 $2");
}

/**
 * Convert HTML img tags from aoe4guides to our [icon:name] format or plain text
 * Input: <img src="/assets/pictures/unit_worker/villager.png" class="icon-default" title="Villager" />
 * Output: [icon:villager]
 */
function convertHtmlToIconMarkers(html: string): string {
  if (!html) return "";

  let result = html;

  // Replace img tags with icon markers or text
  // First match the entire img tag, then extract attributes separately
  result = result.replace(/<img[^>]+\/?>/gi, (imgTag) => {
    // Extract src attribute
    const srcMatch = imgTag.match(/src="([^"]*)"/i);
    const src = srcMatch ? srcMatch[1] : "";

    // Extract title attribute (for fallback)
    const titleMatch = imgTag.match(/title="([^"]*)"/i);
    const title = titleMatch ? titleMatch[1] : undefined;

    if (!src) {
      return title || "";
    }

    // Extract filename from src path
    // e.g., /assets/pictures/unit_worker/villager.png -> villager
    const pathMatch = src.match(/\/([^\/]+)\.(png|webp|jpg)$/i);
    const filename = pathMatch ? pathMatch[1].toLowerCase() : "";

    // Also check parent folder for context
    // e.g., /assets/pictures/resource/resource_gold.png
    const parentMatch = src.match(/\/([^\/]+)\/[^\/]+\.(png|webp|jpg)$/i);
    const parentFolder = parentMatch ? parentMatch[1].toLowerCase() : "";

    // Try to map to our icon format
    let iconName = AOE4GUIDES_ICON_MAP[filename];

    // If not found, try with parent context
    if (!iconName && parentFolder === "resource" && filename.startsWith("resource_")) {
      iconName = filename.replace("resource_", "");
    }

    // If we have a mapped icon name, use our marker format
    if (iconName && iconName.length > 0) {
      return `[icon:${iconName}]`;
    }

    // Check if this icon should be converted to readable text instead
    const readableName = getReadableIconName(filename);
    if (readableName) {
      return readableName;
    }

    // Fallback to title text if available
    if (title) {
      return title;
    }

    // Last resort: convert filename to readable text
    return filename
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  });

  // Convert <br /> tags to newlines or spaces
  result = result.replace(/<br\s*\/?>/gi, " | ");

  // Decode HTML entities
  result = result
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Clean up extra whitespace
  result = result.replace(/\s+/g, " ").trim();

  // Split concatenated CamelCase words (e.g., "ScoutsSurvival" -> "Scouts Survival")
  // But preserve icon markers by temporarily replacing them
  const iconMarkers: string[] = [];
  result = result.replace(/\[icon:\w+\]/g, (match) => {
    iconMarkers.push(match);
    return `__ICON_${iconMarkers.length - 1}__`;
  });

  result = splitCamelCaseUpgrades(result);

  // Restore icon markers
  result = result.replace(/__ICON_(\d+)__/g, (_, index) => iconMarkers[parseInt(index)]);

  // Convert text mentions of villagers to icon markers
  for (const [pattern, replacement] of TEXT_TO_ICON_MAP) {
    result = result.replace(pattern, replacement);
  }

  // Ensure proper spacing around icon markers
  result = result.replace(/\]\s*\[/g, "] [");
  result = result.replace(/\]([a-zA-Z0-9])/g, "] $1");
  result = result.replace(/([a-zA-Z0-9])\[/g, "$1 [");

  // Clean up any double spaces that might have been introduced
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert AOE4 Guides build to our format
 * @throws Error if the build order exceeds MAX_BUILD_ORDER_STEPS
 */
function convertBuild(build: Aoe4GuidesBuild): BuildOrder {
  const steps: BuildOrderStep[] = [];
  let stepNumber = 1;

  // Flatten the nested age phases into steps
  for (const phase of build.steps) {
    // Add age transition marker if it's an age-up phase
    if (phase.type === "ageUp") {
      const nextAgeName = getAgeName(phase.age + 1);
      steps.push({
        id: `step-${stepNumber}`,
        description: `[Age Up to ${nextAgeName}]`,
      });
      stepNumber++;
    }

    // Add gameplan as a step if it exists and is non-empty
    if (phase.gameplan && phase.gameplan.trim()) {
      const cleanGameplan = convertHtmlToIconMarkers(phase.gameplan);
      steps.push({
        id: `step-${stepNumber}`,
        description: cleanGameplan.charAt(0).toUpperCase() + cleanGameplan.slice(1),
      });
      stepNumber++;
    }

    // Add individual steps
    for (const step of phase.steps) {
      if (stepNumber > MAX_BUILD_ORDER_STEPS) {
        throw new Error(
          `Build order exceeds maximum of ${MAX_BUILD_ORDER_STEPS} steps. ` +
            `Please choose a shorter build order.`
        );
      }

      // Skip empty steps
      if (!step.description && !step.food && !step.wood && !step.gold && !step.stone) {
        continue;
      }

      // Convert HTML img tags to our icon marker format
      const cleanDescription = step.description
        ? convertHtmlToIconMarkers(step.description)
        : `Step ${stepNumber}`;

      // Skip steps that are just separators or whitespace after cleaning
      const strippedDescription = cleanDescription.replace(/\|/g, "").trim();
      if (!strippedDescription && !step.food && !step.wood && !step.gold && !step.stone) {
        continue;
      }

      const ourStep: BuildOrderStep = {
        id: `step-${stepNumber}`,
        description: cleanDescription,
      };

      // Add timing if available (clean HTML tags from timing)
      if (step.time && step.time.trim()) {
        ourStep.timing = step.time
          .replace(/<br\s*\/?>/gi, "")
          .replace(/<[^>]+>/g, "")
          .trim();
      }

      // Add resources if any are set
      const food = parseResource(step.food);
      const wood = parseResource(step.wood);
      const gold = parseResource(step.gold);
      const stone = parseResource(step.stone);

      if (food || wood || gold || stone) {
        ourStep.resources = {};
        if (food) ourStep.resources.food = food;
        if (wood) ourStep.resources.wood = wood;
        if (gold) ourStep.resources.gold = gold;
        if (stone) ourStep.resources.stone = stone;
      }

      steps.push(ourStep);
      stepNumber++;
    }
  }

  // Build description from metadata
  const descParts: string[] = [];
  if (build.description) {
    descParts.push(build.description);
  }
  descParts.push("Imported from aoe4guides.com");
  if (build.author) {
    descParts.push(`Author: ${build.author}`);
  }
  if (build.strategy) {
    descParts.push(`Strategy: ${build.strategy}`);
  }

  const converted = BuildOrderSchema.parse({
    id: `aoe4guides-${build.id}`,
    name: build.title || "Imported Build",
    civilization: normalizeCivilization(build.civ),
    description: descParts.join(". "),
    difficulty: strategyToDifficulty(build.strategy),
    enabled: true,
    steps,
  });

  // Safe cast: civilization and difficulty are normalized to valid enum values
  return converted as BuildOrder;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch a single build by ID from AOE4 Guides
 */
export async function fetchAoe4GuidesBuild(buildId: string): Promise<BuildOrder> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/builds/${buildId}`, 5000);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Build "${buildId}" not found on aoe4guides.com`);
        }
        throw new Error(`Failed to fetch build: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const data = Aoe4GuidesBuildSchema.parse(json);

      if (!data.steps || data.steps.length === 0) {
        throw new Error("Build has no steps");
      }

      const converted = convertBuild(data);
      guidesBuildCache.set(buildId, converted);
      return converted;
    } catch (error) {
      lastError = error;
      // Don't retry on 404s or validation errors
      if (error instanceof Error && (
        error.message.includes("not found") || 
        error.message.includes("no steps")
      )) {
        break;
      }
      if (attempt < 2) continue;
    }
  }

  if (guidesBuildCache.has(buildId)) {
    console.warn(`Using cached aoe4guides build ${buildId} due to fetch failure.`);
    return guidesBuildCache.get(buildId)!;
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Failed to fetch build from aoe4guides.com");
}

/**
 * Import a build order from an AOE4 Guides URL or ID
 */
export async function importAoe4GuidesBuild(urlOrId: string): Promise<BuildOrder> {
  const buildId = extractAoe4GuidesId(urlOrId);

  if (!buildId) {
    throw new Error(
      "Invalid AOE4Guides link. Use a URL like https://aoe4guides.com/build/ABC123 or paste the alphanumeric ID."
    );
  }

  return fetchAoe4GuidesBuild(buildId);
}

/**
 * Browse builds from AOE4 Guides
 * Returns list of build summaries for the browser UI
 */
export async function browseAoe4GuidesBuilds(options?: {
  civ?: string; // Civilization code (ENG, FRE, etc.) or full name
}): Promise<Aoe4GuidesBuildSummary[]> {
  const params = new URLSearchParams();

  if (options?.civ) {
    // Convert full name to code if needed
    const code = CIVILIZATION_TO_CODE[options.civ] || options.civ.toUpperCase();
    params.set("civ", code);
  }

  const queryString = params.toString();
  const url = `${API_BASE}/builds${queryString ? `?${queryString}` : ""}`;

  const response = await fetchWithTimeout(url, 5000);

  if (!response.ok) {
    throw new Error(`Failed to browse builds: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const data = z.array(Aoe4GuidesBuildSummarySchema).parse(json);

  // Filter out drafts and map to summary
  return data
    .filter((build) => !build.isDraft)
    .map((build) => ({
      id: build.id,
      title: build.title,
      description: build.description,
      author: build.author,
      civ: build.civ,
      strategy: build.strategy,
      season: build.season,
      views: build.views,
      likes: build.likes,
      upvotes: build.upvotes,
      downvotes: build.downvotes,
      score: build.score,
    }));
}

/**
 * Get the full civilization name from an API code
 * Useful for UI display
 */
export function getCivNameFromCode(code: string): string {
  return CIVILIZATION_CODE_MAP[code.toUpperCase()] || code;
}
