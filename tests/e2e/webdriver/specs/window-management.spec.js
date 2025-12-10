/* eslint-disable no-undef */
/**
 * Window Management Tests
 *
 * Tests for native window operations including window handles,
 * resizing, and UI element persistence across window operations.
 *
 * Note: Native WebDriver has limited access to Tauri window APIs.
 * These tests focus on basic WebDriver window management capabilities.
 *
 * WebdriverIO globals (browser, $, $$, expect, describe, it) are provided at runtime.
 */

describe('Window Management', () => {

  it('should have at least one window handle', async () => {
    // Get all window handles
    const handles = await browser.getWindowHandles();

    // Application should have at least the main overlay window
    expect(handles.length).toBeGreaterThanOrEqual(1);

    // Verify we can get the current window handle
    const currentHandle = await browser.getWindowHandle();
    expect(currentHandle).toBeTruthy();
    expect(typeof currentHandle).toBe('string');
  });

  it('should be able to resize the window', async () => {
    // Get initial window size
    const initialSize = await browser.getWindowSize();

    // Resize to a new dimension
    const newWidth = 1024;
    const newHeight = 768;
    await browser.setWindowSize(newWidth, newHeight);

    // Give UI time to adjust
    await browser.pause(500);

    // Verify new size (allow small variance due to OS chrome)
    const newSize = await browser.getWindowSize();
    expect(Math.abs(newSize.width - newWidth)).toBeLessThan(50);
    expect(Math.abs(newSize.height - newHeight)).toBeLessThan(50);
  });

  it('should maintain UI elements after resize', async () => {
    // Verify core elements exist before resize
    const overlayContainer = await $('[data-testid="overlay-container"]');
    await overlayContainer.waitForExist({ timeout: 3000 });
    const existedBefore = await overlayContainer.isExisting();

    // Resize window
    await browser.setWindowSize(1280, 800);
    await browser.pause(300);

    // Verify elements still exist after resize
    const existsAfter = await overlayContainer.isExisting();
    expect(existedBefore).toBe(true);
    expect(existsAfter).toBe(true);

    // Check other critical elements
    const root = await $('#root');
    expect(await root.isExisting()).toBe(true);
  });

  it('should handle window position changes', async () => {
    // Get current window position
    const initialPosition = await browser.getWindowRect();

    // Move window to new position
    await browser.setWindowRect({
      x: 100,
      y: 100,
      width: initialPosition.width,
      height: initialPosition.height
    });

    // Verify position changed (allow some variance)
    const newPosition = await browser.getWindowRect();
    expect(Math.abs(newPosition.x - 100)).toBeLessThan(50);
    expect(Math.abs(newPosition.y - 100)).toBeLessThan(50);
  });

  it('should support window rect operations', async () => {
    // Get full window rectangle
    const rect = await browser.getWindowRect();

    // Verify all properties exist
    expect(rect).toHaveProperty('x');
    expect(rect).toHaveProperty('y');
    expect(rect).toHaveProperty('width');
    expect(rect).toHaveProperty('height');

    // Verify values are reasonable
    expect(typeof rect.x).toBe('number');
    expect(typeof rect.y).toBe('number');
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  it('should maintain window state across operations', async () => {
    // Perform multiple window operations
    const originalSize = await browser.getWindowSize();

    // Resize
    await browser.setWindowSize(900, 700);
    await browser.pause(200);

    // Move
    await browser.setWindowRect({ x: 50, y: 50, width: 900, height: 700 });
    await browser.pause(200);

    // Resize again
    await browser.setWindowSize(1100, 800);
    await browser.pause(200);

    // Verify app is still responsive
    const body = await $('body');
    expect(await body.isDisplayed()).toBe(true);

    // Verify root still exists
    const root = await $('#root');
    expect(await root.isExisting()).toBe(true);
  });

  it('should handle multiple resize events gracefully', async () => {
    // Rapidly change window size multiple times
    const sizes = [
      { width: 800, height: 600 },
      { width: 1024, height: 768 },
      { width: 1280, height: 720 },
      { width: 1000, height: 800 }
    ];

    for (const size of sizes) {
      await browser.setWindowSize(size.width, size.height);
      await browser.pause(100);
    }

    // Wait for last resize to settle
    await browser.pause(500);

    // Verify app is still functional
    const overlayContainer = await $('[data-testid="overlay-container"]');
    const exists = await overlayContainer.isExisting();
    expect(exists).toBe(true);
  });

  it('should support window focus operations', async () => {
    // Switch to current window (should not error)
    const handle = await browser.getWindowHandle();
    await browser.switchToWindow(handle);

    // Verify we're still on the correct window
    const currentHandle = await browser.getWindowHandle();
    expect(currentHandle).toBe(handle);

    // Verify UI is still accessible
    const body = await $('body');
    expect(await body.isDisplayed()).toBe(true);
  });

  it('should preserve DOM structure after window operations', async () => {
    // Count elements before operations
    const initialElementCount = await $$('*').length;
    expect(initialElementCount).toBeGreaterThan(0);

    // Perform window operations
    await browser.setWindowSize(950, 650);
    await browser.pause(200);
    await browser.setWindowRect({ x: 200, y: 200, width: 950, height: 650 });
    await browser.pause(200);

    // Count elements after operations
    const finalElementCount = await $$('*').length;

    // Element count should be similar (DOM not destroyed)
    // Allow some variance for dynamic elements
    expect(Math.abs(finalElementCount - initialElementCount)).toBeLessThan(10);
  });

  it('should handle minimum window size constraints', async () => {
    // Try to resize to very small dimensions
    await browser.setWindowSize(400, 300);
    await browser.pause(300);

    // Get actual size (Tauri may enforce minimums)
    const actualSize = await browser.getWindowSize();

    // Window should still have reasonable dimensions
    // (Tauri enforces minimum sizes)
    expect(actualSize.width).toBeGreaterThan(0);
    expect(actualSize.height).toBeGreaterThan(0);

    // App should still be functional
    const root = await $('#root');
    expect(await root.isExisting()).toBe(true);
  });
});
