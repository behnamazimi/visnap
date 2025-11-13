/**
 * Configuration for the concurrency pool.
 */
export interface PoolOptions {
  /** Maximum number of concurrent workers to run at the same time. Must be >= 1. */
  concurrency: number;
}

/**
 * Creates a concurrency pool for processing items with a parallelism limit.
 *
 * Usage:
 * ```ts
 * const runWithPool = createConcurrencyPool({ concurrency: 4 });
 * const results = await runWithPool(items, async (item, index) => doWork(item));
 * ```
 *
 * - The worker function is called once per item
 * - Items are processed in batches up to the concurrency limit
 * - Results preserve input order; `results[i]` corresponds to `items[i]`
 *
 * @param options - Concurrency pool options
 * @returns A function that processes items and returns results in input order
 */
export function createConcurrencyPool(options: PoolOptions) {
  // Validate input parameters
  if (typeof options.concurrency !== "number" || isNaN(options.concurrency)) {
    throw new Error("Concurrency must be a valid number");
  }
  if (options.concurrency < 1) {
    throw new Error("Concurrency must be at least 1");
  }
  if (!Number.isInteger(options.concurrency)) {
    throw new Error("Concurrency must be an integer");
  }

  const limit = Math.max(1, Math.floor(options.concurrency));
  return async function runWithPool<T, R>(
    items: T[],
    worker: (item: T, index: number) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = Array.from({ length: items.length });
    let cursor = 0;

    async function processNextItem(): Promise<void> {
      while (cursor < items.length) {
        const index = cursor++;
        const item = items[index] as T;
        results[index] = await worker(item, index);
      }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
      processNextItem()
    );
    await Promise.all(workers);
    return results;
  };
}
