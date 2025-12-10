import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Settings window.
 * Represents the settings UI with tabs for different configuration categories.
 */
export class SettingsPage {
  readonly page: Page;

  // Main container
  readonly container: Locator;
  readonly heading: Locator;

  // Tab navigation
  readonly tabsList: Locator;
  readonly buildOrdersTab: Locator;
  readonly playerTab: Locator;
  readonly gameplayTab: Locator;
  readonly voiceTab: Locator;
  readonly appearanceTab: Locator;
  readonly hotkeysTab: Locator;

  // Build Orders tab elements
  readonly buildOrdersFilter: {
    civilization: Locator;
    difficulty: Locator;
  };
  readonly importButton: Locator;
  readonly exportButton: Locator;
  readonly buildOrderList: Locator;

  // Player tab elements
  readonly playerStatsContainer: Locator;

  // Gameplay tab elements
  readonly gameplaySettingsContainer: Locator;
  readonly telemetryToggle: Locator;
  readonly upgradeBadgesSettings: Locator;

  // Voice tab elements
  readonly voiceSettingsContainer: Locator;
  readonly reminderSettings: Locator;

  // Appearance tab elements
  readonly appearanceSettingsContainer: Locator;
  readonly themeSelect: Locator;
  readonly fontSizeSelect: Locator;
  readonly opacitySlider: Locator;
  readonly opacityValue: Locator;
  readonly uiScaleSlider: Locator;
  readonly uiScaleValue: Locator;
  readonly overlayPresetSelect: Locator;
  readonly coachOnlyModeToggle: Locator;

  // Hotkeys tab elements
  readonly hotkeysContainer: Locator;
  readonly aboutSection: Locator;
  readonly resetAllSettingsButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main container - use data-testid from SettingsWindow.tsx
    this.container = page.locator('[data-testid="settings-container"]');
    this.heading = page.locator('h1').filter({ hasText: 'Settings' });

    // Tab navigation - TabsTrigger have data-value attributes
    this.tabsList = page.locator('[role="tablist"]');
    this.buildOrdersTab = page.locator('[data-value="build-orders"]');
    this.playerTab = page.locator('[data-value="player"]');
    this.gameplayTab = page.locator('[data-value="gameplay"]');
    this.voiceTab = page.locator('[data-value="voice"]');
    this.appearanceTab = page.locator('[data-value="appearance"]');
    this.hotkeysTab = page.locator('[data-value="hotkeys"]');

    // Build Orders tab - filter selects with Label components (no htmlFor, use text)
    // The filters are inside a div with Filter icon, containing grid with civilization and difficulty selects
    this.buildOrdersFilter = {
      // Find the select trigger inside the div that has "Civilization" label
      civilization: page.locator('.space-y-1').filter({ hasText: 'Civilization' }).locator('button[role="combobox"]'),
      difficulty: page.locator('.space-y-1').filter({ hasText: 'Difficulty' }).locator('button[role="combobox"]'),
    };
    this.importButton = page.locator('[data-testid="import-button"]');
    this.exportButton = page.getByRole('button', { name: /Export/i });
    // Build order list - look for build order cards or the first-launch wizard
    // Mock data includes "English Longbow Rush" build order
    this.buildOrderList = page.getByText('English Longbow Rush').or(
      page.getByText('First-launch wizard')
    ).or(page.locator('[data-testid="build-order-list"]'));

    // Player tab - PlayerStats component shows "Link Your Profile" card initially
    this.playerStatsContainer = page.locator('[data-testid="player-stats"]').or(
      page.getByText('Link Your Profile')
    ).or(page.getByRole('heading', { name: 'Link Your Profile' }));

    // Gameplay tab - uses sections with bg-muted/30 and h2 headings
    // Use .first() to handle multiple matching elements
    this.gameplaySettingsContainer = page.getByRole('heading', { name: 'Overlay Behavior' });
    this.telemetryToggle = page.locator('#telemetry');
    this.upgradeBadgesSettings = page.getByRole('heading', { name: 'Upgrade Badges' });

    // Voice tab
    this.voiceSettingsContainer = page.locator('section').filter({ hasText: 'Voice' }).first();
    this.reminderSettings = page.locator('section').filter({ hasText: 'Reminder' }).first();

    // Appearance tab - using IDs and labels from AppearanceSettings.tsx
    this.appearanceSettingsContainer = page.locator('section.bg-muted\\/30').filter({ hasText: 'Theme' }).first();
    this.themeSelect = page.locator('.space-y-2').filter({ hasText: 'Color Theme' }).locator('button[role="combobox"]');
    this.fontSizeSelect = page.locator('.space-y-2').filter({ hasText: 'Font Size' }).locator('button[role="combobox"]');
    this.opacitySlider = page.locator('[data-testid="opacity-slider"]');
    // The opacity value is a span with text-muted-foreground class inside the div that has "Overlay Opacity" label
    this.opacityValue = page.getByLabel('Overlay Opacity').locator('xpath=..').locator('span.text-muted-foreground').or(
      page.locator('label').filter({ hasText: 'Overlay Opacity' }).locator('xpath=..').locator('span')
    );
    this.uiScaleSlider = page.locator('[data-testid="ui-scale-slider"]');
    this.uiScaleValue = page.getByLabel('UI Scale').locator('xpath=..').locator('span.text-muted-foreground').or(
      page.locator('label').filter({ hasText: 'UI Scale' }).locator('xpath=..').locator('span')
    );
    this.overlayPresetSelect = page.locator('.space-y-2').filter({ hasText: 'Overlay Preset' }).locator('button[role="combobox"]');
    this.coachOnlyModeToggle = page.locator('#coach-mode');

