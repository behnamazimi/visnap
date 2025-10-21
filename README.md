# ViSnap

[![npm version](https://img.shields.io/npm/v/@visnap/cli.svg)](https://www.npmjs.com/package/@visnap/cli)
[![npm downloads](https://img.shields.io/npm/dm/@visnap/cli.svg)](https://www.npmjs.com/package/@visnap/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A visual regression testing tool that captures and compares screenshots of your UI components. ViSnap helps you catch unwanted visual changes before they reach users by taking screenshots, comparing them to a saved baseline, and highlighting differences.

<table align="center">
  <tr>
    <td align="center">
      <img src="./html-report.png" alt="ViSnap HTML Report Screenshot" width="600" />
    </td>
  </tr>
</table>

## Features

- **Simple CLI** - Run from the command line with a guided experience
- **Storybook Integration** - Test individual stories with precision
- **URL Testing** - Test any web page or application without Storybook
- **Multi-Browser Support** - Test across Chromium, Firefox, and WebKit
- **Interactive Testing** - Execute 20+ user interactions before capturing screenshots
- **Docker Support** - Run tests in isolated containers for consistent results
- **CSS Injection** - Disable animations and hide elements for stable screenshots
- **Dual Comparison Engines** - Choose between `odiff` and `pixelmatch` for image comparison
- **Flexible Filtering** - Run specific stories or exclude unwanted ones
- **Rich Reporting** - Generate both JSON and interactive HTML reports

## Quick Start

```bash
# Install globally
npm install -g visnap

# Or use with npx (no installation needed)
npx visnap init
npx visnap update
npx visnap test
```

## Documentation

📚 **[Full Documentation](https://visnap.dev)** - Complete guides, API reference, and examples

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.
