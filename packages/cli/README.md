# @visual-testing-tool/cli

Command-line interface for visual regression testing with Storybook.

## Installation

```bash
npm install @visual-testing-tool/cli
```

Or use directly with npx:

```bash
npx @visual-testing-tool/cli [command]
```

## Commands

### `init`

Initialize a new visual testing project with a sample configuration file.

```bash
visual-testing-tool init
```

**Options:**
- Interactive prompts for configuration type (TypeScript/JavaScript)
- Creates `vtt.config.ts` or `vtt.config.js` in the current directory
- Generates `.gitignore` for screenshot directories

### `test`

Capture current screenshots and compare them with baseline images.

```bash
visual-testing-tool test
```

**Options:**
- `--jsonReport [path]` - Output JSON report (provide path to write to file, omit to print to stdout)
- `--docker` - Run inside Docker container

**Example:**
```bash
# Run tests and output JSON to file
visual-testing-tool test --jsonReport ./test-results.json

# Run tests in Docker
visual-testing-tool test --docker
```

### `update`

Capture baseline screenshots for all stories and save them to `visual-testing/base/`.

```bash
visual-testing-tool update
```

**Options:**
- `--docker` - Run inside Docker container

## Configuration

The CLI reads configuration from `vtt.config.ts` in your project root. See the [core package documentation](../core/README.md) for configuration details.

## Related Packages

- [`@visual-testing-tool/core`](../core/README.md) - Core API and utilities
- [`@visual-testing-tool/playwright-adapter`](../playwright-adapter/README.md) - Browser automation
- [`@visual-testing-tool/storybook-adapter`](../storybook-adapter/README.md) - Storybook integration
- [`@visual-testing-tool/protocol`](../protocol/README.md) - Shared types

## License

MIT
