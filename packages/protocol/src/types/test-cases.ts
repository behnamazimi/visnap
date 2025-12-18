/**
 * @fileoverview Test case types for Visnap visual testing framework
 *
 * This module defines types related to test case metadata and instances.
 */

import type { Viewport, BrowserName } from "./core";
import type { InteractionAction } from "./interactions";

/**
 * Visual testing configuration for a specific test case
 * @property skip - Whether to skip this test case
 * @property screenshotTarget - CSS selector for element to capture
 * @property threshold - Pixel difference threshold for this test case
 * @property browser - Browser(s) to use for this test case
 * @property viewport - Viewport configuration for this test case
 * @property disableCSSInjection - Skip injecting global CSS for this test case
 * @property interactions - Actions to perform before capture
 * @property elementsToMask - CSS selectors of elements to mask before capture
 */
export interface TestCaseVisualConfig {
  skip?: boolean;
  screenshotTarget?: string;
  threshold?: number;
  browser?: BrowserName | BrowserName[];
  viewport?: Viewport;
  disableCSSInjection?: boolean;
  interactions?: InteractionAction[];
  /** CSS selectors of elements to mask (overlay) before capture */
  elementsToMask?: string[];
}

/**
 * Base metadata fields common to all test case-related types
 * @property id - Unique identifier for the test case
 * @property title - Human-readable title
 * @property kind - Type of test case (e.g., "story", "url")
 * @property parameters - Additional parameters specific to the test case type
 * @property tags - Tags for categorizing test cases
 */
interface BaseTestCaseMeta {
  id: string;
  title: string;
  kind: string;
  parameters?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Base instance fields for a concrete, runnable test case instance
 * @property caseId - Identifier for the test case
 * @property variantId - Identifier for this specific variant (e.g., viewport key)
 * @property url - URL to test (absolute or relative; if relative, core will prefix adapter.start().baseUrl)
 * @property screenshotTarget - CSS selector for element to capture
 * @property viewport - Viewport configuration for this instance
 * @property browser - Browser for this specific variant
 * @property threshold - Optional per-case threshold applied during comparison
 * @property disableCSSInjection - Optional flag to disable CSS injection
 * @property interactions - Optional interactions to execute before screenshot
 * @property elementsToMask - CSS selectors of elements to mask before capture
 */
interface BaseTestCaseInstance {
  caseId: string;
  variantId: string;
  url: string; // absolute or relative; if relative, core will prefix adapter.start().baseUrl
  screenshotTarget?: string;
  viewport?: Viewport;
  browser?: BrowserName; // Browser for this specific variant
  /** Optional per-case threshold applied during comparison for this instance */
  threshold?: number;
  /** Optional flag to disable CSS injection for this specific test case */
  disableCSSInjection?: boolean;
  /** Optional interactions to execute before screenshot */
  interactions?: InteractionAction[];
  /** CSS selectors of elements to mask (overlay) before capture */
  elementsToMask?: string[];
}

/**
 * Test case metadata including visual testing configuration
 * @property visualTesting - Visual testing specific configuration
 */
export interface TestCaseMeta extends BaseTestCaseMeta {
  visualTesting?: TestCaseVisualConfig;
}

/**
 * A concrete test case instance ready for execution
 */
export type TestCaseInstance = BaseTestCaseInstance;

/**
 * Extended test case instance that includes both metadata and instance fields
 * This allows the instance to be assignable to TestCaseMeta when needed
 */
export interface TestCaseInstanceMeta
  extends BaseTestCaseMeta, BaseTestCaseInstance {
  visualTesting?: TestCaseVisualConfig;
}
