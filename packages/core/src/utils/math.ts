/**
 * Math utilities for consistent rounding and calculations
 */

/**
 * Rounds a number to a specified number of decimal places
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Precision multiplier constant for consistent rounding
 */
export const PRECISION_MULTIPLIER = 100;

/**
 * Minimum concurrency value
 */
export const MIN_CONCURRENCY = 1;

/**
 * Fallback timeout value in milliseconds
 */
export const FALLBACK_TIMEOUT = 1000;

/**
 * Rounds a number to 2 decimal places using the precision multiplier
 * This is a convenience function for the common case of rounding to 2 decimals
 */
export function roundToTwoDecimals(value: number): number {
  return roundToDecimals(value, 2);
}
