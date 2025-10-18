# Visnap Coding Style Guide

## Overview

This document establishes naming conventions and code clarity standards for the Visnap visual testing framework. Following these guidelines ensures consistent, readable, and maintainable code across all packages.

## Naming Conventions

### 1. Variable and Parameter Names

#### ✅ DO: Use descriptive, full names
```typescript
// Good
const maxConcurrency = options.runtime?.maxConcurrency;
const validatedOptions = validateOptions(options);
const visualConfig = story.visualTesting;
const thresholdValue = Number(process.env.VISNAP_THRESHOLD);
```

#### ❌ DON'T: Use abbreviations or single letters
```typescript
// Bad
const mc = options.runtime?.maxConcurrency;
const opts = validateOptions(options);
const cfg = story.visualTesting;
const n = Number(process.env.VISNAP_THRESHOLD);
```

#### Common Abbreviations to Avoid
- `opts` → `options`
- `cfg` → `config` or `configuration`
- `mc` → `maxConcurrency`
- `req` → `request`
- `res` → `response`
- `err` → `error`
- `tmp` → `temporary` or `temp`
- `ctx` → `context`

### 2. Function Names

#### ✅ DO: Use descriptive, action-oriented names
```typescript
// Good
function ensureDirectoryExists(name: string) { }
function attemptStoryDiscovery() { }
function processNextItem() { }
function createUrlFilter(options: FilterOptions) { }
```

#### ❌ DON'T: Use vague or generic names
```typescript
// Bad
function ensure(name: string) { }
function attempt() { }
function runOne() { }
function createFilter(opts: FilterOptions) { }
```

### 3. Single-Letter Variables

#### ✅ DO: Use descriptive names even in loops
```typescript
// Good
for (const testCase of testCases) {
  const file = `${testCase.caseId}-${testCase.variantId}.png`;
}

for (const story of filtered) {
  const visualConfig = story.visualTesting;
}
```

#### ❌ DON'T: Use single letters except for common patterns
```typescript
// Bad
for (const t of testCases) {
  const file = `${t.caseId}-${t.variantId}.png`;
}

for (const s of filtered) {
  const cfg = s.visualTesting;
}
```

#### Acceptable Single-Letter Usage
- Loop indices: `for (let i = 0; i < length; i++)`
- Generic type parameters: `function process<T>(item: T)`
- Mathematical variables in context: `const x = position.x; const y = position.y;`

### 4. Boolean Variables

#### ✅ DO: Use clear boolean naming patterns
```typescript
// Good
const isUrl = /^https?:\/\//i.test(source);
const htmlEnabled = config.html !== false;
const reuseContext = Boolean(options.performance?.reuseContext);
const existsInCurrent = currentFiles.has(file);
```

#### ❌ DON'T: Use unclear boolean names
```typescript
// Bad
const url = /^https?:\/\//i.test(source);
const enabled = config.html !== false;
const reuse = Boolean(options.performance?.reuseContext);
const inCurrent = currentFiles.has(file);
```

### 5. Error Handling

#### ✅ DO: Use descriptive error handler names
```typescript
// Good
const handleServerStartupError = (error: unknown) => {
  // error handling logic
};

const handleAdapterError = (error: unknown) => {
  // error handling logic
};
```

#### ❌ DON'T: Use generic error handler names
```typescript
// Bad
const onError = (err: unknown) => {
  // error handling logic
};
```

## Package-Specific Patterns

### Adapter Pattern
All adapters should follow consistent naming:

```typescript
// Function signature
export function createAdapter(options: AdapterOptions): AdapterType

// Validation function
export function validateOptions(options: unknown): AdapterOptions

// Internal validated variable
const validatedOptions = validateOptions(options);
```

### Configuration Pattern
Configuration functions should use consistent naming:

```typescript
// Parameter naming
function applyEnvOverrides(config: VisualTestingToolConfig): VisualTestingToolConfig

// Internal variables
const updatedConfig = { ...config };
const configWithEnv = applyEnvOverrides(merged);
```

