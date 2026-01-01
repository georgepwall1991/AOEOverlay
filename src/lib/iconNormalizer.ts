/**
 * Unified Icon Normalizer
 * Single source of truth for icon name normalization across all build order sources.
 * Handles version suffixes, separators, aliases, and civ-specific variants.
 */

// ============================================================================
// Icon Registry - Single source of truth for all icons
// ============================================================================

export interface IconEntry {
  /** Canonical name used internally */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Whether we have an icon file for this */
  hasFile: boolean;
  /** Alternative names that map to this icon */
  aliases: string[];
  /** Category for organization */
  category: "unit" | "building" | "resource" | "technology" | "age" | "landmark" | "other";
}

export const ICON_REGISTRY: Record<string, IconEntry> = {
  // ============================================================================
  // RESOURCES
  // ============================================================================
  food: {
    name: "food",
    displayName: "Food",
    hasFile: true,
    aliases: ["f", "resource_food"],
    category: "resource",
  },
  wood: {
    name: "wood",
    displayName: "Wood",
    hasFile: true,
    aliases: ["w", "resource_wood", "lumber"],
    category: "resource",
  },
  gold: {
    name: "gold",
    displayName: "Gold",
    hasFile: true,
    aliases: ["g", "resource_gold"],
    category: "resource",
  },
  stone: {
    name: "stone",
    displayName: "Stone",
    hasFile: true,
    aliases: ["s", "resource_stone"],
    category: "resource",
  },
  sheep: {
    name: "sheep",
    displayName: "Sheep",
    hasFile: true,
    aliases: [],
    category: "resource",
  },
  berries: {
    name: "berries",
    displayName: "Berries",
    hasFile: true,
    aliases: ["berrybush", "berry_bush"],
    category: "resource",
  },
  deer: {
    name: "deer",
    displayName: "Deer",
    hasFile: true,
    aliases: [],
    category: "resource",
  },
  boar: {
    name: "boar",
    displayName: "Boar",
    hasFile: true,
    aliases: [],
    category: "resource",
  },
  fish: {
    name: "fish",
    displayName: "Fish",
    hasFile: true,
    aliases: [],
    category: "resource",
  },
  relic: {
    name: "relic",
    displayName: "Relic",
    hasFile: true,
    aliases: ["relics"],
    category: "resource",
  },
  sacred_site: {
    name: "sacred_site",
    displayName: "Sacred Site",
    hasFile: true,
    aliases: ["sacred_sites", "ss"],
    category: "resource",
  },

  // ============================================================================
  // AGES
  // ============================================================================
  dark_age: {
    name: "dark_age",
    displayName: "Dark Age",
    hasFile: true,
    aliases: ["age_1", "age1"],
    category: "age",
  },
  feudal_age: {
    name: "feudal_age",
    displayName: "Feudal Age",
    hasFile: true,
    aliases: ["age_2", "age2", "feudal"],
    category: "age",
  },
  castle_age: {
    name: "castle_age",
    displayName: "Castle Age",
    hasFile: true,
    aliases: ["age_3", "age3", "castle"],
    category: "age",
  },
  imperial_age: {
    name: "imperial_age",
    displayName: "Imperial Age",
    hasFile: true,
    aliases: ["age_4", "age4", "imperial"],
    category: "age",
  },

  // ============================================================================
  // GENERIC UNITS
  // ============================================================================
  villager: {
    name: "villager",
    displayName: "Villager",
    hasFile: true,
    aliases: ["vill", "vills", "worker"],
    category: "unit",
  },
  scout: {
    name: "scout",
    displayName: "Scout",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  spearman: {
    name: "spearman",
    displayName: "Spearman",
    hasFile: true,
    aliases: ["spear", "spears"],
    category: "unit",
  },
  pikeman: {
    name: "pikeman",
    displayName: "Pikeman",
    hasFile: true,
    aliases: ["pike", "pikes"],
    category: "unit",
  },
  man_at_arms: {
    name: "man_at_arms",
    displayName: "Man-at-Arms",
    hasFile: true,
    aliases: ["maa", "manatarms", "man_at_arm"],
    category: "unit",
  },
  archer: {
    name: "archer",
    displayName: "Archer",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  crossbowman: {
    name: "crossbowman",
    displayName: "Crossbowman",
    hasFile: true,
    aliases: ["xbow", "xb", "crossbow"],
    category: "unit",
  },
  handcannoneer: {
    name: "handcannoneer",
    displayName: "Handcannoneer",
    hasFile: true,
    aliases: ["hc", "handcannon"],
    category: "unit",
  },
  horseman: {
    name: "horseman",
    displayName: "Horseman",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  knight: {
    name: "knight",
    displayName: "Knight",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  lancer: {
    name: "lancer",
    displayName: "Lancer",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  monk: {
    name: "monk",
    displayName: "Monk",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  trader: {
    name: "trader",
    displayName: "Trader",
    hasFile: true,
    aliases: [],
    category: "unit",
  },

  // Siege
  ram: {
    name: "ram",
    displayName: "Battering Ram",
    hasFile: true,
    aliases: ["battering_ram"],
    category: "unit",
  },
  mangonel: {
    name: "mangonel",
    displayName: "Mangonel",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  springald: {
    name: "springald",
    displayName: "Springald",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  trebuchet: {
    name: "trebuchet",
    displayName: "Trebuchet",
    hasFile: true,
    aliases: ["treb"],
    category: "unit",
  },
  bombard: {
    name: "bombard",
    displayName: "Bombard",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  culverin: {
    name: "culverin",
    displayName: "Culverin",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  ribauldequin: {
    name: "ribauldequin",
    displayName: "Ribauldequin",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  siege_tower: {
    name: "siege_tower",
    displayName: "Siege Tower",
    hasFile: true,
    aliases: [],
    category: "unit",
  },

  // ============================================================================
  // CIV-SPECIFIC UNITS
  // ============================================================================

  // English
  longbowman: {
    name: "longbowman",
    displayName: "Longbowman",
    hasFile: false,
    aliases: ["lb", "longbow"],
    category: "unit",
  },
  king: {
    name: "king",
    displayName: "King",
    hasFile: true,
    aliases: [],
    category: "unit",
  },

  // French
  royal_knight: {
    name: "royal_knight",
    displayName: "Royal Knight",
    hasFile: false,
    aliases: ["rk", "royalknight"],
    category: "unit",
  },
  arbaletrier: {
    name: "arbaletrier",
    displayName: "Arbaletrier",
    hasFile: false,
    aliases: [],
    category: "unit",
  },

  // HRE
  landsknecht: {
    name: "landsknecht",
    displayName: "Landsknecht",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  prelate: {
    name: "prelate",
    displayName: "Prelate",
    hasFile: true,
    aliases: [],
    category: "unit",
  },

  // Rus
  streltsy: {
    name: "streltsy",
    displayName: "Streltsy",
    hasFile: false,
    aliases: [],
    category: "unit",
  },
  warrior_monk: {
    name: "warrior_monk",
    displayName: "Warrior Monk",
    hasFile: false,
    aliases: ["warriormonk"],
    category: "unit",
  },
  horse_archer: {
    name: "horse_archer",
    displayName: "Horse Archer",
    hasFile: false,
    aliases: ["horsearcher"],
    category: "unit",
  },

  // Chinese
  zhuge_nu: {
    name: "zhuge_nu",
    displayName: "Zhuge Nu",
    hasFile: true,
    aliases: ["zhugenu"],
    category: "unit",
  },
  fire_lancer: {
    name: "fire_lancer",
    displayName: "Fire Lancer",
    hasFile: true,
    aliases: ["firelancer"],
    category: "unit",
  },
  grenadier: {
    name: "grenadier",
    displayName: "Grenadier",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  nest_of_bees: {
    name: "nest_of_bees",
    displayName: "Nest of Bees",
    hasFile: true,
    aliases: ["nestofbees", "nob"],
    category: "unit",
  },
  imperial_official: {
    name: "imperial_official",
    displayName: "Imperial Official",
    hasFile: true,
    aliases: ["io", "imperialofficial"],
    category: "unit",
  },
  palace_guard: {
    name: "palace_guard",
    displayName: "Palace Guard",
    hasFile: true,
    aliases: ["palaceguard"],
    category: "unit",
  },

  // Mongols
  mangudai: {
    name: "mangudai",
    displayName: "Mangudai",
    hasFile: true,
    aliases: ["mg"],
    category: "unit",
  },
  keshik: {
    name: "keshik",
    displayName: "Keshik",
    hasFile: true,
    aliases: ["kb"],
    category: "unit",
  },
  khan: {
    name: "khan",
    displayName: "Khan",
    hasFile: true,
    aliases: [],
    category: "unit",
  },

  // Delhi
  scholar: {
    name: "scholar",
    displayName: "Scholar",
    hasFile: false,
    aliases: [],
    category: "unit",
  },
  war_elephant: {
    name: "war_elephant",
    displayName: "War Elephant",
    hasFile: false,
    aliases: ["warelephant"],
    category: "unit",
  },
  tower_elephant: {
    name: "tower_elephant",
    displayName: "Tower Elephant",
    hasFile: false,
    aliases: ["towerelephant"],
    category: "unit",
  },

  // Abbasid
  camel_rider: {
    name: "camel_rider",
    displayName: "Camel Rider",
    hasFile: false,
    aliases: ["camelrider"],
    category: "unit",
  },
  camel_archer: {
    name: "camel_archer",
    displayName: "Camel Archer",
    hasFile: false,
    aliases: ["camelarcher"],
    category: "unit",
  },

  // Ottomans
  janissary: {
    name: "janissary",
    displayName: "Janissary",
    hasFile: false,
    aliases: [],
    category: "unit",
  },
  sipahi: {
    name: "sipahi",
    displayName: "Sipahi",
    hasFile: false,
    aliases: [],
    category: "unit",
  },
  mehter: {
    name: "mehter",
    displayName: "Mehter",
    hasFile: false,
    aliases: [],
    category: "unit",
  },
  great_bombard: {
    name: "great_bombard",
    displayName: "Great Bombard",
    hasFile: false,
    aliases: ["greatbombard"],
    category: "unit",
  },

  // Japanese
  samurai: {
    name: "samurai",
    displayName: "Samurai",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  shinobi: {
    name: "shinobi",
    displayName: "Shinobi",
    hasFile: true,
    aliases: [],
    category: "unit",
  },
  onna_bugeisha: {
    name: "onna_bugeisha",
    displayName: "Onna-Bugeisha",
    hasFile: true,
    aliases: ["onnabugeisha"],
    category: "unit",
  },
  ozutsu: {
    name: "ozutsu",
    displayName: "Ozutsu",
    hasFile: true,
    aliases: [],
    category: "unit",
  },

  // ============================================================================
  // BUILDINGS - ECONOMY
  // ============================================================================
  house: {
    name: "house",
    displayName: "House",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  mill: {
    name: "mill",
    displayName: "Mill",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  lumber_camp: {
    name: "lumber_camp",
    displayName: "Lumber Camp",
    hasFile: true,
    aliases: ["lc", "lumbercamp"],
    category: "building",
  },
  mining_camp: {
    name: "mining_camp",
    displayName: "Mining Camp",
    hasFile: true,
    aliases: ["mc", "miningcamp"],
    category: "building",
  },
  farm: {
    name: "farm",
    displayName: "Farm",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  market: {
    name: "market",
    displayName: "Market",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  dock: {
    name: "dock",
    displayName: "Dock",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  town_center: {
    name: "town_center",
    displayName: "Town Center",
    hasFile: true,
    aliases: ["tc", "towncenter"],
    category: "building",
  },

  // BUILDINGS - MILITARY
  barracks: {
    name: "barracks",
    displayName: "Barracks",
    hasFile: true,
    aliases: ["rax"],
    category: "building",
  },
  archery_range: {
    name: "archery_range",
    displayName: "Archery Range",
    hasFile: true,
    aliases: ["ar", "archeryrange"],
    category: "building",
  },
  stable: {
    name: "stable",
    displayName: "Stable",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  siege_workshop: {
    name: "siege_workshop",
    displayName: "Siege Workshop",
    hasFile: true,
    aliases: ["sw", "siegeworkshop"],
    category: "building",
  },
  blacksmith: {
    name: "blacksmith",
    displayName: "Blacksmith",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  monastery: {
    name: "monastery",
    displayName: "Monastery",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  university: {
    name: "university",
    displayName: "University",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  keep: {
    name: "keep",
    displayName: "Keep",
    hasFile: true,
    aliases: [],
    category: "building",
  },
  outpost: {
    name: "outpost",
    displayName: "Outpost",
    hasFile: true,
    aliases: [],
    category: "building",
  },

  // ============================================================================
  // LANDMARKS
  // ============================================================================

  // English
  council_hall: {
    name: "council_hall",
    displayName: "Council Hall",
    hasFile: true,
    aliases: ["councilhall"],
    category: "landmark",
  },
  abbey_of_kings: {
    name: "abbey_of_kings",
    displayName: "Abbey of Kings",
    hasFile: false,
    aliases: ["abbeyofkings"],
    category: "landmark",
  },
  white_tower: {
    name: "white_tower",
    displayName: "White Tower",
    hasFile: true,
    aliases: ["whitetower"],
    category: "landmark",
  },

  // French
  school_of_cavalry: {
    name: "school_of_cavalry",
    displayName: "School of Cavalry",
    hasFile: true,
    aliases: ["schoolofcavalry"],
    category: "landmark",
  },
  chamber_of_commerce: {
    name: "chamber_of_commerce",
    displayName: "Chamber of Commerce",
    hasFile: false,
    aliases: ["chamberofcommerce"],
    category: "landmark",
  },
  guild_hall: {
    name: "guild_hall",
    displayName: "Guild Hall",
    hasFile: false,
    aliases: ["guildhall"],
    category: "landmark",
  },
  red_palace: {
    name: "red_palace",
    displayName: "Red Palace",
    hasFile: false,
    aliases: ["redpalace"],
    category: "landmark",
  },
  college_of_artillery: {
    name: "college_of_artillery",
    displayName: "College of Artillery",
    hasFile: false,
    aliases: ["collegeofartillery"],
    category: "landmark",
  },

  // HRE
  aachen_chapel: {
    name: "aachen_chapel",
    displayName: "Aachen Chapel",
    hasFile: true,
    aliases: ["aachenchapel"],
    category: "landmark",
  },
  meinwerk_palace: {
    name: "meinwerk_palace",
    displayName: "Meinwerk Palace",
    hasFile: true,
    aliases: ["meinwerkpalace"],
    category: "landmark",
  },
  regnitz_cathedral: {
    name: "regnitz_cathedral",
    displayName: "Regnitz Cathedral",
    hasFile: true,
    aliases: ["regnitzcathedral"],
    category: "landmark",
  },

  // Chinese
  imperial_academy: {
    name: "imperial_academy",
    displayName: "Imperial Academy",
    hasFile: true,
    aliases: ["imperialacademy"],
    category: "landmark",
  },
  barbican_of_the_sun: {
    name: "barbican_of_the_sun",
    displayName: "Barbican of the Sun",
    hasFile: true,
    aliases: ["barbicanofthesun"],
    category: "landmark",
  },
  astronomical_clocktower: {
    name: "astronomical_clocktower",
    displayName: "Astronomical Clocktower",
    hasFile: true,
    aliases: ["astronomicalclocktower"],
    category: "landmark",
  },

  // Abbasid
  house_of_wisdom: {
    name: "house_of_wisdom",
    displayName: "House of Wisdom",
    hasFile: true,
    aliases: ["how", "houseofwisdom"],
    category: "landmark",
  },
  culture_wing: {
    name: "culture_wing",
    displayName: "Culture Wing",
    hasFile: true,
    aliases: ["culturewing"],
    category: "landmark",
  },
  economic_wing: {
    name: "economic_wing",
    displayName: "Economic Wing",
    hasFile: true,
    aliases: ["economicwing"],
    category: "landmark",
  },
  military_wing: {
    name: "military_wing",
    displayName: "Military Wing",
    hasFile: true,
    aliases: ["militarywing"],
    category: "landmark",
  },
  trade_wing: {
    name: "trade_wing",
    displayName: "Trade Wing",
    hasFile: true,
    aliases: ["tradewing"],
    category: "landmark",
  },

  // Mongols
  golden_gate: {
    name: "golden_gate",
    displayName: "The Golden Gate",
    hasFile: true,
    aliases: ["goldengate"],
    category: "landmark",
  },

  // ============================================================================
  // TECHNOLOGIES
  // ============================================================================
  wheelbarrow: {
    name: "wheelbarrow",
    displayName: "Wheelbarrow",
    hasFile: true,
    aliases: ["wb"],
    category: "technology",
  },
  professional_scouts: {
    name: "professional_scouts",
    displayName: "Professional Scouts",
    hasFile: true,
    aliases: ["proscouts", "pro_scouts"],
    category: "technology",
  },
  textiles: {
    name: "textiles",
    displayName: "Textiles",
    hasFile: true,
    aliases: [],
    category: "technology",
  },
  horticulture: {
    name: "horticulture",
    displayName: "Horticulture",
    hasFile: true,
    aliases: [],
    category: "technology",
  },
  fertilization: {
    name: "fertilization",
    displayName: "Fertilization",
    hasFile: true,
    aliases: [],
    category: "technology",
  },
  double_broadaxe: {
    name: "double_broadaxe",
    displayName: "Double Broadaxe",
    hasFile: true,
    aliases: ["doublebroadaxe"],
    category: "technology",
  },
  forestry: {
    name: "forestry",
    displayName: "Forestry",
    hasFile: true,
    aliases: [],
    category: "technology",
  },
  survival_techniques: {
    name: "survival_techniques",
    displayName: "Survival Techniques",
    hasFile: true,
    aliases: ["survivaltechniques"],
    category: "technology",
  },
  bloomery: {
    name: "bloomery",
    displayName: "Bloomery",
    hasFile: true,
    aliases: [],
    category: "technology",
  },

  // ============================================================================
  // OTHER
  // ============================================================================
  upgrade: {
    name: "upgrade",
    displayName: "Upgrade",
    hasFile: true,
    aliases: ["tech", "technology"],
    category: "other",
  },
  attack: {
    name: "attack",
    displayName: "Attack",
    hasFile: true,
    aliases: [],
    category: "other",
  },
  rally: {
    name: "rally",
    displayName: "Rally",
    hasFile: true,
    aliases: [],
    category: "other",
  },
  time: {
    name: "time",
    displayName: "Time",
    hasFile: true,
    aliases: [],
    category: "other",
  },
  landmark: {
    name: "landmark",
    displayName: "Landmark",
    hasFile: true,
    aliases: [],
    category: "other",
  },
};

// ============================================================================
// Build reverse lookup maps for performance
// ============================================================================

const ALIAS_MAP: Record<string, string> = {};

// Build alias map from registry
for (const [canonical, entry] of Object.entries(ICON_REGISTRY)) {
  for (const alias of entry.aliases) {
    ALIAS_MAP[alias.toLowerCase()] = canonical;
  }
}

// Age aliases need special handling (age_1 -> dark_age, not age)
const AGE_MAP: Record<string, string> = {
  age_1: "dark_age",
  age1: "dark_age",
  age_2: "feudal_age",
  age2: "feudal_age",
  age_3: "castle_age",
  age3: "castle_age",
  age_4: "imperial_age",
  age4: "imperial_age",
};

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Normalize an icon name to its canonical form.
 * Handles version suffixes, separators, case, aliases, and civ-specific variants.
 */
export function normalizeIconName(rawName: string): string {
  if (!rawName) return "";

  // Step 1: Trim and lowercase
  let name = rawName.trim().toLowerCase();

  // Step 2: Normalize whitespace to underscores
  name = name.replace(/\s+/g, "_");

  // Step 3: Check for age patterns BEFORE stripping suffixes
  if (AGE_MAP[name]) {
    return AGE_MAP[name];
  }

  // Step 4: Convert hyphens to underscores
  name = name.replace(/-/g, "_");

  // Step 5: Strip version suffixes (-1, -2, _3, etc.) but NOT age numbers
  // Only strip if it's at the end and preceded by non-digit
  name = name.replace(/(?<=\D)_?\d+$/, "");

  // Step 6: Check for civ-prefixed villagers
  if (name.startsWith("villager_") && name !== "villager") {
    return "villager";
  }

  // Step 7: Check alias map (handles things like "maa" -> "man_at_arms")
  if (ALIAS_MAP[name]) {
    return ALIAS_MAP[name];
  }

  // Step 8: Check if it's already a canonical name in registry
  if (ICON_REGISTRY[name]) {
    return name;
  }

  // Step 9: Try removing all underscores for compound name lookup
  const compactName = name.replace(/_/g, "");
  if (ALIAS_MAP[compactName]) {
    return ALIAS_MAP[compactName];
  }

  // Step 10: Return as-is (preserves unknown names in normalized form)
  return name;
}

/**
 * Get the human-readable display name for an icon.
 * Normalizes input first, then looks up in registry.
 */
export function getIconDisplayName(rawName: string): string {
  const canonical = normalizeIconName(rawName);

  if (ICON_REGISTRY[canonical]) {
    return ICON_REGISTRY[canonical].displayName;
  }

  // Generate display name from normalized name
  return canonical
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Check if we have an icon file for this icon.
 * Used to determine if we should render an icon or fall back to text.
 */
export function hasIconFile(rawName: string): boolean {
  const canonical = normalizeIconName(rawName);
  return ICON_REGISTRY[canonical]?.hasFile ?? false;
}

/**
 * Get the full icon entry from the registry.
 * Returns undefined if not found.
 */
export function getIconEntry(rawName: string): IconEntry | undefined {
  const canonical = normalizeIconName(rawName);
  return ICON_REGISTRY[canonical];
}

/**
 * Get all aliases for a canonical icon name.
 */
export function getIconAliases(canonicalName: string): string[] {
  return ICON_REGISTRY[canonicalName]?.aliases ?? [];
}
