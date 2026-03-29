/**
 * Environment-aware logging utility
 * Only logs to console in development mode to prevent information leakage in production
 */

type LogLevel = "error" | "warn" | "info" | "debug";

const isDev = import.meta.env.DEV;

/**
 * Log an error with context - only in development
 * In production, errors are silently suppressed from console
 */
export function logError(context: string, error: unknown): void {
  if (isDev) {
    console.error(`[${context}]`, error);
  }
  // In production, you could send to a monitoring service like Sentry
}

/**
 * Log a warning with context - only in development
 */
export function logWarn(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.warn(`[${context}]`, message, data ?? "");
  }
}

/**
 * Log info with context - only in development
 */
export function logInfo(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.info(`[${context}]`, message, data ?? "");
  }
}

/**
 * Log debug info - only in development
 */
export function logDebug(context: string, message: string, data?: unknown): void {
  if (isDev) {
    console.log(`[${context}]`, message, data ?? "");
  }
}

/**
 * Generic log function with level support
 */
export function log(level: LogLevel, context: string, message: string, data?: unknown): void {
  if (!isDev) return;

  switch (level) {
    case "error":
      console.error(`[${context}]`, message, data ?? "");
      break;
    case "warn":
      console.warn(`[${context}]`, message, data ?? "");
      break;
    case "info":
      console.info(`[${context}]`, message, data ?? "");
      break;
    case "debug":
      console.log(`[${context}]`, message, data ?? "");
      break;
  }
}
