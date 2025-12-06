// AoE4World API Service
import type {
  PlayerProfile,
  PlayerSearchResponse,
  PlayerGamesResponse,
  LeaderboardResponse,
  BuildOrder,
  BuildOrderStep,
  Civilization,
  Difficulty,
} from "@/types";

const API_BASE = "https://aoe4world.com/api/v0";

// Maximum allowed steps in a build order to prevent performance issues
export const MAX_BUILD_ORDER_STEPS = 200;

class Aoe4WorldApi {
  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`AoE4World API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for players by name
   */
  async searchPlayers(query: string, limit = 10): Promise<PlayerSearchResponse> {
    const encoded = encodeURIComponent(query);
    return this.fetch<PlayerSearchResponse>(`/players/search?query=${encoded}&limit=${limit}`);
  }

  /**
   * Get player profile and stats by profile ID
   */
  async getPlayer(profileId: number): Promise<PlayerProfile> {
    return this.fetch<PlayerProfile>(`/players/${profileId}`);
  }

  /**
   * Get player's recent games
   */
  async getPlayerGames(
    profileId: number,
    options?: {
      leaderboard?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PlayerGamesResponse> {
    const params = new URLSearchParams();
    if (options?.leaderboard) params.set("leaderboard", options.leaderboard);
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());

    const query = params.toString();
    return this.fetch<PlayerGamesResponse>(
      `/players/${profileId}/games${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(
    leaderboard: string = "rm_solo",
    options?: {
      limit?: number;
      offset?: number;
      profile_id?: number;
    }
  ): Promise<LeaderboardResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());
    if (options?.profile_id) params.set("profile_id", options.profile_id.toString());

    const query = params.toString();
    return this.fetch<LeaderboardResponse>(
      `/leaderboards/${leaderboard}${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get player rank in a specific leaderboard
   */
  async getPlayerRank(profileId: number, leaderboard: string = "rm_solo"): Promise<number | null> {
    try {
      const response = await this.getLeaderboard(leaderboard, { profile_id: profileId, limit: 1 });
      return response.data[0]?.rank ?? null;
    } catch {
      return null;
    }
  }
}

export const aoe4worldApi = new Aoe4WorldApi();

// ============================================================================
// Build Order Import
// ============================================================================

// AoE4World Build API response types
interface Aoe4WorldBuildStep {
  id: number;
  position: number;
  description: string;
  time?: string | number | null;
  food?: number;
  wood?: number;
  gold?: number;
  stone?: number;
  population?: number;
  villagers?: number;
}

interface Aoe4WorldBuild {
  id: number;
  title: string;
  description?: string;
  civilization: string;
  author?: {
    name: string;
    profile_id?: number;
  };
  difficulty?: string;
  steps: Aoe4WorldBuildStep[];
  created_at?: string;
  updated_at?: string;
  views?: number;
  likes?: number;
}

// Civilization name mapping from API format to our format
const CIVILIZATION_MAP: Record<string, Civilization> = {
  english: "English",
  french: "French",
  hre: "Holy Roman Empire",
  holy_roman_empire: "Holy Roman Empire",
  rus: "Rus",
  chinese: "Chinese",
  delhi: "Delhi Sultanate",
  delhi_sultanate: "Delhi Sultanate",
  abbasid: "Abbasid Dynasty",
  abbasid_dynasty: "Abbasid Dynasty",
  mongols: "Mongols",
  ottomans: "Ottomans",
  malians: "Malians",
  byzantines: "Byzantines",
  japanese: "Japanese",
  jeanne_darc: "Jeanne d'Arc",
  ayyubids: "Ayyubids",
  zhu_xi: "Zhu Xi's Legacy",
  zhu_xis_legacy: "Zhu Xi's Legacy",
  order_of_the_dragon: "Order of the Dragon",
};

// Difficulty mapping
const DIFFICULTY_MAP: Record<string, Difficulty> = {
  beginner: "Beginner",
  easy: "Beginner",
  intermediate: "Intermediate",
  medium: "Intermediate",
  advanced: "Advanced",
  hard: "Advanced",
  expert: "Expert",
  very_hard: "Expert",
};

/**
 * Extract build ID from an aoe4world.com URL
 * Supports formats:
 * - https://aoe4world.com/builds/123
 * - https://aoe4world.com/builds/123-my-build-name
 * - aoe4world.com/builds/123
 * - Just the ID: 123
 */
export function extractBuildId(url: string): number | null {
  const cleanUrl = url.trim();

  // Match patterns for build URLs
  const patterns = [
    /aoe4world\.com\/builds\/(\d+)/i,
    /^(\d+)$/, // Just the ID
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Normalize civilization name from API to our format
 * Logs a warning if civilization is unknown and falls back to English
 */
function normalizeCivilization(civ: string): Civilization {
  const normalized = civ.toLowerCase().replace(/[\s-]+/g, "_");
  const mapped = CIVILIZATION_MAP[normalized];

  if (!mapped) {
    console.warn(
      `Unknown civilization "${civ}" from AoE4World API. ` +
      `Falling back to "English". Please report this if it's a valid civilization.`
    );
    return "English";
  }

  return mapped;
}

