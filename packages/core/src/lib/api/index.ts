// API barrel file - exports all API functions and types

// Test API
export { runVisualTests, runVisualTestsCli } from "./test";

// Update API
export { updateBaseline, updateBaselineCli } from "./update";

// Init API
export { initializeProject } from "./init";
export type { InitOptions, InitResult } from "./init";
