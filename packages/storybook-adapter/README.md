# @vividiff/storybook-adapter

Storybook test case adapter for visual regression testing. Discovers and normalizes Storybook stories into test case instances for visual testing.

## Installation

```bash
npm install @vividiff/storybook-adapter
```

## Usage

### Basic Usage

```typescript
import { createAdapter } from '@vividiff/storybook-adapter';

const adapter = createAdapter({
  source: './storybook-static',
  port: 6006,
  include: '*',
  exclude: '*page*'
});

// Start the adapter
await adapter.start();

// List test cases
const page = await browserAdapter.openPage(adapter.baseUrl);
const testCases = await adapter.listCases(page, {
  viewport: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 375, height: 667 }
  }
});

// Stop the adapter
await adapter.stop();
```

### With Remote Storybook

```typescript
const adapter = createAdapter({
  source: 'https://storybook.example.com',
  include: ['button-*', 'input-*']
});
```

## API

### `createAdapter(options)`

Creates a Storybook-based `TestCaseAdapter` instance.

**Parameters:**
- `options`: `CreateStorybookAdapterOptions` - Configuration options

**Returns:** `TestCaseAdapter` - Implements the test case adapter interface

### `CreateStorybookAdapterOptions`

Configuration options for the Storybook adapter.

```typescript
interface CreateStorybookAdapterOptions {
  source: string;                    // Storybook URL or static directory path
  port?: number;                     // Port for local server (default: 6006)
  include?: string | string[];       // Include patterns (minimatch)
  exclude?: string | string[];       // Exclude patterns (minimatch)
}
```

**Options:**

#### `source`
- **URL**: `https://storybook.example.com` - Remote Storybook instance
- **Directory**: `./storybook-static` - Local static build directory

#### `port`
Port number for local static file server (default: `6006`)

#### `include` / `exclude`
Minimatch patterns for filtering stories:
- `'*'` - All stories
- `'button-*'` - Stories starting with "button-"
- `['button-*', 'input-*']` - Multiple patterns

## TestCaseAdapter Interface

The adapter implements the standard `TestCaseAdapter` interface:

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

## Features

### Story Discovery
- Uses Storybook's `extract()` API for story discovery
- Automatic retry with timeout handling
- Validates Storybook preview object availability

### Story Filtering
- Include/exclude patterns with minimatch support
- Skip stories with `visualTesting.skip: true`
- Pattern validation with warnings for invalid patterns

### Story Normalization
- Converts raw Storybook data to standardized test case instances
- Handles story-level visual testing configuration
- Supports per-story viewport and browser configuration
- Extracts and passes through interaction definitions

### Static File Serving
- Automatic local server for `storybook-static` directories
- Configurable port binding
- Base URL resolution for relative paths

### Viewport Expansion
- Expands stories across multiple viewport configurations
- Supports global viewport configuration
- Deterministic viewport key sorting

## Story Configuration

Stories can be configured with visual testing options:

```typescript
// In your story file
export default {
  title: 'Button',
  component: Button,
  parameters: {
    visualTesting: {
      skip: false,                    // Skip this story
      screenshotTarget: '#root',     // Custom screenshot target
      threshold: 0.05,               // Custom threshold
      browser: ['chromium', 'firefox'], // Specific browsers
      viewport: { width: 1200, height: 800 }, // Custom viewport
      disableCSSInjection: true,     // Disable global CSS injection for this story
      interactions: [                // Execute interactions before screenshot - needs a browser adapter
        { type: 'click', selector: 'button' },
        { type: 'fill', selector: 'input', text: 'test' }
      ]
    }
  }
};
```

## Examples

### Filter Specific Stories

```typescript
const adapter = createAdapter({
  source: './storybook-static',
  include: ['components-*', 'pages-*'],
  exclude: ['*-test', '*-spec']
});
```

### Multiple Viewports

```typescript
const testCases = await adapter.listCases(page, {
  viewport: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }
});
```

### Custom Port

```typescript
const adapter = createAdapter({
  source: './storybook-static',
  port: 8080
});
```

## Error Handling

The adapter includes robust error handling:

- **Story Discovery**: Retries with exponential backoff
- **Pattern Validation**: Warns about invalid include/exclude patterns
- **Server Management**: Graceful server startup/shutdown
- **Page Context**: Automatic page cleanup

## Related Packages

- [`@vividiff/protocol`](../protocol/README.md) - Shared types and interfaces
- [`@vividiff/core`](../core/README.md) - Core testing utilities
- [`@vividiff/playwright-adapter`](../playwright-adapter/README.md) - Browser automation

## License

MIT
