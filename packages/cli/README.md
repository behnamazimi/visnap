# @vividiff/cli

Command-line interface for visual regression testing with Storybook.

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

Initialize a new visual testing project with a sample configuration file.

```bash
vividiff init
```

**Options:**
- Interactive prompts for configuration type (TypeScript/JavaScript)
- Creates `vividiff.config.ts` or `vividiff.config.js` in the current directory
- Generates `.gitignore` for screenshot directories

### `test`

Capture current screenshots and compare them with baseline images.

```bash
vividiff test
```

**Options:**
- `--jsonReport [path]` - Output JSON report (provide path to write to file, omit to print to stdout)
- `--docker` - Run inside Docker container

**Example:**
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

The CLI reads configuration from `vividiff.config.ts` in your project root. See the [core package documentation](../core/README.md) for configuration details.

## Related Packages

- [`@vividiff/core`](../core/README.md) - Core API and utilities
- [`@vividiff/playwright-adapter`](../playwright-adapter/README.md) - Browser automation
- [`@vividiff/storybook-adapter`](../storybook-adapter/README.md) - Storybook integration
- [`@vividiff/protocol`](../protocol/README.md) - Shared types

## License

MIT
