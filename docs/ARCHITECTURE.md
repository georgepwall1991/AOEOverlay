# Architecture

This document describes the technical architecture of the AoE4 Overlay application.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Tauri Shell                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                 React Application                        ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  ││
│  │  │   Overlay   │  │   Settings  │  │   System Tray   │  ││
│  │  │   Window    │  │   Window    │  │      Menu       │  ││
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  ││
│  │         │                │                   │           ││
│  │         └────────────────┼───────────────────┘           ││
│  │                          │                               ││
│  │                   ┌──────▼──────┐                        ││
│  │                   │   Zustand   │                        ││
│  │                   │   Stores    │                        ││
│  │                   └──────┬──────┘                        ││
│  └──────────────────────────┼───────────────────────────────┘│
│                             │                                │
│  ┌──────────────────────────▼───────────────────────────────┐│
│  │                 Tauri Backend (Rust)                      ││
│  │  • Global Hotkeys    • Window Management                  ││
│  │  • File System I/O   • Text-to-Speech                     ││
│  │  • System Tray       • Configuration                      ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
AOEOverlay/
├── src/                          # React Frontend
│   ├── components/
│   │   ├── overlay/              # Overlay window components
│   │   │   ├── Overlay.tsx       # Main overlay container
│   │   │   ├── AnimatedOverlay.tsx
│   │   │   ├── BuildOrderDisplay.tsx
│   │   │   ├── BuildOrderStep.tsx
│   │   │   ├── CompactOverlay.tsx
│   │   │   ├── TimerBar.tsx
│   │   │   ├── GameIcons.tsx
│   │   │   ├── CivBadge.tsx
│   │   │   ├── ResourceIcons.tsx
│   │   │   └── ResourceIndicator.tsx
│   │   ├── settings/             # Settings window components
│   │   │   ├── SettingsWindow.tsx
│   │   │   ├── BuildOrderManager.tsx
│   │   │   ├── BuildOrderEditor.tsx
│   │   │   └── PlayerStats.tsx
│   │   └── ui/                   # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── slider.tsx
│   │       ├── tabs.tsx
│   │       └── ...
│   ├── hooks/                    # Custom React hooks
│   │   ├── useGlobalHotkeys.ts   # Global hotkey listener
│   │   ├── useBuildOrders.ts     # Build order loading
│   │   ├── useConfig.ts          # Configuration management
│   │   ├── useTimer.ts           # Game timer
│   │   ├── useReminders.ts       # Periodic reminders
│   │   ├── useTTS.ts             # Text-to-speech
│   │   ├── useWindowDrag.ts      # Window dragging
│   │   └── useAutoResize.ts      # Auto-resize container
│   ├── stores/                   # Zustand state stores
│   │   ├── buildOrderStore.ts    # Build order state
│   │   ├── configStore.ts        # App configuration
│   │   ├── overlayStore.ts       # Overlay visibility
│   │   ├── playerStore.ts        # Player statistics
│   │   ├── timerStore.ts         # Timer state
│   │   └── index.ts
│   ├── types/                    # TypeScript definitions
│   │   ├── buildOrder.ts
│   │   ├── config.ts
│   │   ├── aoe4world.ts
│   │   └── index.ts
│   ├── lib/                      # Utilities
│   │   ├── tauri.ts              # Tauri command bindings
│   │   ├── aoe4world.ts          # AoE4 World API client
│   │   ├── age4builder.ts        # Age4Builder integration
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── lib.rs                # Main backend logic
│   │   ├── tts.rs                # Text-to-speech module
│   │   └── main.rs               # Entry point
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   └── icons/
│
├── public/                       # Static assets
│   ├── build-orders/             # Sample build orders
│   └── icons/                    # AoE4 game icons
│
└── docs/                         # Documentation
```

## Frontend Architecture

### State Management (Zustand)

The application uses Zustand for state management with five stores:

#### buildOrderStore
Manages build order data and navigation.
```typescript
{
  buildOrders: BuildOrder[]
  currentOrderIndex: number
  currentStepIndex: number
  // Actions
  nextStep()
  previousStep()
  cycleBuildOrder()
  resetSteps()
  goToStep(index)
}
```

#### configStore
Persists application configuration.
```typescript
{
  config: AppConfig  // opacity, theme, hotkeys, etc.
  // Actions
  updateConfig(partial)
  loadConfig()
  saveConfig()
}
```

#### overlayStore
Controls overlay window state.
```typescript
{
  isVisible: boolean
  // Actions
  toggleVisibility()
  show()
  hide()
}
```

#### timerStore
Tracks game time and pace.
```typescript
{
  elapsedSeconds: number
  isRunning: boolean
  expectedTime: number  // from build order timing
  // Actions
  startTimer()
  stopTimer()
  resetTimer()
  recordStepTime(timing)
}
```

#### playerStore
Caches player statistics from AoE4 World API.
```typescript
{
  players: Map<string, PlayerStats>
  // Actions
  fetchPlayer(name)
  clearCache()
}
```

### Component Hierarchy

```
App
├── Overlay Window
│   ├── AnimatedOverlay
│   │   ├── BuildOrderDisplay
│   │   │   ├── CivBadge
│   │   │   ├── TimerBar
│   │   │   └── BuildOrderStep (×n)
│   │   │       ├── GameIcons
│   │   │       └── ResourceIndicator
│   │   └── CompactOverlay (alternate)
│   └── useGlobalHotkeys
│       ├── useTTS
│       └── useReminders
│
└── Settings Window
    ├── SettingsWindow
    │   ├── General Tab
    │   ├── Hotkeys Tab
    │   ├── Voice Tab
    │   └── Reminders Tab
    ├── BuildOrderManager
    │   └── BuildOrderEditor
    └── PlayerStats
