# @vividiff/eslint-config

Shared ESLint configurations for ViviDiff.

## Installation

```bash
npm install @vividiff/eslint-config --save-dev
```

## Available Configurations

### `base.js`

Base configuration with common rules for all packages.

### `react-internal.js`

React-specific configuration for internal packages.

### `next.js`

Next.js specific configuration.

## Usage

```javascript
// eslint.config.js
import baseConfig from '@vividiff/eslint-config/base.js';

export default [
  ...baseConfig,
  // Your additional rules
];
```

## License

MIT
