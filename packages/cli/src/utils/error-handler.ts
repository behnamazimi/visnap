import { getErrorMessage, log } from "@vividiff/core";
import chalk from "chalk";

export interface ErrorContext {
  command?: string;
  operation?: string;
  suggestion?: string;
}

/**
 * Centralized error handler with actionable messages
 */
export class ErrorHandler {
  /**
   * Handle and format errors with context
   */
  static handle(error: unknown, context?: ErrorContext): void {
    const message = getErrorMessage(error);
    const errorType = this.getErrorType(error);

    log.error(this.formatErrorMessage(message, errorType, context));

    if (context?.suggestion) {
      log.plain(chalk.yellow(`💡 Suggestion: ${context.suggestion}`));
    }

    // Add common troubleshooting steps
    this.addTroubleshootingSteps(errorType, context);
  }

  /**
   * Format error message with context
   */
  private static formatErrorMessage(
    message: string,
    errorType: string,
    context?: ErrorContext
  ): string {
    let formatted = message;

    if (context?.command) {
      formatted = `Error in '${context.command}' command: ${message}`;
    }

    if (context?.operation) {
      formatted += `\nOperation: ${context.operation}`;
    }

    return formatted;
  }

  /**
   * Determine error type for better handling
   */
  private static getErrorType(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("eaddrinuse") || message.includes("port")) {
        return "port_conflict";
      }

      if (message.includes("enoent") || message.includes("not found")) {
        return "file_not_found";
      }

      if (message.includes("permission") || message.includes("eacces")) {
        return "permission_denied";
      }

      if (message.includes("network") || message.includes("timeout")) {
        return "network_error";
      }

      if (message.includes("syntax") || message.includes("parse")) {
        return "config_error";
      }
    }

    return "unknown";
  }

  /**
   * Add troubleshooting steps based on error type
   */
  private static addTroubleshootingSteps(
    errorType: string,
    _context?: ErrorContext
  ): void {
    log.plain(chalk.gray("\n🔧 Troubleshooting:"));

    switch (errorType) {
      case "port_conflict":
        log.plain("• Check if another process is using the port");
        log.plain("• Try using a different port with --port option");
        log.plain("• Kill existing processes: lsof -ti:PORT | xargs kill");
        break;

      case "file_not_found":
        log.plain("• Verify the file path exists");
        log.plain("• Check if you're in the correct directory");
        log.plain("• Run 'vividiff init' to create a configuration file");
        break;

      case "permission_denied":
        log.plain("• Check file/directory permissions");
        log.plain("• Try running with appropriate permissions");
        log.plain("• Verify write access to the target directory");
        break;

      case "network_error":
        log.plain("• Check your internet connection");
        log.plain("• Verify the URL is accessible");
        log.plain("• Try again in a few moments");
        break;

      case "config_error":
        log.plain("• Validate your configuration file syntax");
        log.plain("• Run 'vividiff validate' to check configuration");
        log.plain("• Check the configuration documentation");
        break;

      default:
        log.plain("• Check the logs for more details");
        log.plain("• Run with --verbose for debug information");
        log.plain("• Report issues at the project repository");
    }
  }

  /**
   * Handle SIGINT gracefully
   */
  static handleSigint(cleanup?: () => void | Promise<void>): void {
    process.on("SIGINT", async () => {
      log.plain(chalk.yellow("\n\n⚠️  Interrupted by user"));

      if (cleanup) {
        try {
          await cleanup();
        } catch (error) {
          log.error(`Cleanup failed: ${getErrorMessage(error)}`);
        }
      }

      log.plain("Goodbye! 👋");
      process.exit(0);
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  static handleUnhandledRejection(): void {
    process.on("unhandledRejection", reason => {
      log.error(`Unhandled promise rejection: ${getErrorMessage(reason)}`);
      process.exit(1);
    });
  }
}
