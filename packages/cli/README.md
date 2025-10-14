# @visnap/cli

Command-line interface for ViSnap visual regression testing.

## Installation

```bash
npm install @visnap/cli
```

Or use directly with npx:

```bash
npx @visnap/cli [command]
```

## CLI Help

```bash
$ npx visnap --help

Options:
  -v, --version       Show version information
  --config <path>     Path to configuration file
  --quiet             Suppress output except errors
  -h, --help          display help for command

Commands:
  init                Initialize a new VTT project with sample config
  test [options]      Capture current screenshots and compare with baseline
  update [options]    Capture baseline screenshots into visnap/base
  validate [options]  Validate configuration file and dependencies
  list [options]      List all discovered test cases without running tests
  open [options]      Open HTML report in browser or screenshot directory in
                      Finder
  help [command]      display help for command
```

## Commands

### `init`

Initialize a new visual testing project with a configuration file.

```bash
visnap init
```

Creates `visnap.config.ts` or `visnap.config.js` in the current directory with interactive prompts for configuration type.

### `test`

Capture current screenshots and compare them with baseline images.

```bash
visnap test
```

**Options:**
- `--jsonReport [path]` - Output JSON report (provide path to write to file, omit to print to stdout)
- `--docker` - Run inside Docker container

**Examples:**
```bash
# Run tests and output JSON to file
visnap test --jsonReport ./test-results.json

# Run tests in Docker
visnap test --docker
```

### `update`

Capture baseline screenshots for all stories and save them to `visnap/base/`.

```bash
visnap update
```

**Options:**
- `--docker` - Run inside Docker container

## Configuration

The CLI reads configuration from `visnap.config.ts` in your project root. See the [core package documentation](../core/README.md) for all configuration options.

## Related Packages

- [Core](../core/README.md) - Core API and utilities
- [Playwright Adapter](../playwright-adapter/README.md) - Browser automation
- [Storybook Adapter](../storybook-adapter/README.md) - Storybook integration
- [Protocol](../protocol/README.md) - Shared types

## License

MIT
