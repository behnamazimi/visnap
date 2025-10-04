# visual-testing-tool

A powerful CLI tool and programmatic API for visual regression testing with Storybook. Capture, compare, and manage visual baselines for your component library.

## Installation

```bash
npm install visual-testing-tool
```

Or use directly with npx:

```bash
npx visual-testing-tool [command]
```

## Commands

### `init`

Create a sample configuration file in the current directory.

```bash
visual-testing-tool init
```

This creates a `visual-testing-tool.config.ts` file with default settings.

### `update`

Capture baseline screenshots for all stories and save them to `visual-testing-tool/base/`.

```bash
visual-testing-tool update
```

**Options:**
- `--config <path>` - Path to config file (default: `visual-testing-tool.config.ts`)
- `--browser <browser>` - Specific browser to use (chromium|firefox|webkit)
- `--concurrency <number>` - Number of concurrent stories to process

### `test`

Capture current screenshots and compare them with baseline images.

```bash
visual-testing-tool test
```

**Options:**
- `--config <path>` - Path to config file
- `--browser <browser>` - Specific browser to use
- `--concurrency <number>` - Number of concurrent stories to process
- `--threshold <number>` - Pixel difference threshold (0-1)

**Output:**
- Current screenshots: `visual-testing-tool/current/`
- Diff images: `visual-testing-tool/diff/`

## Configuration

The CLI reads configuration from `visual-testing-tool.config.ts` in your project root.

### Basic Configuration

```typescript
import type { VTTConfig } from 'visual-testing-tool/core';

const config: VTTConfig = {
  storybook: {
    source: "./storybook-static",
    screenshotTarget: "story-root",
    include: ["Example/**"],
    exclude: ["**/deprecated/*"]
  },
  screenshotDir: "visual-testing",
  browser: ["chromium"],
  concurrency: 2,
  threshold: 0.1
};

export default config;
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **storybook.source** | `string` | **required** | Local path to built Storybook directory (must contain `iframe.html`) or HTTP/HTTPS URL to running Storybook instance |
| **storybook.screenshotTarget** | `string` | `"story-root"` | Element to screenshot within each story. Options: `"story-root"` (maps to `#storybook-root`), `"body"`, or any CSS selector |
| **storybook.include** | `string[]` | `undefined` | Glob patterns to include specific stories. Applied to story `id` first, then to `title`. Example: `["Button/**", "Header/**"]` |
| **storybook.exclude** | `string[]` | `undefined` | Glob patterns to exclude stories. Applied to story `id` first, then to `title`. Example: `["**/deprecated/*", "**/*.test.*"]` |
| **screenshotDir** | `string` | `"visual-testing"` | Directory name for storing screenshots. Screenshots will be saved to `{screenshotDir}/base/`, `{screenshotDir}/current/`, and `{screenshotDir}/diff/` |
| **browser** | `string \| string[]` | `"chromium"` | Browsers to run tests in. Options: `"chromium"`, `"firefox"`, `"webkit"`. For multiple: `["chromium", "firefox", "webkit"]` |
| **concurrency** | `number` | `2` | Maximum number of stories to process concurrently per browser |
| **threshold** | `number` | `0.1` | Pixel difference threshold for visual comparison (0-1). `0` = no differences allowed, `1` = all differences ignored |

## Advanced Usage

### Story Filtering

Filter stories using glob patterns:

```typescript
import type { VTTConfig } from 'visual-testing-tool/core';

const config: VTTConfig = {
  storybook: {
    source: "./storybook-static",
    include: [
      "Button/**",           // All Button stories
      "Header/**",           // All Header stories
      "**/*Primary*"         // Any story with "Primary" in the name
    ],
    exclude: [
      "**/deprecated/*",     // Exclude deprecated stories
      "**/*.test.*",         // Exclude test stories
      "**/Mobile/**"         // Exclude mobile-specific stories
    ]
  }
};

export default config;
```

### Multi-Browser Testing

Test across multiple browsers:

```typescript
import type { VTTConfig } from 'visual-testing-tool/core';

const config: VTTConfig = {
  storybook: {
    source: "./storybook-static"
  },
  browser: ["chromium", "firefox", "webkit"],
  concurrency: 1  // Reduce concurrency for multiple browsers
};

export default config;
```

### Custom Screenshot Targets

Screenshot specific elements:

