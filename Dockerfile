# Stage 1: Build the core package with Node 22 Alpine
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY turbo.json ./

# Copy workspace configuration
COPY packages/core/package.json ./packages/core/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY LICENSE ./LICENSE
COPY README.md ./README.md

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/core ./packages/core
COPY packages/eslint-config ./packages/eslint-config

# Build the core package
WORKDIR /app/packages/core
RUN npm run build

# Stage 2: Create final image with globally installed package
FROM mcr.microsoft.com/playwright:v1.55.1-noble AS test-runner

# Set working directory
WORKDIR /visual-testing-tool

# Copy the built package
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/dist ./dist
COPY --from=builder /app/packages/core/package.json ./
COPY --from=builder /app/README.md ./
COPY --from=builder /app/LICENSE ./

# Install the package globally so the command is available
RUN npm install -g .

# Set working directory back to /app
WORKDIR /app

ENTRYPOINT [ "visual-testing-tool" ]