    // Hotkeys tab
    this.hotkeysContainer = page.locator('section').filter({ hasText: 'Hotkey' }).first();
    this.aboutSection = page.locator('section').filter({ hasText: 'About' }).first();
    this.resetAllSettingsButton = page.getByRole('button', { name: /Reset All Settings/i });
  }

  /**
   * Select a specific tab by name
   */
  async selectTab(tabName: 'build-orders' | 'player' | 'gameplay' | 'voice' | 'appearance' | 'hotkeys') {
    const tabMap = {
      'build-orders': this.buildOrdersTab,
      'player': this.playerTab,
      'gameplay': this.gameplayTab,
      'voice': this.voiceTab,
      'appearance': this.appearanceTab,
      'hotkeys': this.hotkeysTab,
    };

    const tab = tabMap[tabName];
    if (tab) {
      await tab.click();
      // Wait for tab content to be visible
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Check if a tab is currently active
   */
  async isTabActive(tabName: 'build-orders' | 'player' | 'gameplay' | 'voice' | 'appearance' | 'hotkeys'): Promise<boolean> {
    const tabMap = {
      'build-orders': this.buildOrdersTab,
      'player': this.playerTab,
      'gameplay': this.gameplayTab,
      'voice': this.voiceTab,
      'appearance': this.appearanceTab,
      'hotkeys': this.hotkeysTab,
    };

    const tab = tabMap[tabName];
    if (!tab) return false;

    const ariaSelected = await tab.getAttribute('aria-selected');
    const dataState = await tab.getAttribute('data-state');

    return ariaSelected === 'true' || dataState === 'active';
  }

  /**
   * Set the overlay opacity using the slider.
   */
  async setOpacity(value: number) {
    // Ensure value is between 0.1 and 1
    const clampedValue = Math.max(0.1, Math.min(1, value));

    const slider = this.opacitySlider;
    await slider.waitFor({ state: 'visible' });

    // For Radix UI sliders, we need to use keyboard navigation
    await slider.focus();

    // Get current value and calculate steps
    const currentText = await this.opacityValue.textContent();
    const currentPercent = parseInt(currentText?.replace('%', '') || '100', 10) / 100;
    const diff = clampedValue - currentPercent;
    const steps = Math.round(diff / 0.1); // step is 0.1

    const key = steps > 0 ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < Math.abs(steps); i++) {
      await slider.press(key);
    }
  }

  /**
   * Get the current opacity value
   */
  async getOpacity(): Promise<number> {
    const text = await this.opacityValue.textContent();
    if (!text) return 0;

    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) / 100 : 0;
  }

  /**
   * Set the UI scale using the slider.
   */
  async setUIScale(value: number) {
    const clampedValue = Math.max(0.85, Math.min(1.2, value));

    const slider = this.uiScaleSlider;
    await slider.waitFor({ state: 'visible' });

    await slider.focus();

    const currentText = await this.uiScaleValue.textContent();
    const currentPercent = parseInt(currentText?.replace('%', '') || '100', 10) / 100;
    const diff = clampedValue - currentPercent;
    const steps = Math.round(diff / 0.05); // step is 0.05

    const key = steps > 0 ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < Math.abs(steps); i++) {
      await slider.press(key);
    }
  }

  /**
   * Get the current UI scale value
   */
  async getUIScale(): Promise<number> {
    const text = await this.uiScaleValue.textContent();
    if (!text) return 0;

    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) / 100 : 0;
  }

  /**
   * Set the theme
   */
  async setTheme(theme: 'dark' | 'light' | 'system') {
    await this.themeSelect.click();
    const option = this.page.getByRole('option', { name: new RegExp(`^${theme}$`, 'i') });
    await option.click();
  }

  /**
   * Set the font size
   */
  async setFontSize(size: 'small' | 'medium' | 'large') {
    await this.fontSizeSelect.click();
    const option = this.page.getByRole('option', { name: new RegExp(`^${size}$`, 'i') });
    await option.click();
  }

  /**
   * Set the overlay preset
   */
  async setOverlayPreset(preset: 'info_dense' | 'minimal') {
    await this.overlayPresetSelect.click();
    const displayName = preset === 'info_dense' ? 'Info dense' : 'Minimal';
    const option = this.page.getByRole('option', { name: displayName });
    await option.click();
  }

  /**
   * Toggle coach-only mode
   */
  async toggleCoachOnlyMode() {
    await this.coachOnlyModeToggle.click();
  }

  /**
   * Set civilization filter
   */
  async setCivilizationFilter(civilization: string) {
    await this.buildOrdersFilter.civilization.waitFor({ state: 'visible' });
    await this.buildOrdersFilter.civilization.click();
    const option = this.page.getByRole('option', { name: civilization });
    await option.click();
  }

  /**
   * Set difficulty filter
   */
  async setDifficultyFilter(difficulty: string) {
    await this.buildOrdersFilter.difficulty.click();
    const option = this.page.getByRole('option', { name: difficulty });
    await option.click();
  }
}
