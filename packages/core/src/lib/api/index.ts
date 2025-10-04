// API barrel file - exports all API functions and types

// Test API
export { runTests } from "./test";
export type { TestOptions, TestResult } from "./test";

// Update API
export { updateBaseline } from "./update";
export type { UpdateOptions, UpdateResult } from "./update";

// Init API
export { initializeProject } from "./init";
export type { InitOptions, InitResult } from "./init";

// Re-export BrowserTestResult from test-service for external use
export type { BrowserTestResult } from "@/lib/test-service";