/**
 * Normalize difficulty from API to our format
 */
function normalizeDifficulty(diff?: string): Difficulty {
  if (!diff) return "Intermediate";
  const normalized = diff.toLowerCase().replace(/[\s-]+/g, "_");
  return DIFFICULTY_MAP[normalized] || "Intermediate";
}

/**
 * Format timing from various formats to mm:ss
 */
function formatBuildTiming(timing: string | number | null | undefined): string | undefined {
  if (timing === null || timing === undefined) return undefined;

  if (typeof timing === "number") {
    // Assume seconds
    const minutes = Math.floor(timing / 60);
    const seconds = timing % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // Already a string
  const timingStr = timing.toString().trim();
  if (!timingStr) return undefined;

  // Check if it's already in mm:ss format
  if (/^\d+:\d{2}$/.test(timingStr)) {
    return timingStr;
  }

  // Try to parse as seconds
  const seconds = parseInt(timingStr, 10);
  if (!isNaN(seconds)) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  return undefined;
}

/**
 * Convert AoE4World build to our format
 * @throws Error if the build order exceeds MAX_BUILD_ORDER_STEPS
 */
function convertBuild(build: Aoe4WorldBuild): BuildOrder {
  // Validate step count limit before processing
  if (build.steps.length > MAX_BUILD_ORDER_STEPS) {
    throw new Error(
      `Build order exceeds maximum of ${MAX_BUILD_ORDER_STEPS} steps ` +
      `(has ${build.steps.length}). Please choose a shorter build order.`
    );
  }

  const steps: BuildOrderStep[] = build.steps.map((step, index) => {
    const ourStep: BuildOrderStep = {
      id: `step-${step.position || index + 1}`,
      description: step.description || `Step ${step.position || index + 1}`,
    };

    // Add timing if available
    const timing = formatBuildTiming(step.time);
    if (timing) {
      ourStep.timing = timing;
    }

    // Add resources if any are set
    if (step.food || step.wood || step.gold || step.stone) {
      ourStep.resources = {};
      if (step.food) ourStep.resources.food = step.food;
      if (step.wood) ourStep.resources.wood = step.wood;
      if (step.gold) ourStep.resources.gold = step.gold;
      if (step.stone) ourStep.resources.stone = step.stone;
    }

    return ourStep;
  });

  // Build description from author info
  const descParts: string[] = [];
  if (build.description) {
    descParts.push(build.description);
  }
  descParts.push("Imported from aoe4world.com");
  if (build.author?.name) {
    descParts.push(`Author: ${build.author.name}`);
  }

  return {
    id: `aoe4world-${build.id}`,
    name: build.title || "Imported Build",
    civilization: normalizeCivilization(build.civilization),
    description: descParts.join(". "),
    difficulty: normalizeDifficulty(build.difficulty),
    enabled: true,
    steps,
  };
}

/**
 * Fetch a build order from AoE4World API
 */
export async function fetchAoe4WorldBuild(buildId: number): Promise<BuildOrder> {
  const apiUrl = `${API_BASE}/builds/${buildId}`;

  const response = await fetch(apiUrl, {
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Build #${buildId} not found on aoe4world.com`);
    }
    throw new Error(`Failed to fetch build: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as Aoe4WorldBuild;

  if (!data || !data.steps || data.steps.length === 0) {
    throw new Error("Build has no steps");
  }

  return convertBuild(data);
}

/**
 * Import a build order from an AoE4World URL or ID
 */
export async function importAoe4WorldBuild(urlOrId: string): Promise<BuildOrder> {
  const buildId = extractBuildId(urlOrId);

  if (!buildId) {
    throw new Error(
      "Invalid URL or ID. Please paste a link like: https://aoe4world.com/builds/123"
    );
  }

  return fetchAoe4WorldBuild(buildId);
}
