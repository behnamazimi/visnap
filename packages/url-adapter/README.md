# @vividiff/url-adapter

Test any URL with ViviDiff without requiring Storybook.

## Installation

```bash
npm install @vividiff/url-adapter
```

## Basic Usage

```typescript
import { createAdapter } from '@vividiff/url-adapter';

const adapter = createAdapter({
  urls: [
    { id: "homepage", url: "http://localhost:3000/" },
    { id: "about", url: "http://localhost:3000/about" },
    { id: "pricing", url: "http://localhost:3000/pricing" }
  ]
});
```

## URL Configuration

Configure each URL with custom options:

```typescript
const adapter = createAdapter({
  urls: [
    {
      id: "homepage",
      url: "http://localhost:3000/",
      title: "Homepage",
      viewport: { width: 1200, height: 800 },
      threshold: 0.05,
      screenshotTarget: "body",
      interactions: [
        { type: "click", selector: "button.cta" },
        { type: "waitForTimeout", duration: 500 }
      ]
    }
  ]
});
```

## Pattern Filtering

Filter URLs using minimatch patterns:

```typescript
const adapter = createAdapter({
  urls: [
    { id: "homepage", url: "http://localhost:3000/" },
    { id: "about-page", url: "http://localhost:3000/about" },
    { id: "pricing-page", url: "http://localhost:3000/pricing" },
    { id: "admin-dashboard", url: "http://localhost:3000/admin" }
  ],
  include: ["*page*"], // Only test pages with "page" in the ID
  exclude: ["*admin*"] // Exclude admin pages
});
```

## When to Use

Use the URL adapter when you need to test:
- Marketing websites
- Landing pages
- Applications without Storybook
- External websites
- Mixed Storybook + URL testing

For component testing, use the [Storybook Adapter](../storybook-adapter/README.md) instead.

## Related Packages

- [Protocol](../protocol/README.md) - Shared types and interfaces
- [Core](../core/README.md) - Core testing utilities
- [Playwright Adapter](../playwright-adapter/README.md) - Browser automation
- [Storybook Adapter](../storybook-adapter/README.md) - Storybook integration

## License

MIT
