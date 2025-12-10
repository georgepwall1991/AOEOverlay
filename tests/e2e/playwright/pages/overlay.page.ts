import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the AoE4 Overlay window.
 * Represents the main overlay that displays build orders with steps, timer, and controls.
 */
export class OverlayPage {
  readonly page: Page;

  // Main container
  readonly container: Locator;

  // Header elements
  readonly settingsButton: Locator;
  readonly dragHandle: Locator;
  readonly buildOrderTitle: Locator;
  readonly branchName: Locator;

  // Timer and progress
  readonly timerBar: Locator;
  readonly progressIndicator: Locator;
  readonly stepCounter: Locator;
  readonly paceDot: Locator;

  // Build order display
  readonly buildSelector: Locator;
  readonly stepsContainer: Locator;
  readonly steps: Locator;
  readonly currentStep: Locator;

  // Quick action bar buttons
  readonly quickActionBar: Locator;
  readonly previousStepButton: Locator;
  readonly nextStepButton: Locator;
  readonly playPauseButton: Locator;
  readonly resetButton: Locator;
  readonly cycleBuildButton: Locator;
  readonly resetLockButton: Locator;

  // Status indicators
  readonly clickThroughIndicator: Locator;
  readonly keyboardShortcutsButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main container - using general class selector as fallback
    this.container = page.locator('[data-testid="overlay-container"]').or(
      page.locator('.glass-panel, .floating-panel, .floating-panel-pro').first()
    );

    // Header elements
    this.settingsButton = page.locator('[data-testid="settings-button"]').or(
      page.locator('button[title="Open Settings"]')
    );
    this.dragHandle = page.locator('[data-testid="drag-handle"]').or(
      page.getByTitle(/Drag to move/)
    );
    this.buildOrderTitle = page.locator('[data-testid="build-order-title"]').or(
      page.locator('h2, h3').first()
    );
    this.branchName = page.locator('[data-testid="branch-name"]').or(
      page.locator('span').filter({ hasText: /→/ })
    );

    // Timer and progress
    this.timerBar = page.locator('[data-testid="timer-bar"]');
    this.progressIndicator = page.locator('[data-testid="progress-indicator"]');
    this.stepCounter = page.locator('[data-testid="step-counter"]').or(
      page.locator('text=/\\d+\\/\\d+/')
    );
    this.paceDot = page.locator('[data-testid="pace-dot"]').or(
      page.locator('.rounded-full').filter({ hasText: '' })
    );

    // Build order display
    this.buildSelector = page.locator('[data-testid="build-selector"]');
    this.stepsContainer = page.locator('[data-testid="steps-container"]');
    this.steps = page.locator('[data-testid="build-step"]');
    this.currentStep = page.locator('[data-testid="build-step"][data-active="true"]');

    // Quick action bar - use structural relationship to find button container
    this.quickActionBar = page.locator('[data-testid="quick-action-bar"]').or(
      page.locator('[data-testid="previous-step-button"], [data-testid="play-pause-button"]').locator('..')
    );
    this.resetLockButton = page.locator('[data-testid="reset-lock-button"]').or(
      page.locator('button[title*="Lock reset"], button[title*="Unlock reset"]')
    );
    this.resetButton = page.locator('[data-testid="reset-button"]').or(
      page.getByRole('button', { name: /Reset/ })
    );
    this.previousStepButton = page.locator('[data-testid="previous-step-button"]').or(
      page.getByRole('button', { name: /Previous Step/ })
    );
    this.playPauseButton = page.locator('[data-testid="play-pause-button"]').or(
      page.getByRole('button', { name: /Timer/ })
    );
    this.nextStepButton = page.locator('[data-testid="next-step-button"]').or(
      page.getByRole('button', { name: /Next Step/ })
    );
    this.cycleBuildButton = page.locator('[data-testid="cycle-build-button"]').or(
      page.getByRole('button', { name: /Cycle Build/ })
    );

