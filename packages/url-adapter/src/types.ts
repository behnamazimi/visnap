import type {
  Viewport,
  InteractionAction,
  FilterOptions,
} from "@visnap/protocol";

/**
 * Configuration for a single URL to test
 */
export interface UrlConfig {
  /** Unique identifier for the test case */
  id: string;
  /** Absolute URL to test */
  url: string;
  /** Display title (defaults to id) */
  title?: string;
  /** CSS selector for screenshot target */
  screenshotTarget?: string;
  /** Per-URL viewport override */
  viewport?: Viewport;
  /** Per-URL threshold override */
  threshold?: number;
  /** Optional flag to disable CSS injection for this specific URL */
  disableCSSInjection?: boolean;
  /** Per-URL interactions to execute before screenshot */
  interactions?: InteractionAction[];
}

/**
 * Options to create a URL adapter
 */
export interface CreateUrlAdapterOptions extends FilterOptions {
  /** Array of URLs to test */
  urls: UrlConfig[];
}
