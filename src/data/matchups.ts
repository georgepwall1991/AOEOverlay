import type { Civilization } from "@/types";

export interface MatchupEntry {
  civ: Civilization;
  opponent: Civilization | "Any";
  threats: string[];
  responses: string[];
  scoutFor: string[];
  counterTips?: string[];
  dangerTimers?: { time: string; message: string }[];
}

export const MATCHUPS: MatchupEntry[] = [
  {
    civ: "English",
    opponent: "French",
    threats: ["Royal Knights at ~4:30", "Fast trade boom on open maps"],
    responses: [
      "Open Spearmen as first military",
      "Wall choke points early; tower gold if exposed",
      "Delay archers until you see no knights",
    ],
    scoutFor: [
      "Early stable → knight timing",
      "Second TC vs all-in",
      "Market + traders heading to corners",
    ],
    counterTips: [
      "2-3 Spearmen on gold; pull vills behind houses",
      "Add blacksmith armor before first big fight",
      "Use outpost + arrow slits on exposed deer/gold",
    ],
    dangerTimers: [
      { time: "0:45", message: "First house due" },
      { time: "1:25", message: "Second house due" },
      { time: "2:30", message: "Council Hall target" },
      { time: "4:20", message: "First longbows window" },
    ],
  },
  {
    civ: "French",
    opponent: "English",
    threats: ["Longbow rush around 5:00", "Defensive booms behind walls"],
    responses: [
      "Open early stable and harass farms",
      "Add early armor upgrades for knights",
      "Pressure forward barracks or towers",
    ],
    scoutFor: [
      "Forward barracks placement",
      "Early wheelbarrow/farm count",
      "Double range transition",
    ],
    counterTips: [
      "Open school of cavalry; raid farms to slow longbows",
      "Armor upgrade early; mix in a few archers vs spears",
      "Tower your gold if barracks is forward",
    ],
    dangerTimers: [
      { time: "0:45", message: "House due" },
      { time: "4:20", message: "First knight window" },
    ],
  },
  {
    civ: "Holy Roman Empire",
    opponent: "French",
    threats: ["Knight pressure before relics", "Castle timing denial"],
    responses: [
      "Spearmen wall around relic paths",
      "Fast Castle with early barracks support",
      "Drop outpost near forward gold",
    ],
    scoutFor: [
      "Stable timing",
      "TC idle → punish with relic control",
      "Forward towers or battering rams",
    ],
    counterTips: [
      "Early spears + walls on relic routes",
      "Prelate on gold; age safely then drop barracks",
      "Prioritize armor upgrades; deny knights on relics",
    ],
    dangerTimers: [
      { time: "0:40", message: "First house due" },
      { time: "1:20", message: "Second house due" },
      { time: "7:00", message: "Relic window active" },
    ],
  },
  {
    civ: "Mongols",
    opponent: "Chinese",
    threats: ["Song boom with double TC", "Zhuge Nu timing"],
    responses: [
      "Deny Song TC with early tower/ram",
      "Raid with horsemen to slow food eco",
      "Add armor upgrades early",
    ],
    scoutFor: [
      "Greedy mill/village placements",
      "Barbican placement for pathing",
      "Second TC timing",
    ],
    counterTips: [
      "Tower or ram Barbican if placed aggressively",
      "Horsemen raid to slow food; deny villager pulls",
      "Match Song boom with pressure; avoid late fight",
    ],
    dangerTimers: [
      { time: "0:50", message: "Ger + House due" },
      { time: "4:00", message: "Song Landmark window" },
    ],
  },
  {
    civ: "Abbasid Dynasty",
    opponent: "English",
    threats: ["Longbow containment", "White Tower drops"],
    responses: [
      "Horsemen + Phalanx upgrade",
      "Multiple TCs to out-scale",
      "Research Siege Engineering",
    ],
    scoutFor: [
      "Forward Council Hall",
      "Stone mining for 2nd TC",
      "Kings Palace timing",
    ],
    counterTips: [
      "Flank longbows with horsemen",
      "Don't fight under their TC fire",
      "Research Siege Engineering early",
    ],
    dangerTimers: [
      { time: "5:00", message: "Longbows arrive" },
      { time: "7:00", message: "Ram push potential" },
    ],
  },
  {
    civ: "Ottomans",
    opponent: "Any",
    threats: ["Free units from Military Schools", "Great Bombard late game"],
    responses: [
      "Kill Military Schools if exposed",
      "Wall early to stop raids",
    ],
    scoutFor: [
      "Blacksmith placement (landmarks)",
      "Military school count",
      "Vizier Point progression",
    ],
    counterTips: [
      "Snipe Mehter drums first",
      "Spread units vs Mangonels",
      "Don't let them mass Janissaries",
    ],
    dangerTimers: [
      { time: "2:30", message: "Spear raid window" },
      { time: "5:30", message: "Feudal push window" },
    ],
  },
];