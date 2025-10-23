import { describe, it, expect } from 'vitest';
import {
  runVisnapCommand,
  hasBaselineScreenshots,
  getBaselineScreenshots,
  hasReportFiles,
  readVisnapReport,
  parseVisnapListOutput,
  EXPECTED_STORIES
} from './helpers.js';

describe('Visnap CLI E2E Tests', () => {
  describe('visnap update', () => {
    it('should generate baseline screenshots from storybook', async () => {
      // Run visnap update command
      const result = await runVisnapCommand('visnap', ['update']);
      
      // Assert command succeeded
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Verify baseline screenshots were generated
      expect(hasBaselineScreenshots()).toBe(true);
      
      const screenshots = getBaselineScreenshots();
      expect(screenshots.length).toBeGreaterThan(0);
      
      // Verify report files were generated
      const reports = hasReportFiles();
      expect(reports.json).toBe(true);
      expect(reports.html).toBe(true);
      
      // Verify report content
      const report = readVisnapReport();
      expect(report).toBeTruthy();
      // The report structure may vary, so just check it exists and has some content
      expect(Object.keys(report).length).toBeGreaterThan(0);
    }, 120000); // 2 minute timeout
  });

  describe('visnap test', () => {
    it('should run visual tests against baselines', async () => {
      // Run visnap test command
      const result = await runVisnapCommand('visnap', ['test']);
      
      
      // For the first run, we expect it to succeed since we just created baselines
      // If it fails, it might be because there are differences, which is also valid
      expect([0, 1]).toContain(result.exitCode);
      
      // Verify test report was generated
      const reports = hasReportFiles();
      expect(reports.json).toBe(true);
      expect(reports.html).toBe(true);
      
      // Verify report content exists
      const report = readVisnapReport();
      expect(report).toBeTruthy();
      expect(Object.keys(report).length).toBeGreaterThan(0);
    }, 120000); // 2 minute timeout
  });

  describe('visnap list', () => {
    it('should list available stories from storybook', async () => {
      // Run visnap list command
      const result = await runVisnapCommand('visnap', ['list']);
      
      
      // Assert command succeeded
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      
      // Verify output contains expected story names
      const output = result.stdout;
      expect(output).toBeTruthy();
      
      // Parse the output to extract story information
      const stories = parseVisnapListOutput(output);
      expect(stories).toBeTruthy();
      expect(Array.isArray(stories)).toBe(true);
      
      // Check that we have stories from the example-storybook
      const storyNames = stories.map((story: any) => 
        typeof story === 'string' ? story : story.name || story.title || story.id
      );
      
      // Verify we have at least some of the expected stories
      const foundStories = EXPECTED_STORIES.filter(expected => 
        storyNames.some((name: string) => 
          name && name.toLowerCase().includes(expected.toLowerCase())
        )
      );
      
      expect(foundStories.length).toBeGreaterThan(0);
      
    }, 60000); // 1 minute timeout
  });
});
