import { beforeAll, afterAll, beforeEach } from 'vitest';
import { cleanupVisnapDirectories, ensureStorybookBuilt } from './helpers.js';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();
const VISNAP_DIRS = ['visnap/base', 'visnap/current', 'visnap/diff'];

beforeAll(async () => {
  // Ensure storybook is built before running any tests
  await ensureStorybookBuilt();
}, 120000); // 2 minute timeout for storybook build

beforeEach(async () => {
  // Clean up visnap directories before each test
  await cleanupVisnapDirectories();
});

afterAll(async () => {
  // Final cleanup after all tests
  await cleanupVisnapDirectories();
});
