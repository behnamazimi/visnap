# Contributing

Thank you for your interest in contributing to vividiff! This document provides guidelines for contributing to this project.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vividiff
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build packages**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm run test
   ```

## Making Changes

### Code Style

- Follow the existing code style and patterns
- Run `npm run lint` to check for linting issues
- Run `npm run format` to format code with Prettier
- Ensure all tests pass with `npm run test`

### Creating Changesets

When making changes that should be released, you need to create a changeset:

1. **Create a changeset** describing your changes:
   ```bash
   npx changeset
   ```

2. **Follow the prompts** to:
   - Select which packages are affected
   - Choose the type of change (patch, minor, major)
   - Write a description of the changes

3. **Include the changeset file** in your PR

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Add tests if applicable
4. Create a changeset if the change should be released
5. Submit a pull request with a clear description

### Release Process

This project uses automated releases with Changesets:

- When you merge a PR with changesets to `main`, a "Version Packages" PR will be automatically created
- Maintainers review and merge the version PR
- Packages are automatically published to npm

## Package Structure

This is a monorepo with the following packages:

- `@vividiff/protocol` - Shared types and interfaces
- `@vividiff/playwright-adapter` - Playwright browser integration
- `@vividiff/storybook-adapter` - Storybook integration
- `@vividiff/core` - Core functionality
- `@vividiff/cli` - Command-line interface

All packages share the same version number (fixed versioning).

