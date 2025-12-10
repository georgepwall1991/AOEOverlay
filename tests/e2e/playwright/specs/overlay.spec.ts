import { test, expect } from '@playwright/test';
import { OverlayPage } from '../pages';

/**
 * Comprehensive E2E tests for the Overlay window.
 * Tests the main overlay that displays build orders with steps, timer, and controls.
 */
test.describe('Overlay Window', () => {
  let overlayPage: OverlayPage;

  test.beforeEach(async ({ page }) => {
    overlayPage = new OverlayPage(page);
    await overlayPage.goto();
  });

  test.describe('Initial Load', () => {
    test('loads overlay with mock build order data', async () => {
      // Verify the container is visible
      await expect(overlayPage.container).toBeVisible();

      // Verify build order title is displayed
      const buildOrderName = await overlayPage.getBuildOrderName();
      expect(buildOrderName).toBeTruthy();
      expect(buildOrderName).toBe('English Longbow Rush');
    });

    test('displays build order title correctly', async () => {
      // Check that the title element is visible
      await expect(overlayPage.buildOrderTitle).toBeVisible();

      // Check the title text
      await expect(overlayPage.buildOrderTitle).toHaveText('English Longbow Rush');
    });

    test('renders steps list with timing and resources', async () => {
      // Verify steps container is visible
      await expect(overlayPage.stepsContainer).toBeVisible();

      // Verify we have steps
      const stepCount = await overlayPage.getStepCount();
      expect(stepCount).toBeGreaterThan(0);
      expect(stepCount).toBe(4); // Mock data has 4 steps

      // Check first step content
      const firstStepText = await overlayPage.getStepDescription(0);
      expect(firstStepText).toContain('Build House');
      expect(firstStepText).toContain('0:00');
    });

    test('displays step counter correctly', async () => {
      // Check step counter is visible
      await expect(overlayPage.stepCounter).toBeVisible();

      // Check it shows correct format (e.g., "1/4")
      const currentStep = await overlayPage.getCurrentStepIndex();
      const totalSteps = await overlayPage.getTotalStepCount();

      expect(currentStep).toBe(1);
      expect(totalSteps).toBe(4);
    });
  });

  test.describe('UI Components', () => {
    test('settings button is visible', async () => {
      await expect(overlayPage.settingsButton).toBeVisible();
    });

    test('drag handle is visible', async () => {
      await expect(overlayPage.dragHandle).toBeVisible();
    });

    test('timer bar is visible', async () => {
      await expect(overlayPage.timerBar).toBeVisible();
    });

    test('quick action bar is present', async () => {
      await expect(overlayPage.quickActionBar).toBeVisible();
    });

    test('quick action bar buttons are present', async () => {
      // Check all buttons in the quick action bar
      await expect(overlayPage.previousStepButton).toBeVisible();
      await expect(overlayPage.nextStepButton).toBeVisible();
      await expect(overlayPage.playPauseButton).toBeVisible();
      await expect(overlayPage.resetButton).toBeVisible();
      await expect(overlayPage.cycleBuildButton).toBeVisible();
    });

    test('progress indicator is visible', async () => {
      await expect(overlayPage.progressIndicator).toBeVisible();
    });
  });

  test.describe('Step Navigation', () => {
    test('can navigate to next step via button', async () => {
      // Get initial step
      const initialStep = await overlayPage.getCurrentStepIndex();
      expect(initialStep).toBe(1);

      // Click next step
      await overlayPage.nextStep();

      // Verify we moved to step 2
      const newStep = await overlayPage.getCurrentStepIndex();
      expect(newStep).toBe(2);
    });

    test('can navigate to previous step via button', async () => {
      // Move to step 2 first
      await overlayPage.nextStep();
      const secondStep = await overlayPage.getCurrentStepIndex();
      expect(secondStep).toBe(2);

      // Go back to step 1
      await overlayPage.previousStep();
      const firstStep = await overlayPage.getCurrentStepIndex();
      expect(firstStep).toBe(1);
    });

    test('can navigate steps via click', async () => {
      // Click on the third step (index 2)
      await overlayPage.clickStep(2);

      // Verify we're on step 3
      const currentStep = await overlayPage.getCurrentStepIndex();
      expect(currentStep).toBe(3);
    });

    test('step navigation updates the current step visually', async () => {
      // Initial state - step 1 should be active
      const initialCurrentStep = await overlayPage.getCurrentStep();
      await expect(initialCurrentStep).toBeVisible();

      // Navigate to step 2
      await overlayPage.nextStep();

      // Check that a current step is still marked
      const newCurrentStep = await overlayPage.getCurrentStep();
      await expect(newCurrentStep).toBeVisible();
    });

    test('can navigate through all steps in sequence', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Navigate through all steps
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
        const currentStep = await overlayPage.getCurrentStepIndex();
        expect(currentStep).toBe(i + 1);
      }
    });
  });

  test.describe('Timer Controls', () => {
    test('timer starts as paused', async () => {
      const isRunning = await overlayPage.isTimerRunning();
      expect(isRunning).toBe(false);
    });

    test('can toggle timer play/pause', async () => {
      // Check initial state
      const initialState = await overlayPage.isTimerRunning();

      // Toggle timer
      await overlayPage.toggleTimer();

      // Wait a moment for state to update
      await overlayPage.page.waitForTimeout(100);

      // Check that state changed
      const newState = await overlayPage.isTimerRunning();
      expect(newState).toBe(!initialState);
    });

    test('play/pause button is clickable', async () => {
      await expect(overlayPage.playPauseButton).toBeEnabled();
      await overlayPage.playPauseButton.click();
    });
  });

  test.describe('Reset Functionality', () => {
    test('can reset build order to first step', async () => {
      // Navigate to step 3
      await overlayPage.nextStep();
      await overlayPage.nextStep();

      const beforeReset = await overlayPage.getCurrentStepIndex();
      expect(beforeReset).toBe(3);

      // Reset
      await overlayPage.reset();

      // Wait for reset to complete
      await overlayPage.page.waitForTimeout(200);

      // Should be back at step 1
      const afterReset = await overlayPage.getCurrentStepIndex();
      expect(afterReset).toBe(1);
    });

    test('reset button is visible', async () => {
      await expect(overlayPage.resetButton).toBeVisible();
    });

    test('reset lock button is visible', async () => {
      await expect(overlayPage.resetLockButton).toBeVisible();
    });
  });

  test.describe('Build Order Cycling', () => {
    test('cycle build button is visible', async () => {
      await expect(overlayPage.cycleBuildButton).toBeVisible();
    });

    test('can click cycle build button', async () => {
      await expect(overlayPage.cycleBuildButton).toBeEnabled();
      await overlayPage.cycleBuildButton.click();
    });
  });

  test.describe('Settings Integration', () => {
    test('settings button works', async () => {
      // Settings button should be clickable
      await expect(overlayPage.settingsButton).toBeEnabled();

      // Click settings button
      await overlayPage.openSettings();

      // In mock mode, this won't open a new window but shouldn't error
      // Just verify the button was clickable
    });
  });

  test.describe('Step Information Display', () => {
    test('steps show timing information', async () => {
      // Check that steps display timing
      const firstStepText = await overlayPage.getStepDescription(0);
      expect(firstStepText).toMatch(/\d+:\d+/); // Matches "0:00", "2:30", etc.
    });

    test('steps show resource requirements', async () => {
      // First step should show wood cost
      const firstStepText = await overlayPage.getStepDescription(0);
      expect(firstStepText.toLowerCase()).toContain('wood');
    });

    test('all steps are accessible', async () => {
      const totalSteps = await overlayPage.getStepCount();

      // Verify we can get description for each step
      for (let i = 0; i < totalSteps; i++) {
        const description = await overlayPage.getStepDescription(i);
        expect(description).toBeTruthy();
      }
    });
  });

  test.describe('Pace Indicator', () => {
    test('pace dot is visible', async () => {
      await expect(overlayPage.paceDot).toBeVisible();
    });

    test('pace status can be retrieved', async () => {
      const paceStatus = await overlayPage.getPaceStatus();
      expect(['ahead', 'behind', 'on-pace', 'unknown']).toContain(paceStatus);
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('keyboard shortcuts button is visible', async () => {
      await expect(overlayPage.keyboardShortcutsButton).toBeVisible();
    });
  });

  test.describe('Build Order Data', () => {
    test('displays correct build order metadata', async () => {
      const buildOrderName = await overlayPage.getBuildOrderName();
      expect(buildOrderName).toBe('English Longbow Rush');
    });

    test('build selector is present', async () => {
      await expect(overlayPage.buildSelector).toBeVisible();
    });
  });

  test.describe('Responsive Behavior', () => {
    test('overlay maintains visibility on resize', async ({ page }) => {
      // Resize window
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect(overlayPage.container).toBeVisible();

      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(overlayPage.container).toBeVisible();
    });

    test('all critical elements remain visible after resize', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 });

      await expect(overlayPage.buildOrderTitle).toBeVisible();
      await expect(overlayPage.stepsContainer).toBeVisible();
      await expect(overlayPage.quickActionBar).toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test('handles navigation at boundaries gracefully', async () => {
      // Try to go previous from first step (should not error)
      await overlayPage.previousStep();
      const step = await overlayPage.getCurrentStepIndex();
      expect(step).toBe(1); // Should stay at first step

      // Navigate to last step
      const totalSteps = await overlayPage.getTotalStepCount();
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
      }

      // Try to go next from last step (should not error)
      await overlayPage.nextStep();
      const lastStep = await overlayPage.getCurrentStepIndex();
      expect(lastStep).toBe(totalSteps); // Should stay at last step
    });
  });
});
