// AoE4World API Types

export interface PlayerSearchResult {
  profile_id: number;
  name: string;
  country?: string;
  avatars?: {
    small?: string | null;
    medium?: string | null;
    full?: string | null;
  };
  last_game_at?: string;
  leaderboards?: Record<string, LeaderboardStats>;
}

export interface SeasonStats {
  rating: number;
  rank: number;
  rank_level: string;
  streak: number;
  games_count: number;
  wins_count: number;
  losses_count: number;
  disputes_count: number;
  drops_count: number;
  last_game_at?: string;
  win_rate: number;
  season: number;
}

export interface CivilizationStats {
  civilization: string;
  games_count: number;
  wins_count?: number;
  pick_rate: number;
  win_rate: number;
}

export interface RatingHistoryEntry {
  rating: number;
  streak: number;
  wins_count: number;
  drops_count: number;
  disputes_count: number;
  games_count: number;
}

export interface LeaderboardStats {
  rating: number;
  max_rating?: number;
  max_rating_7d?: number;
  max_rating_1m?: number;
  rank?: number;
  rank_level?: string | null;
  streak: number;
  games_count: number;
  wins_count: number;
  losses_count: number;
  disputes_count?: number;
  drops_count?: number;
  last_game_at?: string;
  win_rate: number;
  season?: number;
  rating_history?: Record<string, RatingHistoryEntry>;
  civilizations?: CivilizationStats[];
  previous_seasons?: SeasonStats[];
}

export interface PlayerModeStats {
  rating: number;
  max_rating?: number;
  max_rating_7d?: number;
  max_rating_1m?: number;
  rank?: number;
  rank_level?: string | null;
  streak: number;
  games_count: number;
  wins_count: number;
  losses_count: number;
  disputes_count?: number;
  drops_count?: number;
  win_rate: number;
  last_game_at?: string;
  season?: number;
  rating_history?: Record<string, RatingHistoryEntry>;
  civilizations?: CivilizationStats[];
  previous_seasons?: SeasonStats[];
}

export type GameMode =
  | "rm_solo"
  | "rm_team"
  | "rm_1v1_elo"
  | "rm_2v2_elo"
  | "rm_3v3_elo"
  | "rm_4v4_elo"
  | "qm_1v1"
  | "qm_2v2"
  | "qm_3v3"
  | "qm_4v4"
  | "qm_ffa";

export interface PlayerProfile {
  profile_id: number;
  name: string;
  country?: string;
  site_url?: string;
  steam_id?: string;
  avatars?: {
    small?: string | null;
    medium?: string | null;
    full?: string | null;
  };
  modes?: Partial<Record<GameMode, PlayerModeStats>>;
}

export interface PlayerGame {
  game_id: number;
  started_at: string;
  updated_at: string;
  duration: number;
  map: string;
  kind: string;
  leaderboard: string;
  rating_type: number;
  season: number;
  server?: string;
  patch?: number;
  ongoing?: boolean;
  teams: GameTeam[][];
}

export interface GameTeam {
  profile_id: number;
  name: string;
  result: "win" | "loss" | null;
  civilization: string;
  rating?: number;
  rating_diff?: number;
  mmr?: number;
  mmr_diff?: number;
  input_type?: string;
  country?: string;
}

export interface LeaderboardEntry {
  profile_id: number;
  name: string;
  rank: number;
  rating: number;
  max_rating: number;
  games_count: number;
  wins_count: number;
  losses_count: number;
  streak: number;
  last_game_at?: string;
  country?: string;
  rank_level?: string;
}

export interface LeaderboardResponse {
  count: number;
  data: LeaderboardEntry[];
}

export interface PlayerSearchResponse {
  count: number;
  total_count: number;
  players: PlayerSearchResult[];
}

export interface PlayerGamesResponse {
  count: number;
  data: PlayerGame[];
}

// Helper functions
export function formatRankLevel(rankLevel?: string | null): string {
  if (!rankLevel) return "Unranked";
  return rankLevel.split("_").map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
}

export function getRankTier(rankLevel?: string | null): string {
  if (!rankLevel) return "unranked";
  return rankLevel.split("_")[0].toLowerCase();
}

export function formatCivilization(civ: string): string {
  return civ.split("_").map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
}

export function getModeName(mode: string): string {
  const modeNames: Record<string, string> = {
    rm_solo: "Ranked 1v1",
    rm_team: "Ranked Team",
    rm_1v1_elo: "RM 1v1 ELO",
    rm_2v2_elo: "RM 2v2 ELO",
    rm_3v3_elo: "RM 3v3 ELO",
    rm_4v4_elo: "RM 4v4 ELO",
    qm_1v1: "QM 1v1",
    qm_2v2: "QM 2v2",
    qm_3v3: "QM 3v3",
    qm_4v4: "QM 4v4",
    qm_ffa: "QM FFA",
  };
  return modeNames[mode] || mode;
}
