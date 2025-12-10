# Settings UI Redesign

## Overview

Comprehensive overhaul of the settings UI with a clean minimal style, improved visual hierarchy, and consistent patterns across all 6 tabs.

## Design Decisions

- **Primary use case**: Quick adjustments during play (high scan-ability, minimal cognitive load)
- **Tab structure**: Keep all 6 tabs (Build Orders, Player, Gameplay, Voice, Appearance, Hotkeys)
- **Visual grouping**: Subtle background sections (`bg-muted/30`) instead of borders or cards
- **Descriptions**: Only for complex/non-obvious settings
- **Reset functionality**: Single "Reset All Settings" button in About section

## Layout & Structure

### Overall Layout
- Consistent `max-w-2xl` width for all tab content
- Remove horizontal `<Separator />` components - use spacing instead
- `space-y-4` between sections

### Section Pattern
```
┌─────────────────────────────────────────┐
│ bg-muted/30 rounded-xl p-4             │
│                                         │
│ ● Icon + Section Title (text-base)     │
│                                         │
│   Control 1                      [sw]   │
│   Control 2                      [sw]   │
│   Control 3                      [▼]    │
│                                         │
└─────────────────────────────────────────┘
```

### Section Headers
- `text-base font-medium` (smaller than current `text-lg font-semibold`)
- Icon + title inline, muted icon color
- No bottom margin - container padding handles spacing

## Control Patterns

### Toggle Row (Switch)
- Label on left, switch aligned right
- No per-control icons (section header icon is enough)
- Descriptions only for non-obvious settings

### Slider Row
- Label and current value on same line
- No helper text below

### Select Row
- Full-width selects within container
- Label above select

### Hotkey Row
- Label on left, compact dropdown on right (`w-20`)

### Expandable Settings
- Child settings indent with `ml-4`
- Group toggle + children in same background section

## Tab-by-Tab Changes

### Build Orders
- Apply consistent background sections to filter area and starter wizard
- Move Import button into filter bar area

### Player
- No changes (self-contained component)

### Gameplay
- 2 sections: "Overlay Behavior" and "Timing"
- Remove per-control icons
- Wrap UpgradeBadgesSettings and TelemetryToggle in background sections

### Voice
- 2 sections: "Voice Coaching" and "Periodic Reminders"
- Quick profile buttons as `variant="ghost"`

### Appearance
- 2 sections: "Theme" and "Overlay"
- Stack preset/coach-mode vertically (remove 2-column grid)

### Hotkeys
- Single background section for all hotkey rows
- Preset buttons inside section
- Add "Reset All Settings" in About section with confirmation dialog

## Styling Specs

### Spacing
- `space-y-4` between sections
- `space-y-3` between controls within section
- `p-4` padding inside sections
- `rounded-xl` for sections

### Typography
- Section headers: `text-base font-medium`, icons `text-muted-foreground`
- Control labels: `text-sm font-medium`
- Descriptions: `text-xs text-muted-foreground`

### Colors
- Section backgrounds: `bg-muted/30`
- No borders on sections

### Removals
- Per-control icons
- Horizontal separators
- Helper text (e.g., resolution presets)
- Redundant descriptions on obvious settings

### Additions
- "Reset All Settings" button with AlertDialog confirmation
