# visual-testing-tool

A fast, Dockerized visual regression testing tool designed for **Storybook 8 and above8** with story-level testing capabilities.

## ✨ Key Features

- 🐳 **Dockerized** - Run tests in isolated containers for consistent results
- 📚 **Great Storybook Integration** - Optimized for modern Storybook versions
- 🎯 **Story-Level Visual Testing** - Test individual stories with precision
- 🎛️ **Flexible Filtering** - Run specific stories or exclude unwanted ones
- 🚀 **Easy CLI Interface** - Simple commands for all operations
- ⚡ **Quick Setup** - Get started in minutes with `npx visual-testing-tool init`
- 🌐 **Multi-Browser Support** - Test across Chromium, Firefox, and WebKit
- ⚡ **Fast** - Optimized for speed with concurrent processing

## 🚀 Quick Start

Install and run:

```bash
# Install globally
npm install -g visual-testing-tool

# Or use with npx (no installation needed)
npx visual-testing-tool init
npx visual-testing-tool update
npx visual-testing-tool test
```

## 📖 Documentation

For detailed usage, configuration options, and advanced features, see the [Core Documentation](./packages/core/README.md).

## 🏃‍♂️ Typical Workflow

1. **Initialize** in your Storybook project:
   ```bash
   npx visual-testing-tool init
   ```

2. **Create baseline** screenshots:
   ```bash
   npx visual-testing-tool update
   ```

3. **Run tests** on changes:
   ```bash
   npx visual-testing-tool test
   ```

Screenshots are automatically saved to `visual-testing-tool/` directory.

## 🐳 Docker Support

Run tests in Docker for consistent, isolated environments:

```bash
npx visual-testing-tool test --docker
```

## ⚙️ Environment Variables

You can control defaults via environment variables (useful in CI):

- `VTT_SCREENSHOT_DIR`: override the screenshots root directory (e.g., `visual-testing`).
- `VTT_THRESHOLD`: numeric pixel diff threshold used when comparing images.
- `VTT_MAX_CONCURRENCY`: maximum number of concurrent captures (default 4).

Example (bash):

```bash
VTT_SCREENSHOT_DIR=visual-testing \
VTT_THRESHOLD=0.02 \
VTT_MAX_CONCURRENCY=6 \
npx visual-testing-tool test
```

## 📦 Installation

```bash
npm install visual-testing-tool
```

## TODOs
- [ ] Add viewport size to configs
- [ ] Proper documentation
- [ ] Add cli progress indicator