### Filter Pattern
Filter functions should use consistent naming:

```typescript
// Function signature
export function createUrlFilter(options: FilterOptions): FilterFunction
export function createTestCaseFilter(options: FilterOptions): FilterFunction

// Internal variables
const includePatterns = Array.isArray(options.include) ? options.include : [];
const excludePatterns = Array.isArray(options.exclude) ? options.exclude : [];
```

## Type and Interface Naming

### ✅ DO: Use descriptive, specific names
```typescript
// Good
interface ResolvedReporterConfiguration {
  html: { enabled: boolean; outputPath?: string };
  json: { enabled: boolean; outputPath?: string };
}

interface ConcurrencyPoolConfiguration {
  concurrency: number;
}
```

### ❌ DON'T: Use vague type names
```typescript
// Bad
interface ReporterConfig {
  html: { enabled: boolean; outputPath?: string };
  json: { enabled: boolean; outputPath?: string };
}

interface PoolOptions {
  concurrency: number;
}
```

## Constants and Magic Numbers

### ✅ DO: Use descriptive constant names
```typescript
// Good
const DEFAULT_EVAL_TIMEOUT_MS = 15000;
const DEFAULT_DISCOVERY_MAX_RETRIES = 3;
const SERVER_START_TIMEOUT_MS = 5000;
```

### ❌ DON'T: Use unclear constant names
```typescript
// Bad
const TIMEOUT = 15000;
const MAX_RETRIES = 3;
const SERVER_TIMEOUT = 5000;
```

## File Organization

### Function Documentation
All public functions should have JSDoc comments with:
- Clear description of what the function does
- Parameter descriptions using the actual parameter names
- Return value description
- Example usage when helpful

```typescript
/**
 * Creates a URL filter function based on include/exclude patterns
 * @param options - Filter options with include and exclude patterns
 * @returns Predicate function that returns true if URL should be included
 * 
 * @example
 * ```typescript
 * const filter = createUrlFilter({
 *   include: ["homepage", "about*"],
 *   exclude: ["*test*", "admin*"]
 * });
 * ```
 */
export function createUrlFilter(options: FilterOptions) {
  // implementation
}
```

## Code Review Checklist

When reviewing code, check for:

- [ ] No abbreviated variable names (`opts`, `cfg`, `mc`, etc.)
- [ ] No single-letter variables except in acceptable contexts
- [ ] Descriptive function names that explain what they do
- [ ] Clear boolean variable names with `is`/`has` prefixes
- [ ] Consistent parameter naming across similar functions
- [ ] Descriptive error handler names
- [ ] Clear constant names with context
- [ ] Updated JSDoc comments with correct parameter names

## Enforcement

These guidelines should be enforced through:
1. Code review process
2. ESLint rules where possible
3. IDE configuration for consistent formatting
4. Regular team discussions about code quality

## Examples of Improvements Made

### Before (Problematic)
```typescript
function applyEnvOverrides(cfg: VisualTestingToolConfig) {
  const out = { ...cfg };
  const n = Number(process.env.VISNAP_THRESHOLD);
  if (!Number.isNaN(n)) out.comparison.threshold = n;
  return out;
}

export function createAdapter(opts: AdapterOptions) {
  const validatedOpts = validateOptions(opts);
  // ...
}
```

### After (Improved)
```typescript
function applyEnvOverrides(config: VisualTestingToolConfig) {
  const updatedConfig = { ...config };
  const thresholdValue = Number(process.env.VISNAP_THRESHOLD);
  if (!Number.isNaN(thresholdValue)) updatedConfig.comparison.threshold = thresholdValue;
  return updatedConfig;
}

export function createAdapter(options: AdapterOptions) {
  const validatedOptions = validateOptions(options);
  // ...
}
```

---

*This style guide was created based on a comprehensive code quality audit of the Visnap codebase. It should be updated as the codebase evolves and new patterns emerge.*
