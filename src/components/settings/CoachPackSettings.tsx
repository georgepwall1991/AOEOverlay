import { useConfig } from '@/hooks/useConfig';
import { DEFAULT_COACH_PACK_CONFIG } from '@/types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderOpen, Music } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

export function CoachPackSettings() {
  const { config, updateAndSave } = useConfig();
  const coachPack = config.coach_pack ?? DEFAULT_COACH_PACK_CONFIG;

  const updateCoachPack = (updates: Partial<typeof DEFAULT_COACH_PACK_CONFIG>) => {
    updateAndSave({
      coach_pack: { ...coachPack, ...updates }
    });
  };

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected) {
        updateCoachPack({ basePath: selected as string });
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  const updateFile = (event: keyof typeof coachPack.files, name: string) => {
    updateCoachPack({
      files: { ...coachPack.files, [event]: name }
    });
  };

  return (
    <section className="bg-muted/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-medium">Coach Packs</h2>
        </div>
        <Switch 
          checked={coachPack.enabled} 
          onCheckedChange={(enabled) => updateCoachPack({ enabled })} 
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Replace robotic text-to-speech with custom high-quality audio files.
      </p>

      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label className="text-xs">Coach Pack Directory</Label>
          <div className="flex gap-2">
            <Input 
              value={coachPack.basePath} 
              readOnly 
              placeholder="Select folder containing audio files..."
              className="text-xs h-8"
            />
            <Button size="sm" variant="outline" className="h-8" onClick={handleBrowse}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Browse
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Step Advance</Label>
            <Input 
              value={coachPack.files.stepAdvance ?? ""} 
              onChange={(e) => updateFile("stepAdvance", e.target.value)}
              placeholder="step.mp3"
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Behind Pace</Label>
            <Input 
              value={coachPack.files.behindPace ?? ""} 
              onChange={(e) => updateFile("behindPace", e.target.value)}
              placeholder="behind.mp3"
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Villager Reminder</Label>
            <Input 
              value={coachPack.files.reminderVillager ?? ""} 
              onChange={(e) => updateFile("reminderVillager", e.target.value)}
              placeholder="vills.mp3"
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Scout Reminder</Label>
            <Input 
              value={coachPack.files.reminderScout ?? ""} 
              onChange={(e) => updateFile("reminderScout", e.target.value)}
              placeholder="scout.mp3"
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
