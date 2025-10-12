import { log } from "@vividiff/core";

import {
  formatTestSummary,
  formatNextSteps,
  type TestSummary,
} from "../utils/formatter";
import { createSpinner, shouldUseSpinner } from "../utils/spinner";

export interface PresentationServiceOptions {
  useSpinner?: boolean;
}

/**
 * Service for handling presentation and UI concerns
 */
export class PresentationService {
  private spinner: ReturnType<typeof createSpinner> | null = null;
  private useSpinner: boolean;

  constructor(options: PresentationServiceOptions = {}) {
    this.useSpinner = options.useSpinner ?? shouldUseSpinner();
    if (this.useSpinner) {
      this.spinner = createSpinner();
    }
  }

  /**
   * Start a loading message
   */
  startLoading(message: string): void {
    if (this.useSpinner && this.spinner) {
      this.spinner.start(message);
    } else {
      log.info(message);
    }
  }

  /**
   * Update loading message
   */
  updateLoading(message: string): void {
    if (this.useSpinner && this.spinner) {
      this.spinner.update(message);
    } else {
      log.info(message);
    }
  }

  /**
   * Complete loading with success
   */
  completeLoading(message: string): void {
    if (this.useSpinner && this.spinner) {
      this.spinner.succeed(message);
    } else {
      log.success(message);
    }
  }

  /**
   * Complete loading with failure
   */
  failLoading(message: string): void {
    if (this.useSpinner && this.spinner) {
      this.spinner.fail(message);
    } else {
      log.error(message);
    }
  }

  /**
   * Stop loading without completion message
   */
  stopLoading(): void {
    if (this.useSpinner && this.spinner) {
      this.spinner.stop();
    }
  }

  /**
   * Display test summary
   */
  displayTestSummary(result: {
    outcome: {
      total?: number;
      passed?: number;
      failedDiffs?: number;
      failedErrors?: number;
      captureFailures?: number;
    };
    success: boolean;
  }): void {
    const summary: TestSummary = {
      total: result.outcome.total || 0,
      passed: result.outcome.passed || 0,
      failed: result.outcome.failedDiffs || 0,
      errors:
        (result.outcome.failedErrors || 0) +
        (result.outcome.captureFailures || 0),
      captureFailures: result.outcome.captureFailures || 0,
    };

    formatTestSummary(summary);
    formatNextSteps(summary);

    if (!result.success) {
      log.error("Some tests failed");
    }
  }

  /**
   * Display success message
   */
  displaySuccess(message: string): void {
    log.success(message);
  }

  /**
   * Display error message
   */
  displayError(message: string): void {
    log.error(message);
  }

  /**
   * Display info message
   */
  displayInfo(message: string): void {
    log.info(message);
  }
}
