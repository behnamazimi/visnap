/**
 * @fileoverview Screenshot types for Visnap visual testing framework
 *
 * This module defines types related to screenshot capture and results.
 */

import type { Viewport } from "./core";
import type { InteractionAction } from "./interactions";

/**
 * Options for screenshot capture
 * @property id - Unique identifier for this screenshot
 * @property url - URL to capture
 * @property screenshotTarget - CSS selector for the element to capture (default: "body")
 * @property viewport - Viewport configuration for capture
 * @property waitFor - Selector or timeout to wait for before capture
 * @property disableCSSInjection - Skip injecting global CSS (default: false)
 * @property interactions - Actions to perform before capture
 * @property elementsToMask - CSS selectors of elements to mask before capture
 */
export interface ScreenshotOptions {
  id: string;
  url: string;
  screenshotTarget?: string;
  viewport?: Viewport;
  waitFor?: string | number;
  disableCSSInjection?: boolean;
  interactions?: InteractionAction[];
  /** CSS selectors of elements to mask (overlay) before capture */
  elementsToMask?: string[];
}

/**
 * Result of a screenshot capture operation
 * @property buffer - PNG image data as Uint8Array
 * @property meta - Metadata about the capture operation
 * @property meta.elapsedMs - Time taken to capture in milliseconds
 * @property meta.viewportKey - Viewport configuration key used
 * @property meta.id - Screenshot identifier
 */
export interface ScreenshotResult {
  buffer: Uint8Array;
  meta: { elapsedMs: number; viewportKey?: string; id: string };
}

/**
 * Page context interface with evaluation capabilities
 * Used by adapters that need to execute code in the browser context
 * @property evaluate - Optional function to execute code in browser context
 * @property close - Optional function to close the page context
 */
export type PageWithEvaluate = {
  evaluate?: (fn: () => Promise<unknown>) => Promise<unknown>;
  close?: () => Promise<void>;
};
