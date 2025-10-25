# Release Setup Guide

This guide explains how to set up the automated release process for maintainers using the [changesets action](https://github.com/changesets/action).

## Prerequisites

1. **NPM Account**: You need an npm account with publish permissions for the `@visnap` scope
2. **GitHub Repository Access**: Admin access to configure secrets
3. **No 2FA on npm publish**: The npm token cannot have 2FA enabled for publishing (2FA on auth is fine)

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

### 3. Configure GitHub Actions Permissions

**IMPORTANT**: You must enable GitHub Actions to create pull requests for the changesets action to work.

1. Go to your GitHub repository
2. Navigate to Settings → Actions → General
3. Scroll down to "Workflow permissions"
4. Select "Read and write permissions"
5. Check the box "Allow GitHub Actions to create and approve pull requests"
6. Click "Save"

### 4. Verify Setup

The release process will automatically work once the secret is added and permissions are configured. You can test it by:

1. Creating a test changeset:
   ```bash
   npx changeset
   ```
2. Committing and pushing to main
3. Checking that a "Version Packages" PR is created
4. Merging the version PR to trigger publishing

## How It Works

### The Accumulation Process

Changesets work by accumulating multiple changes into a single release:

1. **Changesets accumulate** in the `.changeset/` folder as developers create them
2. **GitHub Action creates/updates** ONE "Version Packages" PR that includes ALL pending changesets
3. **Multiple changesets → ONE version bump → ONE release** when the PR is merged

### Detailed Workflow

```
Developer A: Creates changeset for bug fix (patch)
    ↓
Developer B: Creates changeset for new feature (minor)  
    ↓
Developer C: Creates changeset for another fix (patch)
    ↓
GitHub Action: Runs "changeset version" command
    ↓
Action updates package.json files with new version numbers
    ↓
"Version Packages" PR shows: 0.5.1 → 0.6.0 (minor bump, because minor > patch)
    ↓
Maintainer: Reviews and merges the PR
    ↓
Release: v0.6.0 published with all 3 changes in changelog
```

**Key Point:** The `changeset version` command actually **updates the package.json files** with the new version numbers. The "Version Packages" PR contains these real version updates, not just metadata.

### What Happens During `changeset version`

When the GitHub Action runs `npm run version` (which executes `changeset version`):

1. **Reads all changeset files** in `.changeset/` folder
2. **Calculates version bumps** based on the highest bump type
3. **Updates package.json files** with new version numbers
4. **Updates CHANGELOG.md files** with new entries
5. **Removes processed changeset files** from `.changeset/` folder
6. **Commits these changes** to the "Version Packages" PR

This is why the PR shows actual file changes - the package.json and CHANGELOG.md files are physically updated with the new versions.

### Version Bump Behavior

**Key Rule:** The version bump uses the **highest bump type** among all pending changesets.

Examples:
- 3 patch changesets → 0.5.1 → 0.5.2 (patch bump)
- 2 patch + 1 minor changeset → 0.5.1 → 0.6.0 (minor bump)
- 1 patch + 1 minor + 1 major → 0.5.1 → 1.0.0 (major bump)

**Fixed Versioning:** All packages always get the same version number due to the `fixed` configuration in `.changeset/config.json`.

### Release Strategies

You can choose how to handle the "Version Packages" PR:

**Frequent Releases (Immediate):**
- Merge the PR as soon as it's created
- Users get fixes faster
- More npm noise, version numbers increment quickly

**Milestone Releases (Batched):**
- Hold the PR until you have multiple changes ready
- More meaningful version numbers and release notes
- Users wait longer for fixes

**Hybrid Approach:**
- Patch releases → frequent (bug fixes)
- Minor releases → batched (new features)  
- Major releases → planned carefully (breaking changes)

### Quick Reference

| Action | Result |
|--------|--------|
| Create changeset | File added to `.changeset/` folder |
| Push to main | GitHub Action runs `changeset version` |
| `changeset version` runs | Updates package.json files with new versions |
| "Version Packages" PR | Contains actual version updates to package.json |
| Multiple changesets pushed | Same PR updated (accumulates changes) |
| Merge "Version Packages" PR | ONE release, ONE version bump for all packages |

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
- **"Permission denied"**: Verify your npm token has publish access to `@visnap` scope
- **"Package not found"**: Ensure all packages are built before publishing
- **"Resource not accessible by integration"** or **"GitHub Actions is not permitted to create pull requests"**: 
  - Go to Settings → Actions → General → Workflow permissions
  - Select "Read and write permissions"
  - Check "Allow GitHub Actions to create and approve pull requests"
  - Click "Save"
  - This is the most common issue with changesets action
