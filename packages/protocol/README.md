# @vividiff/protocol

Shared TypeScript types and interfaces for ViviDiff.

## Installation

```bash
npm install @vividiff/protocol
```

## Main Types

- `VisualTestingToolConfig` - Main configuration interface
- `BrowserAdapter` - Browser automation interface
- `TestCaseAdapter` - Test case discovery interface
- `TestCaseInstance` - Test case representation
- `ScreenshotOptions` - Screenshot capture options
- `ScreenshotResult` - Screenshot capture result
- `BrowserName` - Supported browsers
- `Viewport` - Viewport configuration
- `RunOutcome` - Test run summary
- `InteractionAction` - User interaction types

## Usage

Import types for type-safe development:

```typescript
import type {
  VisualTestingToolConfig,
  BrowserAdapter,
  TestCaseAdapter,
  ScreenshotOptions
} from '@vividiff/protocol';
```

## When to Use

Use this package when building:
- Custom adapters
- Type-safe configuration
- Integration with ViviDiff core
- Extensions or plugins

## Related Packages

- [Core](../core/README.md) - Core implementation using these types
- [Playwright Adapter](../playwright-adapter/README.md) - Browser adapter implementation
- [Storybook Adapter](../storybook-adapter/README.md) - Test case adapter implementation

## License

MIT
