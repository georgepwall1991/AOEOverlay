# AoE4 Overlay - Project Specification

## Overview

A cross-platform (Windows, macOS, Linux) overlay application for Age of Empires 4 that displays build orders and player statistics. Built with Tauri + React + TypeScript + Tailwind CSS + shadcn/ui.

**Inspiration:** [FluffyMaguro's AoE4_Overlay](https://github.com/FluffyMaguro/AoE4_Overlay) - Python/PyQt5 based overlay.

**Goal:** Create a modern, performant, visually stunning alternative with better UX and extensibility.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Tauri v2 | Lightweight native shell, window management, system APIs |
| Frontend | React 18 | UI framework |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS v3 | Utility-first styling |
| Components | shadcn/ui | Beautiful, accessible component primitives |
| State | Zustand | Lightweight state management |
| Build | Vite | Fast bundling and HMR |
| Icons | Lucide React | Consistent icon set |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri Shell                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React Application                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │   Overlay   │  │   Settings  │  │  Tray     │  │  │
│  │  │   Window    │  │   Window    │  │  Menu     │  │  │
│  │  └─────────────┘  └─────────────┘  └───────────┘  │  │
│  │         │                │               │         │  │
│  │         └────────────────┼───────────────┘         │  │
│  │                          │                         │  │
│  │                   ┌──────▼──────┐                  │  │
│  │                   │   Zustand   │                  │  │
│  │                   │    Store    │                  │  │
│  │                   └──────┬──────┘                  │  │
│  └──────────────────────────┼────────────────────────┘  │
│                             │                           │
│  ┌──────────────────────────▼────────────────────────┐  │
│  │              Tauri Backend (Rust)                  │  │
│  │  • Global Hotkey Registration                      │  │
│  │  • File System (config, build orders)              │  │
│  │  • Window Management (transparency, always-on-top) │  │
│  │  • System Tray                                     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## MVP Features (Phase 1)

### 1. Overlay Window
- **Frameless** transparent window
- **Always on top** of other applications (including fullscreen games)
- **Draggable** by clicking and holding anywhere on the overlay
- **Glassmorphism** aesthetic (blur, transparency, subtle borders)
- **Remembers position** between sessions
- **Resizable** via corner handle (optional for MVP)

### 2. Global Hotkeys
| Hotkey | Action |
|--------|--------|
| `F1` (configurable) | Toggle overlay visibility |
| `F2` (configurable) | Previous build order step |
| `F3` (configurable) | Next build order step |
| `F4` (configurable) | Cycle to next build order |

**Important:** Hotkeys must work when the game has focus (not just when overlay has focus).

### 3. Build Order Display
- Load build orders from JSON files
- Display current build order with:
  - Title
  - Civilization icon
  - Current step (highlighted)
  - Previous steps (dimmed)
  - Upcoming steps (visible but less prominent)
- Step components:
  - Population count / timing
  - Resource indicators (food, wood, gold, stone)
  - Villager assignments
  - Action text (e.g., "Build House", "Research Wheelbarrow")
  - Optional: small icons for buildings/units

### 4. Build Order Data Structure
```typescript
interface BuildOrder {
  id: string;
  name: string;
  civilization: Civilization;
  author?: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  matchup?: string; // e.g., "vs French", "General"
  steps: BuildOrderStep[];
}

interface BuildOrderStep {
  id: string;
  population?: number;        // e.g., 6
  gameTime?: string;          // e.g., "0:45"
  resources?: {
    food?: number;
    wood?: number;
    gold?: number;
    stone?: number;
  };
  villagerAssignments?: {
    food?: number;
    wood?: number;
    gold?: number;
    stone?: number;
    builder?: number;
  };
  action: string;             // Main instruction text
  notes?: string;             // Additional context
  icon?: string;              // Optional icon reference
}

type Civilization = 
  | 'english'
  | 'french'
  | 'hre'
  | 'chinese'
  | 'mongols'
  | 'delhi'
  | 'abbasid'
  | 'rus'
  | 'ottomans'
  | 'malians'
  | 'japanese'
  | 'byzantines'
  | 'jeanne_darc'
  | 'order_of_the_dragon'
  | 'ayyubids'
  | 'zhu_xis_legacy';
```

### 5. Configuration Persistence
Store in Tauri's app data directory:
```typescript
interface AppConfig {
  version: string;
  overlay: {
    position: { x: number; y: number };
    opacity: number;           // 0.0 - 1.0
    fontSize: 'small' | 'medium' | 'large';
    theme: 'dark' | 'light' | 'auto';
  };
  hotkeys: {
    toggleOverlay: string;     // e.g., "F1"
    previousStep: string;
    nextStep: string;
    cycleBuildOrder: string;
  };
  buildOrders: {
    selected: string | null;   // Build order ID
    enabled: string[];         // IDs of enabled build orders for cycling
  };
}
```

### 6. System Tray
- Tray icon with context menu:
  - Show/Hide Overlay
  - Open Settings
  - Separator
  - Quit

---

## Project Structure

```
aoe4-overlay/
├── src/                          # React frontend
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── slider.tsx
│   │   │   └── tooltip.tsx
│   │   ├── overlay/
│   │   │   ├── Overlay.tsx           # Main overlay container
│   │   │   ├── BuildOrderDisplay.tsx # Build order renderer
│   │   │   ├── BuildOrderStep.tsx    # Individual step component
│   │   │   ├── ResourceIndicator.tsx # Food/wood/gold/stone display
│   │   │   ├── CivIcon.tsx           # Civilization icon
│   │   │   └── DragHandle.tsx        # Visual drag indicator
│   │   ├── settings/
│   │   │   ├── SettingsWindow.tsx    # Settings main container
│   │   │   ├── HotkeySettings.tsx    # Hotkey configuration
│   │   │   ├── AppearanceSettings.tsx# Opacity, font size, theme
│   │   │   ├── BuildOrderManager.tsx # Add/remove/reorder build orders
│   │   │   └── BuildOrderEditor.tsx  # Edit individual build order
│   │   └── common/
│   │       ├── GlassPanel.tsx        # Reusable glassmorphism container
│   │       └── HotkeyCapture.tsx     # Component to capture hotkey input
│   ├── hooks/
│   │   ├── useGlobalHotkey.ts        # Hook for Tauri hotkey events
│   │   ├── useConfig.ts              # Hook for reading/writing config
│   │   ├── useBuildOrders.ts         # Hook for build order management
│   │   └── useWindowDrag.ts          # Hook for drag functionality
│   ├── stores/
│   │   ├── overlayStore.ts           # Overlay visibility, position state
│   │   ├── buildOrderStore.ts        # Current build order, step index
│   │   └── configStore.ts            # App configuration state
│   ├── lib/
│   │   ├── utils.ts                  # shadcn/ui utility (cn function)
│   │   ├── tauri.ts                  # Tauri command wrappers
│   │   └── constants.ts              # App constants
│   ├── types/
│   │   ├── buildOrder.ts             # Build order types
│   │   ├── config.ts                 # Config types
│   │   └── index.ts                  # Re-exports
│   ├── assets/
│   │   ├── icons/
│   │   │   └── civilizations/        # Civ icons (SVG or PNG)
│   │   └── images/
│   │       └── resources/            # Food, wood, gold, stone icons
│   ├── styles/
│   │   └── globals.css               # Tailwind imports, custom styles
│   ├── App.tsx                       # Main app with router/window detection
│   ├── main.tsx                      # Entry point
│   └── vite-env.d.ts
├── src-tauri/                        # Rust backend
│   ├── src/
│   │   ├── main.rs                   # Tauri entry point
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── config.rs             # Config read/write commands
│   │   │   ├── build_orders.rs       # Build order file operations
│   │   │   └── window.rs             # Window manipulation commands
│   │   ├── hotkeys.rs                # Global hotkey setup
│   │   └── tray.rs                   # System tray setup
│   ├── icons/                        # App icons for all platforms
│   ├── tauri.conf.json               # Tauri configuration
│   ├── Cargo.toml
│   └── build.rs
├── public/
│   └── build-orders/                 # Default build order JSON files
│       ├── english-longbow-rush.json
│       ├── french-knight-rush.json
│       └── ...
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── components.json                   # shadcn/ui config
└── README.md
```

---

## Implementation Steps

### Phase 1: Project Setup

#### Step 1.1: Initialize Tauri + React + TypeScript project
```bash
# Create Tauri app with React + TypeScript template
npm create tauri-app@latest aoe4-overlay -- --template react-ts

cd aoe4-overlay
npm install
```

#### Step 1.2: Install dependencies
```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui dependencies
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge

# Icons
npm install lucide-react

# State management
npm install zustand

# Utilities
npm install @tauri-apps/api
```

#### Step 1.3: Configure Tailwind CSS
Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### Step 1.4: Initialize shadcn/ui
```bash
npx shadcn@latest init
```

Select:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes

Then add components:
```bash
npx shadcn@latest add button card dialog dropdown-menu input label scroll-area select separator slider tooltip
```

---

### Phase 2: Tauri Configuration

#### Step 2.1: Configure `tauri.conf.json`
Key settings for overlay functionality:
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "AoE4 Overlay",
  "identifier": "com.aoe4overlay.app",
  "version": "0.1.0",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "overlay",
        "title": "AoE4 Overlay",
        "width": 400,
        "height": 600,
        "resizable": true,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visible": true,
        "x": 50,
        "y": 50
      },
      {
        "label": "settings",
        "title": "AoE4 Overlay - Settings",
        "width": 800,
        "height": 600,
        "resizable": true,
        "decorations": true,
        "transparent": false,
        "alwaysOnTop": false,
        "visible": false,
        "center": true
      }
    ],
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true
    },
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "plugins": {
    "global-shortcut": {}
  }
}
```

#### Step 2.2: Add Tauri plugins for global shortcuts
In `src-tauri/Cargo.toml`:
```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

