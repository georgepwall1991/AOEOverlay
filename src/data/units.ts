import { Civilization } from "@/types";

export type UnitCategory = "Infantry" | "Cavalry" | "Siege" | "Worker" | "Ship";

export interface Unit {
  id: string;
  name: string;
  icon: string;
  category: UnitCategory;
  civs: Civilization[] | "Any";
  hardCounters: string[]; // IDs of units that hard counter this unit
  softCounters: string[]; // IDs of units that soft counter this unit
  goodAgainst: string[]; // IDs of units this unit is good against
}

export const UNITS: Unit[] = [
  {
    id: "spearman",
    name: "Spearman",
    icon: "spearman",
    category: "Infantry",
    civs: "Any",
    hardCounters: ["archer", "crossbowman", "mangonel"],
    softCounters: ["man_at_arms"],
    goodAgainst: ["horseman", "knight", "lancer"],
  },
  {
    id: "man_at_arms",
    name: "Man-at-Arms",
    icon: "man_at_arms",
    category: "Infantry",
    civs: "Any",
    hardCounters: ["crossbowman", "mangonel", "knight"],
    softCounters: ["handcannoneer"],
    goodAgainst: ["spearman", "archer", "horseman"],
  },
  {
    id: "archer",
    name: "Archer",
    icon: "archer",
    category: "Infantry",
    civs: "Any",
    hardCounters: ["horseman", "mangonel", "man_at_arms"],
    softCounters: ["knight"],
    goodAgainst: ["spearman", "crossbowman"],
  },
  {
    id: "crossbowman",
    name: "Crossbowman",
    icon: "crossbowman",
    category: "Infantry",
    civs: "Any",
    hardCounters: ["horseman", "mangonel", "archer"],
    softCounters: ["knight"],
    goodAgainst: ["man_at_arms", "knight", "lancer"],
  },
  {
    id: "handcannoneer",
    name: "Handcannoneer",
    icon: "handcannoneer",
    category: "Infantry",
    civs: "Any",
    hardCounters: ["mangonel", "culverin", "horseman"],
    softCounters: ["knight"],
    goodAgainst: ["man_at_arms", "spearman", "archer"],
  },
  {
    id: "horseman",
    name: "Horseman",
    icon: "horseman",
    category: "Cavalry",
    civs: "Any",
    hardCounters: ["spearman", "knight", "man_at_arms"],
    softCounters: ["mangonel"],
    goodAgainst: ["archer", "crossbowman", "siege_units"],
  },
  {
    id: "knight",
    name: "Knight",
    icon: "knight",
    category: "Cavalry",
    civs: "Any",
    hardCounters: ["spearman", "crossbowman", "handcannoneer"],
    softCounters: ["man_at_arms"],
    goodAgainst: ["archer", "horseman", "man_at_arms"],
  },
  {
    id: "mangonel",
    name: "Mangonel",
    icon: "mangonel",
    category: "Siege",
    civs: "Any",
    hardCounters: ["springald", "culverin", "horseman"],
    softCounters: ["knight"],
    goodAgainst: ["archer", "crossbowman", "spearman", "handcannoneer"],
  },
  {
    id: "springald",
    name: "Springald",
    icon: "springald",
    category: "Siege",
    civs: "Any",
    hardCounters: ["culverin", "horseman", "knight"],
    softCounters: ["bombard"],
    goodAgainst: ["mangonel", "bombard", "trebuchet"],
  },
  {
    id: "bombard",
    name: "Bombard",
    icon: "bombard",
    category: "Siege",
    civs: "Any",
    hardCounters: ["springald", "culverin", "horseman", "knight"],
    softCounters: ["man_at_arms"],
    goodAgainst: ["buildings", "trebuchet"],
  },
];

export function getUnitById(id: string): Unit | undefined {
  return UNITS.find(u => u.id === id);
}
