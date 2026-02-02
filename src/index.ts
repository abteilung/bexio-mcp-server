#!/usr/bin/env node

/**
 * Bexio MCP Server v2 Entry Point
 *
 * This is the main entry point for the Bexio MCP server.
 * It handles:
 * - Environment variable loading
 * - Command line argument parsing
 * - Server initialization and startup
 *
 * IMPORTANT: All logging goes to stderr via logger.ts.
 * stdout is reserved for MCP JSON-RPC protocol messages.
 */

import { config } from "dotenv";
import { BexioMcpServer } from "./server.js";
import { logger } from "./logger.js";

// Load environment variables from .env file
config();

// Configuration from environment
const BEXIO_API_TOKEN = process.env["BEXIO_API_TOKEN"];
const BEXIO_BASE_URL =
  process.env["BEXIO_BASE_URL"] ?? "https://api.bexio.com/2.0";

function parseArgs(): { mode: string } {
  const args = process.argv.slice(2);
  const modeIndex = args.indexOf("--mode");
  const mode = modeIndex !== -1 ? args[modeIndex + 1] ?? "stdio" : "stdio";

  return { mode };
}

function validateEnvironment(): void {
  if (!BEXIO_API_TOKEN) {
    logger.error("BEXIO_API_TOKEN environment variable is required");
    logger.error("Set it in your .env file or environment");
    process.exit(1);
  }

  logger.info(`Using Bexio API base URL: ${BEXIO_BASE_URL}`);
}

async function main(): Promise<void> {
  const { mode } = parseArgs();

  // For now, only validate env if we're actually going to use it
  // The ping tool doesn't need Bexio API access
  // But we validate to ensure configuration is correct
  validateEnvironment();

  if (mode === "stdio") {
    logger.info("Starting in stdio mode (for Claude Desktop)");

    const server = new BexioMcpServer();
    await server.run();
  } else {
    logger.error(`Invalid mode: ${mode}. Only 'stdio' is supported in v2.0.`);
    logger.error("HTTP transport will be added in a later version.");
    process.exit(1);
  }
}

// Run the server
main().catch((error: unknown) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
