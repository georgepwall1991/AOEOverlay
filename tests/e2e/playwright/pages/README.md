# Page Object Models (POMs)

This directory contains Page Object Models for Playwright E2E tests. POMs provide a clean abstraction layer over the UI, making tests more maintainable and readable.

## Available Page Objects

### OverlayPage (`overlay.page.ts`)

Represents the main overlay window that displays build orders during gameplay.

**Key Features:**
- Build order display with steps
- Timer bar and progress tracking
- Quick action bar controls (prev/next, play/pause, reset, cycle)
- Settings access
- Branch navigation
- Compact mode detection

**Example Usage:**
```typescript
import { OverlayPage } from '../pages';

test('navigate through steps', async ({ page }) => {
  const overlayPage = new OverlayPage(page);
  await overlayPage.goto();

  // Navigate steps
  await overlayPage.nextStep();
  await overlayPage.nextStep();

  // Check current position
  const currentIndex = await overlayPage.getCurrentStepIndex();
  expect(currentIndex).toBe(3);

  // Reset to beginning
  await overlayPage.reset();
});
```

**Main Methods:**
- `goto()` - Navigate to the overlay
- `getCurrentStep()` - Get active step element
- `getStep(index)` - Get specific step by index
- `clickStep(index)` - Click a step to navigate
- `getStepCount()` - Get number of visible steps
- `getCurrentStepIndex()` - Get current step number
- `getTotalStepCount()` - Get total steps in build
- `nextStep()` - Navigate to next step
- `previousStep()` - Navigate to previous step
- `reset()` - Reset to first step
- `toggleTimer()` - Play/pause timer
- `cycleBuildOrder()` - Switch to next build order
- `openSettings()` - Open settings window
- `getBuildOrderName()` - Get current build order name
- `getPaceStatus()` - Get pace indicator (ahead/behind/on-pace)
- `isTimerRunning()` - Check if timer is active

### SettingsPage (`settings.page.ts`)

Represents the settings window with tabbed interface for configuration.

**Key Features:**
- Tab navigation (build-orders, player, gameplay, voice, appearance, hotkeys)
- Build order management and filtering
- Appearance settings (theme, opacity, scale)
- Import/Export functionality
- Reset all settings

**Example Usage:**
```typescript
import { SettingsPage } from '../pages';

test('change appearance settings', async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  await settingsPage.gotoSettings();

  // Change theme
  await settingsPage.setTheme('dark');

  // Adjust opacity
  await settingsPage.setOpacity(0.8);

  // Change font size
  await settingsPage.setFontSize('large');
});
```

**Main Methods:**
- `gotoSettings()` - Navigate to settings
- `selectTab(tabName)` - Switch tabs
- `isTabActive(tabName)` - Check active tab
- `setOpacity(value)` - Adjust overlay opacity (0.1-1.0)
- `getOpacity()` - Get current opacity
- `setUIScale(value)` - Adjust UI scale (0.85-1.2)
- `getUIScale()` - Get current scale
- `setTheme(theme)` - Set color theme
- `setFontSize(size)` - Set font size
- `setOverlayPreset(preset)` - Set overlay preset
- `toggleCoachOnlyMode()` - Toggle coach-only mode
- `setCivilizationFilter(civ)` - Filter by civilization
- `setDifficultyFilter(diff)` - Filter by difficulty
- `clickImport()` - Trigger import dialog
- `loadStarterBuild()` - Load starter build
- `resetAllSettings()` - Reset to defaults
- `getVersion()` - Get app version

## Locator Strategy

POMs use a dual-locator strategy for robustness:

1. **Primary**: `data-testid` attributes (to be added to components)
2. **Fallback**: Semantic selectors (role, text, title attributes)

Example:
```typescript
this.settingsButton = page.locator('[data-testid="settings-button"]').or(
  page.locator('button[title="Open Settings"]')
);
```

This ensures tests work now (with fallbacks) and will be more robust once `data-testid` attributes are added.

## Best Practices

1. **Use POMs consistently** - All UI interactions should go through POMs
2. **Keep selectors in POMs** - Never use raw selectors in test files
3. **Add helper methods** - Create domain-specific methods for common workflows
4. **Document assumptions** - Use JSDoc comments to explain behavior
5. **Return typed values** - Methods should return specific types, not raw Locators when possible

## Next Steps

1. Add `data-testid` attributes to components for more reliable selectors
2. Create additional POMs as needed (e.g., BuildOrderEditorPage)
3. Add more helper methods based on test requirements
4. Consider creating fixture files for test data
