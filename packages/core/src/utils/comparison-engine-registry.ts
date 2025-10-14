import type { ComparisonEngine, ComparisonCore } from "@visnap/protocol";

/**
 * Registry for comparison engines
 */
class ComparisonEngineRegistry {
  private engines = new Map<ComparisonCore, ComparisonEngine>();

  /**
   * Register a comparison engine
   */
  register(engine: ComparisonEngine): void {
    this.engines.set(engine.name as ComparisonCore, engine);
  }

  /**
   * Get a comparison engine by name
   */
  get(name: ComparisonCore): ComparisonEngine {
    const engine = this.engines.get(name);
    if (!engine) {
      throw new Error(
        `Comparison engine '${name}' not found. Available engines: ${Array.from(this.engines.keys()).join(", ")}`
      );
    }
    return engine;
  }

  /**
   * Get all registered engines
   */
  getAll(): ComparisonEngine[] {
    return Array.from(this.engines.values());
  }

  /**
   * Check if an engine is registered
   */
  has(name: ComparisonCore): boolean {
    return this.engines.has(name);
  }
}

// Global registry instance
export const comparisonEngineRegistry = new ComparisonEngineRegistry();

/**
 * Register built-in comparison engines
 */
export function registerBuiltInEngines(): void {
  // Import and register engines dynamically to avoid circular dependencies
  import("../lib/compare").then(({ OdiffEngine, PixelmatchEngine }) => {
    comparisonEngineRegistry.register(new OdiffEngine());
    comparisonEngineRegistry.register(new PixelmatchEngine());
  });
}
