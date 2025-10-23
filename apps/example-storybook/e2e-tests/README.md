# Visnap E2E Tests

This directory contains end-to-end tests for the visnap CLI commands using the example-storybook app.

## Test Cases

1. **visnap update** - Generates baseline screenshots from storybook
2. **visnap test** - Runs visual tests against baselines  
3. **visnap list** - Lists available stories from storybook

## Running Tests

### Prerequisites

1. Build the visnap packages from source:
   ```bash
   npm run build
   ```

2. Build the example storybook:
   ```bash
   npm run build-storybook -w example-storybook-v8
   ```

3. Install e2e test dependencies:
   ```bash
   npm install -w example-storybook-v8
   ```

### Run Tests

From the example-storybook directory:
```bash
npm run test:e2e
```

Or from the workspace root:
```bash
npm run test:e2e -w example-storybook-v8
```

## Test Configuration

- Tests run sequentially to maintain state between test cases
- Each test cleans up visnap directories before running
- Timeouts are set to 2 minutes for e2e operations
- Tests use the existing `visnap.config.ts` configuration

## CI Integration

The tests run in GitHub Actions with two approaches:
1. Standard Node.js environment
2. Docker with Playwright image (`mcr.microsoft.com/playwright:v1.56.1-noble`)

Both approaches build packages from source and test against the built storybook.
