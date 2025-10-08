# Release Setup Guide

This guide explains how to set up the automated release process for maintainers.

## Prerequisites

1. **NPM Account**: You need an npm account with publish permissions for the `@visual-testing-tool` scope
2. **GitHub Repository Access**: Admin access to configure secrets

## Setup Steps

### 1. Create NPM Token

1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Go to "Access Tokens" in your account settings
3. Click "Generate New Token"
4. Choose "Automation" token type (for CI/CD)
5. Copy the token (you won't see it again!)

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click "Add secret"

### 3. Verify Setup

The release process will automatically work once the secret is added. You can test it by:

1. Creating a test changeset:
   ```bash
   npx changeset
   ```
2. Committing and pushing to main
3. Checking that a "Version Packages" PR is created
4. Merging the version PR to trigger publishing

## How It Works

1. **Developer creates changeset** → Commits and pushes to main
2. **Release workflow triggers** → Creates "Version Packages" PR automatically
3. **Maintainer reviews** → Merges the version PR
4. **Publish workflow triggers** → Builds and publishes to npm

## Manual Release (Emergency)

If you need to release manually:

```bash
# Install dependencies
npm ci

# Version packages
npm run version

# Publish to npm
npm run release
```

## Troubleshooting

- **"NPM_TOKEN not found"**: Check that the secret is properly set in GitHub
- **"Permission denied"**: Verify your npm token has publish access to `@visual-testing-tool` scope
- **"Package not found"**: Ensure all packages are built before publishing
