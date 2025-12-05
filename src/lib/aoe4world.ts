// AoE4World API Service
import type {
  PlayerProfile,
  PlayerSearchResponse,
  PlayerGamesResponse,
  LeaderboardResponse,
} from "@/types";

const API_BASE = "https://aoe4world.com/api/v0";

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
