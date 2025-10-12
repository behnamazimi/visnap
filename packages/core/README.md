# @vividiff/core

Core library for visual regression testing with Storybook. Provides programmatic APIs for capturing, comparing, and managing visual baselines.

## Installation

```bash
npm install @vividiff/core
```

## Programmatic API

### High-Level APIs

#### `runVisualTests(options)`

Run visual tests and compare with baseline images.

```typescript
import { runVisualTests } from '@vividiff/core';

const result = await runVisualTests({
  threshold: 0.1,
  screenshotDir: 'vividiff'
});

console.log(`Tests passed: ${result.success}`);
console.log(`Exit code: ${result.exitCode}`);
```

#### `updateBaseline(options)`

Capture baseline screenshots for all test cases.

```typescript
import { updateBaseline } from '@vividiff/core';

await updateBaseline({
  screenshotDir: 'vividiff'
});
```

#### `initializeProject(options)`

Initialize a new project with configuration.

```typescript
import { initializeProject } from '@vividiff/core';

const result = await initializeProject({
  configType: 'ts',
  threshold: 0.1
});

console.log(`Config created: ${result.configPath}`);
```

### Low-Level APIs

#### Configuration Management

```typescript
import { loadConfigFile, resolveEffectiveConfig } from '@vividiff/core';

// Load configuration from file
const config = await loadConfigFile();

// Resolve effective configuration with overrides
const effectiveConfig = await resolveEffectiveConfig({
  threshold: 0.2,
  runtime: { maxConcurrency: 8 }
});
```

#### Screenshot Comparison

```typescript
import { compareBaseAndCurrentWithTestCases } from '@vividiff/core';

const results = await compareBaseAndCurrentWithTestCases(config, testCases);

for (const result of results) {
  if (result.match) {
    console.log(`✅ ${result.id} passed`);
  } else {
    console.log(`❌ ${result.id} failed: ${result.reason}`);
  }
}
```

#### Concurrency Pool

```typescript
import { createConcurrencyPool } from '@vividiff/core';

const runWithPool = createConcurrencyPool({ concurrency: 4 });

const results = await runWithPool(items, async (item, index) => {
  return await processItem(item);
});
```

### Configuration Schema

```typescript
interface VisualTestingToolConfig {
  adapters: {
    browser: {
      name: string;
      options?: {
        browser?: BrowserConfiguration | BrowserConfiguration[];
        [key: string]: unknown;
      };
    };
    testCase: Array<{
      name: string;
      options?: {
        source: string;
        port?: number;
        include?: string | string[];
        exclude?: string | string[];
      };
    }>;
  };
  threshold: number;
  screenshotDir?: string;
  runtime?: {
    maxConcurrency?: number;
  };
  viewport?: Record<string, { width: number; height: number }>;
  reporter: {
    html: true,
    json: true
  }
}
```

### Adapter Loading

The core library dynamically loads adapters based on configuration:

```typescript
// Browser adapter loading
const browserAdapter = await import('@vividiff/playwright-adapter');
const adapter = browserAdapter.createAdapter(options);

// Test case adapter loading
const testCaseAdapter = await import('@vividiff/storybook-adapter');
const adapter = testCaseAdapter.createAdapter(options);
```

## Memory Management

The visual testing tool includes advanced memory management:

- **Batch Processing**: Test cases are processed in configurable batches
- **Immediate Disk Writing**: Screenshots are written to disk immediately
- **Temporary File Cleanup**: Automatic cleanup of temporary files on failure
- **Resource Disposal**: Proper cleanup of browser contexts and adapters
- **Concurrency Control**: Configurable concurrency limits to prevent memory issues

## Interactive Testing

The core supports executing user interactions before capturing screenshots:

```typescript
const result = await runVisualTests({
  // Interactions are automatically executed by browser adapters
  // when defined in story parameters
});
```

Interactions are defined declaratively and executed by browser adapters, supporting 20+ action types including clicks, form filling, scrolling, and waiting.

## Utilities

### Logging

```typescript
import { log } from '@vividiff/core';

log.info('Starting visual tests');
log.success('Test completed');
log.error('Test failed');
log.warn('Warning message');
log.dim('Debug information');
```

### Error Handling

```typescript
import { getErrorMessage } from '@vividiff/core';

try {
  await runVisualTests();
} catch (error) {
  console.error(`Error: ${getErrorMessage(error)}`);
}
```

### Docker Support

```typescript
import { runInDocker, DEFAULT_DOCKER_IMAGE } from '@vividiff/core';

const exitCode = runInDocker({
  image: DEFAULT_DOCKER_IMAGE,
  args: ['test', '--jsonReport']
});
```

## Configuration Examples

### Basic Configuration

```typescript
import { type VisualTestingToolConfig } from '@vividiff/protocol';

const config: VisualTestingToolConfig = {
  adapters: {
    browser: {
      name: "@vividiff/playwright-adapter",
      options: { browser: 'chromium' }
    },
    testCase: [{
      name: "@vividiff/storybook-adapter",
      options: {
        source: "./storybook-static",
        port: 6006,
        include: "*"
      }
    }]
  },
  threshold: 0.1,
  screenshotDir: "vividiff",
  runtime: {
    maxConcurrency: 4
  }
};
```

### Multi-Browser Configuration

```typescript
const config: VisualTestingToolConfig = {
  adapters: {
    browser: {
      name: "@vividiff/playwright-adapter",
      options: {
        browser: ['chromium', 'firefox', 'webkit']
      }
    },
    testCase: [{
      name: "@vividiff/storybook-adapter",
      options: {
        source: "./storybook-static"
      }
    }]
  },
  threshold: 0.1,
  viewport: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }
};
```

### Environment Overrides

The core library supports environment variable overrides:

```bash
VIVIDIFF_SCREENSHOT_DIR=./screenshots
VIVIDIFF_THRESHOLD=0.05
VIVIDIFF_MAX_CONCURRENCY=8
```

## Related Packages

- [`@vividiff/cli`](../cli/README.md) - Command-line interface
- [`@vividiff/playwright-adapter`](../playwright-adapter/README.md) - Browser automation
- [`@vividiff/storybook-adapter`](../storybook-adapter/README.md) - Storybook integration
- [`@vividiff/protocol`](../protocol/README.md) - Shared types

## License

MIT