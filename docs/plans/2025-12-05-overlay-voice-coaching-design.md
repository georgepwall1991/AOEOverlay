# Overlay Voice Coaching Design

## Overview

Enhanced overlay coaching system that provides real-time voice guidance, visual timing feedback, and polished game-like resource icons. The overlay becomes an active coach, not just a passive checklist.

**Core Features:**
1. Voice Coaching - Native TTS reads step descriptions + periodic reminders
2. Time Delta - Shows ahead/behind timing when you advance steps
3. Resource Icons - AoE4-authentic icons replacing text letters
4. Periodic Reminders - Toggle-able coaching reminders

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Overlay   │  │ TTS Hook │  │ Timer/Delta  │  │
│  │ Components│  │ (speaks) │  │ Store        │  │
│  └───────────┘  └──────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ Tauri Commands
┌────────────────────▼────────────────────────────┐
│                  Rust Backend                    │
│  ┌──────────────────────────────────────────┐   │
│  │ TTS Module (macOS: say / Windows: SAPI)  │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 1. Voice Coaching System

### TTS Implementation (Rust Backend)

```rust
// src-tauri/src/tts.rs
#[cfg(target_os = "macos")]
fn speak_native(text: &str, rate: f32) {
    // Use macOS 'say' command
    Command::new("say")
        .args(["-r", &(rate * 200.0).to_string(), text])
        .spawn();
}

#[cfg(target_os = "windows")]
fn speak_native(text: &str, rate: f32) {
    // Use PowerShell with SAPI
    let script = format!(
        "Add-Type -AssemblyName System.Speech; \
         $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; \
         $synth.Rate = {}; $synth.Speak('{}')",
        ((rate - 1.0) * 5.0) as i32, text
    );
    Command::new("powershell").args(["-Command", &script]).spawn();
}
```

### Tauri Commands

- `speak(text: String)` - Speak text immediately
- `stop_speaking()` - Cancel current speech
- `set_voice_settings(rate: f32, volume: f32, enabled: bool)` - Configure TTS

### When Speech Triggers

1. **Step change** - When user advances to next step via hotkey, speak the step description
2. **Periodic reminders** - Timer fires every N seconds, speaks enabled reminder
3. **Delta warning** - If falling behind by >30 seconds, "You're behind pace"

### Voice Settings (config)

```typescript
voice: {
  enabled: boolean;        // Master toggle
  rate: number;            // 0.5 - 2.0 (1.0 = normal)
  speakSteps: boolean;     // Read step descriptions
  speakReminders: boolean; // Periodic coaching
  speakDelta: boolean;     // Announce when behind
}
```

---

## 2. Time Delta & Pacing Feedback

### Timer State

The timer starts when you advance from step 1 to step 2 (first manual progression).

```typescript
interface TimerState {
  isRunning: boolean;
  startedAt: number | null;      // Timestamp when timer started
  elapsedSeconds: number;        // Current elapsed time
  lastStepTime: number | null;   // When last step was reached
}
```

### Delta Calculation

When you advance to a step, compare elapsed time vs suggested timing:

```typescript
const suggestedSeconds = parseTimingToSeconds(step.timing); // "3:30" → 210
const actualSeconds = elapsedSeconds;                       // e.g., 195
const delta = actualSeconds - suggestedSeconds;             // -15 (15s ahead)
```

### Visual Display

```
┌─────────────────────────────────────────┐
│  ⏱ 3:15  │  Step 10: Build Council Hall │
│  ▲ -0:15  │  Target: 3:30               │
│  (ahead)  │                              │
└─────────────────────────────────────────┘
```

- **Green arrow up** + negative delta = ahead of pace
- **Red arrow down** + positive delta = behind
- **Gray** = within 10 seconds (on pace)

### Compact Mode Delta

`⏱ 3:15 ▲-15s`

### Voice Warning

If `speakDelta` enabled and >30s behind: "You're 30 seconds behind pace"

---

## 3. Periodic Coaching Reminders

### Available Reminders

| Reminder | Message | Default Interval |
|----------|---------|------------------|
| Villager Queue | "Keep queuing villagers" | 25 seconds |
| Scout | "Check your scout" | 45 seconds |
| Houses | "Don't get supply blocked" | 40 seconds |
| Military | "Build more military" | 60 seconds |
| Map Control | "Control the map" | 90 seconds |

### Config Structure