#### Step 2.3: Setup Rust backend (`src-tauri/src/main.rs`)
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod hotkeys;
mod tray;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Setup system tray
            tray::setup_tray(app)?;
            
            // Setup global hotkeys
            hotkeys::setup_hotkeys(app)?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::config::get_config,
            commands::config::save_config,
            commands::build_orders::get_build_orders,
            commands::build_orders::save_build_order,
            commands::build_orders::delete_build_order,
            commands::window::set_window_position,
            commands::window::get_window_position,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

### Phase 3: Frontend Implementation

#### Step 3.1: Create Zustand stores

**`src/stores/overlayStore.ts`:**
```typescript
import { create } from 'zustand';

interface OverlayState {
  isVisible: boolean;
  position: { x: number; y: number };
  opacity: number;
  
  // Actions
  toggleVisibility: () => void;
  setVisible: (visible: boolean) => void;
  setPosition: (position: { x: number; y: number }) => void;
  setOpacity: (opacity: number) => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isVisible: true,
  position: { x: 50, y: 50 },
  opacity: 0.85,
  
  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
  setVisible: (visible) => set({ isVisible: visible }),
  setPosition: (position) => set({ position }),
  setOpacity: (opacity) => set({ opacity }),
}));
```

**`src/stores/buildOrderStore.ts`:**
```typescript
import { create } from 'zustand';
import type { BuildOrder } from '@/types';

interface BuildOrderState {
  buildOrders: BuildOrder[];
  currentBuildOrderId: string | null;
  currentStepIndex: number;
  
  // Computed
  currentBuildOrder: () => BuildOrder | null;
  currentStep: () => BuildOrderStep | null;
  
  // Actions
  setBuildOrders: (orders: BuildOrder[]) => void;
  setCurrentBuildOrder: (id: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  cycleBuildOrder: () => void;
}

export const useBuildOrderStore = create<BuildOrderState>((set, get) => ({
  buildOrders: [],
  currentBuildOrderId: null,
  currentStepIndex: 0,
  
  currentBuildOrder: () => {
    const { buildOrders, currentBuildOrderId } = get();
    return buildOrders.find(bo => bo.id === currentBuildOrderId) ?? null;
  },
  
  currentStep: () => {
    const bo = get().currentBuildOrder();
    if (!bo) return null;
    return bo.steps[get().currentStepIndex] ?? null;
  },
  
  setBuildOrders: (orders) => set({ buildOrders: orders }),
  
  setCurrentBuildOrder: (id) => set({ 
    currentBuildOrderId: id, 
    currentStepIndex: 0 
  }),
  
  nextStep: () => set((state) => {
    const bo = state.buildOrders.find(b => b.id === state.currentBuildOrderId);
    if (!bo) return state;
    const maxIndex = bo.steps.length - 1;
    return { 
      currentStepIndex: Math.min(state.currentStepIndex + 1, maxIndex) 
    };
  }),
  
  previousStep: () => set((state) => ({
    currentStepIndex: Math.max(state.currentStepIndex - 1, 0)
  })),
  
  goToStep: (index) => set({ currentStepIndex: index }),
  
  cycleBuildOrder: () => set((state) => {
    const { buildOrders, currentBuildOrderId } = state;
    if (buildOrders.length === 0) return state;
    
    const currentIndex = buildOrders.findIndex(bo => bo.id === currentBuildOrderId);
    const nextIndex = (currentIndex + 1) % buildOrders.length;
    
    return {
      currentBuildOrderId: buildOrders[nextIndex].id,
      currentStepIndex: 0
    };
  }),
}));
```

