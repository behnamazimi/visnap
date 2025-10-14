# @visnap/core

Core orchestration engine for ViSnap. Manages test execution, configuration, and coordinates between adapters.

## Installation

```bash
npm install @visnap/core
```

## Main APIs

### `runVisualTests(options)`

Run visual tests and compare with baseline images.

```typescript
import { runVisualTests } from '@visnap/core';

const result = await runVisualTests({
  threshold: 0.1,
  screenshotDir: 'visnap'
});

console.log(`Tests passed: ${result.success}`);
```

### `updateBaseline(options)`

Capture baseline screenshots for all test cases.

```typescript
import { updateBaseline } from '@visnap/core';

await updateBaseline({
  screenshotDir: 'visnap'
});
```

### `initializeProject(options)`

Initialize a new project with configuration.

```typescript
import { initializeProject } from '@visnap/core';

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

- `VISNAP_SCREENSHOT_DIR` - Screenshot directory (default: `visnap`)
- `VISNAP_THRESHOLD` - Pixel diff threshold (default: `0.1`)
- `VISNAP_MAX_CONCURRENCY` - Max concurrent captures (default: `4`)

Example:

```bash
VISNAP_SCREENSHOT_DIR=./screenshots \
VISNAP_THRESHOLD=0.05 \
VISNAP_MAX_CONCURRENCY=8 \
npx visnap test
```

## Related Packages

- [CLI](../cli/README.md) - Command-line interface
- [Playwright Adapter](../playwright-adapter/README.md) - Browser automation
- [Storybook Adapter](../storybook-adapter/README.md) - Storybook integration
- [Protocol](../protocol/README.md) - Shared types

## License

MIT