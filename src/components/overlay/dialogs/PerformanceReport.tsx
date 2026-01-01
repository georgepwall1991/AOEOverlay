import { X, TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { useSessionStore } from "@/stores";
import { formatDelta } from "@/stores/timerStore";
import { cn } from "@/lib/utils";

export function PerformanceReport() {
  const { history, isReportOpen, setReportOpen } = useSessionStore();
  const lastSession = history[0];

  if (!isReportOpen || !lastSession) return null;

  const totalSteps = lastSession.steps.length;
  const aheadSteps = lastSession.steps.filter((s) => s.delta < -5).length;
  const behindSteps = lastSession.steps.filter((s) => s.delta > 5).length;
  const onPaceSteps = totalSteps - aheadSteps - behindSteps;

  const score = Math.round(( (aheadSteps * 100) + (onPaceSteps * 70) ) / totalSteps);

  // Calculate max delta for chart scaling
  const maxAbsDelta = Math.max(...lastSession.steps.map((s) => Math.abs(s.delta)), 30);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-v3 w-full max-w-md overflow-hidden relative border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">Performance Analysis</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest">{lastSession.buildOrderName}</p>
            </div>
          </div>
          <button onClick={() => setReportOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Ahead</p>
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xl font-black">{aheadSteps}</span>
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">On Pace</p>
              <div className="flex items-center justify-center gap-1 text-amber-400">
                <Minus className="w-3 h-3" />
                <span className="text-xl font-black">{onPaceSteps}</span>
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Behind</p>
              <div className="flex items-center justify-center gap-1 text-red-400">
                <TrendingDown className="w-3 h-3" />
                <span className="text-xl font-black">{behindSteps}</span>
              </div>
            </div>
          </div>

          {/* Sparkline Deviation Chart */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-white/60">Pace Deviation (sec)</span>
              <span className="text-[10px] font-mono text-white/20 uppercase">Early → Late</span>
            </div>
            <div className="h-32 w-full flex items-end gap-1.5 px-2 bg-white/[0.01] rounded-lg border border-white/[0.03] pt-4">
              {lastSession.steps.map((step, idx) => {
                const height = Math.abs((step.delta / maxAbsDelta) * 80); // Max 80% height
                const isBehind = step.delta > 0;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-center">
                    <div 
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-500",
                        isBehind ? "bg-red-500/40 order-1" : "bg-emerald-500/40 order-2"
                      )} 
                      style={{ height: `${height}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[9px] font-bold text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      Step {idx + 1}: {formatDelta(step.delta)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-white/20">
              <span>START</span>
              <span>FINISH</span>
            </div>
          </div>

          {/* Coaching Tip */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <p className="text-xs font-bold text-amber-200/80 leading-relaxed italic">
              {score > 80 
                ? "Excellent focus! Your timing was pro-level. Try pushing for even more aggression." 
                : score > 50 
                ? "Solid execution. You lost some momentum in the mid-game. Watch your gold transition." 
                : "A bit slow today. Use the Macro Metronome to keep your production moving."}
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-white/[0.02] border-t border-white/[0.05]">
          <button 
            onClick={() => setReportOpen(false)}
            className="w-full py-3 rounded-xl bg-white text-black font-black text-sm hover:bg-amber-400 transition-colors shadow-lg"
          >
            DISMISS REPORT
          </button>
        </div>
      </div>
    </div>
  );
}
