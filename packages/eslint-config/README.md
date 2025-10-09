# @vividiff/eslint-config

Shared ESLint configurations for the visual testing tool monorepo. Provides consistent linting rules across all packages.

## Installation

```bash
npm install @vividiff/eslint-config --save-dev
```

## Available Configurations

### `base.js`

Base configuration with common rules for all packages.

```javascript
// eslint.config.js
import baseConfig from '@vividiff/eslint-config/base.js';

export default [
  ...baseConfig,
  // Your additional rules
];
```

### `react-internal.js`

React-specific configuration for internal packages.

```javascript
// eslint.config.js
import reactConfig from '@vividiff/eslint-config/react-internal.js';

export default [
  ...reactConfig,
  // Your additional rules
];
```

### `next.js`

Next.js specific configuration.

```javascript
// eslint.config.js
import nextConfig from '@vividiff/eslint-config/next.js';

export default [
  ...nextConfig,
  // Your additional rules
];
```

## Usage in Package.json

```json
{
  "name": "my-package",
  "devDependencies": {
    "@vividiff/eslint-config": "*"
  },
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

## Configuration Files

### Base Configuration (`base.js`)

Common rules for all packages:
- TypeScript support
- Import/export rules
- Code quality rules
- Consistent formatting

### React Internal (`react-internal.js`)

React-specific rules for internal packages:
- React hooks rules
- JSX formatting
- Component naming conventions
- Props validation

### Next.js (`next.js`)

Next.js specific rules:
- Next.js specific imports
- Image optimization rules
- App router support
- Server/client component rules

## Monorepo Integration

This package is designed for use within the visual testing tool monorepo:

```bash
# In package.json dependencies
"@vividiff/eslint-config": "*"
```

The `*` version ensures packages always use the latest configuration from the monorepo.

## Customization

You can extend any configuration:

```javascript
// eslint.config.js
import baseConfig from '@vividiff/eslint-config/base.js';

export default [
  ...baseConfig,
  {
    rules: {
      // Override specific rules
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  }
];
```

## Package Structure

```
eslint-config/
├── base.js              # Base configuration
├── react-internal.js    # React internal config
├── next.js              # Next.js config
└── package.json         # Package metadata
```

## Related Packages

This configuration is used by all packages in the monorepo:

- [`@vividiff/core`](../core/README.md)
- [`@vividiff/cli`](../cli/README.md)
- [`@vividiff/playwright-adapter`](../playwright-adapter/README.md)
- [`@vividiff/storybook-adapter`](../storybook-adapter/README.md)
- [`@vividiff/protocol`](../protocol/README.md)

## License

MIT
