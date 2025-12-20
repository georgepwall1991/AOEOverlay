import { Search, RefreshCw, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlayerSearchResult } from "@/types/aoe4world";

interface PlayerSearchCardProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchResults: PlayerSearchResult[];
  isSearching: boolean;
  error: string | null;
  onSelectPlayer: (profileId: number) => void;
}

export function PlayerSearchCard({
  query,
  onQueryChange,
  searchResults,
  isSearching,
  error,
  onSelectPlayer,
}: PlayerSearchCardProps) {
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
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="pl-9"
            />
            {isSearching && (
              <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && query && (
            <div className="border rounded-lg divide-y overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.map((player) => (
                <button
                  key={player.profile_id}
                  onClick={() => onSelectPlayer(player.profile_id)}
                  className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                >
                  {player.avatars?.small ? (
                    <img
                      src={player.avatars.small}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">
                      {player.name}
                    </span>
                    {player.country && (
                      <span className="text-xs text-muted-foreground uppercase">
                        {player.country}
                      </span>
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
