# Build Order Format

This document describes the JSON format for AoE4 Overlay build orders.

## File Location

Build orders are stored as JSON files in:
- **Bundled**: `public/build-orders/` (sample builds)
- **User**: `~/.config/aoe4-overlay/build-orders/` (custom builds)

## Schema

```json
{
  "id": "string",
  "name": "string",
  "civilization": "string",
  "description": "string",
  "difficulty": "string",
  "enabled": true,
  "steps": [
    {
      "id": "string",
      "description": "string",
      "timing": "string",
      "resources": {
        "food": 0,
        "wood": 0,
        "gold": 0,
        "stone": 0
      }
    }
  ]
}
```

## Field Reference

### Root Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (used for filename) |
| `name` | string | Yes | Display name in UI |
| `civilization` | string | Yes | Civilization name (see list below) |
| `description` | string | Yes | Strategy description |
| `difficulty` | string | Yes | Skill level required |
| `enabled` | boolean | No | Whether to include in rotation (default: true) |
| `steps` | array | Yes | Build order steps |

### Step Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `description` | string | Yes | Step instructions (supports icon markers) |
| `timing` | string | No | Expected game time (MM:SS format) |
| `resources` | object | No | Villager assignments |

### Resources Object

| Field | Type | Description |
|-------|------|-------------|
| `food` | number | Villagers on food |
| `wood` | number | Villagers on wood |
| `gold` | number | Villagers on gold |
| `stone` | number | Villagers on stone |

## Civilizations

Valid civilization values:

```
English
French
Holy Roman Empire
Rus
Chinese
Delhi Sultanate
Abbasid Dynasty
Mongols
Ottomans
Malians
Byzantines
Japanese
Jeanne d'Arc
Ayyubids
Zhu Xi's Legacy
Order of the Dragon
```

## Difficulty Levels

```
Beginner
Intermediate
Advanced
Expert
```

## Icon Markers

Use `[icon:name]` syntax in step descriptions to display game icons.

### Syntax

```
[icon:villager] Queue 2 villagers to [icon:sheep] sheep
```

### Available Icons

#### Units
| Marker | Display |
|--------|---------|
| `[icon:villager]` | Villager |
| `[icon:scout]` | Scout |
| `[icon:knight]` | Knight |
| `[icon:spearman]` | Spearman |
| `[icon:man_at_arms]` | Man-at-Arms |
| `[icon:longbowman]` | Longbowman |
| `[icon:crossbowman]` | Crossbowman |
| `[icon:horseman]` | Horseman |
| `[icon:monk]` | Monk/Prelate |

#### Buildings
| Marker | Display |
|--------|---------|
| `[icon:house]` | House |
| `[icon:town_center]` | Town Center |
| `[icon:barracks]` | Barracks |
| `[icon:archery_range]` | Archery Range |
| `[icon:stable]` | Stable |
| `[icon:blacksmith]` | Blacksmith |
| `[icon:mining_camp]` | Mining Camp |
| `[icon:lumber_camp]` | Lumber Camp |
| `[icon:farm]` | Farm |
| `[icon:mill]` | Mill |
| `[icon:dock]` | Dock |
| `[icon:market]` | Market |
| `[icon:monastery]` | Monastery |
| `[icon:university]` | University |
| `[icon:siege_workshop]` | Siege Workshop |
| `[icon:keep]` | Keep |
| `[icon:outpost]` | Outpost |

#### Resources
| Marker | Display |
|--------|---------|
| `[icon:food]` | Food |
| `[icon:wood]` | Wood |
| `[icon:gold]` | Gold |
| `[icon:stone]` | Stone |
| `[icon:sheep]` | Sheep |

#### Ages
| Marker | Display |
|--------|---------|
| `[icon:dark_age]` | Dark Age |
| `[icon:feudal_age]` | Feudal Age |
| `[icon:castle_age]` | Castle Age |
| `[icon:imperial_age]` | Imperial Age |

#### Actions
| Marker | Display |
|--------|---------|
| `[icon:attack]` | Attack |
| `[icon:upgrade]` | Upgrade |

#### Civ-Specific
| Marker | Display |
|--------|---------|
| `[icon:relic]` | Relic (HRE) |

### TTS Conversion

Icon markers are converted to speech-friendly text:
- `[icon:town_center]` → "town center"
- `[icon:mining_camp]` → "mining camp"
- Snake_case converted to spaces

## Example: French Knight Rush

