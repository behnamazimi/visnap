# @visnap/fs-adapter

Internal filesystem storage adapter for visnap visual testing.

## Overview

This package provides a filesystem-based implementation of the `StorageAdapter` interface, allowing visnap to store and retrieve screenshot files from the local filesystem.

> **Notice:** This package is mainly used internally by the core of visnap. In most cases, you don't need to use or interact with it directly. You can safely skip this package unless you're interested in the underlying technical details or implementation flow.

## Usage

```typescript
import { FsStorageAdapter } from "@visnap/fs-adapter";

const adapter = new FsStorageAdapter({
  screenshotDir: "./visnap",
  baseDirName: "base", // optional, defaults to 'base'
  currentDirName: "current", // optional, defaults to 'current'
  diffDirName: "diff", // optional, defaults to 'diff'
});

// Write a screenshot
await adapter.write("base", "my-test.png", buffer);

// Read a screenshot
const buffer = await adapter.read("base", "my-test.png");

// Get file path for comparison engines
const path = await adapter.getReadablePath("base", "my-test.png");

// Check if file exists
const exists = await adapter.exists("base", "my-test.png");

// List all PNG files in a directory
const files = await adapter.list("base");
```

#### Options

- `screenshotDir: string` - Base directory for storing screenshots
- `baseDirName?: string` - Name of base directory (default: 'base')
- `currentDirName?: string` - Name of current directory (default: 'current')
- `diffDirName?: string` - Name of diff directory (default: 'diff')

#### Methods

Implements the `StorageAdapter` interface:

- `write(kind, filename, buffer)` - Write buffer to file
- `read(kind, filename)` - Read file as buffer
- `getReadablePath(kind, filename)` - Get absolute file path
- `exists(kind, filename)` - Check if file exists
- `list(kind)` - List PNG files in directory
- `cleanup()` - No-op for filesystem adapter
