/**
 * Constants for playwright-adapter
 *
 * These constants serve as fallback defaults when not configured via PlaywrightAdapterOptions.
 * All timeout values can be overridden in the adapter configuration:
 * - screenshot.waitForElementTimeoutMs - overrides SCREENSHOT_ELEMENT_TIMEOUT
 * - interaction.defaultTimeoutMs - overrides INTERACTION_DEFAULT_TIMEOUT
 * - interaction.settleTimeMs - overrides INTERACTION_SETTLE_TIME
 * - navigation.timeoutMs - main page timeout (replaces DEFAULT_PAGE_TIMEOUT)
 * - navigation.networkIdleFallbackDelayMs - overrides NETWORK_IDLE_FALLBACK_DELAY
 * - navigation.networkIdleTimeoutDivisor - overrides NETWORK_IDLE_TIMEOUT_DIVISOR
 */

// Timeout constants (in milliseconds) - fallback defaults
export const SCREENSHOT_ELEMENT_TIMEOUT = 2000;
export const INTERACTION_DEFAULT_TIMEOUT = 5000;
export const INTERACTION_SETTLE_TIME = 100;
export const DEFAULT_PAGE_TIMEOUT = 30000;
export const NETWORK_IDLE_FALLBACK_DELAY = 1000;
export const NETWORK_IDLE_TIMEOUT_DIVISOR = 10;
