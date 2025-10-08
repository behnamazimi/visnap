# @visual-testing-tool/core

Core library for visual regression testing with Storybook. Provides programmatic APIs for capturing, comparing, and managing visual baselines.

## Installation

```bash
npm install @visual-testing-tool/core
```

## Programmatic API

### High-Level APIs

#### `runVisualTests(options)`

Run visual tests and compare with baseline images.

```typescript
import { runVisualTests } from '@visual-testing-tool/core';

const result = await runVisualTests({
  threshold: 0.1,
  screenshotDir: 'visual-testing'
});

console.log(`Tests passed: ${result.success}`);
console.log(`Exit code: ${result.exitCode}`);
```

#### `updateBaseline(options)`

Capture baseline screenshots for all test cases.

```typescript
import { updateBaseline } from '@visual-testing-tool/core';

await updateBaseline({
  screenshotDir: 'visual-testing'
});
```

#### `initializeProject(options)`

Initialize a new project with configuration.

```typescript
import { initializeProject } from '@visual-testing-tool/core';

const result = await initializeProject({
  configType: 'ts',
  threshold: 0.1
});

console.log(`Config created: ${result.configPath}`);
```

### Low-Level APIs

#### Configuration Management

```typescript
import { loadConfigFile, resolveEffectiveConfig } from '@visual-testing-tool/core';

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
import { compareBaseAndCurrentWithTestCases } from '@visual-testing-tool/core';

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
import { createConcurrencyPool } from '@visual-testing-tool/core';

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
}
```

### Adapter Loading

The core library dynamically loads adapters based on configuration:

```typescript
// Browser adapter loading
const browserAdapter = await import('@visual-testing-tool/playwright-adapter');
const adapter = browserAdapter.createAdapter(options);

// Test case adapter loading
const testCaseAdapter = await import('@visual-testing-tool/storybook-adapter');
const adapter = testCaseAdapter.createAdapter(options);
```

## Memory Management

The visual testing tool includes advanced memory management:

- **Batch Processing**: Test cases are processed in configurable batches
- **Immediate Disk Writing**: Screenshots are written to disk immediately
- **Temporary File Cleanup**: Automatic cleanup of temporary files on failure
- **Resource Disposal**: Proper cleanup of browser contexts and adapters
- **Concurrency Control**: Configurable concurrency limits to prevent memory issues

## Utilities

### Logging

```typescript
import { log } from '@visual-testing-tool/core';

log.info('Starting visual tests');
log.success('Test completed');
log.error('Test failed');
log.warn('Warning message');
log.dim('Debug information');
```

### Error Handling

```typescript
import { getErrorMessage } from '@visual-testing-tool/core';

try {
  await runVisualTests();
} catch (error) {
  console.error(`Error: ${getErrorMessage(error)}`);
}
```

### Docker Support

```typescript
import { runInDocker, DEFAULT_DOCKER_IMAGE } from '@visual-testing-tool/core';

const exitCode = runInDocker({
  image: DEFAULT_DOCKER_IMAGE,
  args: ['test', '--jsonReport']
});
```

## Configuration Examples

### Basic Configuration

```typescript
import { type VisualTestingToolConfig } from '@visual-testing-tool/protocol';

const config: VisualTestingToolConfig = {
  adapters: {
    browser: {
      name: "@visual-testing-tool/playwright-adapter",
      options: { browser: 'chromium' }
    },
    testCase: [{
      name: "@visual-testing-tool/storybook-adapter",
      options: {
        source: "./storybook-static",
        port: 6006,
        include: "*"
      }
    }]
  },
  threshold: 0.1,
  screenshotDir: "visual-testing",
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
      name: "@visual-testing-tool/playwright-adapter",
      options: {
        browser: ['chromium', 'firefox', 'webkit']
      }
    },
    testCase: [{
      name: "@visual-testing-tool/storybook-adapter",
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
VTT_SCREENSHOT_DIR=./screenshots
VTT_THRESHOLD=0.05
VTT_MAX_CONCURRENCY=8
```

## Related Packages

- [`@visual-testing-tool/cli`](../cli/README.md) - Command-line interface
- [`@visual-testing-tool/playwright-adapter`](../playwright-adapter/README.md) - Browser automation
- [`@visual-testing-tool/storybook-adapter`](../storybook-adapter/README.md) - Storybook integration
- [`@visual-testing-tool/protocol`](../protocol/README.md) - Shared types

## License

MIT