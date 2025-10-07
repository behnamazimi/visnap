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

## Configuration

The CLI reads configuration from `visual-testing-tool.config.ts` in your project root.

### Basic Configuration

TBD

### Configuration Options

TBD

## License

MIT