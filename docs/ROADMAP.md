# Feature Roadmap

Improvement ideas for AoE4 Overlay, prioritized by impact on player improvement.

## Implemented Features ✅

- [x] Build order display with steps, timing, resources
- [x] Voice TTS reads steps aloud
- [x] Timer tracks pace (ahead/behind)
- [x] Periodic reminders (villagers, scout, houses, military, map control)
- [x] Global hotkeys (F1-F7)
- [x] Click-through mode
- [x] Compact mode
- [x] Opacity control
- [x] Next steps preview
- [x] Player statistics (AoE4 World API)
- [x] Matchup Cheat Sheets
- [x] AoE4World Build Import

---

## Tier 1: High Impact

### 1. Branching Build Orders
**Problem:** Games aren't linear. Getting rushed while following a "Fast Castle" build = loss.

**Solution:** Add reaction branches triggered by hotkeys or buttons.
- `Ctrl+D` → Switch to "Defense" branch (towers, spears)
- `Ctrl+A` → Switch to "Aggression" branch (all-in attack)

**Implementation:**
```json
{
  "steps": [...],
  "branches": {
    "defense": { "trigger": "rushed", "steps": [...] },
    "aggression": { "trigger": "ahead", "steps": [...] }
  }
}
```

**Impact:** Transforms static build orders into adaptive game plans.

---

### 2. Macro Cycle Metronome
**Problem:** Pros operate on a mental loop every 20s. Beginners tunnel vision.

**Solution:** Rhythmic audio cue independent of build order.
- Configurable interval (15-30s)
- Subtle audio "tick" or whisper
- Visual pulse on overlay

**Pro Pattern:**
1. Check TC queue
2. Spend floating resources
3. Glance minimap
4. Return to current task

**Impact:** Builds fundamental macro habits.

---

### 3. Smart Timer Drift
**Problem:** Falling behind makes the overlay annoying (reading Castle Age while you're 200 food short).

**Solution:**
- **Pause hotkey** - Temporarily halt timer/TTS
- **Drift compensation** - When user advances late, adjust future timings relative to actual completion

**Example:**
- Expected Feudal at 4:30, actual at 5:00
- All subsequent timings shift +30s automatically

---

## Tier 2: Strategic Depth

### 6. Counter-Unit Quick Reference
**Problem:** In battle, players forget what counters what.

**Solution:** Toggleable panel (Tab key) with unit counter grid.

**Data:**
| Unit | Hard Counter | Soft Counter |
|------|--------------|--------------|
| Knight | Spearman | Crossbow |
| Archer | Horseman | Man-at-Arms |
| Mangonel | Springald | Horseman |
| Landsknecht | Archers | Handcannons |

---

### 7. Upgrade Reminder Badges
**Problem:** Forgetting Wheelbarrow or Blacksmith upgrades loses games.

**Solution:** Persistent badge that stays until acknowledged.

**Behavior:**
- Badge appears at appropriate game time
- Flashes red if time has passed
- Doesn't disappear with step advancement
- Manual dismiss required

**Key Upgrades:**
- Wheelbarrow (3:00)
- Blacksmith +1 Attack (5:00)
- Double Broadaxe (6:00)
- Textiles (8:00)

---

### 8. Post-Game Performance Stats
**Problem:** "How did I do?" is hard to answer.

**Solution:** Session recording with deviation graph.

**Tracked Data:**
- Step completion time vs expected
- Total time ahead/behind
- Where biggest delays occurred

**Display:**
```
Step 5: Feudal Age
  Expected: 4:30
  Actual: 4:52
  Delta: -22s ⚠️
```

---

### 9. Villager Distribution Visualizer
**Problem:** "6 on Food, 3 on Gold" is abstract text.

**Solution:** Visual bar showing current ideal ratio.

```
Food  ████████████ 12
Wood  ██████ 6
Gold  ████ 4
Stone █ 1
```

When step changes to "Move 4 to Wood":
- Wood section pulses/highlights
- Arrow animation shows transfer

---

## Tier 3: Pro-Level Features

### 10. TC Idle Time Alert
**BeastyQT:** "Your TC should never be idle in Dark/Feudal Age"

**Solution:** Alert when TC queue drops to 0 (early game only).

**Behavior:**
- Monitor TC production queue (may need game API)
- Or: Simple timer-based reminder "Check TC!" every 25s
- Disable after Castle Age

---

### 11. Sacred Site Timer
**Problem:** Sacred sites are win conditions but timing is forgotten.

**Solution:**
- "Sacred sites spawn in 2:00" countdown starting at 3:00
- "Sacred sites active!" alert at 5:00
- "Control 3 sites to win" reminder

---

### 12. Aggressive Timing Windows
**Problem:** Players don't know when enemy attacks are coming.

**Solution:** Civ-specific timing alerts.

**Examples:**
| Civ | Timing | Alert |
|-----|--------|-------|
| French | 4:30 | "Knight rush window - have spears ready" |
| English | 5:00 | "Longbow timing - walls up?" |
| Mongols | 3:30 | "Tower rush possible - scout forward" |
| HRE | 8:00 | "Regnitz timing - pressure or match eco" |

---

### 13. Landmark Selection Helper
**Problem:** Which landmark to pick depends on strategy.

**Solution:** Context-aware landmark suggestions.

**Example (English Feudal):**
```
🏛️ LANDMARK CHOICE

Council Hall
✓ Longbow rush
✓ Early aggression
✗ If going defensive

Abbey of Kings
✓ Boom/defensive
✓ Healing for MAA
✗ If opponent is passive
```

---

### 14. Custom Sound Packs
**Problem:** TTS is robotic.

**Solution:** Map events to custom audio files.

**Structure:**
```
sounds/
├── step-advance.mp3
├── reminder-villagers.mp3
├── reminder-scout.mp3
├── behind-pace.mp3
└── age-up.mp3
```

**Bonus:** Community sound pack sharing.

---

### 15. Scout Pattern Overlay
**Problem:** Optimal scouting paths aren't obvious.

**Solution:** Semi-transparent minimap overlay showing scout route.

**Patterns:**
- Standard spiral (find sheep)
- Rush to opponent (early pressure)
- Map control (relics, sacred sites)

---

## Implementation Priority

### Phase 1: Core Improvements
1. Smart Timer Drift (Pause + Compensation)
2. Upgrade Reminder Badges
3. Matchup Cheat Sheets

### Phase 2: Content & Import
4. AoE4World Build Import
5. Counter-Unit Reference
6. Branching Build Orders (basic)

### Phase 3: Pro Features
7. Macro Cycle Metronome
8. Post-Game Stats
9. Villager Distribution Viz

### Phase 4: Polish
10. Custom Sound Packs
11. Scout Pattern Overlay
12. Advanced Branching

---

## Technical Considerations

### Game State Integration
Some features would benefit from game state reading:
- TC idle detection
- Actual villager counts
- Resource totals
- Age status

**Options:**
- AoE4 doesn't have official API
- Could use OCR on game UI
- Or keep everything timer-based (current approach)

### Data Sources
- Matchup data: Community wikis, pro player guides
- Counter units: Game data files
- Build orders: AoE4World scraping/API

### Performance
- Keep overlay lightweight
- Minimize CPU usage during games
- Test on various resolutions (1080p, 1440p, 4K)
