# AoE4 Overlay

A modern, cross-platform overlay application for Age of Empires 4 that displays build orders with voice coaching, timers, and player statistics.

Built with **Tauri v2 + React 19 + TypeScript + Tailwind CSS + shadcn/ui**.

## Features

### Build Order Display
- Transparent, always-on-top overlay window
- Shows current, previous, and upcoming build order steps
- Resource tracking per step (food, wood, gold, stone)
- Civilization badges and official AoE4 game icons
- Two display modes: **Expanded** and **Compact**
- Click-through mode for non-interactive overlay
- Draggable window with position memory

### Voice Coaching (TTS)
- Text-to-speech reads build order steps aloud
- Configurable speech rate (0.5x - 2.0x)
- Platform-native TTS (macOS `say`, Windows System.Speech)
- Icon markers converted to readable text (`[icon:scout]` → "scout")

### Timer & Pace Tracking
- Tracks elapsed game time from first step
- Shows delta (ahead/behind) vs expected build order timing
- Visual timer bar with pace indicator

### Periodic Reminders
- Configurable voice reminders for common tasks:
  - Keep queuing villagers (default: 25s)
  - Check your scout (default: 45s)
  - Don't get supply blocked (default: 40s)
  - Build more military (default: 60s)
  - Control the map (default: 90s)

### Global Hotkeys
| Default | Action |
|---------|--------|
| `F1` | Toggle overlay visibility |
| `F2` | Previous step |
| `F3` | Next step |
| `F4` | Cycle build order |
| `F5` | Toggle click-through |
| `F6` | Toggle compact mode |
| `F7` | Reset build order |

All hotkeys work while the game has focus.

### Build Order Management
- Import/export build orders (JSON format)
- Enable/disable individual build orders
- Filter by civilization and difficulty
- Built-in editor for customization

### Player Statistics
- Integration with [AoE4 World API](https://aoe4world.com)
- Search players by name
- View rank, rating, win rate
- Per-civilization statistics

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific dependencies:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **Linux**: `webkit2gtk`, `libappindicator3`

### Development Setup

```bash
# Clone the repository
git clone https://github.com/georgepwall1991/AOEOverlay.git
cd AOEOverlay

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Building for Production

```bash
# Build the application
npm run tauri build
```

Built applications will be in `src-tauri/target/release/bundle/`.

## Usage

1. **Launch the app** - The overlay window and system tray icon will appear
2. **Load a build order** - Use Settings (right-click tray icon) to manage build orders
3. **Start your game** - The overlay stays on top of AoE4
4. **Use hotkeys** - Press F3 to advance steps as you play
5. **Enable voice coaching** - Toggle in Settings > Voice tab

### Settings Window
Right-click the system tray icon and select "Settings" to access:
- **General**: Opacity, font size, theme, overlay position
- **Hotkeys**: Customize all keyboard shortcuts
- **Voice**: TTS settings, speech rate, enable/disable features
- **Reminders**: Configure periodic reminder intervals
- **Build Orders**: Import, export, enable/disable, edit

## Build Order Format

Build orders are JSON files with this structure:

```json
{
  "id": "unique-id",
  "name": "Build Order Name",
  "civilization": "French",
  "description": "Short description of the strategy",
  "difficulty": "Intermediate",
  "enabled": true,
  "steps": [
    {
      "id": "step-1",
      "description": "[icon:villager] Queue 2 villagers to [icon:sheep] sheep",
      "timing": "0:00",
      "resources": {
        "food": 6,
        "wood": 0,
        "gold": 0,
        "stone": 0
      }
    }
  ]
}
```

### Icon Markers
Use `[icon:name]` in descriptions to display game icons:
- Units: `villager`, `scout`, `knight`, `spearman`, `longbowman`, `crossbowman`, `man_at_arms`
- Buildings: `house`, `town_center`, `barracks`, `archery_range`, `stable`, `mining_camp`, `lumber_camp`, `farm`
- Resources: `food`, `wood`, `gold`, `stone`, `sheep`
- Ages: `dark_age`, `feudal_age`, `castle_age`, `imperial_age`

### Supported Civilizations
English, French, Holy Roman Empire, Rus, Chinese, Delhi Sultanate, Abbasid Dynasty, Mongols, Ottomans, Malians, Byzantines, Japanese, Jeanne d'Arc, Ayyubids, Zhu Xi's Legacy, Order of the Dragon

### Difficulty Levels
Beginner, Intermediate, Advanced, Expert

## Project Structure

```
AOEOverlay/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── overlay/        # Overlay window components
│   │   ├── settings/       # Settings window components
│   │   └── ui/             # shadcn/ui primitives
│   ├── hooks/              # React hooks
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript types
│   └── lib/                # Utilities
├── src-tauri/              # Rust backend
│   └── src/
│       ├── lib.rs          # Main Tauri backend
│       └── tts.rs          # Text-to-speech module
├── public/
│   ├── build-orders/       # Sample build order JSONs
│   └── icons/              # AoE4 game icons
└── docs/                   # Documentation
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Codebase structure and design
- [Features](docs/FEATURES.md) - Detailed feature documentation
- [Build Orders](docs/BUILD-ORDERS.md) - Build order format and examples
- [Original Spec](docs/ORIGINAL-SPEC.md) - Original design specification

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Tauri v2 |
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| State | Zustand |
| Build | Vite |
| Backend | Rust |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by [FluffyMaguro's AoE4_Overlay](https://github.com/FluffyMaguro/AoE4_Overlay)
- Game icons from Age of Empires 4
- Player stats from [AoE4 World](https://aoe4world.com)
