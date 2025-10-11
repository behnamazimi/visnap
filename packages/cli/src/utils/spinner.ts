import ora, { type Ora } from "ora";

/**
 * Spinner utility wrapper around ora for consistent usage
 */
export class Spinner {
  private spinner: Ora | null = null;
  private isEnabled: boolean;

  constructor() {
    // Disable spinner in CI environments or when output is not a TTY
    this.isEnabled = !process.env.CI && process.stdout.isTTY;
  }

  /**
   * Start a spinner with the given text
   */
  start(text: string): void {
    if (!this.isEnabled) {
      console.log(`⏳ ${text}`);
      return;
    }

    this.spinner = ora(text).start();
  }

  /**
   * Update the spinner text
   */
  update(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  /**
   * Stop the spinner with success
   */
  succeed(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  /**
   * Stop the spinner with error
   */
  fail(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  /**
   * Stop the spinner with warning
   */
  warn(text?: string): void {
    if (this.spinner) {
      this.spinner.warn(text);
      this.spinner = null;
    }
  }

  /**
   * Stop the spinner without any status
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Check if spinner is currently running
   */
  isSpinning(): boolean {
    return this.spinner?.isSpinning ?? false;
  }
}

/**
 * Create a new spinner instance
 */
export function createSpinner(): Spinner {
  return new Spinner();
}
