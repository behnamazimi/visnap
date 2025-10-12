# @vividiff/storybook-adapter

Storybook integration adapter for ViviDiff.

## Installation

```bash
npm install @vividiff/storybook-adapter
```

## Basic Usage

```typescript
import { createAdapter } from '@vividiff/storybook-adapter';

const adapter = createAdapter({
  source: './storybook-static',
  port: 4477,
  include: '*',
  exclude: '*page*'
});

await adapter.start();
const testCases = await adapter.listCases(page, {
  viewport: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 375, height: 667 }
  }
});
await adapter.stop();
```

## Options

### `source`
- **URL**: `https://storybook.example.com` - Remote Storybook instance
- **Directory**: `./storybook-static` - Local static build directory

### `port`
Port number for local static file server (default: `4477`)

### `include` / `exclude`
Minimatch patterns for filtering stories:
- `'*'` - All stories
- `'button-*'` - Stories starting with "button-"
- `['button-*', 'input-*']` - Multiple patterns

## Story Configuration

Configure visual testing options in your stories:

```typescript
export default {
  title: 'Button',
  component: Button,
  parameters: {
    visualTesting: {
      skip: false,                    // Skip this story
      screenshotTarget: '#root',     // Custom screenshot target
      threshold: 0.05,               // Custom threshold
      browser: ['chromium', 'firefox'], // Specific browsers
      viewport: { width: 1200, height: 800 }, // Custom viewport
      disableCSSInjection: true,     // Disable global CSS injection
      interactions: [                // Execute interactions before screenshot
        { type: 'click', selector: 'button' },
        { type: 'fill', selector: 'input', text: 'test' }
      ]
    }
  }
};
```

## Viewport Support

Supports multiple viewport configurations:

```typescript
const testCases = await adapter.listCases(page, {
  viewport: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }
});
```

## Related Packages

- [Protocol](../protocol/README.md) - Shared types and interfaces
- [Core](../core/README.md) - Core testing utilities
- [Playwright Adapter](../playwright-adapter/README.md) - Browser automation

## License

MIT
