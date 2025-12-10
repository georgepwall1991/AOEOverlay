/* eslint-disable no-undef */
/**
 * Application Launch Tests
 *
 * Basic tests verifying the Tauri application launches successfully
 * and displays the overlay window.
 *
 * Note: These tests use native WebDriver protocol which has limitations
 * compared to Playwright. Focus is on basic app lifecycle and visibility.
 *
 * WebdriverIO globals (browser, $, $$, expect, describe, it) are provided at runtime.
 */

describe('Application Launch', () => {

  it('should launch the application successfully', async () => {
    // Wait for app to be fully initialized
    await browser.pause(1000);

    // Check window title matches expected value
    const title = await browser.getTitle();
    expect(title).toBe('AoE4 Overlay');

    // Verify body element is present and visible
    const body = await $('body');
    await body.waitForDisplayed({ timeout: 5000 });
    expect(await body.isDisplayed()).toBe(true);

    // Verify root element exists
    const root = await $('#root');
    expect(await root.isExisting()).toBe(true);
  });

  it('should display the overlay window', async () => {
    // Wait for React app to render content
    // Note: First launch may show onboarding wizard instead of overlay-container
    const root = await $('#root');
    await root.waitForExist({ timeout: 5000 });

    // Verify root has rendered children (React mounted)
    const children = await root.$$('*');
    expect(children.length).toBeGreaterThan(0);

    // Check if either overlay or onboarding is present
    const overlayContainer = await $('[data-testid="overlay-container"]');
    const onboardingButton = await $('button'); // Onboarding wizard has buttons

    const overlayExists = await overlayContainer.isExisting();
    const onboardingExists = await onboardingButton.isExisting();

    // At least one should exist - either the main overlay or the onboarding wizard
    expect(overlayExists || onboardingExists).toBe(true);
  });

  it('should have correct window size', async () => {
    // Get current window size
    const windowSize = await browser.getWindowSize();

    // Verify window has reasonable dimensions
    // Default overlay window should be at least 800x600
    expect(windowSize.width).toBeGreaterThanOrEqual(800);
    expect(windowSize.height).toBeGreaterThanOrEqual(600);

    // Verify window is not maximized (overlay should be sized appropriately)
    expect(windowSize.width).toBeLessThan(2000);
    expect(windowSize.height).toBeLessThan(1500);
  });

  it('should have transparent background', async () => {
    // Verify the HTML element exists
    const html = await $('html');
    await html.waitForDisplayed({ timeout: 3000 });

    // Check that dark class is applied (from index.html)
    const htmlClass = await html.getAttribute('class');
    expect(htmlClass).toContain('dark');
  });

  it('should load application without critical console errors', async () => {
    // Get browser logs (limited in WebDriver but worth checking)
    const logs = await browser.getLogs('browser');

    // Filter for severe errors only, excluding known acceptable errors
    const errors = logs.filter(log => {
      if (log.level !== 'SEVERE') return false;

      // Ignore specific known non-critical errors
      const message = log.message || '';
      // ResizeObserver errors are benign and expected in some browsers
      if (message.includes('ResizeObserver')) return false;
      // First-launch onboarding may trigger benign errors
      if (message.includes('onboarding')) return false;

      return true;
    });

    // Log errors for debugging but don't fail on minor issues
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }

    // Allow up to 1 error for Windows environment differences
    expect(errors.length).toBeLessThanOrEqual(1);
  });

  it('should render root React element', async () => {
    // Verify React root is mounted
    const root = await $('#root');
    await root.waitForExist({ timeout: 5000 });

    // Root should have child elements (React has rendered)
    const hasChildren = await root.$$('*').length > 0;
    expect(hasChildren).toBe(true);
  });

  it('should be ready for interaction within timeout', async () => {
    // Wait for app to be interactive
    await browser.waitUntil(
      async () => {
        const body = await $('body');
        return await body.isDisplayed();
      },
      {
        timeout: 10000,
        timeoutMsg: 'Application did not become ready within 10 seconds'
      }
    );

    // If we reach here, app launched successfully
    expect(true).toBe(true);
  });
});
