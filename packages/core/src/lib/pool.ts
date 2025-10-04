/**
 * Configuration for the concurrency pool.
 */
export interface PoolOptions {
  /** Maximum number of concurrent workers to run at the same time. Must be >= 1. */
  concurrency: number;
}

/**
 * Creates a small, framework-agnostic concurrency pool for processing a list of items with a given parallelism limit.
 *
 * Usage:
 * ```ts
 * const runWithPool = createConcurrencyPool({ concurrency: 4 });
 * const results = await runWithPool(items, async (item, index) => doWork(item));
 * ```
 *
 * - The provided `worker` is called exactly once per item.
 * - Items are processed in batches up to `concurrency` at a time.
 * - The returned array preserves input order; `results[i]` corresponds to `items[i]`.
 *
 * This utility is transport- and framework-agnostic: it does not depend on Node, Playwright, HTTP, etc.
 *
 * @param options Concurrency pool options
 * @returns A function that accepts a list of items and an async worker, returning results in input order
 */
export function createConcurrencyPool(options: PoolOptions) {
  const limit = Math.max(1, Math.floor(options.concurrency));
  return async function runWithPool<T, R>(
    items: T[],
    worker: (item: T, index: number) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = Array.from({ length: items.length });
    let cursor = 0;

    async function runOne(): Promise<void> {
      while (true) {
        const index = cursor++;
        if (index >= items.length) return;
        const item = items[index] as T;
        results[index] = await worker(item, index);
      }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
      runOne()
    );
    await Promise.all(workers);
    return results;
  };
}
