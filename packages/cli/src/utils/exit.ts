export type ExitFn = (code?: number) => never;

/**
 * Exit codes used by the CLI:
 * - 0: Success
 * - 1: General error (configuration, runtime, etc.)
 * - 2: Test failures (visual differences found)
 * - 3: Capture failures (screenshots failed to capture)
 * - 4: Comparison failures (comparison engine errors)
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  TEST_FAILURES: 2,
  CAPTURE_FAILURES: 3,
  COMPARISON_FAILURES: 4,
} as const;

// Exported indirection over process.exit to allow tests to mock it safely
export const exit: ExitFn = ((code?: number) => {
  return process.exit(code);
}) as ExitFn;
