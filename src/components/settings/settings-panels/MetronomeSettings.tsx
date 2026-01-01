import { useConfig } from '@/hooks/useConfig';
import { DEFAULT_METRONOME_CONFIG, type MetronomeConfig } from '@/types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Volume2, Timer } from 'lucide-react';

export function MetronomeSettings() {
  const { config, updateAndSave } = useConfig();
  const metronome = config.metronome ?? DEFAULT_METRONOME_CONFIG;

  const updateMetronome = (updates: Partial<MetronomeConfig>) => {
    updateAndSave({
      metronome: { ...metronome, ...updates }
    });
  };

  return (
    <section className="bg-muted/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-medium">Macro Cycle Metronome</h2>
        </div>
        <Switch 
          checked={metronome.enabled} 
          onCheckedChange={(enabled) => updateMetronome({ enabled })} 
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Plays a subtle rhythmic audio cue and visual pulse to help you maintain your macro habits (TC queue, resources, scouting).
      </p>

      <div className="flex items-center justify-between pt-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Macro Coaching Cycle</Label>
        <Switch 
          checked={metronome.coachLoop} 
          onCheckedChange={(coachLoop) => updateMetronome({ coachLoop })} 
        />
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Whispers tasks like "Check TC" or "Glance minimap" instead of just a generic tick.
      </p>

      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Interval (seconds)</Label>
            <span className="text-xs font-mono">{metronome.intervalSeconds}s</span>
          </div>
          <Slider
            value={[metronome.intervalSeconds]}
            min={10}
            max={60}
            step={5}
            onValueChange={(vals) => updateMetronome({ intervalSeconds: vals[0] })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              Volume
            </Label>
            <span className="text-xs font-mono">{Math.round(metronome.volume * 100)}%</span>
          </div>
          <Slider
            value={[metronome.volume * 100]}
            min={0}
            max={100}
            step={5}
            onValueChange={(vals) => updateMetronome({ volume: vals[0] / 100 })}
          />
        </div>
      </div>
    </section>
  );
}
