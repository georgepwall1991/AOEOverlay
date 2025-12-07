import type { Civilization } from "@/types";

export interface MatchupEntry {
  civ: Civilization;
  opponent: Civilization;
  threats: string[];
  responses: string[];
  scoutFor: string[];
  counterTips?: string[];
  dangerTimers?: string[];
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
      "House at 0:45, second at 1:25 to avoid block",
      "Council Hall up by ~2:30; first longbows at ~4:20",
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
      "House before 0:45 to dodge supply block",
      "First knight at ~4:20; pressure before mass longbows",
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
      "First house at 0:40; second by 1:20",
      "Grab relics by 7:00 to keep eco safe",
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
      "Ger + House before 0:50",
      "Punish Song landmark before ~4:00 if possible",
    ],
  },
];


