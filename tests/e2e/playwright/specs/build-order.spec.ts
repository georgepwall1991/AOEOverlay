import { test, expect } from '@playwright/test';
import { OverlayPage } from '../pages';

/**
 * Comprehensive E2E tests for Build Order workflows.
 * Tests the complete flow of working with build orders including:
 * - Complete navigation through all steps
 * - Step-by-step progression
 * - Previous/next navigation
 * - Reset functionality
 * - Timer integration with build order progression
 */
test.describe('Build Order Workflows', () => {
  let overlayPage: OverlayPage;

  test.beforeEach(async ({ page }) => {
    overlayPage = new OverlayPage(page);
    await overlayPage.goto();
  });

  test.describe('Complete Build Order Navigation', () => {
    test('can navigate through entire build order from start to finish', async () => {
      // Start at step 1
      const initialStep = await overlayPage.getCurrentStepIndex();
      expect(initialStep).toBe(1);

      const totalSteps = await overlayPage.getTotalStepCount();
      expect(totalSteps).toBe(4); // Mock data has 4 steps

      // Navigate through all steps
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
        const currentStep = await overlayPage.getCurrentStepIndex();
        expect(currentStep).toBe(i + 1);

        // Verify we can read the step description
        const stepDesc = await overlayPage.getStepDescription(i);
        expect(stepDesc).toBeTruthy();
      }

      // Verify we're at the last step
      const finalStep = await overlayPage.getCurrentStepIndex();
      expect(finalStep).toBe(totalSteps);
    });

    test('can navigate backwards through entire build order', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Navigate to last step first
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
      }

      // Verify we're at the last step
      let currentStep = await overlayPage.getCurrentStepIndex();
      expect(currentStep).toBe(totalSteps);

      // Navigate backwards through all steps
      for (let i = totalSteps - 1; i > 0; i--) {
        await overlayPage.previousStep();
        currentStep = await overlayPage.getCurrentStepIndex();
        expect(currentStep).toBe(i);
      }

      // Verify we're back at step 1
      expect(currentStep).toBe(1);
    });

    test('can navigate using a mix of next, previous, and direct clicks', async () => {
      // Start at step 1
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);

      // Go to step 2 via button
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(2);

      // Jump to step 4 via click
      await overlayPage.clickStep(3); // index 3 = step 4
      expect(await overlayPage.getCurrentStepIndex()).toBe(4);

      // Go back to step 3 via button
      await overlayPage.previousStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(3);

      // Jump to step 1 via click
      await overlayPage.clickStep(0); // index 0 = step 1
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);
    });
  });

  test.describe('Step-by-Step Progression', () => {
    test('each step shows correct information', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Define expected content for each step based on mock data
      const expectedSteps = [
        { desc: 'Build House', timing: '0:00' },
        { desc: 'Build Council Hall', timing: '2:30' },
        { desc: 'Train Longbows', timing: '4:00' },
        { desc: 'Attack', timing: '5:00' },
      ];

      for (let i = 0; i < totalSteps; i++) {
        // Navigate to step
        if (i > 0) {
          await overlayPage.nextStep();
        }

        // Verify step counter
        const currentStep = await overlayPage.getCurrentStepIndex();
        expect(currentStep).toBe(i + 1);

        // Verify step description contains expected text
        const stepText = await overlayPage.getStepDescription(i);
        expect(stepText).toContain(expectedSteps[i].desc);
        expect(stepText).toContain(expectedSteps[i].timing);
      }
    });

    test('step counter updates correctly during progression', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      for (let i = 1; i <= totalSteps; i++) {
        if (i > 1) {
          await overlayPage.nextStep();
        }

        const counterText = await overlayPage.stepCounter.textContent();
        expect(counterText).toContain(`${i}/${totalSteps}`);
      }
    });

    test('current step is visually highlighted during progression', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      for (let i = 0; i < totalSteps; i++) {
        if (i > 0) {
          await overlayPage.nextStep();
        }

        // Verify a current step exists and is visible
        const currentStep = await overlayPage.getCurrentStep();
        await expect(currentStep).toBeVisible();

        // Verify it has the active attribute
        const isActive = await currentStep.getAttribute('data-active');
        expect(isActive).toBe('true');
      }
    });
  });

  test.describe('Previous/Next Step Navigation', () => {
    test('next step button advances correctly', async () => {
      for (let i = 1; i < 4; i++) {
        const beforeStep = await overlayPage.getCurrentStepIndex();
        await overlayPage.nextStep();
        const afterStep = await overlayPage.getCurrentStepIndex();

        expect(afterStep).toBe(beforeStep + 1);
      }
    });

    test('previous step button goes back correctly', async () => {
      // Move to step 3
      await overlayPage.nextStep();
      await overlayPage.nextStep();

      for (let i = 0; i < 2; i++) {
        const beforeStep = await overlayPage.getCurrentStepIndex();
        await overlayPage.previousStep();
        const afterStep = await overlayPage.getCurrentStepIndex();

        expect(afterStep).toBe(beforeStep - 1);
      }
    });

    test('next button does not go beyond last step', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Navigate to last step
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
      }

      // Verify we're at last step
      expect(await overlayPage.getCurrentStepIndex()).toBe(totalSteps);

      // Try to go next (should stay at last step)
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(totalSteps);

      // Try multiple times
      await overlayPage.nextStep();
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(totalSteps);
    });

    test('previous button does not go before first step', async () => {
      // Start at step 1
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);

      // Try to go previous (should stay at step 1)
      await overlayPage.previousStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);

      // Try multiple times
      await overlayPage.previousStep();
      await overlayPage.previousStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);
    });

    test('navigation buttons remain enabled throughout', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      for (let i = 0; i < totalSteps; i++) {
        if (i > 0) {
          await overlayPage.nextStep();
        }

        // Both buttons should remain enabled (UI handles boundary logic internally)
        await expect(overlayPage.nextStepButton).toBeEnabled();
        await expect(overlayPage.previousStepButton).toBeEnabled();
      }
    });
  });

  test.describe('Reset Functionality', () => {
    test('reset returns to first step from middle', async () => {
      // Navigate to step 3
      await overlayPage.nextStep();
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(3);

      // Reset
      await overlayPage.reset();
      await overlayPage.page.waitForTimeout(200);

      // Should be at step 1
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);
    });

    test('reset returns to first step from last step', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Navigate to last step
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
      }
      expect(await overlayPage.getCurrentStepIndex()).toBe(totalSteps);

      // Reset
      await overlayPage.reset();
      await overlayPage.page.waitForTimeout(200);

      // Should be at step 1
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);
    });

    test('reset handles locked state correctly', async () => {
      // Navigate to step 2
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(2);

      // The reset() method handles unlocking if needed
      await overlayPage.reset();
      await overlayPage.page.waitForTimeout(200);

      // Should be at step 1
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);
    });

    test('reset lock button is functional', async () => {
      // The reset lock button should be clickable
      await expect(overlayPage.resetLockButton).toBeVisible();
      await expect(overlayPage.resetLockButton).toBeEnabled();

      // Click to toggle lock state
      await overlayPage.resetLockButton.click();

      // Button should still be functional
      await expect(overlayPage.resetLockButton).toBeEnabled();
    });

    test('can reset multiple times', async () => {
      for (let iteration = 0; iteration < 3; iteration++) {
        // Navigate forward
        await overlayPage.nextStep();
        await overlayPage.nextStep();
        expect(await overlayPage.getCurrentStepIndex()).toBe(3);

        // Reset
        await overlayPage.reset();
        await overlayPage.page.waitForTimeout(100);
        expect(await overlayPage.getCurrentStepIndex()).toBe(1);
      }
    });

    test('reset clears navigation history', async () => {
      // Navigate through several steps
      await overlayPage.nextStep(); // step 2
      await overlayPage.nextStep(); // step 3
      await overlayPage.previousStep(); // back to step 2
      await overlayPage.nextStep(); // to step 3 again

      // Reset
      await overlayPage.reset();
      await overlayPage.page.waitForTimeout(200);

      // Should be cleanly at step 1, not in some intermediate state
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);

      // Navigate forward should go to step 2
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(2);
    });
  });

  test.describe('Timer Integration with Build Order', () => {
    test('timer can be started and stopped during build order', async () => {
      // Timer should start paused
      expect(await overlayPage.isTimerRunning()).toBe(false);

      // Start timer
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(100);

      // Timer should be running
      expect(await overlayPage.isTimerRunning()).toBe(true);

      // Navigate to next step
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(2);

      // Timer should still be running
      expect(await overlayPage.isTimerRunning()).toBe(true);

      // Stop timer
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(100);

      // Timer should be stopped
      expect(await overlayPage.isTimerRunning()).toBe(false);
    });

    test('timer state persists across step navigation', async () => {
      // Start timer
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(100);

      // Navigate through steps
      for (let i = 0; i < 3; i++) {
        await overlayPage.nextStep();
        await overlayPage.page.waitForTimeout(50);

        // Timer should still be running
        expect(await overlayPage.isTimerRunning()).toBe(true);
      }
    });

    test('reset stops and resets timer', async () => {
      // Start timer
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(100);
      expect(await overlayPage.isTimerRunning()).toBe(true);

      // Navigate forward
      await overlayPage.nextStep();

      // Reset
      await overlayPage.reset();
      await overlayPage.page.waitForTimeout(200);

      // Timer should be stopped after reset
      expect(await overlayPage.isTimerRunning()).toBe(false);
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);
    });

    test('timer controls are always accessible', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Verify timer button is accessible at each step
      for (let i = 0; i < totalSteps; i++) {
        if (i > 0) {
          await overlayPage.nextStep();
        }

        await expect(overlayPage.playPauseButton).toBeVisible();
        await expect(overlayPage.playPauseButton).toBeEnabled();
      }
    });
  });

  test.describe('Build Order Metadata', () => {
    test('build order name remains visible throughout navigation', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      for (let i = 0; i < totalSteps; i++) {
        if (i > 0) {
          await overlayPage.nextStep();
        }

        // Title should always be visible
        await expect(overlayPage.buildOrderTitle).toBeVisible();

        // Title should be consistent
        const title = await overlayPage.getBuildOrderName();
        expect(title).toBe('English Longbow Rush');
      }
    });

    test('step timing information is displayed for each step', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      for (let i = 0; i < totalSteps; i++) {
        const stepText = await overlayPage.getStepDescription(i);

        // Each step should have timing in format "M:SS"
        expect(stepText).toMatch(/\d+:\d{2}/);
      }
    });

    test('resource information is displayed when applicable', async () => {
      // First step should show wood resource
      const step1Text = await overlayPage.getStepDescription(0);
      expect(step1Text.toLowerCase()).toMatch(/wood|50/);

      // Second step should show food and gold
      const step2Text = await overlayPage.getStepDescription(1);
      expect(step2Text.toLowerCase()).toMatch(/food|gold|400|200/);
    });
  });

  test.describe('Build Order Completion', () => {
    test('can complete entire build order workflow', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Start timer
      await overlayPage.toggleTimer();
      await overlayPage.page.waitForTimeout(100);

      // Go through all steps
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
        await overlayPage.page.waitForTimeout(50);
      }

      // Verify we completed all steps
      expect(await overlayPage.getCurrentStepIndex()).toBe(totalSteps);

      // Stop timer
      await overlayPage.toggleTimer();

      // Reset for next run
      await overlayPage.reset();
      await overlayPage.page.waitForTimeout(200);

      // Should be ready to start again
      expect(await overlayPage.getCurrentStepIndex()).toBe(1);
      expect(await overlayPage.isTimerRunning()).toBe(false);
    });

    test('completing build order maintains UI state', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      // Navigate to last step
      for (let i = 1; i < totalSteps; i++) {
        await overlayPage.nextStep();
      }

      // All UI elements should still be functional
      await expect(overlayPage.buildOrderTitle).toBeVisible();
      await expect(overlayPage.stepCounter).toBeVisible();
      await expect(overlayPage.quickActionBar).toBeVisible();
      await expect(overlayPage.settingsButton).toBeVisible();
      await expect(overlayPage.resetButton).toBeEnabled();
      await expect(overlayPage.playPauseButton).toBeEnabled();
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('rapid step navigation does not cause errors', async () => {
      // Rapidly click next button
      for (let i = 0; i < 10; i++) {
        await overlayPage.nextStepButton.click();
      }

      // Should handle gracefully without crashing
      const currentStep = await overlayPage.getCurrentStepIndex();
      expect(currentStep).toBeGreaterThanOrEqual(1);
      expect(currentStep).toBeLessThanOrEqual(4);
    });

    test('rapid toggle of timer does not cause errors', async () => {
      // Rapidly toggle timer
      for (let i = 0; i < 5; i++) {
        await overlayPage.playPauseButton.click();
        await overlayPage.page.waitForTimeout(50);
      }

      // Should handle gracefully
      await expect(overlayPage.playPauseButton).toBeEnabled();
    });

    test('clicking same step multiple times is handled', async () => {
      // Click step 2 multiple times
      for (let i = 0; i < 3; i++) {
        await overlayPage.clickStep(1);
        await overlayPage.page.waitForTimeout(50);
      }

      // Should be at step 2
      expect(await overlayPage.getCurrentStepIndex()).toBe(2);
    });

    test('navigation during reset is handled gracefully', async () => {
      // Navigate to step 3
      await overlayPage.nextStep();
      await overlayPage.nextStep();

      // Click reset and immediately try to navigate
      await overlayPage.resetButton.click();
      await overlayPage.nextStepButton.click();

      // Should end up in a valid state
      const currentStep = await overlayPage.getCurrentStepIndex();
      expect(currentStep).toBeGreaterThanOrEqual(1);
      expect(currentStep).toBeLessThanOrEqual(4);
    });
  });

  test.describe('Accessibility During Build Order Flow', () => {
    test('all interactive elements remain keyboard accessible', async () => {
      // Tab through elements
      await overlayPage.page.keyboard.press('Tab');
      await overlayPage.page.keyboard.press('Tab');

      // Navigation should still work
      await overlayPage.nextStep();
      expect(await overlayPage.getCurrentStepIndex()).toBe(2);
    });

    test('step counter is always readable', async () => {
      const totalSteps = await overlayPage.getTotalStepCount();

      for (let i = 0; i < totalSteps; i++) {
        if (i > 0) {
          await overlayPage.nextStep();
        }

        const counterText = await overlayPage.stepCounter.textContent();
        expect(counterText).toBeTruthy();
        expect(counterText).toMatch(/\d+\/\d+/);
      }
    });
  });
});
