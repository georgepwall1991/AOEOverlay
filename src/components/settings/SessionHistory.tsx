import { useSessionStore } from "@/stores/sessionStore";
import { formatTime, formatDelta } from "@/stores/timerStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart2, Trash2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SessionHistory() {
  const { history, clearHistory } = useSessionStore();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
        <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">No performance history yet</p>
        <p className="text-xs">Complete build orders to see your analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-muted-foreground" />
          Recent Sessions
        </h2>
        <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      <ScrollArea className="h-[450px] pr-4">
        <div className="space-y-4">
          {history.map((session) => (
            <Card key={session.id} className="bg-muted/30 border-none">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-bold">{session.buildOrderName}</CardTitle>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(session.timestamp).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-1.5">
                  {session.steps.map((step, idx) => (
                    <div key={step.stepId + idx} className="grid grid-cols-[1fr,60px,60px,60px] gap-2 items-center text-xs">
                      <span className="truncate text-foreground/80" title={step.description}>
                        {idx + 1}. {step.description}
                      </span>
                      <span className="text-muted-foreground font-mono text-right">{step.expectedTiming}</span>
                      <span className="text-foreground font-mono text-right">{formatTime(step.actualTiming)}</span>
                      <span className={cn(
                        "font-mono font-bold text-right",
                        step.delta <= 0 ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {formatDelta(step.delta)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
