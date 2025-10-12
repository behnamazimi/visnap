# @vividiff/cli

Command-line interface for ViviDiff visual regression testing.

## Installation

```bash
npm install @vividiff/cli
```

Or use directly with npx:

```bash
npx @vividiff/cli [command]
```

## Commands

### `init`

Initialize a new visual testing project with a configuration file.

```bash
vividiff init
```

Creates `vividiff.config.ts` or `vividiff.config.js` in the current directory with interactive prompts for configuration type.

### `test`

Capture current screenshots and compare them with baseline images.

```bash
vividiff test
```

**Options:**
- `--jsonReport [path]` - Output JSON report (provide path to write to file, omit to print to stdout)
- `--docker` - Run inside Docker container

**Examples:**
```bash
# Run tests and output JSON to file
vividiff test --jsonReport ./test-results.json

# Run tests in Docker
vividiff test --docker
```

### `update`

Capture baseline screenshots for all stories and save them to `vividiff/base/`.

```bash
vividiff update
```

**Options:**
- `--docker` - Run inside Docker container

## Configuration

The CLI reads configuration from `vividiff.config.ts` in your project root. See the [core package documentation](../core/README.md) for all configuration options.

## Related Packages

- [Core](../core/README.md) - Core API and utilities
- [Playwright Adapter](../playwright-adapter/README.md) - Browser automation
- [Storybook Adapter](../storybook-adapter/README.md) - Storybook integration
- [Protocol](../protocol/README.md) - Shared types

## License

MIT