    // Status indicators
    this.clickThroughIndicator = page.locator('[data-testid="click-through-indicator"]').or(
      page.locator('[title*="Click-through"]')
    );
    this.keyboardShortcutsButton = page.locator('[data-testid="keyboard-shortcuts-button"]').or(
      page.locator('button[title*="Keyboard shortcuts"], button[title*="Show shortcuts"]')
    );
  }

  /**
   * Navigate to the overlay page
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Get the currently active step element
   */
  async getCurrentStep(): Promise<Locator> {
    return this.currentStep;
  }

  /**
   * Get a specific step by index (0-based)
   */
  getStep(index: number): Locator {
    return this.steps.nth(index);
  }

  /**
   * Click on a specific step to navigate to it
   */
  async clickStep(index: number) {
    await this.getStep(index).click();
  }

  /**
   * Get the total number of visible steps
   */
  async getStepCount(): Promise<number> {
    return await this.steps.count();
  }

  /**
   * Get the current step index from the step counter (e.g., "2/10" returns 2)
   */
  async getCurrentStepIndex(): Promise<number> {
    const counterText = await this.stepCounter.textContent();
    if (!counterText) return 0;
    const match = counterText.match(/(\d+)\/\d+/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get the total step count from the step counter (e.g., "2/10" returns 10)
   */
  async getTotalStepCount(): Promise<number> {
    const counterText = await this.stepCounter.textContent();
    if (!counterText) return 0;
    const match = counterText.match(/\d+\/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get the description text of a step
   */
  async getStepDescription(index: number): Promise<string> {
    const step = this.getStep(index);
    return (await step.textContent()) || '';
  }

  /**
   * Navigate to the next step
   */
  async nextStep() {
    await this.nextStepButton.click();
  }

  /**
   * Navigate to the previous step
   */
  async previousStep() {
    await this.previousStepButton.click();
  }

  /**
   * Reset the build order to the first step
   */
  async reset() {
    // Check if reset is locked
    const isLocked = await this.resetLockButton.getAttribute('data-active') === 'true';

    if (isLocked) {
      // Unlock first
      await this.resetLockButton.click();
    }

    // Click reset (may need confirmation)
    await this.resetButton.click();

    // Check if confirmation is needed
    const title = await this.resetButton.getAttribute('title');
    const needsConfirmation = title?.includes('Confirm');
    if (needsConfirmation) {
      await this.resetButton.click();
    }
  }

  /**
   * Toggle the timer (play/pause)
   */
  async toggleTimer() {
    await this.playPauseButton.click();
  }

  /**
   * Cycle to the next build order
   */
  async cycleBuildOrder() {
    await this.cycleBuildButton.click();

    // Check if confirmation is needed
    const title = await this.cycleBuildButton.getAttribute('title');
    const needsConfirmation = title?.includes('Confirm');
    if (needsConfirmation) {
      await this.cycleBuildButton.click();
    }
  }

  /**
   * Open the settings window
   */
  async openSettings() {
    await this.settingsButton.click();
  }

  /**
   * Check if the overlay is in compact mode
   */
  async isCompactMode(): Promise<boolean> {
    // In compact mode, the layout is different
    const compactIndicator = this.page.locator('[data-testid="compact-overlay"]');
    return await compactIndicator.isVisible().catch(() => false);
  }

  /**
   * Check if timer is running by examining the button's title attribute.
   * The title toggles between "Start timer" and "Pause timer".
   */
  async isTimerRunning(): Promise<boolean> {
    const title = await this.playPauseButton.getAttribute('title');
    // If title contains "Pause", the timer is running
    // If title contains "Start" or "Play", the timer is stopped
    return title?.toLowerCase().includes('pause') ?? false;
  }

  /**
   * Get the build order name
   */
  async getBuildOrderName(): Promise<string> {
    return (await this.buildOrderTitle.textContent()) || '';
  }

  /**
   * Get the current branch name (if any)
   */
  async getBranchName(): Promise<string | null> {
    const isVisible = await this.branchName.isVisible().catch(() => false);
    if (!isVisible) return null;
    return await this.branchName.textContent();
  }

  /**
   * Select a branch by name
   */
  async selectBranch(branchName: string) {
    const branchButton = this.page.locator('[data-testid="branch-button"]')
      .filter({ hasText: branchName });
    await branchButton.click();
  }

  /**
   * Get the pace status (ahead, behind, on-pace, or unknown)
   */
  async getPaceStatus(): Promise<'ahead' | 'behind' | 'on-pace' | 'unknown'> {
    const title = await this.paceDot.getAttribute('title') || '';

    if (title.toLowerCase().includes('ahead')) return 'ahead';
    if (title.toLowerCase().includes('behind')) return 'behind';
    if (title.toLowerCase().includes('on-pace') || title.toLowerCase().includes('on pace')) return 'on-pace';

    return 'unknown';
  }

  /**
   * Check if click-through mode is active
   */
  async isClickThroughActive(): Promise<boolean> {
    return await this.clickThroughIndicator.isVisible().catch(() => false);
  }
}
