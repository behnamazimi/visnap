# @visual-testing-tool/playwright-adapter

Playwright browser adapter for visual regression testing. Provides browser automation capabilities for capturing screenshots and interacting with web pages.

## Installation

```bash
npm install @visual-testing-tool/playwright-adapter
```

**Peer Dependencies:**
```bash
npm install playwright@>=1.40.0 playwright-core@>=1.40.0
```

## Usage

### Basic Usage

```typescript
import { createAdapter } from '@visual-testing-tool/playwright-adapter';

const adapter = createAdapter({
  launch: {
    browser: 'chromium',
    headless: true
  },
  context: {
    colorScheme: 'light',
    reducedMotion: 'reduce'
  },
  navigation: {
    baseUrl: 'http://localhost:6006',
    waitUntil: 'load',
    timeoutMs: 30000
  }
});

// Initialize the adapter
await adapter.init({ browser: 'chromium' });

// Capture a screenshot
const result = await adapter.capture({
  id: 'button-story',
  url: '/iframe.html?id=button--primary',
  screenshotTarget: '#storybook-root',
  viewport: { width: 1920, height: 1080 }
});

// Clean up
await adapter.dispose();
```

## API

### `createAdapter(options)`

Creates a Playwright-backed `BrowserAdapter` instance.

**Parameters:**
- `options` (optional): `PlaywrightAdapterOptions` - Configuration options

**Returns:** `BrowserAdapter` - Implements the browser adapter interface

### `PlaywrightAdapterOptions`

Configuration options for the Playwright adapter.

```typescript
interface PlaywrightAdapterOptions {
  launch?: {
    browser?: BrowserName;
    headless?: boolean;
    channel?: string;
    [key: string]: unknown;
  };
  context?: {
    colorScheme?: "light" | "dark";
    reducedMotion?: "reduce" | "no-preference";
    storageStatePath?: string;
    [key: string]: unknown;
  };
  navigation?: {
    baseUrl?: string;
    waitUntil?: "load" | "domcontentloaded" | "networkidle";
    timeoutMs?: number;
  };
}
```

**Options:**

#### `launch`
Browser launch configuration:
- `browser`: Browser type (`chromium`, `firefox`, `webkit`)
- `headless`: Run in headless mode (default: `true`)
- `channel`: Browser channel (e.g., `chrome`, `msedge`)
- Additional Playwright launch options

#### `context`
Browser context configuration:
- `colorScheme`: Color scheme preference
- `reducedMotion`: Motion preference for accessibility
- `storageStatePath`: Path to storage state file
- Additional Playwright context options

#### `navigation`
Navigation behavior:
- `baseUrl`: Base URL for relative navigation
- `waitUntil`: Wait condition for page load
- `timeoutMs`: Navigation timeout in milliseconds

## Features

### Isolated Contexts
Each screenshot capture uses an isolated browser context to ensure visual stability and prevent test interference.

### Resilient Navigation
- Automatic retry handling for network issues
- Configurable wait conditions
- Base URL support for relative paths

### Memory Management
- Immediate screenshot writing to disk
- Automatic context cleanup
- Resource disposal on errors

### Multi-Browser Support
Supports Chromium, Firefox, and WebKit browsers with per-browser configuration.

## BrowserAdapter Interface

The adapter implements the standard `BrowserAdapter` interface:

```typescript
interface BrowserAdapter {
  name: string;
  init(opts: BrowserAdapterInitOptions): Promise<void> | void;
  openPage(url: string): Promise<PageWithEvaluate | void>;
  capture(opts: ScreenshotOptions): Promise<ScreenshotResult>;
  dispose(): Promise<void> | void;
}
```

## Examples

### Custom Browser Configuration

```typescript
const adapter = createAdapter({
  launch: {
    browser: 'firefox',
    headless: false,
    args: ['--disable-web-security']
  },
  context: {
    colorScheme: 'dark',
    viewport: { width: 1920, height: 1080 }
  }
});
```

### With Storage State

```typescript
const adapter = createAdapter({
  context: {
    storageStatePath: './auth-state.json'
  }
});
```

### Custom Navigation

```typescript
const adapter = createAdapter({
  navigation: {
    baseUrl: 'https://storybook.example.com',
    waitUntil: 'networkidle',
    timeoutMs: 60000
  }
});
```

## Related Packages

- [`@visual-testing-tool/protocol`](../protocol/README.md) - Shared types and interfaces
- [`@visual-testing-tool/core`](../core/README.md) - Core testing utilities
- [`@visual-testing-tool/storybook-adapter`](../storybook-adapter/README.md) - Storybook integration

## License

MIT
