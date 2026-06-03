export interface Resources {
  food?: number;
  wood?: number;
  gold?: number;
  stone?: number;
  villagers?: number; // Total villager count
  builders?: number; // Builders for current building/landmark
}

export interface BuildOrderStep {
  id: string;
  description: string;
  timing?: string;
  resources?: Resources;
}

export type BuildOrderSourceType =
  | "bundled"
  | "aoe4world"
  | "aoe4guides"
  | "rtsbuilds"
  | "age4builder"
  | "manual";

export interface BuildOrderSourceMetadata {
  type: BuildOrderSourceType;
  url?: string;
  importedAt?: string;
  updatedAt?: string;
  rawCivilization?: string;
}

export interface BuildOrderBranch {
  id: string;
  name: string;
  trigger?: string;
  startStepIndex: number; // 0-based index in the base build where this branch begins
  steps: BuildOrderStep[];
}

export interface BuildOrder {
  id: string;
  name: string;
  civilization: Civilization;
  description: string;
  difficulty: Difficulty;
  steps: BuildOrderStep[];
  enabled: boolean;
  pinned?: boolean;
  favorite?: boolean;
  branches?: BuildOrderBranch[];
  source?: BuildOrderSourceMetadata;
  contentVersion?: string;
  warnings?: string[];
}

export type Civilization =
  | "English"
  | "French"
  | "Holy Roman Empire"
  | "Rus"
  | "Chinese"
  | "Delhi Sultanate"
  | "Abbasid Dynasty"
  | "Mongols"
  | "Ottomans"
  | "Malians"
  | "Byzantines"
  | "Japanese"
  | "Jeanne d'Arc"
  | "Ayyubids"
  | "Zhu Xi's Legacy"
  | "Order of the Dragon"
  // Dynasties of the East DLC
  | "Golden Horde"
  | "Macedonian Dynasty"
  | "Sengoku Daimyo"
  | "Tughlaq Dynasty"
  // Knights of Cross and Rose / Yue Fei's Legacy
  | "Knights Templar"
  | "House of Lancaster"
  | "Jin Dynasty"
  // Preserve unrecognized source data without silently rewriting to English.
  | (string & {});

export const CONTENT_BASELINE_VERSION = "2026-05-07";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export const CIVILIZATIONS: Civilization[] = [
  "English",
  "French",
  "Holy Roman Empire",
  "Rus",
  "Chinese",
  "Delhi Sultanate",
  "Abbasid Dynasty",
  "Mongols",
  "Ottomans",
  "Malians",
  "Byzantines",
  "Japanese",
  "Jeanne d'Arc",
  "Ayyubids",
  "Zhu Xi's Legacy",
  "Order of the Dragon",
  // Dynasties of the East DLC
  "Golden Horde",
  "Macedonian Dynasty",
  "Sengoku Daimyo",
  "Tughlaq Dynasty",
  "Knights Templar",
  "House of Lancaster",
  "Jin Dynasty",
];

export const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced", "Expert"];