#### Step 3.2: Create overlay components

**`src/components/overlay/Overlay.tsx`:**
```typescript
import { useEffect } from 'react';
import { useOverlayStore } from '@/stores/overlayStore';
import { useBuildOrderStore } from '@/stores/buildOrderStore';
import { BuildOrderDisplay } from './BuildOrderDisplay';
import { GlassPanel } from '@/components/common/GlassPanel';
import { appWindow } from '@tauri-apps/api/window';

export function Overlay() {
  const { isVisible, opacity, position } = useOverlayStore();
  const { currentBuildOrder } = useBuildOrderStore();
  
  // Handle window dragging
  useEffect(() => {
    const handleMouseDown = async (e: MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.draggable) {
        await appWindow.startDragging();
      }
    };
    
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);
  
  if (!isVisible) {
    return null;
  }
  
  const buildOrder = currentBuildOrder();
  
  return (
    <div 
      className="w-full h-full p-2"
      style={{ opacity }}
      data-draggable="true"
    >
      <GlassPanel className="w-full h-full overflow-hidden">
        {buildOrder ? (
          <BuildOrderDisplay buildOrder={buildOrder} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No build order selected
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
```

**`src/components/common/GlassPanel.tsx`:**
```typescript
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        "bg-black/60 backdrop-blur-md",
        "border border-white/10",
        "shadow-2xl shadow-black/50",
        className
      )}
    >
      {children}
    </div>
  );
}
```

