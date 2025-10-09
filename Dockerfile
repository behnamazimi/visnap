# Stage 1: Build all workspace packages with Node 22 Alpine
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY turbo.json ./

# Copy workspace configuration and package manifests for install caching
COPY packages/core/package.json ./packages/core/
COPY packages/cli/package.json ./packages/cli/
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/playwright-adapter/package.json ./packages/playwright-adapter/
COPY packages/storybook-adapter/package.json ./packages/storybook-adapter/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY LICENSE ./LICENSE
COPY README.md ./README.md

# Install dependencies
RUN npm ci

# Copy source code for all packages
COPY packages/core ./packages/core
COPY packages/cli ./packages/cli
COPY packages/protocol ./packages/protocol
COPY packages/playwright-adapter ./packages/playwright-adapter
COPY packages/storybook-adapter ./packages/storybook-adapter
COPY packages/eslint-config ./packages/eslint-config

# Build all packages via turbo (ensures runtime deps like core/adapters are built)
WORKDIR /app
RUN npm run build

# Stage 2: Create final image with globally installed CLI
FROM mcr.microsoft.com/playwright:v1.56.0-noble AS test-runner

# Set working directory for global install of the CLI
WORKDIR /vividiff

# Copy the built monorepo (only what's needed)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/README.md ./
COPY --from=builder /app/LICENSE ./

# Link workspace packages globally so the CLI and its local deps resolve without registry
RUN npm link \
  ./packages/protocol \
  ./packages/playwright-adapter \
  ./packages/storybook-adapter \
  ./packages/core \
  ./packages/cli

# Set working directory back to /app
WORKDIR /app

ENTRYPOINT [ "vividiff" ]