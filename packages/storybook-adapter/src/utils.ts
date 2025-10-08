/**
 * Utility functions for the Storybook adapter
 */

/**
 * Races a promise against a timeout and ensures the timer is always cleared.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Escapes a string for safe use inside a RegExp literal.
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converts a user pattern supporting only `*` wildcards into a safe anchored RegExp.
 * Returns null if the pattern cannot produce a valid RegExp.
 */
export function toSafeRegex(pattern: string): RegExp | null {
  // Support '*' wildcards only; escape everything else
  const escaped = pattern
    .split("*")
    .map(segment => escapeRegExp(segment))
    .join(".*");
  try {
    return new RegExp(`^${escaped}$`);
  } catch {
    return null;
  }
}
