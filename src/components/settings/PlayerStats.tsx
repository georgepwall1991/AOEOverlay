import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  RefreshCw,
  X,
  User,
  Trophy,
  Swords,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Crown,
  Flame,
  ChevronDown,
  ChevronUp,
  BarChart3,
  History,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayerStore, usePlayerWinRate } from "@/stores";
import { cn } from "@/lib/utils";
import {
  formatRankLevel,
  getRankTier,
  formatCivilization,
  getModeName,
  type PlayerModeStats,
  type SeasonStats,
  type RatingHistoryEntry,
} from "@/types/aoe4world";

// Mini sparkline chart component
function MiniChart({ data, color = "primary" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 100;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const colorClass = color === "green" ? "stroke-green-500" :
                     color === "red" ? "stroke-red-500" :
                     "stroke-primary";

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        className={cn(colorClass, "stroke-[1.5]")}
        points={points}
      />
    </svg>
  );
}

// Circular progress component
function CircularProgress({
  value,
  size = 60,
  strokeWidth = 6,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorClass = value >= 55 ? "stroke-green-500" :
                     value >= 45 ? "stroke-yellow-500" :
                     "stroke-red-500";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        className="text-muted/20"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className={colorClass}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// Rank badge component
function RankBadge({ rankLevel, size = "md" }: { rankLevel?: string | null; size?: "sm" | "md" | "lg" }) {
  const tier = getRankTier(rankLevel);
  const formatted = formatRankLevel(rankLevel);

  const colors: Record<string, string> = {
    bronze: "from-amber-700 to-amber-600 text-amber-100 shadow-amber-500/20",
    silver: "from-gray-400 to-gray-300 text-gray-800 shadow-gray-400/20",
    gold: "from-yellow-500 to-yellow-400 text-yellow-900 shadow-yellow-500/20",
    platinum: "from-cyan-400 to-cyan-300 text-cyan-900 shadow-cyan-400/20",
    diamond: "from-blue-400 to-blue-300 text-blue-900 shadow-blue-400/20",
    conqueror: "from-purple-500 to-purple-400 text-purple-100 shadow-purple-500/20",
    unranked: "from-gray-600 to-gray-500 text-gray-200 shadow-gray-500/20",
  };

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-sm px-4 py-1.5",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full bg-gradient-to-r font-semibold shadow-lg",
      colors[tier] || colors.unranked,
      sizeClasses[size]
    )}>
      <Crown className={cn(
        size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"
      )} />
      {formatted}
    </span>
  );
}

// Mode card component
function ModeCard({
  mode,
  stats,
  isSelected,
  onClick
}: {
  mode: string;
  stats: PlayerModeStats;
  isSelected: boolean;
  onClick: () => void;
}) {
  const winRate = stats.games_count > 0
    ? Math.round((stats.wins_count / stats.games_count) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-3 rounded-lg border transition-all",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-muted/30 border-transparent hover:bg-muted/50"
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {getModeName(mode)}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold">{stats.rating}</span>
        <span className={cn(
          "text-xs font-medium",
          winRate >= 50 ? "text-green-500" : "text-red-500"
        )}>
          {winRate}%
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {stats.games_count} games
      </div>
    </button>
  );
}

// Season history item
function SeasonHistoryItem({
  season,
  rating,
  rank_level,
  games_count,
  win_rate,
  isCurrentSeason
}: {
  season: number;
  rating: number;
  rank_level: string;
  games_count: number;
  win_rate: number;
  isCurrentSeason?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between py-2 px-3 rounded-lg",
      isCurrentSeason ? "bg-primary/10" : "bg-muted/30"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
          isCurrentSeason ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          S{season}
        </div>
        <div>
          <div className="text-sm font-medium">{rating} Rating</div>
          <div className="text-[10px] text-muted-foreground">{games_count} games</div>
        </div>
      </div>
      <div className="text-right">
        <RankBadge rankLevel={rank_level} size="sm" />
        <div className={cn(
          "text-[10px] font-medium mt-1",
          win_rate >= 50 ? "text-green-500" : "text-red-500"
        )}>
          {win_rate.toFixed(1)}% WR
        </div>
      </div>
    </div>
  );
}

