# @visnap/playwright-adapter

Browser automation adapter for ViSnap using Playwright.

## Installation

```bash
npm install @visnap/playwright-adapter
```

**Peer Dependencies:**
```bash
npm install playwright@>=1.40.0 playwright-core@>=1.40.0
```

## Basic Usage

```typescript
import { createAdapter } from '@visnap/playwright-adapter';

const adapter = createAdapter({
  launch: {
    browser: 'chromium',
    headless: true
  },
  context: {
    colorScheme: 'light',
    reducedMotion: 'reduce'
  },
  navigation: {
    baseUrl: 'http://localhost:4477',
    waitUntil: 'load',
    timeoutMs: 30000
  }
});

await adapter.init({ browser: 'chromium' });
const result = await adapter.capture({
  id: 'button-story',
  url: '/iframe.html?id=button--primary',
  screenshotTarget: '#storybook-root',
  viewport: { width: 1920, height: 1080 }
});
await adapter.dispose();
```

## Key Options

### Launch Configuration

```typescript
launch: {
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean; // default: true
  channel?: string; // e.g., 'chrome', 'msedge'
}
```

### Context Configuration

```typescript
context: {
  colorScheme: 'light' | 'dark';
  reducedMotion: 'reduce' | 'no-preference';
  storageStatePath?: string;
}
```

### Navigation Configuration

```typescript
navigation: {
  baseUrl?: string;
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle';
  timeoutMs?: number;
}
```

### CSS Injection

```typescript
injectCSS: `
  * {
    animation: none !important;
    transition: none !important;
  }
  .loader { display: none !important; }
`
```

## Multi-Browser Support

Supports Chromium, Firefox, and WebKit browsers with per-browser configuration.

## Interactive Testing

Executes user interactions before capturing screenshots, supporting 20+ action types including clicks, form filling, scrolling, and waiting.

## Related Packages

- [Protocol](../protocol/README.md) - Shared types and interfaces
- [Core](../core/README.md) - Core testing utilities
- [Storybook Adapter](../storybook-adapter/README.md) - Storybook integration

## License

MIT
