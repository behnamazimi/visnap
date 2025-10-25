# ViSnap

[![npm version](https://img.shields.io/npm/v/visnap.svg)](https://www.npmjs.com/package/visnap)
[![npm downloads](https://img.shields.io/npm/dm/visnap.svg)](https://www.npmjs.com/package/visnap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A visual regression testing tool organized as a monorepo. ViSnap captures and compares screenshots of UI components to help catch unwanted visual changes before they reach users.

## Workspace Structure

This monorepo contains several packages that work together to provide visual regression testing:

### Core Packages
- **`@visnap/protocol`** - Shared types and interfaces used across all packages
- **`@visnap/core`** - Main orchestration engine that manages test execution and coordinates between adapters
- **`@visnap/cli`** - Command-line interface for end users
- **`@visnap/reporter`** - Generates HTML and JSON reports from test results

### Adapters
- **`@visnap/storybook-adapter`** - Tests individual Storybook components and stories
- **`@visnap/url-adapter`** - Tests any web page or application by URL
- **`@visnap/playwright-adapter`** - Browser automation layer using Playwright
- **`@visnap/fs-adapter`** - Filesystem storage for screenshots and test data

### Apps & Examples
- **`apps/docs`** - Documentation site at [visnap.dev](https://visnap.dev)
- **`examples/*`** - Example projects showing ViSnap integration

### Shared Configuration
- **`packages/eslint-config`** - Shared ESLint configuration for all packages

## Getting Started

```bash
# Start with init - it sets up everything you need
npx visnap init

# Take baseline screenshots
npx visnap update

# Test for visual changes
npx visnap test
```

The init command installs @visnap/cli and required adapters locally in your project.

## Development

To contribute to this project, see [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## Documentation

📚 **[Full Documentation](https://visnap.dev)** - Complete guides, API reference, and examples
