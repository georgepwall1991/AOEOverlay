# Features

Detailed documentation of all AoE4 Overlay features.

## Table of Contents
- [Overlay Window](#overlay-window)
- [Build Order Display](#build-order-display)
- [Voice Coaching](#voice-coaching)
- [Timer & Pace Tracking](#timer--pace-tracking)
- [Periodic Reminders](#periodic-reminders)
- [Global Hotkeys](#global-hotkeys)
- [Build Order Management](#build-order-management)
- [Player Statistics](#player-statistics)
- [System Tray](#system-tray)

---

## Overlay Window

The overlay is a transparent, frameless window that stays on top of your game.

### Display Modes

#### Expanded Mode (Default)
Shows full build order information:
- Civilization badge
- Build order name
- Timer bar with pace delta
- Previous step (dimmed)
- Current step (highlighted)
- Next 2 upcoming steps
- Step counter and progress bar

#### Compact Mode (Ctrl+Alt+F6)
Minimal display showing only:
- Current step description
- Timer
- Step counter

### Window Behavior

| Feature | Description |
|---------|-------------|
| **Always on Top** | Stays visible over fullscreen games |
| **Transparent** | Semi-transparent background (configurable 0-100%) |
| **Draggable** | Click and drag the header grip to move |
| **Position Memory** | Remembers position between sessions |
| **Click-Through** | Toggle with Ctrl+Alt+F5 to allow clicks to pass through |

### Settings

- **Opacity**: 0% (invisible) to 100% (solid)
- **Font Size**: Small, Medium, Large
- **Theme**: Dark, Light, System
- **Position**: Top-left, Top-right, Bottom-left, Bottom-right, Custom

---

## Build Order Display

### Step Display

Each step shows:
- **Description** with inline game icons
- **Timing** (MM:SS format)
- **Resources** (food, wood, gold, stone counts)

### Icon Markers

Build order descriptions support inline icons using `[icon:name]` syntax:

```
[icon:villager] Queue 2 villagers to [icon:sheep] sheep
```

Renders as actual game icons in the overlay.

**Available Icons:**

| Category | Icons |
|----------|-------|
| **Units** | `villager`, `scout`, `knight`, `spearman`, `man_at_arms`, `longbowman`, `crossbowman`, `horseman`, `monk` |
| **Buildings** | `house`, `town_center`, `barracks`, `archery_range`, `stable`, `blacksmith`, `mining_camp`, `lumber_camp`, `farm`, `mill`, `dock`, `market`, `monastery`, `university`, `siege_workshop`, `keep`, `outpost` |
| **Resources** | `food`, `wood`, `gold`, `stone`, `sheep` |
| **Ages** | `dark_age`, `feudal_age`, `castle_age`, `imperial_age` |
| **Actions** | `attack`, `upgrade` |
| **Civ-Specific** | `relic` (HRE), and more |

### Step Navigation

- **Previous Step**: Ctrl+Alt+F2 (or click step)
- **Next Step**: Ctrl+Alt+F3 (or click step)
- **Jump to Step**: Click any visible step
- **Reset**: Ctrl+Alt+F7 returns to step 1

---

## Voice Coaching

Text-to-speech reads build order steps aloud as you progress.

### Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Voice** | Master toggle | Off |
| **Speech Rate** | 0.5x to 2.0x speed | 1.0x |
| **Speak Steps** | Read step descriptions | On |
| **Speak Reminders** | Read periodic reminders | On |
| **Speak Delta** | Announce when behind pace | On |

### Platform Support

| Platform | Engine | Notes |
|----------|--------|-------|
| **macOS** | Native `say` command | Full support |
| **Windows** | System.Speech (PowerShell) | Full support |
| **Linux** | Not implemented | Placeholder |

### Icon Conversion

Icon markers are converted to readable text for TTS:
- `[icon:town_center]` → "town center"
- `[icon:mining_camp]` → "mining camp"
- `[icon:man_at_arms]` → "man at arms"

---

## Timer & Pace Tracking

### Timer

- Starts automatically when advancing from step 1
- Shows elapsed time in MM:SS format
- Resets with F7 or when cycling build orders

### Pace Delta

Compares your progress to expected build order timings:

| Display | Meaning |
|---------|---------|
| **+15s** (green) | 15 seconds ahead of pace |
| **-30s** (red) | 30 seconds behind pace |
| **On pace** | Within 5 seconds |

### Timer Bar

Visual progress indicator showing:
- Current elapsed time
- Expected time for current step
- Color-coded pace indicator

---

## Periodic Reminders

Voice reminders for common game tasks, triggered at configurable intervals.

### Available Reminders

| Reminder | Default Interval | Message |
|----------|------------------|---------|
| **Villager Queue** | 25 seconds | "Keep queuing villagers" |
| **Scout** | 45 seconds | "Check your scout" |
| **Houses** | 40 seconds | "Don't get supply blocked" |
| **Military** | 60 seconds | "Build more military" |
| **Map Control** | 90 seconds | "Control the map" |

### Configuration

Each reminder can be:
- Enabled/disabled individually
- Set to custom interval (in seconds)
- All reminders toggled with master switch

### Behavior

- Only active while timer is running
- Won't interrupt current TTS speech
- Resets intervals when timer resets
- One reminder per check (prioritized by order)

---

## Global Hotkeys

All hotkeys work even when the game has focus.

### Default Bindings

| Hotkey | Action | Description |
|--------|--------|-------------|
| **Ctrl+Alt+F1** | Toggle Overlay | Show/hide the overlay window |
| **Ctrl+Alt+F2** | Previous Step | Go back one step |
| **Ctrl+Alt+F3** | Next Step | Advance to next step (starts timer) |
| **Ctrl+Alt+F4** | Cycle Build Order | Switch to next enabled build order |
| **Ctrl+Alt+F5** | Toggle Click-Through | Enable/disable mouse passthrough |
| **Ctrl+Alt+F6** | Toggle Compact Mode | Switch between expanded/compact |
| **Ctrl+Alt+F7** | Reset Build Order | Return to step 1, reset timer |
| **Ctrl+Alt+F8** | Start/Pause Timer | Toggle the timer |
| **Ctrl+Alt+TAB** | Toggle Counter Reference | Show/hide unit counter guide |
| **Ctrl+Alt+0** | Main Branch | Switch back to the main build branch |
| **Ctrl+Alt+1-4** | Switch Branch | Switch to a specific build branch |

### Customization

All hotkeys can be remapped in Settings > Hotkeys tab.

**Supported Keys:** F1-F12

---

## Build Order Management

### Loading Build Orders

Build orders are loaded from:
1. `public/build-orders/` - Sample build orders (bundled)
2. `~/.config/aoe4-overlay/build-orders/` - User build orders

### Filtering

Filter build orders by:
- **Civilization**: Show only specific civ builds
- **Difficulty**: Beginner, Intermediate, Advanced, Expert

### Enable/Disable

Toggle individual build orders on/off. Disabled build orders are skipped when cycling (F4).

### Import/Export

- **Import**: Load `.json` build order files
- **Export**: Save build orders to share

### Editor

Built-in editor for creating/modifying build orders:
- Edit name, civilization, difficulty
- Add/remove/reorder steps
- Set timing and resources per step
- Preview with icon rendering

---

## Player Statistics

Integration with [AoE4 World](https://aoe4world.com) for player statistics.

### Search

Search for any player by their in-game name.

### Statistics Displayed

- **Overall**
  - Current rank
  - Rating (ELO)
  - Win rate
  - Total games

- **Per Civilization**
  - Games played
  - Win rate
  - Most played civs

- **Game History**
  - Recent matches
  - Opponents
  - Results

### Caching

Player data is cached to reduce API calls. Cache clears on app restart.

---

## System Tray

The app runs in the system tray for quick access.

### Tray Menu

Right-click the tray icon:
- **Show Overlay** - Make overlay visible
- **Hide Overlay** - Hide overlay
- **Settings** - Open settings window
- **Quit** - Exit application

### Tray Icon Click

Left-click toggles overlay visibility.

---

## Settings Window

Access via tray menu or right-click tray icon > Settings.

### Tabs

#### General
- Opacity slider
- Font size selector
- Theme selector
- Overlay position
- Floating style toggle

#### Hotkeys
- Remap all keyboard shortcuts
- Visual key capture

#### Voice
- Enable/disable TTS
- Speech rate slider
- Toggle speak steps
- Toggle speak reminders
- Toggle speak delta

#### Reminders
- Master enable/disable
- Individual reminder toggles
- Interval configuration (seconds)

#### Build Orders
- View all build orders
- Enable/disable toggle
- Import/Export buttons
- Edit button (opens editor)
- Filter by civ/difficulty