// Civilization stat bar
function CivStatBar({
  name,
  games,
  winRate,
  maxGames
}: {
  name: string;
  games: number;
  winRate: number;
  maxGames: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate">{formatCivilization(name)}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(
            "font-medium",
            winRate >= 50 ? "text-green-500" : "text-red-500"
          )}>
            {winRate.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">{games}g</span>
        </div>
      </div>
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            winRate >= 55 ? "bg-green-500" : winRate >= 45 ? "bg-yellow-500" : "bg-red-500"
          )}
          style={{ width: `${(games / maxGames) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function PlayerStats() {
  const {
    currentPlayer,
    isLoading,
    error,
    searchResults,
    isSearching,
    savedProfileId,
    searchPlayers,
    fetchPlayer,
    refreshPlayer,
    clearPlayer,
  } = usePlayerStore();

  const [localQuery, setLocalQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("rm_solo");
  const [showSeasonHistory, setShowSeasonHistory] = useState(false);
  const winRate = usePlayerWinRate(selectedMode);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery.length >= 2) {
        searchPlayers(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, searchPlayers]);

  // Auto-refresh saved player on mount
  useEffect(() => {
    if (savedProfileId && !currentPlayer) {
      fetchPlayer(savedProfileId);
    }
  }, [savedProfileId, currentPlayer, fetchPlayer]);

  const handleSelectPlayer = useCallback(
    (profileId: number) => {
      fetchPlayer(profileId);
      setLocalQuery("");
    },
    [fetchPlayer]
  );

  // Get current mode stats
  const currentModeStats = useMemo((): PlayerModeStats | null => {
    if (!currentPlayer?.modes) return null;
    const modes = currentPlayer.modes as Record<string, PlayerModeStats | undefined>;
    return modes[selectedMode] || null;
  }, [currentPlayer, selectedMode]);

  // Get rating history for chart
  const ratingHistory = useMemo(() => {
    if (!currentModeStats?.rating_history) return [];
    const entries = Object.entries(currentModeStats.rating_history) as [string, RatingHistoryEntry][];
    return entries
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, data]) => data.rating)
      .slice(-15); // Last 15 data points
  }, [currentModeStats]);

  // Get available modes
  const availableModes = useMemo(() => {
    if (!currentPlayer?.modes) return [];
    return Object.entries(currentPlayer.modes)
      .filter(([, stats]) => stats && stats.games_count > 0)
      .sort(([, a], [, b]) => (b?.games_count || 0) - (a?.games_count || 0));
  }, [currentPlayer]);

  // Get civilizations
  const civilizations = useMemo(() => {
    if (!currentModeStats?.civilizations) return [];
    return [...currentModeStats.civilizations].sort((a, b) => b.games_count - a.games_count);
  }, [currentModeStats]);

  // Get last game time
  const lastGameTime = useMemo(() => {
    if (!currentModeStats?.last_game_at) return null;
    const date = new Date(currentModeStats.last_game_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }, [currentModeStats]);

  // No player linked - show search UI
  if (!currentPlayer && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Link Your Profile</CardTitle>
            <CardDescription>
              Search for your AoE4World player name to view detailed analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for player..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && localQuery && (
              <div className="border rounded-lg divide-y overflow-hidden max-h-64 overflow-y-auto">
                {searchResults.map((player) => (
                  <button
                    key={player.profile_id}
                    onClick={() => handleSelectPlayer(player.profile_id)}
                    className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                  >
                    {player.avatars?.small ? (
                      <img src={player.avatars.small} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block truncate">{player.name}</span>
                      {player.country && (
                        <span className="text-xs text-muted-foreground uppercase">{player.country}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading player data...</p>
        </div>
      </div>
    );
  }

  // Player profile loaded - full-width responsive layout
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Section: Player Header + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Player Header */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentPlayer?.avatars?.medium ? (
                  <img
                    src={currentPlayer.avatars.medium}
                    alt=""
                    className="w-16 h-16 rounded-full border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-2xl">{currentPlayer?.name}</h2>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    {currentPlayer?.country && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        {currentPlayer.country.toUpperCase()}
                      </span>
                    )}
                    {lastGameTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {lastGameTime}
                      </span>
                    )}
                    {currentPlayer?.site_url && (
                      <a
                        href={currentPlayer.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        AoE4World
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refreshPlayer} disabled={isLoading}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={clearPlayer}>
                  <X className="w-4 h-4 mr-2" />
                  Unlink
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Win Rate Card */}
        {currentModeStats && (
          <Card>
            <CardContent className="pt-4 h-full flex items-center justify-center">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <CircularProgress value={winRate || 0} size={72} strokeWidth={7} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">{winRate || 0}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{currentModeStats.rating}</div>
                  <div className="text-sm text-muted-foreground">{getModeName(selectedMode)}</div>
                  {currentModeStats.rank && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Rank #{currentModeStats.rank.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Game Modes Grid */}
      {availableModes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Game Modes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {availableModes.map(([mode, stats]) => (
                <ModeCard
                  key={mode}
                  mode={mode}
                  stats={stats!}
                  isSelected={selectedMode === mode}
                  onClick={() => setSelectedMode(mode)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content: Stats + Civilizations Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left Column: Main Stats */}
        {currentModeStats && (
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  {getModeName(selectedMode)} Stats
                </span>
                {currentModeStats.rank_level && (
                  <RankBadge rankLevel={currentModeStats.rank_level} size="md" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {/* Rating Hero */}
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Current Rating
                    </div>
                    <div className="text-4xl font-bold">{currentModeStats.rating}</div>
                    {currentModeStats.max_rating && currentModeStats.max_rating > currentModeStats.rating && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Peak: {currentModeStats.max_rating}
                      </div>
                    )}
                  </div>
                  {/* Rating Chart */}
                  {ratingHistory.length > 2 && (
                    <div className="text-right">
                      <MiniChart data={ratingHistory} />
                      <div className={cn(
                        "text-sm font-medium flex items-center justify-end gap-1 mt-1",
                        ratingHistory[ratingHistory.length - 1] > ratingHistory[0]
                          ? "text-green-500"
                          : "text-red-500"
                      )}>
                        {ratingHistory[ratingHistory.length - 1] > ratingHistory[0]
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />
                        }
                        {Math.abs(ratingHistory[ratingHistory.length - 1] - ratingHistory[0])}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid - 2 rows of 2 on larger screens */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Swords className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{currentModeStats.games_count}</div>
                  <div className="text-[10px] text-muted-foreground">Games</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Target className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <div className="text-lg font-bold text-green-500">{currentModeStats.wins_count}</div>
                  <div className="text-[10px] text-muted-foreground">Wins</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <X className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  <div className="text-lg font-bold text-red-500">{currentModeStats.losses_count}</div>
                  <div className="text-[10px] text-muted-foreground">Losses</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Flame className={cn(
                    "w-4 h-4 mx-auto mb-1",
                    currentModeStats.streak > 0 ? "text-green-500" :
                    currentModeStats.streak < 0 ? "text-red-500" : "text-muted-foreground"
                  )} />
                  <div className={cn(
                    "text-lg font-bold",
                    currentModeStats.streak > 0 ? "text-green-500" :
                    currentModeStats.streak < 0 ? "text-red-500" : ""
                  )}>
                    {currentModeStats.streak > 0 ? `+${currentModeStats.streak}` : currentModeStats.streak}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Streak</div>
                </div>
              </div>

              {/* Season History (Collapsible) */}
              {currentModeStats?.previous_seasons && currentModeStats.previous_seasons.length > 0 && (
                <div className="border-t pt-3">
                  <button
                    onClick={() => setShowSeasonHistory(!showSeasonHistory)}
                    className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Season History ({currentModeStats.previous_seasons.length + 1})
                    </span>
                    {showSeasonHistory ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {showSeasonHistory && (
                    <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                      {currentModeStats.season && (
                        <SeasonHistoryItem
                          season={currentModeStats.season}
                          rating={currentModeStats.rating}
                          rank_level={currentModeStats.rank_level || "unranked"}
                          games_count={currentModeStats.games_count}
                          win_rate={currentModeStats.win_rate}
                          isCurrentSeason
                        />
                      )}
                      {currentModeStats.previous_seasons.map((seasonData: SeasonStats) => (
                        <SeasonHistoryItem
                          key={seasonData.season}
                          season={seasonData.season}
                          rating={seasonData.rating}
                          rank_level={seasonData.rank_level}
                          games_count={seasonData.games_count}
                          win_rate={seasonData.win_rate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Right Column: Civilizations */}
        {civilizations.length > 0 && (
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Civilizations ({civilizations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {civilizations.map((civ) => (
                  <CivStatBar
                    key={civ.civilization}
                    name={civ.civilization}
                    games={civ.games_count}
                    winRate={civ.win_rate}
                    maxGames={civilizations[0].games_count}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* If no stats, show placeholder */}
        {!currentModeStats && (
          <Card className="lg:col-span-2 flex items-center justify-center">
            <CardContent className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No stats available for this mode</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
