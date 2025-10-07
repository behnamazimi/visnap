/**
 * Global type declarations for Storybook adapter
 */

/**
 * Interface for Storybook's preview object available on window.__STORYBOOK_PREVIEW__
 */
interface StorybookPreview {
  ready?(): Promise<void> | void;
  extract(): Promise<Record<string, unknown>>;
}

/**
 * Extend the global Window interface to include Storybook's preview object
 */
declare global {
  interface Window {
    __STORYBOOK_PREVIEW__?: StorybookPreview;
  }
}

export {};