```typescript
reminders: {
  enabled: boolean;
  villagerQueue: { enabled: boolean; intervalSeconds: number };
  scout: { enabled: boolean; intervalSeconds: number };
  houses: { enabled: boolean; intervalSeconds: number };
  military: { enabled: boolean; intervalSeconds: number };
  mapControl: { enabled: boolean; intervalSeconds: number };
}
```

### Implementation

```typescript
useInterval(() => {
  if (!reminders.enabled || !timerState.isRunning) return;

  const now = Date.now();
  Object.entries(activeReminders).forEach(([key, reminder]) => {
    if (now - reminder.lastSpoken >= reminder.intervalSeconds * 1000) {
      speak(reminder.message);
      reminder.lastSpoken = now;
    }
  });
}, 1000);
```

### Collision Avoidance

- Don't speak reminder if TTS already speaking a step
- Queue reminders if step announcement in progress
- Pause reminders when in settings window

---

## 4. Resource Icons (AoE4-Authentic)

### Icon Components

```typescript
// src/components/overlay/ResourceIcon.tsx
function FoodIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#dc2626" />
      <ellipse cx="12" cy="11" rx="5" ry="4" fill="#fca5a5" />
    </svg>
  );
}
// Similar for WoodIcon, GoldIcon, StoneIcon
```

### Updated ResourceIndicator

Before: `F 6  W 4  G 2`
After: `[🍖] 6  [🪵] 4  [💰] 2`

### Visual Style

- Icons 14-16px normal, 12px compact
- Numbers in matching resource color
- Subtle glow/shadow for visibility
- Gradients to match AoE4 aesthetic

---

## 5. Updated Overlay UI Layout

### Full Overlay

```
┌────────────────────────────────────────────────────┐
│ ⚙️ ════════════ ≡ ════════════ 🔇              │ ← Header
├────────────────────────────────────────────────────┤
│ ⏱ 3:15  ▲ -0:15                    English 🏰    │ ← Timer bar
├────────────────────────────────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━●━━━━━━━━━ 10/14               │ ← Progress
├────────────────────────────────────────────────────┤
│  ○ 9. Villager to food          🍖8 🪵4 🪨2      │ ← Past
│  ● 10. Build Council Hall       🍖8 🪵2 🪨2      │ ← ACTIVE
│        Target: 3:30                                │
│  ○ 11. Queue villagers          🍖10 🪵2 🪨2     │ ← Future
│  ○ 12. Feudal Age reached!      🍖10 🪵4 🪨2     │
└────────────────────────────────────────────────────┘
```

### Compact Mode

```
┌──────────────────────────────────────────┐
│ ⏱ 3:15 ▲-15s │ 10. Build Council Hall   │
│              │ 🍖8 🪵2 🪨2  Target: 3:30 │
└──────────────────────────────────────────┘
```

### New UI Elements

1. Timer bar - elapsed time + delta indicator
2. Mute button - quick voice toggle (🔇/🔊)
3. Target time - suggested timing for active step
4. Resource icons - replace F/W/G/S text

### Color Coding

- Green glow/border = ahead of pace
- Red glow/border = behind pace
- Amber = active step
- Gray = past steps

---

## Implementation Order

1. **Resource Icons** - Visual polish, standalone
2. **Timer Store** - Foundation for delta
3. **Delta Display** - Timer bar + delta UI
4. **TTS Backend** - Rust commands for speech
5. **Voice Hook** - Frontend TTS integration
6. **Step Announcements** - Speak on step change
7. **Reminder System** - Periodic coaching
8. **Settings UI** - Voice/reminder config
9. **Compact Mode Updates** - Apply to compact view

---

## Files to Create/Modify

### New Files
- `src-tauri/src/tts.rs` - Native TTS module
- `src/components/overlay/ResourceIcons.tsx` - SVG icon components
- `src/components/overlay/TimerBar.tsx` - Timer + delta display
- `src/stores/timerStore.ts` - Game timer state
- `src/hooks/useTTS.ts` - TTS frontend hook
- `src/hooks/useReminders.ts` - Reminder timer hook

### Modified Files
- `src-tauri/src/lib.rs` - Register TTS commands
- `src/components/overlay/ResourceIndicator.tsx` - Use new icons
- `src/components/overlay/Overlay.tsx` - Add timer bar
- `src/components/overlay/CompactOverlay.tsx` - Add delta
- `src/components/overlay/BuildOrderStep.tsx` - Target time display
- `src/types/config.ts` - Voice/reminder config types
- `src/components/settings/SettingsWindow.tsx` - Voice settings UI
