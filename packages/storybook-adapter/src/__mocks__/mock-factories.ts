/**
 * @fileoverview Mock factory functions for creating test data
 */

import type {
  TestCaseMeta,
  TestCaseInstanceMeta,
  ViewportMap,
  BrowserName,
  Viewport,
} from "@visnap/protocol";

/**
 * Creates a mock story object
 */
export function createMockStory(
  overrides: Partial<TestCaseMeta> = {}
): TestCaseMeta {
  return {
    id: "button-primary",
    title: "Primary Button",
    kind: "story",
    visualTesting: {},
    ...overrides,
  };
}

/**
 * Creates a mock storybook adapter options
 */
export function createMockStorybookAdapterOptions(
  overrides: {
    source?: string;
    port?: number;
    include?: string | string[];
    exclude?: string | string[];
    discovery?: {
      evalTimeoutMs?: number;
      maxRetries?: number;
      retryDelayMs?: number;
    };
  } = {}
) {
  return {
    source: "/path/to/storybook",
    ...overrides,
  };
}

/**
 * Creates a mock discovery configuration
 */
export function createMockDiscoveryConfig(
  overrides: {
    evalTimeoutMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
  } = {}
) {
  return {
    evalTimeoutMs: 15000,
    maxRetries: 3,
    retryDelayMs: 500,
    ...overrides,
  };
}

/**
 * Creates a mock filter options
 */
export function createMockFilterOptions(
  overrides: {
    include?: string | string[];
    exclude?: string | string[];
  } = {}
) {
  return {
    include: undefined,
    exclude: undefined,
    ...overrides,
  };
}

/**
 * Creates a mock viewport configuration
 */
export function createMockViewportMap(
  overrides: Partial<ViewportMap> = {}
): ViewportMap {
  return {
    default: { width: 1024, height: 768 },
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    ...overrides,
  };
}

/**
 * Creates a mock viewport
 */
export function createMockViewport(
  overrides: Partial<Viewport> = {}
): Viewport {
  return {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    ...overrides,
  };
}

/**
 * Creates a mock test case instance
 */
export function createMockTestCaseInstance(
  overrides: Partial<TestCaseInstanceMeta> = {}
): TestCaseInstanceMeta {
  return {
    id: "button-primary",
    caseId: "button-primary",
    variantId: "default",
    title: "Primary Button",
    kind: "story",
    url: "http://localhost:4477/iframe.html?id=button-primary",
    screenshotTarget: "#storybook-root",
    viewport: createMockViewport(),
    ...overrides,
  };
}

/**
 * Creates a mock story with visual testing configuration
 */
export function createMockStoryWithVisualTesting(
  overrides: {
    id?: string;
    title?: string;
    visualTesting?: {
      skip?: boolean;
      screenshotTarget?: string;
      threshold?: number;
      browser?: BrowserName | BrowserName[];
      viewport?: Viewport;
      disableCSSInjection?: boolean;
      interactions?: any[];
      elementsToMask?: string[];
    };
  } = {}
) {
  const { visualTesting = {}, ...rest } = overrides;

  return {
    id: "button-primary",
    title: "Primary Button",
    parameters: {
      visualTesting: {
        skip: false,
        screenshotTarget: "#storybook-root",
        threshold: 0.1,
        ...visualTesting,
      },
    },
    ...rest,
  };
}

/**
 * Creates a mock storybook stories object
 */
export function createMockStories(overrides: Record<string, any> = {}) {
  return {
    "button-primary": {
      id: "button-primary",
      title: "Primary Button",
      parameters: {
        visualTesting: {
          skip: false,
          screenshotTarget: "#button",
          threshold: 0.1,
        },
      },
    },
    "button-secondary": {
      id: "button-secondary",
      title: "Secondary Button",
      parameters: {
        visualTesting: {
          skip: true,
        },
      },
    },
    "input-text": {
      id: "input-text",
      title: "Text Input",
      parameters: {
        visualTesting: {
          skip: false,
          threshold: 0.2,
        },
      },
    },
    ...overrides,
  };
}

/**
 * Creates a mock storybook window object
 */
export function createMockStorybookWindow(
  overrides: {
    ready?: () => Promise<void>;
    extract?: () => Promise<Record<string, unknown>>;
  } = {}
) {
  return {
    ready: () => Promise.resolve(),
    extract: () => Promise.resolve(createMockStories()),
    ...overrides,
  };
}

/**
 * Creates a mock server manager configuration
 */
export function createMockServerManagerConfig(
  overrides: {
    source?: string;
    port?: number;
    baseUrl?: string;
  } = {}
) {
  return {
    source: "/path/to/storybook",
    port: 4477,
    baseUrl: "http://localhost:4477",
    ...overrides,
  };
}

/**
 * Creates a mock filter test data
 */
export function createMockFilterTestData() {
  return {
    stories: [
      createMockStory({ id: "button-primary" }),
      createMockStory({ id: "button-secondary" }),
      createMockStory({ id: "input-text" }),
      createMockStory({ id: "modal-dialog" }),
      createMockStory({ id: "button-test" }),
      createMockStory({ id: "test-button" }),
      createMockStory({ id: "input-spec" }),
    ],
    includePatterns: ["button*", "input*"],
    excludePatterns: ["*test*", "*spec*"],
  };
}

/**
 * Creates a mock discovery test data
 */
export function createMockDiscoveryTestData() {
  return {
    stories: createMockStories(),
    config: createMockDiscoveryConfig(),
    pageContext: {
      evaluate: () => Promise.resolve(createMockStories()),
      close: () => Promise.resolve(),
    },
  };
}

/**
 * Creates a mock server test data
 */
export function createMockServerTestData() {
  return {
    source: "/path/to/storybook",
    port: 4477,
    baseUrl: "http://localhost:4477",
    server: {
      listen: () => {},
      close: () => {},
      once: () => {},
      off: () => {},
    },
  };
}
