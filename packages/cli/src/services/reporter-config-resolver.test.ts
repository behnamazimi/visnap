import { describe, it, expect } from "vitest";

import { createMockConfigReporter } from "../__mocks__/mock-cli-factories";

import {
  resolveHtmlReporterConfig,
  resolveJsonReporterConfig,
  resolveReporterConfig,
} from "./reporter-config-resolver";

describe("reporter-config-resolver", () => {
  describe("resolveHtmlReporterConfig", () => {
    it("should use default values when no config or CLI options provided", () => {
      const result = resolveHtmlReporterConfig(
        undefined,
        undefined,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "./visnap/report.html",
      });
    });

    it("should use CLI override when provided as boolean true", () => {
      const result = resolveHtmlReporterConfig(undefined, true, "./visnap");

      expect(result).toEqual({
        enabled: true,
        outputPath: "./visnap/report.html",
      });
    });

    it("should use CLI override when provided as string 'true'", () => {
      const result = resolveHtmlReporterConfig(undefined, "true", "./visnap");

      expect(result).toEqual({
        enabled: true,
        outputPath: "true",
      });
    });

    it("should disable when CLI override is false", () => {
      const result = resolveHtmlReporterConfig(undefined, false, "./visnap");

      expect(result).toEqual({
        enabled: false,
        outputPath: undefined,
      });
    });

    it("should disable when CLI override is string 'false'", () => {
      const result = resolveHtmlReporterConfig(undefined, "false", "./visnap");

      expect(result).toEqual({
        enabled: false,
        outputPath: undefined,
      });
    });

    it("should use custom path when CLI override is string", () => {
      const result = resolveHtmlReporterConfig(
        undefined,
        "/custom/path.html",
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "/custom/path.html",
      });
    });

    it("should use config values when CLI override not provided", () => {
      const configReporter = createMockConfigReporter({
        html: true,
      });

      const result = resolveHtmlReporterConfig(
        configReporter,
        undefined,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "./visnap/report.html",
      });
    });

    it("should use config string path when CLI override not provided", () => {
      const configReporter = createMockConfigReporter({
        html: "/config/path.html",
      });

      const result = resolveHtmlReporterConfig(
        configReporter,
        undefined,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "/config/path.html",
      });
    });

    it("should disable from config when CLI override not provided", () => {
      const configReporter = createMockConfigReporter({
        html: false,
      });

      const result = resolveHtmlReporterConfig(
        configReporter,
        undefined,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: false,
        outputPath: undefined,
      });
    });

    it("should prioritize CLI over config", () => {
      const configReporter = createMockConfigReporter({
        html: false,
      });

      const result = resolveHtmlReporterConfig(
        configReporter,
        true,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "./visnap/report.html",
      });
    });
  });

  describe("resolveJsonReporterConfig", () => {
    it("should use default values when no config or CLI options provided", () => {
      const result = resolveJsonReporterConfig(
        undefined,
        undefined,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "./visnap/report.json",
      });
    });

    it("should use CLI override when provided as boolean true", () => {
      const result = resolveJsonReporterConfig(undefined, true, "./visnap");

      expect(result).toEqual({
        enabled: true,
        outputPath: "./visnap/report.json",
      });
    });

    it("should use CLI override when provided as string 'true'", () => {
      const result = resolveJsonReporterConfig(undefined, "true", "./visnap");

      expect(result).toEqual({
        enabled: true,
        outputPath: "true",
      });
    });

    it("should disable when CLI override is false", () => {
      const result = resolveJsonReporterConfig(undefined, false, "./visnap");

      expect(result).toEqual({
        enabled: false,
        outputPath: undefined,
      });
    });

    it("should disable when CLI override is string 'false'", () => {
      const result = resolveJsonReporterConfig(undefined, "false", "./visnap");

      expect(result).toEqual({
        enabled: false,
        outputPath: undefined,
      });
    });

    it("should use custom path when CLI override is string", () => {
      const result = resolveJsonReporterConfig(
        undefined,
        "/custom/path.json",
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "/custom/path.json",
      });
    });

    it("should use config values when CLI override not provided", () => {
      const configReporter = createMockConfigReporter({
        json: true,
      });

      const result = resolveJsonReporterConfig(
        configReporter,
        undefined,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "./visnap/report.json",
      });
    });

    it("should use config string path when CLI override not provided", () => {
      const configReporter = createMockConfigReporter({
        json: "/config/path.json",
      });

      const result = resolveJsonReporterConfig(
        configReporter,
        undefined,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "/config/path.json",
      });
    });

    it("should disable from config when CLI override not provided", () => {
      const configReporter = createMockConfigReporter({
        json: false,
      });

      const result = resolveJsonReporterConfig(
        configReporter,
        undefined,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: false,
        outputPath: undefined,
      });
    });

    it("should prioritize CLI over config", () => {
      const configReporter = createMockConfigReporter({
        json: false,
      });

      const result = resolveJsonReporterConfig(
        configReporter,
        true,
        "./visnap"
      );

      expect(result).toEqual({
        enabled: true,
        outputPath: "./visnap/report.json",
      });
    });
  });

  describe("resolveReporterConfig", () => {
    it("should resolve both HTML and JSON configs", () => {
      const configReporter = createMockConfigReporter({
        html: "/config/html.html",
        json: "/config/json.json",
      });

      const result = resolveReporterConfig(
        configReporter,
        true,
        false,
        "./visnap"
      );

      expect(result).toEqual({
        html: {
          enabled: true,
          outputPath: "./visnap/report.html",
        },
        json: {
          enabled: false,
          outputPath: undefined,
        },
      });
    });

    it("should handle undefined config reporter", () => {
      const result = resolveReporterConfig(
        undefined,
        undefined,
        undefined,
        "./custom-dir"
      );

      expect(result).toEqual({
        html: {
          enabled: true,
          outputPath: "./custom-dir/report.html",
        },
        json: {
          enabled: true,
          outputPath: "./custom-dir/report.json",
        },
      });
    });

    it("should use custom screenshot directory for default paths", () => {
      const result = resolveReporterConfig(
        undefined,
        undefined,
        undefined,
        "/custom/screenshots"
      );

      expect(result).toEqual({
        html: {
          enabled: true,
          outputPath: "/custom/screenshots/report.html",
        },
        json: {
          enabled: true,
          outputPath: "/custom/screenshots/report.json",
        },
      });
    });
  });
});
