# @visnap/eslint-config

Shared ESLint configurations for ViSnap.

## Installation

```bash
npm install @visnap/eslint-config --save-dev
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
import baseConfig from '@visnap/eslint-config/base.js';

export default [
  ...baseConfig,
  // Your additional rules
];
```

## License

MIT
