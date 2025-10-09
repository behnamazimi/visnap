# @vividiff/protocol

Shared TypeScript types and interfaces for the visual testing tool ecosystem. This package contains all the type definitions used across adapters and the core library.

## Installation

```bash
npm install @vividiff/protocol
```

## Usage

```typescript
import type {
  VisualTestingToolConfig,
  BrowserAdapter,
  TestCaseAdapter,
  TestCaseInstance,
  ScreenshotOptions,
  RunOutcome
} from '@vividiff/protocol';
```

## Core Types

### Configuration Types

#### `VisualTestingToolConfig`

Main configuration interface for the visual testing tool.

```typescript
interface VisualTestingToolConfig {
  adapters: {
    browser: BrowserAdapterOptions;
    testCase: TestCaseAdapterOptions[];
  };
  threshold: number;
  screenshotDir?: string;
  runtime?: {
    maxConcurrency?: number;
  };
  viewport?: ViewportMap;
}
```

#### `BrowserAdapterOptions`

Browser adapter configuration.

```typescript
interface BrowserAdapterOptions {
  name: string;
  options?: {
    browser?: BrowserConfiguration | BrowserConfiguration[];
    [key: string]: unknown;
  };
}
```

#### `TestCaseAdapterOptions`

Test case adapter configuration.

```typescript
interface TestCaseAdapterOptions {
  name: string;
  options?: {
    source: string;
    port?: number;
    include?: string | string[];
    exclude?: string | string[];
  };
}
```

### Adapter Interfaces

#### `BrowserAdapter`

Interface for browser automation adapters.

```typescript
interface BrowserAdapter {
  name: string;
  init(opts: BrowserAdapterInitOptions): Promise<void> | void;
  openPage(url: string): Promise<PageWithEvaluate | void>;
  capture(opts: ScreenshotOptions): Promise<ScreenshotResult>;
  dispose(): Promise<void> | void;
}
```

#### `TestCaseAdapter`

Interface for test case discovery adapters.

```typescript
interface TestCaseAdapter {
  name: string;
  start?(): Promise<TestCaseAdapterStartResult | void>;
  listCases(
    pageCtx?: PageWithEvaluate,
    opts?: { viewport?: ViewportMap }
  ): Promise<TestCaseInstanceMeta[]>;
  stop?(): Promise<void>;
}
```

### Data Types

#### `TestCaseInstance`

Represents a concrete test case instance ready for execution.

```typescript
interface TestCaseInstance {
  caseId: string;
  variantId: string;
  url: string;
  screenshotTarget?: string;
  viewport?: Viewport;
  browser?: BrowserName;
  threshold?: number;
}
```

#### `ScreenshotOptions`

Options for screenshot capture.

```typescript
interface ScreenshotOptions {
  id: string;
  url: string;
  screenshotTarget?: string;
  viewport?: Viewport;
  waitFor?: string | number;
}
```

#### `ScreenshotResult`

Result of a screenshot capture operation.

```typescript
interface ScreenshotResult {
  buffer: Uint8Array;
  meta: { elapsedMs: number; viewportKey?: string; id: string };
}
```

### Browser Types

#### `BrowserName`

Supported browser types.

```typescript
type BrowserName = "chromium" | "firefox" | "webkit" | (string & {});
```

#### `Viewport`

Viewport configuration.

```typescript
interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
}
```

#### `ViewportMap`

Map of viewport configurations.

```typescript
type ViewportMap = Record<string, Viewport>;
```

### Test Results

#### `RunOutcome`

Aggregate outcome for a test run.

```typescript
interface RunOutcome {
  total: number;
  passed: number;
  failedDiffs: number;
  failedMissingCurrent: number;
  failedMissingBase: number;
  failedErrors: number;
  captureFailures: number;
}
```

#### `CompareReason`

Standardized comparison reasons for non-matching results.

```typescript
type CompareReason =
  | "pixel-diff"
  | "missing-current"
  | "missing-base"
  | "error";
```

### Story Types

#### `VTTStory`

Story metadata with visual testing configuration.

```typescript
interface VTTStory {
  id: string;
  title: string;
  kind: string;
  visualTesting: {
    skip?: boolean;
    screenshotTarget?: "story-root" | "body" | string;
    threshold?: number;
    browser?: BrowserName | BrowserName[];
    viewport?: ViewportConfig;
  };
}
```

## Type Categories

### Core Adapter Types
- `BrowserAdapter` - Browser automation interface
- `TestCaseAdapter` - Test case discovery interface
- `PageWithEvaluate` - Page context interface

### Configuration Types
- `VisualTestingToolConfig` - Main configuration
- `BrowserAdapterOptions` - Browser adapter config
- `TestCaseAdapterOptions` - Test case adapter config

### Data Types
- `TestCaseInstance` - Test case representation
- `ScreenshotOptions` - Screenshot capture options
- `ScreenshotResult` - Screenshot capture result

### Browser Types
- `BrowserName` - Supported browsers
- `Viewport` - Viewport configuration
- `BrowserConfiguration` - Browser setup

### Test Results
- `RunOutcome` - Test run summary
- `CompareReason` - Comparison failure reasons

## Usage Examples

### Creating a Custom Adapter

```typescript
import type { BrowserAdapter, ScreenshotOptions, ScreenshotResult } from '@vividiff/protocol';

class MyBrowserAdapter implements BrowserAdapter {
  name = 'my-adapter';
  
  async init() {
    // Initialize browser
  }
  
  async capture(options: ScreenshotOptions): Promise<ScreenshotResult> {
    // Capture screenshot
    return {
      buffer: new Uint8Array(),
      meta: { elapsedMs: 100, id: options.id }
    };
  }
  
  async dispose() {
    // Cleanup
  }
}
```

### Type-Safe Configuration

```typescript
import type { VisualTestingToolConfig } from '@vividiff/protocol';

const config: VisualTestingToolConfig = {
  adapters: {
    browser: {
      name: '@vividiff/playwright-adapter',
      options: { browser: 'chromium' }
    },
    testCase: [{
      name: '@vividiff/storybook-adapter',
      options: {
        source: './storybook-static',
        include: '*'
      }
    }]
  },
  threshold: 0.1,
  screenshotDir: 'vividiff'
};
```

## Related Packages

- [`@vividiff/core`](../core/README.md) - Core implementation using these types
- [`@vividiff/playwright-adapter`](../playwright-adapter/README.md) - Browser adapter implementation
- [`@vividiff/storybook-adapter`](../storybook-adapter/README.md) - Test case adapter implementation

## License

MIT