**`src/components/overlay/BuildOrderDisplay.tsx`:**
```typescript
import { useBuildOrderStore } from '@/stores/buildOrderStore';
import { BuildOrderStep } from './BuildOrderStep';
import { CivIcon } from './CivIcon';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BuildOrder } from '@/types';

interface BuildOrderDisplayProps {
  buildOrder: BuildOrder;
}

export function BuildOrderDisplay({ buildOrder }: BuildOrderDisplayProps) {
  const { currentStepIndex, goToStep } = useBuildOrderStore();
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <CivIcon civilization={buildOrder.civilization} size={32} />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">
            {buildOrder.name}
          </h2>
          {buildOrder.matchup && (
            <p className="text-sm text-muted-foreground">{buildOrder.matchup}</p>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {currentStepIndex + 1} / {buildOrder.steps.length}
        </div>
      </div>
      
      {/* Steps */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {buildOrder.steps.map((step, index) => (
            <BuildOrderStep
              key={step.id}
              step={step}
              index={index}
              isActive={index === currentStepIndex}
              isPast={index < currentStepIndex}
              onClick={() => goToStep(index)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

**`src/components/overlay/BuildOrderStep.tsx`:**
```typescript
import { cn } from '@/lib/utils';
import { ResourceIndicator } from './ResourceIndicator';
import type { BuildOrderStep as StepType } from '@/types';

interface BuildOrderStepProps {
  step: StepType;
  index: number;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
}

