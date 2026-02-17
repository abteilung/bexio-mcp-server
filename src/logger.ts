/**
 * Logger module that ONLY writes to stderr.
 *
 * CRITICAL: MCP protocol uses stdout for JSON-RPC messages.
 * Any non-JSON output to stdout corrupts the protocol.
 * All logging MUST go to stderr via console.error().
 *
 * Log level is controlled by the LOG_LEVEL environment variable.
 * Supported values: debug | info | warn | error (default: info)
 * Example: LOG_LEVEL=debug node dist/index.js
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
const currentLevel: number = LOG_LEVELS[raw as LogLevel] ?? LOG_LEVELS.info;

function formatTimestamp(): string {
  return new Date().toISOString();
}

export function debug(message: string, ...args: unknown[]): void {
  if (currentLevel <= LOG_LEVELS.debug) {
    console.error(`[DEBUG] ${formatTimestamp()} ${message}`, ...args);
  }
}

export function info(message: string, ...args: unknown[]): void {
  if (currentLevel <= LOG_LEVELS.info) {
    console.error(`[INFO] ${formatTimestamp()} ${message}`, ...args);
  }
}

export function warn(message: string, ...args: unknown[]): void {
  if (currentLevel <= LOG_LEVELS.warn) {
    console.error(`[WARN] ${formatTimestamp()} ${message}`, ...args);
  }
}

export function error(message: string, ...args: unknown[]): void {
  if (currentLevel <= LOG_LEVELS.error) {
    console.error(`[ERROR] ${formatTimestamp()} ${message}`, ...args);
  }
}

export const logger = {
  debug,
  info,
  warn,
  error,
};
