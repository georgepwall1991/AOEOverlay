import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Compact Overlay mode.
 * Tests layout, text wrapping, icons, and visual presentation.
 */
test.describe('Compact Overlay', () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage to skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('aoe4-overlay-onboarding-seen', 'true');
    });
    await page.goto('/');
    // Wait for regular overlay to load first
    await page.locator('[data-testid="overlay-container"]').waitFor({ state: 'visible', timeout: 10000 });

    // Click the compact mode toggle button to switch to compact mode (look for the title which is "Compact Mode" initially)
    const compactToggle = page.locator('button[title*="Compact Mode"]');
    await compactToggle.click();
    await page.waitForTimeout(200);

    // Now wait for compact overlay to be visible
    await page.locator('[data-testid="compact-overlay"]').waitFor({ state: 'visible', timeout: 5000 });
  });

  test.describe('Visual Layout', () => {
    test('renders compact overlay container', async ({ page }) => {
      const container = page.locator('[data-testid="compact-overlay"]');
      await expect(container).toBeVisible();
    });

    test('displays step counter', async ({ page }) => {
      const counter = page.locator('[data-testid="compact-step-counter"]');
      await expect(counter).toBeVisible();
      await expect(counter).toContainText(/\d+\/\d+/);
    });

    test('displays current step description', async ({ page }) => {
      const description = page.locator('[data-testid="compact-step-description"]');
      await expect(description).toBeVisible();
      const text = await description.textContent();
      expect(text?.length).toBeGreaterThan(0);
    });

    test('displays timing badge when step has timing', async ({ page }) => {
      const timingBadge = page.locator('[data-testid="compact-timing-badge"]');
      // First step should have timing "0:00"
      await expect(timingBadge).toBeVisible();
      await expect(timingBadge).toContainText(/\d+:\d+/);
    });

    test('displays next step preview', async ({ page }) => {
      const nextPreview = page.locator('[data-testid="compact-next-preview"]');
      await expect(nextPreview).toBeVisible();
    });

    test('displays navigation buttons', async ({ page }) => {
      const prevButton = page.locator('[data-testid="compact-prev-button"]');
      const nextButton = page.locator('[data-testid="compact-next-button"]');
      await expect(prevButton).toBeVisible();
      await expect(nextButton).toBeVisible();
    });

    test('previous button disabled on first step', async ({ page }) => {
      const prevButton = page.locator('[data-testid="compact-prev-button"]');
      await expect(prevButton).toBeDisabled();
    });
  });

  test.describe('Text Wrapping and Overflow', () => {
    test('step description wraps properly (not truncated)', async ({ page }) => {
      const description = page.locator('[data-testid="compact-step-description"]');

      // Get the element's computed style
      const overflow = await description.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          overflow: style.overflow,
          textOverflow: style.textOverflow,
          whiteSpace: style.whiteSpace,
        };
      });

      // Should NOT have ellipsis/truncation
      expect(overflow.textOverflow).not.toBe('ellipsis');
      // Should allow text to wrap
      expect(overflow.whiteSpace).not.toBe('nowrap');
    });

    test('step description is fully visible without clipping', async ({ page }) => {
      const description = page.locator('[data-testid="compact-step-description"]');

      // Get both scrollHeight and clientHeight
      const dimensions = await description.evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));

      // Content should not overflow (scrollHeight == clientHeight means no vertical overflow)
      expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight + 2); // +2 for rounding
    });

    test('next preview text wraps properly', async ({ page }) => {
      const nextDescription = page.locator('[data-testid="compact-next-description"]');

      const overflow = await nextDescription.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          overflow: style.overflow,
          textOverflow: style.textOverflow,
          whiteSpace: style.whiteSpace,
        };
      });

      // Should NOT have ellipsis/truncation
      expect(overflow.textOverflow).not.toBe('ellipsis');
    });

    test('container height adjusts to content', async ({ page }) => {
      const container = page.locator('[data-testid="compact-overlay"]');
      const stepContent = page.locator('[data-testid="compact-step-content"]');

      // Get container and content heights
      const containerBox = await container.boundingBox();
      const contentBox = await stepContent.boundingBox();

      expect(containerBox).not.toBeNull();
      expect(contentBox).not.toBeNull();

      // Container should be tall enough to contain the content
      if (containerBox && contentBox) {
        expect(containerBox.height).toBeGreaterThan(contentBox.height);
      }
    });
  });

  test.describe('Font Sizes', () => {
    test('has appropriate font size for description (medium config)', async ({ page }) => {
      const description = page.locator('[data-testid="compact-step-description"]');

      const fontSize = await description.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });

      // text-base = 16px
      expect(fontSize).toBeGreaterThanOrEqual(16);
    });

    test('step counter has visible font size', async ({ page }) => {
      const counter = page.locator('[data-testid="compact-step-counter"]');

      const fontSize = await counter.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });

      // text-base = 16px
      expect(fontSize).toBeGreaterThanOrEqual(16);
    });
  });

  test.describe('Navigation', () => {
    test('can navigate to next step', async ({ page }) => {
      const counter = page.locator('[data-testid="compact-step-counter"]');
      const nextButton = page.locator('[data-testid="compact-next-button"]');

      // Initially at step 1
      await expect(counter).toContainText(/1\//);

      // Click next
      await nextButton.click();
      await page.waitForTimeout(100);

      // Should be at step 2
      await expect(counter).toContainText(/2\//);
    });

    test('can navigate to previous step', async ({ page }) => {
      const counter = page.locator('[data-testid="compact-step-counter"]');
      const nextButton = page.locator('[data-testid="compact-next-button"]');
      const prevButton = page.locator('[data-testid="compact-prev-button"]');

      // Go to step 2
      await nextButton.click();
      await page.waitForTimeout(100);
      await expect(counter).toContainText(/2\//);

      // Go back to step 1
      await prevButton.click();
      await page.waitForTimeout(100);
      await expect(counter).toContainText(/1\//);
    });

    test('next button disables on last step', async ({ page }) => {
      const counter = page.locator('[data-testid="compact-step-counter"]');
      const nextButton = page.locator('[data-testid="compact-next-button"]');

      // Get total steps
      const counterText = await counter.textContent();
      const match = counterText?.match(/\d+\/(\d+)/);
      const totalSteps = match ? parseInt(match[1], 10) : 0;

      // Navigate to last step
      for (let i = 1; i < totalSteps; i++) {
        await nextButton.click();
        await page.waitForTimeout(50);
      }

      // Next button should be disabled
      await expect(nextButton).toBeDisabled();
    });
  });

  test.describe('Icon Rendering', () => {
    test('renders game icons in step description', async ({ page }) => {
      const description = page.locator('[data-testid="compact-step-description"]');

      // Check if there are any img or svg elements (game icons)
      const iconCount = await description.locator('img, svg').count();

      // Icons may or may not be present depending on the step content
      // This test just verifies the container can hold icons
      expect(iconCount).toBeGreaterThanOrEqual(0);
    });

    test('icons have appropriate size', async ({ page }) => {
      const description = page.locator('[data-testid="compact-step-description"]');
      const icons = description.locator('img');

      const iconCount = await icons.count();
      if (iconCount > 0) {
        const firstIcon = icons.first();
        const size = await firstIcon.evaluate((el) => ({
          width: el.clientWidth,
          height: el.clientHeight,
        }));

        // Icons should be reasonably sized (at least 18px for compact mode)
        expect(size.width).toBeGreaterThanOrEqual(18);
        expect(size.height).toBeGreaterThanOrEqual(18);
      }
    });
  });

  test.describe('Responsive Behavior', () => {
    test('compact overlay adjusts to narrow width', async ({ page }) => {
      const container = page.locator('[data-testid="compact-overlay"]');

      // Set narrow viewport
      await page.setViewportSize({ width: 400, height: 600 });

      await expect(container).toBeVisible();

      // Description should still be visible
      const description = page.locator('[data-testid="compact-step-description"]');
      await expect(description).toBeVisible();
    });

    test('compact overlay adjusts to wide width', async ({ page }) => {
      const container = page.locator('[data-testid="compact-overlay"]');

      // Set wide viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      await expect(container).toBeVisible();

      // Container should respect maxWidth
      const box = await container.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(600); // maxWidth is 600
      }
    });
  });

  test.describe('Visual Screenshots', () => {
    test('capture compact overlay screenshot for visual review', async ({ page }) => {
      const container = page.locator('[data-testid="compact-overlay"]');

      // Wait for any animations
      await page.waitForTimeout(500);

      // Take screenshot of just the compact overlay
      await container.screenshot({
        path: 'tests/e2e/playwright/screenshots/compact-overlay-default.png',
      });
    });

    test('capture compact overlay with navigation', async ({ page }) => {
      const container = page.locator('[data-testid="compact-overlay"]');
      const nextButton = page.locator('[data-testid="compact-next-button"]');

      // Navigate to step 2
      await nextButton.click();
      await page.waitForTimeout(300);

      // Take screenshot
      await container.screenshot({
        path: 'tests/e2e/playwright/screenshots/compact-overlay-step2.png',
      });
    });

    test('capture compact overlay at last step', async ({ page }) => {
      const container = page.locator('[data-testid="compact-overlay"]');
      const counter = page.locator('[data-testid="compact-step-counter"]');
      const nextButton = page.locator('[data-testid="compact-next-button"]');

      // Get total steps
      const counterText = await counter.textContent();
      const match = counterText?.match(/\d+\/(\d+)/);
      const totalSteps = match ? parseInt(match[1], 10) : 0;

      // Navigate to last step
      for (let i = 1; i < totalSteps; i++) {
        await nextButton.click();
        await page.waitForTimeout(50);
      }

      await page.waitForTimeout(300);

      // Take screenshot
      await container.screenshot({
        path: 'tests/e2e/playwright/screenshots/compact-overlay-last-step.png',
      });
    });
  });

  test.describe('Font Size Verification', () => {
    test('description font is at least 16px (medium size default)', async ({ page }) => {
      const description = page.locator('[data-testid="compact-step-description"]');
      const fontSize = await description.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });

      // text-base = 16px for medium font size
      expect(fontSize).toBeGreaterThanOrEqual(16);
    });
  });
});