export function BuildOrderStep({ 
  step, 
  index, 
  isActive, 
  isPast, 
  onClick 
}: BuildOrderStepProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-all duration-200",
        "border border-transparent",
        isActive && "bg-primary/20 border-primary/50 scale-[1.02]",
        isPast && "opacity-50",
        !isActive && !isPast && "hover:bg-white/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Population / Time indicator */}
        <div className="flex-shrink-0 w-12 text-center">
          {step.population && (
            <div className="text-lg font-bold text-amber-400">
              {step.population}
            </div>
          )}
          {step.gameTime && (
            <div className="text-xs text-muted-foreground">
              {step.gameTime}
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm",
            isActive ? "text-white font-medium" : "text-gray-300"
          )}>
            {step.action}
          </p>
          
          {step.notes && (
            <p className="mt-1 text-xs text-muted-foreground">
              {step.notes}
            </p>
          )}
          
          {/* Resource indicators */}
          {step.villagerAssignments && (
            <div className="flex gap-2 mt-2">
              <ResourceIndicator 
                type="food" 
                value={step.villagerAssignments.food} 
              />
              <ResourceIndicator 
                type="wood" 
                value={step.villagerAssignments.wood} 
              />
              <ResourceIndicator 
                type="gold" 
                value={step.villagerAssignments.gold} 
              />
              <ResourceIndicator 
                type="stone" 
                value={step.villagerAssignments.stone} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**`src/components/overlay/ResourceIndicator.tsx`:**
```typescript
import { cn } from '@/lib/utils';

type ResourceType = 'food' | 'wood' | 'gold' | 'stone';

interface ResourceIndicatorProps {
  type: ResourceType;
  value?: number;
}

const resourceColors: Record<ResourceType, string> = {
  food: 'bg-red-500',
  wood: 'bg-green-600', 
  gold: 'bg-yellow-500',
  stone: 'bg-gray-400',
};

const resourceIcons: Record<ResourceType, string> = {
  food: '🍖',
  wood: '🪵',
  gold: '🪙',
  stone: '🪨',
};

export function ResourceIndicator({ type, value }: ResourceIndicatorProps) {
  if (!value || value === 0) return null;
  
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
      "bg-black/40"
    )}>
      <span>{resourceIcons[type]}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
```

---

### Phase 4: Global Hotkeys

#### Step 4.1: Setup hotkeys in Rust (`src-tauri/src/hotkeys.rs`)
```rust
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

pub fn setup_hotkeys(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.clone();
    
    app.global_shortcut().on_shortcut("F1", move |_app, shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_handle.emit("hotkey-toggle-overlay", ());
        }
    })?;
    
    let app_handle = app.clone();
    app.global_shortcut().on_shortcut("F2", move |_app, shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_handle.emit("hotkey-previous-step", ());
        }
    })?;
    
    let app_handle = app.clone();
    app.global_shortcut().on_shortcut("F3", move |_app, shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_handle.emit("hotkey-next-step", ());
        }
    })?;
    
    let app_handle = app.clone();
    app.global_shortcut().on_shortcut("F4", move |_app, shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_handle.emit("hotkey-cycle-build-order", ());
        }
    })?;
    
    Ok(())
}
```

#### Step 4.2: Listen to hotkey events in React
**`src/hooks/useGlobalHotkeys.ts`:**
```typescript
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useOverlayStore } from '@/stores/overlayStore';
import { useBuildOrderStore } from '@/stores/buildOrderStore';

export function useGlobalHotkeys() {
  const { toggleVisibility } = useOverlayStore();
  const { nextStep, previousStep, cycleBuildOrder } = useBuildOrderStore();
  
  useEffect(() => {
    const unlisteners: (() => void)[] = [];
    
    const setup = async () => {
      unlisteners.push(
        await listen('hotkey-toggle-overlay', () => {
          toggleVisibility();
        })
      );
      
      unlisteners.push(
        await listen('hotkey-previous-step', () => {
          previousStep();
        })
      );
      
      unlisteners.push(
        await listen('hotkey-next-step', () => {
          nextStep();
        })
      );
      
      unlisteners.push(
        await listen('hotkey-cycle-build-order', () => {
          cycleBuildOrder();
        })
      );
    };
    
    setup();
    
    return () => {
      unlisteners.forEach(unlisten => unlisten());
    };
  }, [toggleVisibility, nextStep, previousStep, cycleBuildOrder]);
}
```

---

### Phase 5: System Tray

**`src-tauri/src/tray.rs`:**
```rust
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};
use tauri::menu::{Menu, MenuItem};

pub fn setup_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "Show Overlay", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "hide", "Hide Overlay", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    
    let menu = Menu::with_items(app, &[&show_item, &hide_item, &settings_item, &quit_item])?;
    
    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("overlay") {
                    let _ = window.show();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("overlay") {
                    let _ = window.hide();
                }
            }
            "settings" => {
                if let Some(window) = app.get_webview_window("settings") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("overlay") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;
    
    Ok(())
}
```

---

### Phase 6: Configuration Persistence

**`src-tauri/src/commands/config.rs`:**
```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub version: String,
    pub overlay: OverlayConfig,
    pub hotkeys: HotkeyConfig,
    pub build_orders: BuildOrderConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlayConfig {
    pub position: Position,
    pub opacity: f32,
    pub font_size: String,
    pub theme: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeyConfig {
    pub toggle_overlay: String,
    pub previous_step: String,
    pub next_step: String,
    pub cycle_build_order: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildOrderConfig {
    pub selected: Option<String>,
    pub enabled: Vec<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            version: "0.1.0".to_string(),
            overlay: OverlayConfig {
                position: Position { x: 50, y: 50 },
                opacity: 0.85,
                font_size: "medium".to_string(),
                theme: "dark".to_string(),
            },
            hotkeys: HotkeyConfig {
                toggle_overlay: "F1".to_string(),
                previous_step: "F2".to_string(),
                next_step: "F3".to_string(),
                cycle_build_order: "F4".to_string(),
            },
            build_orders: BuildOrderConfig {
                selected: None,
                enabled: vec![],
            },
        }
    }
}

fn get_config_path(app: &AppHandle) -> PathBuf {
    let app_dir = app.path().app_config_dir().expect("Failed to get app config dir");
    fs::create_dir_all(&app_dir).ok();
    app_dir.join("config.json")
}

#[tauri::command]
pub fn get_config(app: AppHandle) -> Result<AppConfig, String> {
    let path = get_config_path(&app);
    
    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())
    } else {
        Ok(AppConfig::default())
    }
}

#[tauri::command]
pub fn save_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
    let path = get_config_path(&app);
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}
```

---

## Sample Build Order JSON

**`public/build-orders/english-longbow-rush.json`:**
```json
{
  "id": "english-longbow-rush",
  "name": "English Longbow Rush",
  "civilization": "english",
  "author": "Community",
  "description": "Fast Feudal Age longbow rush focusing on early aggression",
  "difficulty": "beginner",
  "matchup": "General",
  "steps": [
    {
      "id": "step-1",
      "population": 6,
      "action": "Queue 2 villagers, rally to sheep",
      "villagerAssignments": { "food": 6 }
    },
    {
      "id": "step-2", 
      "population": 7,
      "action": "Send new villager to build house, then to wood",
      "villagerAssignments": { "food": 6, "wood": 1 }
    },
    {
      "id": "step-3",
      "population": 8,
      "action": "Villager to wood",
      "villagerAssignments": { "food": 6, "wood": 2 }
    },
    {
      "id": "step-4",
      "population": 9,
      "action": "Villager to wood",
      "villagerAssignments": { "food": 6, "wood": 3 }
    },
    {
      "id": "step-5",
      "population": 10,
      "action": "Villager to gold",
      "villagerAssignments": { "food": 6, "wood": 3, "gold": 1 }
    },
    {
      "id": "step-6",
      "population": 11,
      "action": "Build Mining Camp at gold, villager to gold",
      "villagerAssignments": { "food": 6, "wood": 3, "gold": 2 }
    },
    {
      "id": "step-7",
      "population": 12,
      "action": "Build Lumber Camp, villager to wood",
      "villagerAssignments": { "food": 6, "wood": 4, "gold": 2 }
    },
    {
      "id": "step-8",
      "population": 13,
      "action": "Villager to food",
      "villagerAssignments": { "food": 7, "wood": 4, "gold": 2 }
    },
    {
      "id": "step-9",
      "population": 14,
      "action": "Villager to food",
      "villagerAssignments": { "food": 8, "wood": 4, "gold": 2 }
    },
    {
      "id": "step-10",
      "population": 15,
      "gameTime": "3:30",
      "action": "Build Council Hall (Landmark), age up to Feudal",
      "notes": "Use 2 wood villagers to build",
      "villagerAssignments": { "food": 8, "wood": 2, "gold": 2, "builder": 2 }
    },
    {
      "id": "step-11",
      "population": 17,
      "action": "Queue villagers to food during age up",
      "villagerAssignments": { "food": 10, "wood": 2, "gold": 2, "builder": 2 }
    },
    {
      "id": "step-12",
      "population": 18,
      "gameTime": "5:00",
      "action": "Feudal Age reached! Start producing Longbowmen",
      "notes": "Council Hall produces Longbowmen faster"
    },
    {
      "id": "step-13",
      "population": 20,
      "action": "Build Archery Range, move 2 villagers to gold",
      "villagerAssignments": { "food": 8, "wood": 4, "gold": 4 }
    },
    {
      "id": "step-14",
      "population": 22,
      "action": "Constant Longbow production, attack with 6-8 Longbows",
      "notes": "Target enemy gold/wood villagers"
    }
  ]
}
```

---

## Testing Checklist

### MVP Functionality
- [ ] Application launches without errors
- [ ] Overlay window appears transparent with glassmorphism effect
- [ ] Overlay stays on top of other windows
- [ ] Overlay can be dragged to reposition
- [ ] F1 toggles overlay visibility (while game has focus)
- [ ] F2/F3 navigate build order steps
- [ ] F4 cycles between build orders
- [ ] Current step is visually highlighted
- [ ] Past steps are dimmed
- [ ] Build order loads from JSON
- [ ] System tray icon appears
- [ ] Tray menu works (show/hide/settings/quit)
- [ ] Window position persists between sessions
- [ ] Settings window opens from tray

### Cross-Platform
- [ ] Windows: Overlay works over fullscreen games
- [ ] macOS: Overlay works, permissions granted
- [ ] Linux: Overlay works (may need compositor support)

---

## Backlog (Post-MVP)

### P1 - Quick Wins
- [ ] Animated transitions (fade/blur on show/hide)
- [ ] Smooth step change animations
- [ ] Visual step progress bar

### P2 - Enhanced UX
- [ ] Multiple themes (dark/light/custom)
- [ ] Configurable hotkeys in settings UI
- [ ] Auto-show when match detected (via API polling)
- [ ] Compact/expanded view modes

### P3 - API Integration
- [ ] AoE4World API integration
- [ ] Player stats display
- [ ] Match history lookup
- [ ] Opponent analysis

### P4 - OBS Streaming
- [ ] Export overlay as HTML for OBS browser source
- [ ] Shared component library between app and web overlay
- [ ] Custom CSS theming support

### P5 - Advanced Features
- [ ] Build order visual editor (drag & drop steps)
- [ ] Timer integration with auto-advance
- [ ] Voice callouts (TTS)
- [ ] Import from age4builder.com / aoe4guides.com

### P6 - Platform Features
- [ ] Plugin/extension system
- [ ] Cloud sync for settings and build orders
- [ ] Community build order sharing

---

## Resources

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Tauri Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [AoE4World API](https://aoe4world.com/api)
- [FluffyMaguro's Original Overlay](https://github.com/FluffyMaguro/AoE4_Overlay)
- [age4builder.com](https://age4builder.com/) - Build order source
- [aoe4guides.com](https://aoe4guides.com/) - Build order source

---

## Notes for Claude Code

1. **Start with scaffolding** - Get Tauri + React + Tailwind + shadcn/ui working first with a basic transparent window.

2. **Iterate on the overlay** - Get the glassmorphism panel rendering before adding build order logic.

3. **Test hotkeys early** - Global hotkeys are the trickiest part. Verify they work when another window has focus.

4. **Use the sample JSON** - The English Longbow Rush build order is provided as test data.

5. **Platform quirks**:
   - Windows: May need to disable DWM for true transparency in some cases
   - macOS: Requires accessibility permissions for global hotkeys
   - Linux: Transparency depends on compositor (X11 vs Wayland)

6. **Don't over-engineer** - MVP first. Get it working ugly, then make it pretty.
