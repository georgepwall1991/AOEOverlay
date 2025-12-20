import { RefreshCw, X, User, Clock, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlayerProfile } from "@/types/aoe4world";

interface PlayerProfileHeaderProps {
  player: PlayerProfile;
  lastGameTime: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  onClear: () => void;
}

export function PlayerProfileHeader({
  player,
  lastGameTime,
  isLoading,
  onRefresh,
  onClear,
}: PlayerProfileHeaderProps) {
  return (
    <Card className="lg:col-span-2">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {player.avatars?.medium ? (
              <img
                src={player.avatars.medium}
                alt=""
                className="w-16 h-16 rounded-full border-2 border-primary/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-7 h-7 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-2xl">{player.name}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                {player.country && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {player.country.toUpperCase()}
                  </span>
                )}
                {lastGameTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {lastGameTime}
                  </span>
                )}
                {player.site_url && (
                  <a
                    href={player.site_url}
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
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onClear}>
              <X className="w-4 h-4 mr-2" />
              Unlink
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
