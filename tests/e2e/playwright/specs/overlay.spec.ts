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

      // Verify we have visible steps (only 3 visible at a time due to visibleRange)
      const stepCount = await overlayPage.getStepCount();
      expect(stepCount).toBeGreaterThan(0);
      expect(stepCount).toBeLessThanOrEqual(4); // Mock data has 4 steps, but only 3 visible

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
      // Initially at step 1
      const initialStep = await overlayPage.getCurrentStepIndex();
      expect(initialStep).toBe(1);

      // Click on a different step (second visible step = step 2)
      // Find the step and click it directly
      const step2 = overlayPage.page.locator('[data-testid="step-1"]');
      await step2.click();

      // Wait a moment for state to update
      await overlayPage.page.waitForTimeout(100);

      // Verify we moved
      const currentStep = await overlayPage.getCurrentStepIndex();
      expect(currentStep).toBe(2);
    });

    test('step navigation updates the current step visually', async () => {
      // Initial state - should be at step 1
      const initialStep = await overlayPage.getCurrentStepIndex();
      expect(initialStep).toBe(1);

      // Navigate to step 2
      await overlayPage.nextStep();

      // Verify step changed via step counter
      const newStep = await overlayPage.getCurrentStepIndex();
      expect(newStep).toBe(2);

      // Verify the steps container is still visible
      await expect(overlayPage.stepsContainer).toBeVisible();
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

    test('reset lock prevents reset when locked', async () => {
      // Navigate to step 2
      await overlayPage.nextStep();
      const initialStep = await overlayPage.getCurrentStepIndex();
      expect(initialStep).toBe(2);

      // Lock reset by clicking lock button
      await overlayPage.resetLockButton.click();
      await overlayPage.page.waitForTimeout(100);

      // Verify reset button is now disabled
      await expect(overlayPage.resetButton).toBeDisabled();

      // Try to click reset - should not work
      await overlayPage.resetButton.click({ force: true });
      await overlayPage.page.waitForTimeout(100);

      // Step should remain at 2
      const afterAttempt = await overlayPage.getCurrentStepIndex();
      expect(afterAttempt).toBe(2);

      // Unlock reset
      await overlayPage.resetLockButton.click();
      await overlayPage.page.waitForTimeout(100);

      // Now reset should be enabled
      await expect(overlayPage.resetButton).toBeEnabled();
    });

    test('reset lock button toggles state correctly', async () => {
      // Initially unlocked - check button shows unlock icon (meaning reset is available)
      const initialTitle = await overlayPage.resetLockButton.getAttribute('title');
      expect(initialTitle).toContain('Lock reset');

      // Click to lock
      await overlayPage.resetLockButton.click();
      await overlayPage.page.waitForTimeout(100);

      // Should now show "Unlock reset"
      const lockedTitle = await overlayPage.resetLockButton.getAttribute('title');
      expect(lockedTitle).toContain('Unlock reset');

      // Click to unlock
      await overlayPage.resetLockButton.click();
      await overlayPage.page.waitForTimeout(100);

      // Should be back to "Lock reset"
      const unlockedTitle = await overlayPage.resetLockButton.getAttribute('title');
      expect(unlockedTitle).toContain('Lock reset');
    });

    test('reset lock visual state reflects locked status', async () => {
      // Lock reset
      await overlayPage.resetLockButton.click();
      await overlayPage.page.waitForTimeout(100);

      // The lock button should have active styling when locked
      const lockButtonClasses = await overlayPage.resetLockButton.getAttribute('class');
      expect(lockButtonClasses).toContain('amber'); // Active state has amber color

      // Unlock
      await overlayPage.resetLockButton.click();
      await overlayPage.page.waitForTimeout(100);

      // Should no longer have active styling
      const unlockedClasses = await overlayPage.resetLockButton.getAttribute('class');
      // Either no amber or specifically checking it's in default state
      expect(unlockedClasses?.includes('amber') || unlockedClasses === lockButtonClasses).toBeFalsy();
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

  test.describe('Dual-Click Confirmation', () => {
    test('reset requires double click for confirmation', async () => {
      // Navigate to step 2
      await overlayPage.nextStep();
      const initialStep = await overlayPage.getCurrentStepIndex();
      expect(initialStep).toBe(2);

      // First click should arm confirmation (not reset)
      await overlayPage.resetButton.click();
      await overlayPage.page.waitForTimeout(100);

      // Check title changed to show confirmation needed
      const confirmTitle = await overlayPage.resetButton.getAttribute('title');
      expect(confirmTitle).toContain('Confirm');

      // Step should still be at 2
      const afterFirstClick = await overlayPage.getCurrentStepIndex();
      expect(afterFirstClick).toBe(2);

      // Second click should confirm reset
      await overlayPage.resetButton.click();
      await overlayPage.page.waitForTimeout(200);

      // Now should be at step 1
      const afterConfirm = await overlayPage.getCurrentStepIndex();
      expect(afterConfirm).toBe(1);
    });

    test('reset confirmation times out after 3 seconds', async () => {
      // Navigate to step 2
      await overlayPage.nextStep();

      // First click to arm
      await overlayPage.resetButton.click();
      await overlayPage.page.waitForTimeout(100);

      // Verify confirmation is armed
      let confirmTitle = await overlayPage.resetButton.getAttribute('title');
      expect(confirmTitle).toContain('Confirm');

      // Wait for timeout (3 seconds + buffer)
      await overlayPage.page.waitForTimeout(3500);

      // Confirmation should have expired
      confirmTitle = await overlayPage.resetButton.getAttribute('title');
      expect(confirmTitle).not.toContain('Confirm');

      // Step should still be at 2
      const currentStep = await overlayPage.getCurrentStepIndex();
      expect(currentStep).toBe(2);
    });

    test('cycle build requires double click for confirmation', async () => {
      // First click should arm confirmation
      await overlayPage.cycleBuildButton.click();
      await overlayPage.page.waitForTimeout(100);

      // Check title changed to show confirmation needed
      const confirmTitle = await overlayPage.cycleBuildButton.getAttribute('title');
      expect(confirmTitle).toContain('Confirm');
    });

    test('cycle build confirmation times out after 3 seconds', async () => {
      // First click to arm
      await overlayPage.cycleBuildButton.click();
      await overlayPage.page.waitForTimeout(100);

      // Verify confirmation is armed
      let confirmTitle = await overlayPage.cycleBuildButton.getAttribute('title');
      expect(confirmTitle).toContain('Confirm');

      // Wait for timeout
      await overlayPage.page.waitForTimeout(3500);

      // Confirmation should have expired
      confirmTitle = await overlayPage.cycleBuildButton.getAttribute('title');
      expect(confirmTitle).not.toContain('Confirm');
    });
  });

  test.describe('Timer Boundary Conditions', () => {
    test('timer starts from 0:00', async () => {
      const timerText = await overlayPage.timerBar.textContent();
      expect(timerText).toMatch(/0:00/);
    });

    test('timer increments when started', async () => {
      // Start timer
      await overlayPage.toggleTimer();

      // Wait a bit for timer to increment
      await overlayPage.page.waitForTimeout(1500);

      // Timer should have advanced
      const timerText = await overlayPage.timerBar.textContent();
      // Should show at least 0:01
      expect(timerText).toMatch(/0:0[1-9]|0:[1-5]\d/);
    });

    test('timer pauses at current value', async () => {
      // Start timer
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(1200);

      // Get current time (extract the time portion, e.g., "0:01")
      const timeBeforePause = await overlayPage.timerBar.textContent();
      const timeMatch = timeBeforePause?.match(/(\d+:\d+)/);
      const timeValueBeforePause = timeMatch ? timeMatch[1] : '';

      // Pause timer
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(500);

      // Get time after pause
      const timeAfterPause = await overlayPage.timerBar.textContent();

      // Time should show "PAUSED" indicator and the same time value
      expect(timeAfterPause).toContain('PAUSED');
      expect(timeAfterPause).toContain(timeValueBeforePause);
    });

    test('timer resumes from paused value', async () => {
      // Start timer
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(1200);

      // Pause
      await overlayPage.toggleTimer();
      const pausedTime = await overlayPage.timerBar.textContent();
      await overlayPage.page.waitForTimeout(500);

      // Resume
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(1200);

      // Get new time
      const resumedTime = await overlayPage.timerBar.textContent();

      // Time should have advanced past paused value
      // Extract seconds to compare
      const pausedMatch = pausedTime?.match(/(\d+):(\d+)/);
      const resumedMatch = resumedTime?.match(/(\d+):(\d+)/);
      if (pausedMatch && resumedMatch) {
        const pausedSeconds = parseInt(pausedMatch[1]) * 60 + parseInt(pausedMatch[2]);
        const resumedSeconds = parseInt(resumedMatch[1]) * 60 + parseInt(resumedMatch[2]);
        expect(resumedSeconds).toBeGreaterThan(pausedSeconds);
      }
    });

    test('timer resets with build order reset', async () => {
      // Start timer and let it run
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(1200);

      // Verify timer is not at 0
      const timerBeforeReset = await overlayPage.timerBar.textContent();
      expect(timerBeforeReset).not.toMatch(/^0:00$/);

      // Reset (needs double click)
      await overlayPage.reset();
      await overlayPage.page.waitForTimeout(200);

      // Timer should be back to 0:00
      const timerAfterReset = await overlayPage.timerBar.textContent();
      expect(timerAfterReset).toMatch(/0:00/);
    });
  });

  test.describe('Step Navigation Edge Cases', () => {
    test('previous button disabled on first step', async () => {
      await expect(overlayPage.previousStepButton).toBeDisabled();
    });

    test('next button disabled on last step', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Navigate to last step
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
      }

      await expect(overlayPage.nextStepButton).toBeDisabled();
    });

    test('can navigate forward and backward continuously', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Go to step 2
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(2);

      // Go back to step 1
      await overlayPage.previousStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);

      // Go forward again
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(2);

      // Go to last step
      for (let i = 2; i < totalSteps; i++) {
        await overlayPage.nextStep();
      }
      expect(await overlayPage.getCurrentStepIndex()).toBe(totalSteps);

      // Go back one
      await overlayPage.previousStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(totalSteps - 1);
    });

    test('clicking on step directly navigates to that step', async () => {
      // Click on step 2 (index 1)
      const step2 = overlayPage.page.locator('[data-testid="step-1"]');
      await step2.click();
      await overlayPage.page.waitForTimeout(100);

      const currentStep = await overlayPage.getCurrentStepIndex();
      expect(currentStep).toBe(2);
    });

    test('step counter updates correctly during navigation', async () => {
      // Verify initial state
      const counterText1 = await overlayPage.stepCounter.textContent();
      expect(counterText1).toMatch(/1\/\d+/);

      // Navigate to step 2
      await overlayPage.nextStep();
      const counterText2 = await overlayPage.stepCounter.textContent();
      expect(counterText2).toMatch(/2\/\d+/);

      // Navigate to step 3
      await overlayPage.nextStep();
      const counterText3 = await overlayPage.stepCounter.textContent();
      expect(counterText3).toMatch(/3\/\d+/);
    });

    test('next step starts timer automatically if not running', async () => {
      // Verify timer is not running initially
      const initialRunning = await overlayPage.isTimerRunning();
      expect(initialRunning).toBe(false);

      // Navigate to next step
      await overlayPage.nextStep();
      await overlayPage.page.waitForTimeout(100);

      // Timer should now be running
      const afterNextRunning = await overlayPage.isTimerRunning();
      expect(afterNextRunning).toBe(true);
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
      // Check that steps display timing (look in any step)
      const stepContainer = await overlayPage.stepsContainer.textContent();
      expect(stepContainer).toMatch(/\d+:\d+/); // Matches "0:00", "2:30", etc.
    });

    test('steps show build instructions', async () => {
      // Steps should show build instructions like "Build House"
      const stepContainer = await overlayPage.stepsContainer.textContent();
      expect(stepContainer?.toLowerCase()).toContain('build');
    });

    test('all visible steps are accessible', async () => {
      const visibleSteps = await overlayPage.getStepCount();
      expect(visibleSteps).toBeGreaterThan(0);

      // Verify we can get content for each visible step
      for (let i = 0; i < visibleSteps; i++) {
        const step = overlayPage.getStep(i);
        await expect(step).toBeVisible();
      }
    });
  });

  test.describe('Timer Display', () => {
    test('timer bar shows time display', async () => {
      // Timer bar should be visible
      await expect(overlayPage.timerBar).toBeVisible();

      // Check that timer display shows initial time (0:00)
      const timerText = await overlayPage.timerBar.textContent();
      expect(timerText).toMatch(/\d+:\d+|PAUSED/);
    });

    test('timer shows state via play/pause button', async () => {
      // The timer state is indicated by the play/pause button's title
      const isRunning = await overlayPage.isTimerRunning();
      expect(typeof isRunning).toBe('boolean');
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
      // At first step, previous button should be disabled
      await expect(overlayPage.previousStepButton).toBeDisabled();
      const step = await overlayPage.getCurrentStepIndex();
      expect(step).toBe(1); // Should be at first step

      // Navigate to last step
      const totalSteps = await overlayPage.getTotalStepCount();
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
      }

      // At last step, next button should be disabled
      await expect(overlayPage.nextStepButton).toBeDisabled();
      const lastStep = await overlayPage.getCurrentStepIndex();
      expect(lastStep).toBe(totalSteps); // Should be at last step
    });
  });

  test.describe('Step Visibility Windowing', () => {
    test('shows correct number of visible steps (max 3)', async () => {
      // Should show at most 3 steps at a time
      const visibleSteps = await overlayPage.getStepCount();
      expect(visibleSteps).toBeLessThanOrEqual(3);
      expect(visibleSteps).toBeGreaterThan(0);
    });

    test('visible steps update when navigating', async () => {
      // Get initial visible steps
      const initialSteps = await overlayPage.getStepCount();

      // Navigate forward
      await overlayPage.nextStep();
      await overlayPage.page.waitForTimeout(100);

      // Still should have visible steps
      const afterNavSteps = await overlayPage.getStepCount();
      expect(afterNavSteps).toBeGreaterThan(0);
      expect(afterNavSteps).toBeLessThanOrEqual(3);
    });

    test('step window includes current step', async () => {
      // Navigate to step 2
      await overlayPage.nextStep();
      await overlayPage.page.waitForTimeout(100);

      // Current step should be visible
      const step1 = overlayPage.page.locator('[data-testid="step-1"]');
      await expect(step1).toBeVisible();
    });

    test('step windowing works at end of build order', async () => {
      // Navigate to last step
      const totalSteps = await overlayPage.getTotalStepCount();
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
      }
      await overlayPage.page.waitForTimeout(100);

      // Should still show steps
      const visibleSteps = await overlayPage.getStepCount();
      expect(visibleSteps).toBeGreaterThan(0);
    });
  });

  test.describe('Progress Indicator', () => {
    test('progress bar starts at initial position', async () => {
      const progressIndicator = overlayPage.progressIndicator;
      await expect(progressIndicator).toBeVisible();

      // Progress bar should show 1/4 = 25%
      const progressBar = overlayPage.page.locator('[data-testid="progress-indicator"] .bg-gradient-to-r');
      await expect(progressBar).toBeVisible();
    });

    test('progress bar updates on step navigation', async () => {
      // Navigate through steps and verify progress updates
      await overlayPage.nextStep();
      await overlayPage.page.waitForTimeout(100);

      // Check counter updated
      const counter = await overlayPage.stepCounter.textContent();
      expect(counter).toMatch(/2\/\d+/);

      await overlayPage.nextStep();
      await overlayPage.page.waitForTimeout(100);

      const counter2 = await overlayPage.stepCounter.textContent();
      expect(counter2).toMatch(/3\/\d+/);
    });
  });

  test.describe('Step Content Display', () => {
    test('step displays timing correctly', async () => {
      // First step should show 0:00
      const firstStep = overlayPage.getStep(0);
      const stepText = await firstStep.textContent();
      expect(stepText).toMatch(/\d+:\d+/);
    });

    test('step displays description text', async () => {
      const firstStep = overlayPage.getStep(0);
      const stepText = await firstStep.textContent();
      // Should contain some text (build instruction)
      expect(stepText?.length).toBeGreaterThan(5);
    });

    test('active step has distinct visual styling', async () => {
      // Check that active step has specific classes
      const activeStepLocator = overlayPage.page.locator('[data-testid="step-0"]');
      const classes = await activeStepLocator.getAttribute('class');
      expect(classes).toContain('active-step');
    });

    test('navigating changes which step is active', async () => {
      // Initially step 0 is active
      const step0 = overlayPage.page.locator('[data-testid="step-0"]');
      let step0Classes = await step0.getAttribute('class');
      expect(step0Classes).toContain('active-step');

      // Navigate to step 2
      await overlayPage.nextStep();
      await overlayPage.page.waitForTimeout(100);

      // Step 1 should now be active (visible and has active class)
      const step1 = overlayPage.page.locator('[data-testid="step-1"]');
      const step1Classes = await step1.getAttribute('class');
      expect(step1Classes).toContain('active-step');
    });
  });

  test.describe('DPI Scaling Behavior', () => {
    test('overlay maintains readability at different viewports', async ({ page }) => {
      // Small viewport (simulating high DPI)
      await page.setViewportSize({ width: 640, height: 480 });
      await expect(overlayPage.container).toBeVisible();
      await expect(overlayPage.stepsContainer).toBeVisible();

      // Check steps are still readable
      const stepText = await overlayPage.getStepDescription(0);
      expect(stepText.length).toBeGreaterThan(5);

      // Large viewport
      await page.setViewportSize({ width: 2560, height: 1440 });
      await expect(overlayPage.container).toBeVisible();
      const stepTextLarge = await overlayPage.getStepDescription(0);
      expect(stepTextLarge.length).toBeGreaterThan(5);
    });

    test('buttons remain clickable at different viewports', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 480 });

      // Verify buttons are still functional
      await expect(overlayPage.nextStepButton).toBeEnabled();
      await overlayPage.nextStep();

      const currentStep = await overlayPage.getCurrentStepIndex();
      expect(currentStep).toBe(2);
    });
  });

  test.describe('UI Scale Transform', () => {
    test('container has correct transform origin', async () => {
      const containerStyle = await overlayPage.container.getAttribute('style');
      expect(containerStyle).toContain('transform-origin');
    });

    test('overlay respects minWidth', async () => {
      const containerStyle = await overlayPage.container.getAttribute('style');
      // minWidth: 320 is set in the component
      expect(containerStyle).toContain('min-width');
    });
  });

  test.describe('Step Click Interactions', () => {
    test('clicking step triggers navigation', async () => {
      const initialStep = await overlayPage.getCurrentStepIndex();
      expect(initialStep).toBe(1);

      // Click on visible step 2 (index 1)
      const step2 = overlayPage.page.locator('[data-testid="step-1"]');
      await step2.click();
      await overlayPage.page.waitForTimeout(100);

      const newStep = await overlayPage.getCurrentStepIndex();
      expect(newStep).toBe(2);
    });

    test('clicking step starts timer if not running', async () => {
      // Ensure timer is not running
      const initialRunning = await overlayPage.isTimerRunning();
      expect(initialRunning).toBe(false);

      // Click a step
      const step2 = overlayPage.page.locator('[data-testid="step-1"]');
      await step2.click();
      await overlayPage.page.waitForTimeout(100);

      // Timer should have started
      const afterClickRunning = await overlayPage.isTimerRunning();
      expect(afterClickRunning).toBe(true);
    });

    test('multiple rapid clicks work correctly', async () => {
      // Rapid navigation
      await overlayPage.nextStep();
      await overlayPage.nextStep();
      await overlayPage.page.waitForTimeout(100);

      const step = await overlayPage.getCurrentStepIndex();
      expect(step).toBe(3);
    });
  });

  test.describe('Build Selector Dropdown', () => {
    test('build selector is visible and accessible', async () => {
      await expect(overlayPage.buildSelector).toBeVisible();
    });

    test('build selector shows current build name', async () => {
      const selectorText = await overlayPage.buildSelector.textContent();
      expect(selectorText).toContain('English Longbow Rush');
    });
  });

  test.describe('Drag Handle', () => {
    test('drag handle is visible', async () => {
      await expect(overlayPage.dragHandle).toBeVisible();
    });

    test('drag handle has cursor move style', async () => {
      const dragHandleClass = await overlayPage.dragHandle.getAttribute('class');
      expect(dragHandleClass).toContain('cursor-move');
    });
  });

  test.describe('Opacity and Styling', () => {
    test('container has opacity style', async () => {
      const containerStyle = await overlayPage.container.getAttribute('style');
      expect(containerStyle).toContain('opacity');
    });

    test('overlay panel has proper styling class', async () => {
      const panelDiv = overlayPage.page.locator('[data-testid="overlay-container"] > div');
      const classes = await panelDiv.getAttribute('class');
      // Should have one of the panel classes
      expect(classes).toMatch(/floating-panel|glass-panel/);
    });
  });
});
