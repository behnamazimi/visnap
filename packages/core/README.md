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

### `test`

Capture current screenshots and compare them with baseline images.

```bash
visual-testing-tool test
```

## Memory Management

The visual testing tool includes basic memory management features:

- **Batch Processing**: Test cases are processed in batches to reduce memory usage
- **Immediate Disk Writing**: Screenshots are written to disk immediately instead of kept in memory
- **Temporary File Cleanup**: Automatic cleanup of temporary files during failures
- **Garbage Collection**: Forced garbage collection between batches when available

## Configuration

The CLI reads configuration from `visual-testing-tool.config.ts` in your project root.

### Basic Configuration

```typescript
export default {
  adapters: {
    browser: {
      name: "@visual-testing-tool/playwright-adapter",
      options: {}
    },
    testCase: [{
      name: "@visual-testing-tool/storybook-adapter",
      options: {
        source: "./storybook-static",
        port: 6006
      }
    }]
  },
  threshold: 0.2,
  screenshotDir: "visual-testing",
  runtime: {
    maxConcurrency: 4
  }
};
```


## License

MIT