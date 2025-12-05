export interface Resources {
  food?: number;
  wood?: number;
  gold?: number;
  stone?: number;
}

export interface BuildOrderStep {
  id: string;
  description: string;
  timing?: string;
  resources?: Resources;
}

export interface BuildOrder {
  id: string;
  name: string;
  civilization: Civilization;
  description: string;
  difficulty: Difficulty;
  steps: BuildOrderStep[];
  enabled: boolean;
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
  | "Order of the Dragon";

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
];

export const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced", "Expert"];
