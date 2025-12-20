import { useEffect, useState, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Trophy,
  Swords,
  TrendingUp,
  TrendingDown,
  Target,
  X,
  Crown,
  Flame,
  ChevronDown,
  ChevronUp,
  BarChart3,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayerStore, usePlayerWinRate } from "@/stores";
import { cn } from "@/lib/utils";
import {
  getModeName,
  type PlayerModeStats,
  type SeasonStats,
  type RatingHistoryEntry,
} from "@/types/aoe4world";
import {
  MiniChart,
  CircularProgress,
  RankBadge,
  ModeCard,
  SeasonHistoryItem,
  CivStatBar,
  PlayerSearchCard,
  PlayerProfileHeader,
} from "./player-stats";

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
    const entries = Object.entries(currentModeStats.rating_history) as [
      string,
      RatingHistoryEntry,
    ][];
    return entries
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, data]) => data.rating)
      .slice(-15);
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
    return [...currentModeStats.civilizations].sort(
      (a, b) => b.games_count - a.games_count
    );
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
      <PlayerSearchCard
        query={localQuery}
        onQueryChange={setLocalQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        error={error}
        onSelectPlayer={handleSelectPlayer}
      />
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

  // Player profile loaded
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Section: Player Header + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Player Header */}
        <PlayerProfileHeader
          player={currentPlayer!}
          lastGameTime={lastGameTime}
          isLoading={isLoading}
          onRefresh={refreshPlayer}
          onClear={clearPlayer}
        />

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
                  <div className="text-sm text-muted-foreground">
                    {getModeName(selectedMode)}
                  </div>
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

      {/* Main Content: Stats + Civilizations */}
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
                    {currentModeStats.max_rating &&
                      currentModeStats.max_rating > currentModeStats.rating && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Peak: {currentModeStats.max_rating}
                        </div>
                      )}
                  </div>
                  {/* Rating Chart */}
                  {ratingHistory.length > 2 && (
                    <div className="text-right">
                      <MiniChart data={ratingHistory} />
                      <div
                        className={cn(
                          "text-sm font-medium flex items-center justify-end gap-1 mt-1",
                          ratingHistory[ratingHistory.length - 1] > ratingHistory[0]
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        {ratingHistory[ratingHistory.length - 1] > ratingHistory[0] ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {Math.abs(
                          ratingHistory[ratingHistory.length - 1] - ratingHistory[0]
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Swords className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{currentModeStats.games_count}</div>
                  <div className="text-[10px] text-muted-foreground">Games</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Target className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <div className="text-lg font-bold text-green-500">
                    {currentModeStats.wins_count}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Wins</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <X className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  <div className="text-lg font-bold text-red-500">
                    {currentModeStats.losses_count}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Losses</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Flame
                    className={cn(
                      "w-4 h-4 mx-auto mb-1",
                      currentModeStats.streak > 0
                        ? "text-green-500"
                        : currentModeStats.streak < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                    )}
                  />
                  <div
                    className={cn(
                      "text-lg font-bold",
                      currentModeStats.streak > 0
                        ? "text-green-500"
                        : currentModeStats.streak < 0
                          ? "text-red-500"
                          : ""
                    )}
                  >
                    {currentModeStats.streak > 0
                      ? `+${currentModeStats.streak}`
                      : currentModeStats.streak}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Streak</div>
                </div>
              </div>

              {/* Season History (Collapsible) */}
              {currentModeStats?.previous_seasons &&
                currentModeStats.previous_seasons.length > 0 && (
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
                        {currentModeStats.previous_seasons.map(
                          (seasonData: SeasonStats) => (
                            <SeasonHistoryItem
                              key={seasonData.season}
                              season={seasonData.season}
                              rating={seasonData.rating}
                              rank_level={seasonData.rank_level}
                              games_count={seasonData.games_count}
                              win_rate={seasonData.win_rate}
                            />
                          )
                        )}
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
