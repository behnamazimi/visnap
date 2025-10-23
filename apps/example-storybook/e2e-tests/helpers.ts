import { execa } from 'execa';
import { existsSync, rmSync, mkdirSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();
const VISNAP_DIRS = ['visnap/base', 'visnap/current', 'visnap/diff'];

export interface VisnapCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  command: string;
}

/**
 * Run a visnap CLI command and return the result
 */
export async function runVisnapCommand(
  command: string,
  args: string[] = [],
  options: { cwd?: string; timeout?: number } = {}
): Promise<VisnapCommandResult> {
  const { cwd = PROJECT_ROOT, timeout = 60000 } = options;
  
  try {
    const result = await execa(command, args, {
      cwd,
      timeout,
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      command: `${command} ${args.join(' ')}`
    };
  } catch (error: any) {
    return {
      exitCode: error.exitCode || 1,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      command: `${command} ${args.join(' ')}`
    };
  }
}

/**
 * Clean up visnap directories
 */
export async function cleanupVisnapDirectories(): Promise<void> {
  for (const dir of VISNAP_DIRS) {
    const fullPath = join(PROJECT_ROOT, dir);
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true, force: true });
    }
  }
}

/**
 * Ensure storybook is built
 */
export async function ensureStorybookBuilt(): Promise<void> {
  const storybookStaticPath = join(PROJECT_ROOT, 'storybook-static');
  
  if (!existsSync(storybookStaticPath)) {
    console.log('Building storybook...');
    const result = await runVisnapCommand('npm', ['run', 'build-storybook'], {
      cwd: PROJECT_ROOT,
      timeout: 120000
    });
    
    if (result.exitCode !== 0) {
      throw new Error(`Failed to build storybook: ${result.stderr}`);
    }
  }
}

/**
 * Check if visnap baseline directory exists and has content
 */
export function hasBaselineScreenshots(): boolean {
  const basePath = join(PROJECT_ROOT, 'visnap/base');
  if (!existsSync(basePath)) {
    return false;
  }
  
  const files = readdirSync(basePath, { recursive: true });
  return files.length > 0;
}

/**
 * Get list of baseline screenshot files
 */
export function getBaselineScreenshots(): string[] {
  const basePath = join(PROJECT_ROOT, 'visnap/base');
  if (!existsSync(basePath)) {
    return [];
  }
  
  const files: string[] = [];
  function scanDir(dir: string) {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.png')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(basePath);
  return files;
}

/**
 * Check if visnap report files exist
 */
export function hasReportFiles(): { json: boolean; html: boolean } {
  const jsonPath = join(PROJECT_ROOT, 'visnap/report.json');
  const htmlPath = join(PROJECT_ROOT, 'visnap/report.html');
  
  return {
    json: existsSync(jsonPath),
    html: existsSync(htmlPath)
  };
}

/**
 * Read and parse visnap JSON report
 */
export function readVisnapReport(): any {
  const jsonPath = join(PROJECT_ROOT, 'visnap/report.json');
  if (!existsSync(jsonPath)) {
    return null;
  }
  
  try {
    const content = readFileSync(jsonPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Parse visnap list output to extract story information
 */
export function parseVisnapListOutput(output: string): any[] {
  try {
    // Try to parse as JSON first
    return JSON.parse(output);
  } catch {
    // If not JSON, extract story names from the table output
    const lines = output.split('\n');
    const stories: any[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Look for table rows that contain story information
      if (trimmed.includes('│') && trimmed.includes('Example/')) {
        // Extract the title from the table row
        const parts = trimmed.split('│');
        if (parts.length >= 3) {
          const title = parts[2].trim();
          if (title && title !== 'Title') {
            // Extract the story name from "Example/Button" format
            const storyName = title.split('/')[1];
            if (storyName) {
              stories.push({ name: storyName, title: title });
            }
          }
        }
      }
    }
    
    return stories;
  }
}

/**
 * Expected story names from the example-storybook
 */
export const EXPECTED_STORIES = ['Button', 'Form', 'Header', 'Page'];
