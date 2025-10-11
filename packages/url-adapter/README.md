# @vividiff/url-adapter

URL test case adapter for visual regression testing. Enables testing of static URLs without requiring Storybook or other test frameworks.

## Installation

```bash
npm install @vividiff/url-adapter
```

## Usage

### Basic Usage

```typescript
import { createAdapter } from '@vividiff/url-adapter';

const adapter = createAdapter({
  urls: [
    { id: "homepage", url: "http://localhost:3000/" },
    { id: "about", url: "http://localhost:3000/about" },
    { id: "pricing", url: "http://localhost:3000/pricing" }
  ]
});

// Use with vividiff
const config = {
  adapters: {
    browser: { name: "@vividiff/playwright-adapter" },
    testCase: [{
      name: "@vividiff/url-adapter",
      options: {
        urls: [
          { id: "homepage", url: "http://localhost:3000/" },
          { id: "about", url: "http://localhost:3000/about" }
        ]
      }
    }]
  }
};
```

### With Filtering

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

### With Per-URL Configuration

```typescript
const adapter = createAdapter({
  urls: [
    {
      id: "homepage",
      url: "http://localhost:3000/",
      title: "Homepage",
      viewport: { width: 1200, height: 800 },
      threshold: 0.05,
      interactions: [
        { type: "click", selector: "button.cta" },
        { type: "waitForTimeout", duration: 500 }
      ]
    },
    {
      id: "mobile-homepage",
      url: "http://localhost:3000/",
      viewport: { width: 375, height: 667 },
      screenshotTarget: "body"
    }
  ]
});
```

## API

### `createAdapter(options)`

Creates a URL-based `TestCaseAdapter` instance.

**Parameters:**
- `options`: `CreateUrlAdapterOptions` - Configuration options

**Returns:** `TestCaseAdapter` - Implements the test case adapter interface

### `CreateUrlAdapterOptions`

Configuration options for the URL adapter.

```typescript
interface CreateUrlAdapterOptions {
  urls: UrlConfig[];
  include?: string | string[];
  exclude?: string | string[];
}
```

### `UrlConfig`

Configuration for a single URL to test.

```typescript
interface UrlConfig {
  id: string;                    // Unique identifier for the test case
  url: string;                   // Absolute URL to test
  title?: string;                // Display title (defaults to id)
  screenshotTarget?: string;     // CSS selector for screenshot target
  viewport?: Viewport;           // Per-URL viewport override
  threshold?: number;            // Per-URL threshold override
  interactions?: InteractionAction[]; // Per-URL interactions
}
```

## Features

### URL Discovery
- Tests any absolute URL (http/https)
- Supports localhost and remote URLs
- No server setup required

### Pattern Filtering
- Include/exclude patterns using minimatch
- Wildcard support (`*`, `**`)
- Pattern validation with warnings

### Viewport Expansion
- Expands URLs across multiple viewport configurations
- Supports global viewport configuration
- Per-URL viewport overrides

### Interactive Testing
- Execute user interactions before capturing screenshots
- Supports all interaction types from the protocol
- Per-URL interaction configuration

### Per-URL Configuration
- Custom thresholds per URL
- Custom viewports per URL
- Custom screenshot targets per URL
- Custom interactions per URL

## Examples

### Marketing Site Testing

```typescript
const config = {
  adapters: {
    browser: { name: "@vividiff/playwright-adapter" },
    testCase: [{
      name: "@vividiff/url-adapter",
      options: {
        urls: [
          { id: "landing", url: "https://myapp.com" },
          { id: "pricing", url: "https://myapp.com/pricing" },
          { id: "contact", url: "https://myapp.com/contact" }
        ],
        include: ["*"],
        exclude: ["*admin*"]
      }
    }]
  }
};
```

### Multi-Adapter Configuration

```typescript
const config = {
  adapters: {
    browser: { name: "@vividiff/playwright-adapter" },
    testCase: [
      {
        name: "@vividiff/storybook-adapter",
        options: { source: "./storybook-static" }
      },
      {
        name: "@vividiff/url-adapter",
        options: {
          urls: [
            { id: "external-home", url: "http://localhost:3000/" }
          ]
        }
      }
    ]
  }
};
```

### Complex Interactions

```typescript
const adapter = createAdapter({
  urls: [
    {
      id: "checkout-flow",
      url: "http://localhost:3000/checkout",
      interactions: [
        { type: "fill", selector: "input[name='email']", text: "test@example.com" },
        { type: "select", selector: "select[name='country']", value: "us" },
        { type: "check", selector: "input[type='checkbox']" },
        { type: "click", selector: "button[type='submit']" },
        { type: "waitForTimeout", duration: 1000 }
      ]
    }
  ]
});
```

## Error Handling

The adapter includes robust error handling:

- **URL Validation**: Validates URL format and accessibility
- **Pattern Validation**: Warns about invalid include/exclude patterns
- **Configuration Validation**: Validates required fields and types
- **Graceful Degradation**: Continues with valid URLs if some fail

## Related Packages

- [`@vividiff/protocol`](../protocol/README.md) - Shared types and interfaces
- [`@vividiff/core`](../core/README.md) - Core testing utilities
- [`@vividiff/playwright-adapter`](../playwright-adapter/README.md) - Browser automation
- [`@vividiff/storybook-adapter`](../storybook-adapter/README.md) - Storybook integration

## License

MIT
