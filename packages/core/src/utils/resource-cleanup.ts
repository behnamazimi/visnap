/**
 * Resource cleanup utilities to prevent memory leaks
 */

import type { Browser, Page } from "playwright-core";

import log from "./logger";

/**
 * Manages browser instances and ensures proper cleanup
 */
export class BrowserManager {
  private browsers: Browser[] = [];
  private pages: Page[] = [];

  /**
   * Register a browser instance for cleanup
   */
  registerBrowser(browser: Browser): void {
    this.browsers.push(browser);
  }

  /**
   * Register a page instance for cleanup
   */
  registerPage(page: Page): void {
    this.pages.push(page);
  }

  /**
   * Close all registered pages
   */
  async closeAllPages(): Promise<void> {
    const closePromises = this.pages.map(async page => {
      try {
        if (!page.isClosed()) {
          await page.close();
        }
      } catch (error) {
        log.debug(
          `Error closing page: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    });

    await Promise.allSettled(closePromises);
    this.pages = [];
  }

  /**
   * Close all registered browsers
   */
  async closeAllBrowsers(): Promise<void> {
    const closePromises = this.browsers.map(async browser => {
      try {
        if (browser.isConnected()) {
          await browser.close();
        }
      } catch (error) {
        log.debug(
          `Error closing browser: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    });

    await Promise.allSettled(closePromises);
    this.browsers = [];
  }

  /**
   * Remove a browser from tracking (when explicitly closed)
   */
  removeBrowser(browser: Browser): void {
    const index = this.browsers.indexOf(browser);
    if (index > -1) {
      this.browsers.splice(index, 1);
    }
  }

  /**
   * Remove a page from tracking (when explicitly closed)
   */
  removePage(page: Page): void {
    const index = this.pages.indexOf(page);
    if (index > -1) {
      this.pages.splice(index, 1);
    }
  }

  /**
   * Close all resources (pages first, then browsers)
   */
  async cleanup(): Promise<void> {
    await this.closeAllPages();
    await this.closeAllBrowsers();
  }

  /**
   * Get the number of registered browsers
   */
  getBrowserCount(): number {
    return this.browsers.length;
  }

  /**
   * Get the number of registered pages
   */
  getPageCount(): number {
    return this.pages.length;
  }
}

/**
 * Global browser manager instance
 */
export const globalBrowserManager = new BrowserManager();

/**
 * Cleanup function to be called on process exit
 */
export const setupCleanup = (): void => {
  const cleanup = async (): Promise<void> => {
    log.debug("Cleaning up remaining resources...");
    await globalBrowserManager.cleanup();
  };

  // Only cleanup on process exit signals, not during normal operation
  process.on("exit", () => {
    // Synchronous cleanup for exit
    globalBrowserManager.closeAllBrowsers().catch(() => {
      // Ignore errors during exit cleanup
    });
  });

  process.on("SIGINT", async () => {
    log.info("Received SIGINT, cleaning up...");
    await cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    log.info("Received SIGTERM, cleaning up...");
    await cleanup();
    process.exit(0);
  });

  process.on("uncaughtException", async error => {
    log.error(`Uncaught exception: ${error.message}`);
    await cleanup();
    process.exit(1);
  });

  process.on("unhandledRejection", async reason => {
    log.error(`Unhandled rejection: ${reason}`);
    await cleanup();
    process.exit(1);
  });
};