```

### Key Hooks

| Hook | Purpose |
|------|---------|
| `useGlobalHotkeys` | Listens for Tauri hotkey events, triggers TTS |
| `useBuildOrders` | Loads build orders from Tauri backend |
| `useConfig` | Syncs config between React and Tauri |
| `useTimer` | Manages game timer with interval |
| `useReminders` | Triggers periodic voice reminders |
| `useTTS` | Queues and speaks TTS messages |
| `useWindowDrag` | Enables window dragging via Tauri |

## Backend Architecture (Rust)

### Module Structure

```rust
// lib.rs - Main module
mod tts;  // Text-to-speech

// Types
struct AppConfig { ... }
struct BuildOrder { ... }
struct AppState { config: Mutex<AppConfig> }

// Tauri Commands
fn get_config() -> Result<AppConfig, String>
fn save_config(config: AppConfig) -> Result<(), String>
fn get_build_orders() -> Result<Vec<BuildOrder>, String>
fn toggle_click_through() -> Result<bool, String>
fn speak(text: String, rate: f32) -> Result<(), String>
// ... more commands
```

### Tauri Commands

| Command | Description |
|---------|-------------|
| `get_config` / `save_config` | Configuration persistence |
| `get_build_orders` / `save_build_order` | Build order CRUD |
| `import_build_order` / `export_build_order` | File import/export |
| `get_window_position` / `set_window_position` | Window management |
| `toggle_click_through` | Enable/disable mouse passthrough |
| `toggle_compact_mode` | Switch display modes |
| `speak` / `tts_stop` | Text-to-speech control |

### File Storage

```
~/.config/aoe4-overlay/
├── config.json           # App configuration
└── build-orders/         # User build orders
    ├── custom-order-1.json
    └── custom-order-2.json
```

### Text-to-Speech (tts.rs)

Platform-specific TTS implementation:

| Platform | Method |
|----------|--------|
| macOS | `say` command with `-r` rate flag |
| Windows | PowerShell + System.Speech.Synthesis |
| Linux | Placeholder (not implemented) |

```rust
#[cfg(target_os = "macos")]
pub fn speak_native(text: &str, rate: f32) -> Result<(), String> {
    Command::new("say")
        .args(["-r", &wpm.to_string(), text])
        .spawn()
}

#[cfg(target_os = "windows")]
pub fn speak_native(text: &str, rate: f32) -> Result<(), String> {
    // PowerShell script with System.Speech
}
```

## Data Flow

### Build Order Navigation
```
User presses F3 (Next Step)
    │
    ▼
Tauri emits "hotkey-next-step" event
    │
    ▼
useGlobalHotkeys receives event
    │
    ├──▶ buildOrderStore.nextStep()
    │        │
    │        ▼
    │    Update currentStepIndex
    │        │
    │        ▼
    │    React re-renders overlay
    │
    └──▶ speakStep(description)
             │
             ▼
         convertIconMarkersForTTS()
             │
             ▼
         Tauri invoke "speak"
             │
             ▼
         Native TTS plays audio
```

### Configuration Persistence
```
User changes setting in UI
    │
    ▼
configStore.updateConfig(partial)
    │
    ├──▶ Update Zustand state (immediate UI update)
    │
    └──▶ Tauri invoke "save_config"
             │
             ▼
         Write to ~/.config/aoe4-overlay/config.json
```

## Window Configuration

### Overlay Window (tauri.conf.json)
```json
{
  "label": "overlay",
  "transparent": true,
  "decorations": false,
  "alwaysOnTop": true,
  "skipTaskbar": true,
  "resizable": true
}
```

### Settings Window
```json
{
  "label": "settings",
  "title": "AoE4 Overlay Settings",
  "width": 800,
  "height": 600,
  "visible": false
}
```

## External APIs

### AoE4 World API
- Base URL: `https://aoe4world.com/api/v0`
- Used for player statistics lookup
- Endpoints: `/players/search`, `/players/{id}`

## Performance Considerations

1. **Zustand** - Lightweight state (~1KB) vs Redux
2. **Tauri** - Native performance vs Electron
3. **Vite** - Fast HMR during development
4. **TTS Queueing** - Prevents overlapping speech
5. **Icon Markers** - Parsed at render time, cached in component

## Future Architecture Considerations

1. **TTS Crate** - Replace shell commands with `tts` Rust crate
2. **Component Splitting** - Break up large components (SettingsWindow, PlayerStats)
3. **Build Order Validation** - JSON schema validation
4. **Offline Mode** - Cache player stats locally
5. **Plugin System** - Allow custom build order sources
