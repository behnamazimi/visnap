# vividiff

A fast, Dockerized visual regression testing tool designed for **Storybook 8 and above8** with story-level testing capabilities.

## ✨ Features

- 🐳 **Dockerized** - Run tests in isolated containers for consistent results
- 📚 **Great Storybook Integration** - Optimized for modern Storybook versions
- 🎯 **Story-Level Visual Testing** - Test individual stories with precision
- 🎛️ **Flexible Filtering** - Run specific stories or exclude unwanted ones
- 🚀 **Easy CLI Interface** - Simple commands for all operations
- ⚡ **Quick Setup** - Get started in minutes with `npx vividiff init`
- 🌐 **Multi-Browser Support** - Test across Chromium, Firefox, and WebKit
- ⚡ **Fast** - Optimized for speed with concurrent processing
- 🎨 **CSS Injection** - Inject global CSS for stable screenshots (disable animations, hide elements)
- 🖱️ **Interactive Testing** - Execute user interactions before capturing screenshots

## 🚀 Quick Start

Install and run:

```bash
# Install globally
npm install -g vividiff

# Or use with npx (no installation needed)
npx vividiff init
npx vividiff update
npx vividiff test
```

## 📖 Documentation

For detailed usage, configuration options, and advanced features, see the [Core Documentation](./packages/core/README.md).

## 🏃‍♂️ Typical Workflow

1. **Initialize** in your Storybook project:
   ```bash
   npx vividiff init
   ```

2. **Create baseline** screenshots:
   ```bash
   npx vividiff update
   ```

3. **Run tests** on changes:
   ```bash
   npx vividiff test
   ```

Screenshots are automatically saved to `vividiff/` directory.

## 🖱️ Interactive Testing

Test user interactions by defining them in your Storybook stories:

```typescript
// In your story file
export const FilledForm: Story = {
  parameters: {
    visualTesting: {
      interactions: [
        { type: 'fill', selector: 'input[name="email"]', text: 'test@example.com' },
        { type: 'select', selector: 'select[name="country"]', value: 'us' },
        { type: 'check', selector: 'input[type="checkbox"]' }
      ]
    }
  }
};
```

Supports 20+ interaction types: clicks, form filling, scrolling, waiting, and more.

## 🐳 Docker Support

Run tests in Docker for consistent, isolated environments:

```bash
npx vividiff test --docker
```

## ⚙️ Environment Variables

You can control defaults via environment variables (useful in CI):

- `VTT_SCREENSHOT_DIR`: override the screenshots root directory (e.g., `vividiff`).
- `VTT_THRESHOLD`: numeric pixel diff threshold used when comparing images.
- `VTT_MAX_CONCURRENCY`: maximum number of concurrent captures (default 4).

Example (bash):

```bash
VTT_SCREENSHOT_DIR=vividiff \
VTT_THRESHOLD=0.02 \
VTT_MAX_CONCURRENCY=6 \
npx vividiff test
```

## 📦 Installation

```bash
npm install vividiff
```

## 🚀 Release Process

This project uses [Changesets](https://github.com/changesets/changesets) for automated versioning and publishing.

### For Contributors

When making changes that should be released:

1. **Create a changeset** describing your changes:
   ```bash
   npx changeset
   ```
   This creates a markdown file in `.changeset/` describing your changes.

2. **Submit your PR** with the changeset file included.

3. **Merge to main** - The changeset will be included in the next release.

### For Maintainers

1. **Review and merge** the "Version Packages" PR created by the changesets bot
2. **Automatic publishing** - The packages will be automatically published to npm

### Manual Release (if needed)

```bash
# Version packages (updates package.json versions and changelog)
npm run version

# Publish to npm
npm run release
```

## TODOs
- [ ] Add viewport size to configs
- [ ] Proper documentation
- [ ] Add cli progress indicator