```typescript
import type { VTTConfig } from 'visual-testing-tool/core';

const config: VTTConfig = {
  storybook: {
    source: "./storybook-static",
    screenshotTarget: ".my-component"  // Custom CSS selector
  }
};

export default config;
```

### Story-Level Configuration

Override global settings for specific stories using the `visualTesting` parameter in your Storybook stories:

```typescript
// Button.stories.ts
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    visualTesting: {
      skip: false,                    // Skip this story (overrides global config)
      screenshotTarget: '.button',    // Custom screenshot target for this story
      threshold: 0.05,               // Custom threshold for this story (0-1)
      browser: ['chromium', 'firefox'] // Only test in specific browsers
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
  parameters: {
    visualTesting: {
      threshold: 0.01  // Even more strict threshold for this specific story
    }
  }
};
```

#### Story-Level Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| **skip** | `boolean` | Skip this story during visual testing |
| **screenshotTarget** | `string` | Custom CSS selector for screenshot target |
| **threshold** | `number` | Pixel difference threshold (0-1) for this story |
| **browser** | `string \| string[]` | Specific browsers to test this story in |

## Programmatic Usage

You can use the visual testing tool programmatically with high-level API functions that mirror the CLI commands:

### High-Level API

```typescript
import { 
  runTests, 
  updateBaseline, 
  initializeProject,
  type TestOptions,
  type UpdateOptions,
  type TestResult
} from 'visual-testing-tool/core';

// Run visual regression tests (loads config automatically)
const result: TestResult = await runTests({
  include: ['Button/**'],        // Override config include patterns
  exclude: ['**/*.skip'],       // Override config exclude patterns
  browsers: ['chromium', 'firefox'], // Override config browsers
  jsonReport: 'test-results.json'
});

console.log(`Tests passed: ${result.passed}`);
console.log(`Total stories: ${result.totalStories}`);
console.log(`Passed stories: ${result.passedStories}`);

// Update baseline screenshots (loads config automatically)
await updateBaseline({
  include: ['Button/**'],        // Override config include patterns
  browsers: ['chromium'],       // Override config browsers
});

// Or run with just config defaults (no overrides needed)
await runTests(); // Uses all settings from vtt.config.ts
await updateBaseline(); // Uses all settings from vtt.config.ts

// Initialize a new project
await initializeProject({
  configType: 'ts',
  browsers: ['chromium', 'firefox'],
  storybookSource: './storybook-static'
});
```

### Low-Level API

For more control, you can use the low-level utilities (requires manual config loading):

```typescript
import { 
  compareDirectories, 
  launchBrowser, 
  loadConfigFile,
  type VTTConfig,
  type CompareResult 
} from 'visual-testing-tool/core';

// Load configuration manually
const config = await loadConfigFile();
if (!config) {
  throw new Error('Config not found');
}

// Launch browser and take screenshots
const browser = await launchBrowser('chromium');
const page = await browser.newPage();

// Compare directories
const results: CompareResult[] = await compareDirectories(
  './visual-testing-tool/base',
  './visual-testing-tool/current',
  './visual-testing-tool/diff',
  { threshold: 0.1 }
);

console.log(`Found ${results.length} comparisons`);
```

### Available Exports

#### High-Level API
- `runTests(options?)` - Run visual regression tests
- `updateBaseline(options?)` - Update baseline screenshots
- `initializeProject(options?)` - Initialize a new project
- `type TestOptions` - Options for runTests
- `type UpdateOptions` - Options for updateBaseline
- `type InitOptions` - Options for initializeProject
- `type TestResult` - Result from runTests
- `type UpdateResult` - Result from updateBaseline

#### Low-Level API
- `compareDirectories()` - Compare two directories of screenshots
- `launchBrowser()` - Launch a browser instance
- `openPage()` - Open a new page in a browser
- `loadConfigFile()` - Load VTT configuration
- `createConcurrencyPool()` - Create a concurrency pool for parallel processing
- `createStoryFilter()` - Create a story filter for testing
- `type VTTConfig` - Configuration type
- `type CompareResult` - Comparison result type
- `type VTTStory` - Story type

### Performance Optimization

Optimize for your system:

```typescript
import type { VTTConfig } from 'visual-testing-tool/core';

const config: VTTConfig = {
  storybook: {
    source: "./storybook-static"
  },
  concurrency: 4,  // Increase for powerful machines
  threshold: 0.05  // Stricter comparison
};

export default config;
```

## Requirements

- Node.js >= 18
- Storybook >= 8.0
- Built Storybook static files or running Storybook instance

## License

MIT