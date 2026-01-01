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
import { BuildOrderSchema } from "@/types";
import { z } from "zod";
import { sanitizeTiming } from "@/stores/timerStore";
import { IntelligentConverter } from "./intelligentConverter";

const API_BASE = "https://aoe4world.com/api/v0";

// Maximum allowed steps in a build order to prevent performance issues
export const MAX_BUILD_ORDER_STEPS = 200;
const buildCache = new Map<number, BuildOrder>();

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

class Aoe4WorldApi {
  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetchWithTimeout(`${API_BASE}${endpoint}`);

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
    const response = await this.getLeaderboard(leaderboard, { profile_id: profileId, limit: 1 });
    return response.data[0]?.rank ?? null;
  }

  /**
   * Attempt to find an ongoing match for a player
   */
  async getLiveMatch(profileId: number) {
    const response = await this.getPlayerGames(profileId, { limit: 1 });
    const lastGame = response.data?.[0];

    if (lastGame && lastGame.ongoing) {
      return lastGame;
    }
    return null;
  }
}

export const aoe4worldApi = new Aoe4WorldApi();

// ============================================================================
// Build Order Import
// ============================================================================

// AoE4World Build API response schema
const Aoe4WorldBuildStepSchema = z.object({
  id: z.number().optional(),
  position: z.number().optional(),
  description: z.string().min(1),
  time: z.union([z.string(), z.number()]).nullable().optional(),
  food: z.number().optional(),
  wood: z.number().optional(),
  gold: z.number().optional(),
  stone: z.number().optional(),
  population: z.number().optional(),
  villagers: z.number().optional(),
});

const Aoe4WorldBuildSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  civilization: z.string(),
  author: z.object({ name: z.string().optional(), profile_id: z.number().optional() }).optional(),
  difficulty: z.string().optional(),
  steps: z.array(Aoe4WorldBuildStepSchema).min(1),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  views: z.number().optional(),
  likes: z.number().optional(),
});

type Aoe4WorldBuild = z.infer<typeof Aoe4WorldBuildSchema>;

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
  // Dynasties of the East DLC
  golden_horde: "Golden Horde",
  goldenhorde: "Golden Horde",
  macedonian_dynasty: "Macedonian Dynasty",
  macedoniandynasty: "Macedonian Dynasty",
  macedonian: "Macedonian Dynasty",
  sengoku_daimyo: "Sengoku Daimyo",
  sengokudaimyo: "Sengoku Daimyo",
  sengoku: "Sengoku Daimyo",
  tughlaq_dynasty: "Tughlaq Dynasty",
  tughlaqdynasty: "Tughlaq Dynasty",
  tughlaq: "Tughlaq Dynasty",
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

  // Reject clearly wrong domains to provide actionable feedback
  if (/https?:\/\//i.test(cleanUrl) && !/aoe4world\.com/i.test(cleanUrl)) {
    return null;
  }

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
  const timingStr = sanitizeTiming(timing.toString());
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

  const intelligentConverter = new IntelligentConverter();

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
    if (step.food || step.wood || step.gold || step.stone || step.villagers || step.population) {
      ourStep.resources = {};
      if (step.food) ourStep.resources.food = step.food;
      if (step.wood) ourStep.resources.wood = step.wood;
      if (step.gold) ourStep.resources.gold = step.gold;
      if (step.stone) ourStep.resources.stone = step.stone;
      if (step.villagers) ourStep.resources.villagers = step.villagers;
      if (step.population) ourStep.resources.builders = step.population; // Map population to builders as a fallback if explicit builders not available
    }

    return intelligentConverter.processStep(ourStep, index);
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

  const converted = BuildOrderSchema.parse({
    id: `aoe4world-${build.id}`,
    name: build.title || "Imported Build",
    civilization: normalizeCivilization(build.civilization) as Civilization,
    description: descParts.join(". "),
    difficulty: normalizeDifficulty(build.difficulty),
    enabled: true,
    steps,
  });

  return converted as unknown as BuildOrder;
}

/**
 * Fetch a build order from AoE4World API
 */
export async function fetchAoe4WorldBuild(buildId: number): Promise<BuildOrder> {
  const apiUrl = `${API_BASE}/builds/${buildId}`;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchWithTimeout(apiUrl, 5000);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Build #${buildId} not found on aoe4world.com`);
        }
        throw new Error(`Failed to fetch build: ${response.status} ${response.statusText}`);
      }

      const raw = await response.json();
      const data = Aoe4WorldBuildSchema.parse(raw);
      const converted = convertBuild(data);
      buildCache.set(buildId, converted);
      return converted;
    } catch (error) {
      lastError = error;
      // Don't retry on 404s or validation errors
      if (error instanceof Error && (
        error.message.includes("not found") ||
        error.message.includes("Build order exceeds") ||
        error instanceof z.ZodError // Validation errors
      )) {
        break;
      }
      // Retry on network/timeouts
      if (attempt < 2) continue;
    }
  }

  if (buildCache.has(buildId)) {
    console.warn(`Using cached aoe4world build #${buildId} due to fetch failure.`);
    return buildCache.get(buildId)!;
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Failed to fetch build from aoe4world.com");
}

/**
 * Import a build order from an AoE4World URL or ID
 */
export async function importAoe4WorldBuild(urlOrId: string): Promise<BuildOrder> {
  const buildId = extractBuildId(urlOrId);

  if (!buildId) {
    throw new Error(
      "Invalid AoE4World link. Use a URL like https://aoe4world.com/builds/123 or just the numeric ID."
    );
  }

  try {
    return await fetchAoe4WorldBuild(buildId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Received unexpected build data from aoe4world.com");
    }
    throw error;
  }
}