```json
{
  "id": "french-knight-rush",
  "name": "French Knight Rush",
  "civilization": "French",
  "description": "Fast Feudal with School of Cavalry for early knight pressure.",
  "difficulty": "Intermediate",
  "enabled": true,
  "steps": [
    {
      "id": "step-1",
      "description": "[icon:villager] Queue 2 villagers, rally to [icon:sheep] sheep",
      "timing": "0:00",
      "resources": { "food": 6, "wood": 0, "gold": 0, "stone": 0 }
    },
    {
      "id": "step-2",
      "description": "[icon:house] Build house with [icon:scout] scout, [icon:villager] villager to [icon:sheep] sheep",
      "timing": "0:25",
      "resources": { "food": 7, "wood": 0, "gold": 0, "stone": 0 }
    },
    {
      "id": "step-3",
      "description": "[icon:villager] Villager to [icon:wood] wood",
      "timing": "0:50",
      "resources": { "food": 7, "wood": 1, "gold": 0, "stone": 0 }
    },
    {
      "id": "step-4",
      "description": "[icon:villager] Villager to [icon:wood] wood",
      "timing": "1:15",
      "resources": { "food": 7, "wood": 2, "gold": 0, "stone": 0 }
    },
    {
      "id": "step-5",
      "description": "[icon:villager] Villager to [icon:gold] gold",
      "timing": "1:40",
      "resources": { "food": 7, "wood": 2, "gold": 1, "stone": 0 }
    },
    {
      "id": "step-6",
      "description": "[icon:mining_camp] Build Mining Camp, [icon:villager] villager to [icon:gold] gold",
      "timing": "2:00",
      "resources": { "food": 7, "wood": 2, "gold": 2, "stone": 0 }
    },
    {
      "id": "step-7",
      "description": "[icon:villager] Villager to [icon:gold] gold",
      "timing": "2:25",
      "resources": { "food": 7, "wood": 2, "gold": 3, "stone": 0 }
    },
    {
      "id": "step-8",
      "description": "[icon:lumber_camp] Build Lumber Camp, [icon:villager] villager to [icon:wood] wood",
      "timing": "2:50",
      "resources": { "food": 7, "wood": 3, "gold": 3, "stone": 0 }
    },
    {
      "id": "step-9",
      "description": "[icon:feudal_age] Build School of Cavalry - use 2 [icon:villager] villagers",
      "timing": "3:15",
      "resources": { "food": 7, "wood": 1, "gold": 3, "stone": 0 }
    },
    {
      "id": "step-10",
      "description": "[icon:villager] Continue villagers to [icon:food] food during age up",
      "timing": "3:45",
      "resources": { "food": 9, "wood": 1, "gold": 3, "stone": 0 }
    },
    {
      "id": "step-11",
      "description": "[icon:feudal_age] Feudal Age! [icon:knight] Queue knights from School of Cavalry",
      "timing": "4:30",
      "resources": { "food": 9, "wood": 3, "gold": 3, "stone": 0 }
    },
    {
      "id": "step-12",
      "description": "[icon:stable] Build Stable for double [icon:knight] knight production",
      "timing": "5:00",
      "resources": { "food": 8, "wood": 4, "gold": 4, "stone": 0 }
    },
    {
      "id": "step-13",
      "description": "[icon:attack] Harass with 2-3 [icon:knight] knights, target [icon:villager] villagers",
      "timing": "5:30",
      "resources": { "food": 8, "wood": 4, "gold": 5, "stone": 0 }
    },
    {
      "id": "step-14",
      "description": "[icon:knight] Maintain knight pressure while booming behind it",
      "timing": "6:30",
      "resources": { "food": 10, "wood": 5, "gold": 6, "stone": 0 }
    }
  ]
}
```

## Sample Build Orders Included

| File | Civilization | Strategy |
|------|--------------|----------|
| `french-knight-rush.json` | French | Fast Feudal knight rush |
| `english-longbow-rush.json` | English | Council Hall longbow pressure |
| `chinese-zhuge-nu-rush.json` | Chinese | Song Dynasty Zhuge Nu spam |
| `mongols-tower-rush.json` | Mongols | Aggressive forward TC tower rush |
| `hre-fast-castle.json` | Holy Roman Empire | Prelate eco into Regnitz Cathedral |

## Creating Custom Build Orders

1. Copy an existing build order as a template
2. Change the `id` to a unique value
3. Update name, civilization, description, difficulty
4. Modify steps for your strategy
5. Save as `{id}.json` in build-orders folder
6. Restart the app or use Import in Settings

## Tips

- Keep step descriptions concise (TTS will read them)
- Use icon markers for visual clarity
- Include timing for pace tracking
- Resource counts show villager assignments, not totals
- Test your build order by cycling through steps
