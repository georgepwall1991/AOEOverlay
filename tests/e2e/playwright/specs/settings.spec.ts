import { test, expect } from '@playwright/test';
import { SettingsPage } from '../pages';

/**
 * Comprehensive E2E tests for the Settings window.
 * Tests all settings tabs, controls, and configuration options.
 *
 * Note: In Tauri, settings opens in a separate window. For browser testing,
 * we navigate to the settings window label by setting up the mock environment.
 * We use the ?window=settings URL parameter to switch to settings mode.
 */
test.describe('Settings Window', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    // Navigate to settings window using URL parameter
    await page.goto('/?window=settings');
    // Wait for the settings container to be visible
    await settingsPage.container.waitFor({ state: 'visible', timeout: 10000 });
  });

  test.describe('Window and Layout', () => {
    test('settings window loads', async () => {
      // Check that settings container is visible
      await expect(settingsPage.container).toBeVisible();
    });

    test('settings heading is visible', async () => {
      await expect(settingsPage.heading).toBeVisible();
    });
  });

  test.describe('Tab Navigation', () => {
    test('all tabs are visible', async () => {
      // Verify all tab buttons are present
      await expect(settingsPage.buildOrdersTab).toBeVisible();
      await expect(settingsPage.playerTab).toBeVisible();
      await expect(settingsPage.gameplayTab).toBeVisible();
      await expect(settingsPage.voiceTab).toBeVisible();
      await expect(settingsPage.appearanceTab).toBeVisible();
      await expect(settingsPage.hotkeysTab).toBeVisible();
    });

    test('can switch to build-orders tab', async () => {
      await settingsPage.selectTab('build-orders');
      expect(await settingsPage.isTabActive('build-orders')).toBe(true);
    });

    test('can switch to player tab', async () => {
      await settingsPage.selectTab('player');
      expect(await settingsPage.isTabActive('player')).toBe(true);
    });

    test('can switch to gameplay tab', async () => {
      await settingsPage.selectTab('gameplay');
      expect(await settingsPage.isTabActive('gameplay')).toBe(true);
    });

    test('can switch to voice tab', async () => {
      await settingsPage.selectTab('voice');
      expect(await settingsPage.isTabActive('voice')).toBe(true);
    });

    test('can switch to appearance tab', async () => {
      await settingsPage.selectTab('appearance');
      expect(await settingsPage.isTabActive('appearance')).toBe(true);
    });

    test('can switch to hotkeys tab', async () => {
      await settingsPage.selectTab('hotkeys');
      expect(await settingsPage.isTabActive('hotkeys')).toBe(true);
    });

    test('tab switching works correctly', async () => {
      // Switch through multiple tabs
      await settingsPage.selectTab('appearance');
      expect(await settingsPage.isTabActive('appearance')).toBe(true);
      expect(await settingsPage.isTabActive('gameplay')).toBe(false);

      await settingsPage.selectTab('gameplay');
      expect(await settingsPage.isTabActive('gameplay')).toBe(true);
      expect(await settingsPage.isTabActive('appearance')).toBe(false);

      await settingsPage.selectTab('voice');
      expect(await settingsPage.isTabActive('voice')).toBe(true);
      expect(await settingsPage.isTabActive('gameplay')).toBe(false);
    });
  });

  test.describe('Appearance Tab', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('appearance');
    });

    test('appearance settings container is visible', async () => {
      await expect(settingsPage.appearanceSettingsContainer).toBeVisible();
    });

    test('theme select is present', async () => {
      await expect(settingsPage.themeSelect).toBeVisible();
    });

    test('font size select is present', async () => {
      await expect(settingsPage.fontSizeSelect).toBeVisible();
    });

    test('opacity slider is present', async () => {
      await expect(settingsPage.opacitySlider).toBeVisible();
    });

    test('opacity slider can be interacted with', async ({ page }) => {
      // Verify slider is visible
      await expect(settingsPage.opacitySlider).toBeVisible();

      // Click on the slider to interact with it
      await settingsPage.opacitySlider.click();

      // Verify the slider container has the expected structure (Radix Slider)
      const sliderTrack = page.locator('[data-testid="opacity-slider"] [data-orientation="horizontal"]').first();
      await expect(sliderTrack).toBeVisible();
    });

    test('UI scale slider is present', async () => {
      await expect(settingsPage.uiScaleSlider).toBeVisible();
    });

    test('UI scale slider works', async () => {
      // Get initial scale
      const initialScale = await settingsPage.getUIScale();
      expect(initialScale).toBeGreaterThanOrEqual(0.85);
      expect(initialScale).toBeLessThanOrEqual(1.2);

      // Adjust scale
      await settingsPage.setUIScale(1.0);

      // Wait for update
      await settingsPage.page.waitForTimeout(100);

      // Verify scale changed
      const newScale = await settingsPage.getUIScale();
      expect(newScale).toBeCloseTo(1.0, 1);
    });

    test('overlay preset select is present', async () => {
      await expect(settingsPage.overlayPresetSelect).toBeVisible();
    });

    test('coach only mode toggle is present', async () => {
      await expect(settingsPage.coachOnlyModeToggle).toBeVisible();
    });
  });

  test.describe('Build Orders Tab', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('build-orders');
    });

    test('build orders filter controls are visible', async () => {
      await expect(settingsPage.buildOrdersFilter.civilization).toBeVisible();
      await expect(settingsPage.buildOrdersFilter.difficulty).toBeVisible();
    });

    test('import button is present', async () => {
      await expect(settingsPage.importButton).toBeVisible();
    });

    test('export button is present', async () => {
      await expect(settingsPage.exportButton).toBeVisible();
    });

    test('import button is clickable', async () => {
      await expect(settingsPage.importButton).toBeEnabled();
    });

    test('build order list is present', async () => {
      await expect(settingsPage.buildOrderList).toBeVisible();
    });
  });

  test.describe('Player Tab', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('player');
    });

    test('player stats container is visible', async () => {
      await expect(settingsPage.playerStatsContainer).toBeVisible();
    });
  });

  test.describe('Gameplay Tab', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('gameplay');
    });

    test('gameplay settings container is visible', async () => {
      await expect(settingsPage.gameplaySettingsContainer).toBeVisible();
    });

    test('telemetry toggle is present', async () => {
      await expect(settingsPage.telemetryToggle).toBeVisible();
    });

    test('upgrade badges settings are present', async () => {
      await expect(settingsPage.upgradeBadgesSettings).toBeVisible();
    });
  });

  test.describe('Voice Tab', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('voice');
    });

    test('voice settings container is visible', async () => {
      await expect(settingsPage.voiceSettingsContainer).toBeVisible();
    });

    test('reminder settings are present', async () => {
      await expect(settingsPage.reminderSettings).toBeVisible();
    });
  });

  test.describe('Hotkeys Tab', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('hotkeys');
    });

    test('hotkeys container is visible', async () => {
      await expect(settingsPage.hotkeysContainer).toBeVisible();
    });

    test('about section is visible', async () => {
      await expect(settingsPage.aboutSection).toBeVisible();
    });

    test('reset all settings button is present', async () => {
      await expect(settingsPage.resetAllSettingsButton).toBeVisible();
    });

    test('reset settings shows confirmation dialog', async ({ page }) => {
      // Click reset button to open dialog
      await settingsPage.resetAllSettingsButton.click();

      // Wait for and verify the confirmation dialog appears
      const dialogTitle = page.getByRole('alertdialog').getByText('Reset All Settings?');
      await expect(dialogTitle).toBeVisible({ timeout: 5000 });

      // Cancel the dialog
      await page.getByRole('button', { name: 'Cancel' }).click();
    });
  });

  test.describe('Theme Switching', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('appearance');
    });

    test('can change theme to light', async () => {
      await settingsPage.setTheme('light');
      // Verify theme select is still accessible (indicates no crash)
      await expect(settingsPage.themeSelect).toBeVisible();
    });

    test('can change theme to dark', async () => {
      await settingsPage.setTheme('dark');
      await expect(settingsPage.themeSelect).toBeVisible();
    });

    test('can change theme to system', async () => {
      await settingsPage.setTheme('system');
      await expect(settingsPage.themeSelect).toBeVisible();
    });
  });

  test.describe('Font Size Settings', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('appearance');
    });

    test('can change font size to small', async () => {
      await settingsPage.setFontSize('small');
      await expect(settingsPage.fontSizeSelect).toBeVisible();
    });

    test('can change font size to medium', async () => {
      await settingsPage.setFontSize('medium');
      await expect(settingsPage.fontSizeSelect).toBeVisible();
    });

    test('can change font size to large', async () => {
      await settingsPage.setFontSize('large');
      await expect(settingsPage.fontSizeSelect).toBeVisible();
    });
  });

  test.describe('Overlay Preset Settings', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('appearance');
    });

    test('can change overlay preset to info_dense', async () => {
      await settingsPage.setOverlayPreset('info_dense');
      await expect(settingsPage.overlayPresetSelect).toBeVisible();
    });

    test('can change overlay preset to minimal', async () => {
      await settingsPage.setOverlayPreset('minimal');
      await expect(settingsPage.overlayPresetSelect).toBeVisible();
    });
  });

  test.describe('Civilization Filter', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('build-orders');
    });

    test('can set civilization filter', async () => {
      await settingsPage.setCivilizationFilter('English');
      // Verify filter is still accessible
      await expect(settingsPage.buildOrdersFilter.civilization).toBeVisible();
    });
  });

  test.describe('Settings Persistence', () => {
    test('tab content persists across tab switches', async () => {
      // Switch to appearance tab and verify content is visible
      await settingsPage.selectTab('appearance');
      await expect(settingsPage.themeSelect).toBeVisible();

      // Switch to gameplay tab
      await settingsPage.selectTab('gameplay');
      await expect(settingsPage.gameplaySettingsContainer).toBeVisible();

      // Switch back to appearance - content should still be there
      await settingsPage.selectTab('appearance');
      await expect(settingsPage.themeSelect).toBeVisible();
      await expect(settingsPage.opacitySlider).toBeVisible();
    });
  });

  test.describe('Responsive Behavior', () => {
    test('settings window adapts to different viewport sizes', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect(settingsPage.container).toBeVisible();
      await expect(settingsPage.tabsList).toBeVisible();

      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(settingsPage.container).toBeVisible();
      await expect(settingsPage.tabsList).toBeVisible();
    });

    test('tabs remain accessible after resize', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 });

      await settingsPage.selectTab('appearance');
      expect(await settingsPage.isTabActive('appearance')).toBe(true);

      await settingsPage.selectTab('hotkeys');
      expect(await settingsPage.isTabActive('hotkeys')).toBe(true);
    });
  });

  test.describe('Coach Only Mode', () => {
    test.beforeEach(async () => {
      await settingsPage.selectTab('appearance');
    });

    test('can toggle coach only mode', async () => {
      await expect(settingsPage.coachOnlyModeToggle).toBeVisible();
      await settingsPage.toggleCoachOnlyMode();
      // Verify toggle is still accessible (no crash)
      await expect(settingsPage.coachOnlyModeToggle).toBeVisible();
    });
  });
});
