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
  readonly starterBuildWizard: Locator;
  readonly loadStarterBuildButton: Locator;

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

    // Main container
    this.container = page.locator('[data-testid="settings-window"]').or(
      page.locator('div.bg-background').filter({ hasText: 'Settings' }).first()
    );
    this.heading = page.locator('[data-testid="settings-heading"]').or(
      page.getByRole('heading', { name: 'Settings', level: 1 })
    );

    // Tab navigation
    this.tabsList = page.locator('[data-testid="settings-tabs-list"]').or(
      page.locator('[role="tablist"]')
    );
    this.buildOrdersTab = page.locator('[data-testid="tab-build-orders"]').or(
      page.getByRole('tab', { name: /Build Orders/i })
    );
    this.playerTab = page.locator('[data-testid="tab-player"]').or(
      page.getByRole('tab', { name: /Player/i })
    );
    this.gameplayTab = page.locator('[data-testid="tab-gameplay"]').or(
      page.getByRole('tab', { name: /Gameplay/i })
    );
    this.voiceTab = page.locator('[data-testid="tab-voice"]').or(
      page.getByRole('tab', { name: /Voice/i })
    );
    this.appearanceTab = page.locator('[data-testid="tab-appearance"]').or(
      page.getByRole('tab', { name: /Appearance/i })
    );
    this.hotkeysTab = page.locator('[data-testid="tab-hotkeys"]').or(
      page.getByRole('tab', { name: /Hotkeys/i })
    );

    // Build Orders tab
    this.buildOrdersFilter = {
      civilization: page.locator('[data-testid="filter-civilization"]').or(
        page.getByLabel('Civilization')
      ),
      difficulty: page.locator('[data-testid="filter-difficulty"]').or(
        page.getByLabel('Difficulty')
      ),
    };
    this.importButton = page.locator('[data-testid="import-button"]').or(
      page.getByRole('button', { name: /Import/i })
    );
    this.exportButton = page.locator('[data-testid="export-button"]').or(
      page.getByRole('button', { name: /Export/i })
    );
    this.buildOrderList = page.locator('[data-testid="build-order-list"]').or(
      page.locator('[role="list"]').filter({ has: page.locator('[data-testid="build-order-item"]') })
    );
    this.starterBuildWizard = page.locator('[data-testid="starter-build-wizard"]').or(
      page.getByText('First-launch wizard')
    );
    this.loadStarterBuildButton = page.locator('[data-testid="load-starter-build"]').or(
      page.getByRole('button', { name: /Load starter build/i })
    );

    // Player tab
    this.playerStatsContainer = page.locator('[data-testid="player-stats"]').or(
      page.getByText('Player Statistics').locator('..')
    );

    // Gameplay tab
    this.gameplaySettingsContainer = page.locator('[data-testid="gameplay-settings"]').or(
      page.getByText('Gameplay Settings').locator('..')
    );
    this.telemetryToggle = page.locator('[data-testid="telemetry-toggle"]').or(
      page.locator('#telemetry, input[type="checkbox"][name*="telemetry"]')
    );
    this.upgradeBadgesSettings = page.locator('[data-testid="upgrade-badges-settings"]').or(
      page.getByText('Upgrade Badges').locator('..')
    );

    // Voice tab
    this.voiceSettingsContainer = page.locator('[data-testid="voice-settings"]').or(
      page.getByText('Voice Settings').locator('..')
    );
    this.reminderSettings = page.locator('[data-testid="reminder-settings"]').or(
      page.getByText('Reminder Settings').locator('..')
    );

    // Appearance tab
    this.appearanceSettingsContainer = page.locator('[data-testid="appearance-settings"]').or(
      page.getByText('Appearance Settings').locator('..')
    );
    this.themeSelect = page.locator('[data-testid="theme-select"]').or(
      page.getByLabel('Color Theme')
    );
    this.fontSizeSelect = page.locator('[data-testid="font-size-select"]').or(
      page.getByLabel('Font Size')
    );
    this.opacitySlider = page.locator('[data-testid="opacity-slider"]').or(
      page.locator('#opacity')
    );
    this.opacityValue = page.locator('[data-testid="opacity-value"]').or(
      page.locator('label[for="opacity"]').locator('..').locator('.text-muted-foreground')
    );
    this.uiScaleSlider = page.locator('[data-testid="ui-scale-slider"]').or(
      page.locator('#scale')
    );
    this.uiScaleValue = page.locator('[data-testid="ui-scale-value"]').or(
      page.locator('label[for="scale"]').locator('..').locator('.text-muted-foreground')
    );
    this.overlayPresetSelect = page.locator('[data-testid="overlay-preset-select"]').or(
      page.getByLabel('Overlay Preset')
    );
    this.coachOnlyModeToggle = page.locator('[data-testid="coach-only-mode-toggle"]').or(
      page.locator('#coach-mode')
    );

    // Hotkeys tab
    this.hotkeysContainer = page.locator('[data-testid="hotkeys-settings"]').or(
      page.getByText('Keyboard Shortcuts').locator('..')
    );
    this.aboutSection = page.locator('[data-testid="about-section"]').or(
      page.getByText('About').locator('..')
    );
    this.resetAllSettingsButton = page.locator('[data-testid="reset-all-settings"]').or(
      page.getByRole('button', { name: /Reset All Settings/i })
    );
  }

  /**
   * Navigate to the settings page.
   *
   * IMPORTANT: In the Tauri application, settings opens in a separate window which Playwright
   * cannot access in browser mode. This method attempts multiple strategies:
   * 1. Direct route navigation (if a /settings route exists for testing)
   * 2. Clicking the settings button from overlay (may open new window in Tauri)
   *
   * For Tauri-specific testing, you may need to use Tauri's testing utilities or
   * mock the window creation behavior. In browser mode, ensure your app has a
   * /settings route or handles settings as a modal/panel instead of a new window.
   */
  async gotoSettings() {
    // Attempt to navigate to settings route if it exists
    await this.page.goto('/settings').catch(async () => {
      // If route doesn't exist, try clicking settings button from overlay
      await this.page.goto('/');
      const settingsButton = this.page.locator('button[title="Open Settings"]');
      await settingsButton.click();
    });
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
   * Uses Playwright's native slider support with keyboard navigation for precision.
   */
  async setOpacity(value: number) {
    // Ensure value is between 0.1 and 1
    const clampedValue = Math.max(0.1, Math.min(1, value));

    // Navigate to appearance tab first
    await this.selectTab('appearance');

    const slider = this.opacitySlider;
    await slider.waitFor({ state: 'visible' });

    // Focus the slider
    await slider.focus();

    // Get the slider's step attribute for precise keyboard navigation
    const step = parseFloat(await slider.getAttribute('step') || '0.01');

    // Calculate how many steps to move
    const currentValue = parseFloat(await slider.inputValue());
    const targetValue = clampedValue;
    const diff = targetValue - currentValue;
    const steps = Math.round(diff / step);

    // Use arrow keys to adjust the value
    const key = steps > 0 ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < Math.abs(steps); i++) {
      await slider.press(key);
    }
  }

  /**
   * Get the current opacity value
   */
  async getOpacity(): Promise<number> {
    await this.selectTab('appearance');
    const text = await this.opacityValue.textContent();
    if (!text) return 0;

    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) / 100 : 0;
  }

  /**
   * Set the UI scale using the slider.
   * Uses Playwright's native slider support with keyboard navigation for precision.
   */
  async setUIScale(value: number) {
    // Ensure value is between 0.85 and 1.2
    const clampedValue = Math.max(0.85, Math.min(1.2, value));

    await this.selectTab('appearance');

    const slider = this.uiScaleSlider;
    await slider.waitFor({ state: 'visible' });

    // Focus the slider
    await slider.focus();

    // Get the slider's step attribute for precise keyboard navigation
    const step = parseFloat(await slider.getAttribute('step') || '0.01');

    // Calculate how many steps to move
    const currentValue = parseFloat(await slider.inputValue());
    const targetValue = clampedValue;
    const diff = targetValue - currentValue;
    const steps = Math.round(diff / step);

    // Use arrow keys to adjust the value
    const key = steps > 0 ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < Math.abs(steps); i++) {
      await slider.press(key);
    }
  }

  /**
   * Get the current UI scale value
   */
  async getUIScale(): Promise<number> {
    await this.selectTab('appearance');
    const text = await this.uiScaleValue.textContent();
    if (!text) return 0;

    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) / 100 : 0;
  }

  /**
   * Set the theme
   */
  async setTheme(theme: 'dark' | 'light' | 'system') {
    await this.selectTab('appearance');
    await this.themeSelect.click();

    const option = this.page.getByRole('option', { name: new RegExp(theme, 'i') });
    await option.click();
  }

  /**
   * Set the font size
   */
  async setFontSize(size: 'small' | 'medium' | 'large') {
    await this.selectTab('appearance');
    await this.fontSizeSelect.click();

    const option = this.page.getByRole('option', { name: new RegExp(size, 'i') });
    await option.click();
  }

  /**
   * Set the overlay preset
   */
  async setOverlayPreset(preset: 'info_dense' | 'minimal') {
    await this.selectTab('appearance');
    await this.overlayPresetSelect.click();

    const displayName = preset === 'info_dense' ? 'Info dense' : 'Minimal';
    const option = this.page.getByRole('option', { name: displayName });
    await option.click();
  }

  /**
   * Toggle coach-only mode
   */
  async toggleCoachOnlyMode() {
    await this.selectTab('appearance');
    await this.coachOnlyModeToggle.click();
  }

  /**
   * Set civilization filter
   */
  async setCivilizationFilter(civilization: string) {
    await this.selectTab('build-orders');
    await this.buildOrdersFilter.civilization.click();

    const option = this.page.getByRole('option', { name: civilization });
    await option.click();
  }

  /**
   * Set difficulty filter
   */
  async setDifficultyFilter(difficulty: string) {
    await this.selectTab('build-orders');
    await this.buildOrdersFilter.difficulty.click();

    const option = this.page.getByRole('option', { name: difficulty });
    await option.click();
  }

  /**
   * Import a build order
   * Note: This will trigger the file dialog which needs to be handled in tests
   */
  async clickImport() {
    await this.selectTab('build-orders');
    await this.importButton.click();
  }

  /**
   * Load a starter build
   */
  async loadStarterBuild() {
    await this.selectTab('build-orders');
    await this.loadStarterBuildButton.click();
  }

  /**
   * Reset all settings to defaults
   */
  async resetAllSettings() {
    await this.selectTab('hotkeys');
    await this.resetAllSettingsButton.click();

    // Handle confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /Reset Settings/i });
    await confirmButton.click();
  }

  /**
   * Check if the first-launch wizard is visible
   */
  async isFirstLaunchWizardVisible(): Promise<boolean> {
    await this.selectTab('build-orders');
    return await this.starterBuildWizard.isVisible().catch(() => false);
  }

  /**
   * Get the version number from the About section
   */
  async getVersion(): Promise<string> {
    await this.selectTab('hotkeys');
    const versionText = await this.aboutSection.locator('p').filter({ hasText: /v\d/ }).textContent();
    return versionText?.match(/v[\d.]+/)?.[0] || '';
  }
}
