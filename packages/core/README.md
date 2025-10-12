# @vividiff/core

Core orchestration engine for ViviDiff. Manages test execution, configuration, and coordinates between adapters.

## Installation

```bash
npm install @vividiff/core
```

## Main APIs

### `runVisualTests(options)`

Run visual tests and compare with baseline images.

```typescript
import { runVisualTests } from '@vividiff/core';

const result = await runVisualTests({
  threshold: 0.1,
  screenshotDir: 'vividiff'
});

console.log(`Tests passed: ${result.success}`);
```

### `updateBaseline(options)`

Capture baseline screenshots for all test cases.

```typescript
import { updateBaseline } from '@vividiff/core';

await updateBaseline({
  screenshotDir: 'vividiff'
});
```

### `initializeProject(options)`

Initialize a new project with configuration.

```typescript
import { initializeProject } from '@vividiff/core';

const result = await initializeProject({
  configType: 'ts',
  threshold: 0.1
});
```

## Configuration Schema

Essential configuration fields:

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
      options?: Record<string, unknown>;
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

**Adapter-specific options:**
- **Storybook Adapter**: `source`, `port`, `include`, `exclude`
- **URL Adapter**: `urls`, `include`, `exclude`
- **Custom Adapters**: Any options defined by the adapter

## Environment Variables

Control defaults via environment variables:

- `VIVIDIFF_SCREENSHOT_DIR` - Screenshot directory (default: `vividiff`)
- `VIVIDIFF_THRESHOLD` - Pixel diff threshold (default: `0.1`)
- `VIVIDIFF_MAX_CONCURRENCY` - Max concurrent captures (default: `4`)

Example:

```bash
VIVIDIFF_SCREENSHOT_DIR=./screenshots \
VIVIDIFF_THRESHOLD=0.05 \
VIVIDIFF_MAX_CONCURRENCY=8 \
npx vividiff test
```

## Related Packages

- [CLI](../cli/README.md) - Command-line interface
- [Playwright Adapter](../playwright-adapter/README.md) - Browser automation
- [Storybook Adapter](../storybook-adapter/README.md) - Storybook integration
- [Protocol](../protocol/README.md) - Shared types

## License

MIT