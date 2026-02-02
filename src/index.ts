#!/usr/bin/env node

/**
 * Bexio MCP Server v2 Entry Point
 *
 * This is the main entry point for the Bexio MCP server.
 * It handles:
 * - Environment variable loading
 * - Command line argument parsing
 * - Server initialization and startup
 * - Dual transport: stdio (Claude Desktop) and http (n8n/remote)
 *
 * IMPORTANT: All logging goes to stderr via logger.ts.
 * stdout is reserved for MCP JSON-RPC protocol messages (stdio mode only).
 */

import { BexioMcpServer } from "./server.js";
import { BexioClient } from "./bexio-client.js";
import { logger } from "./logger.js";
import { createHttpServer } from "./transports/http.js";

// Load environment variables from .env file (optional - for development)
// In MCPB bundles, env vars are already set by Claude Desktop
import("dotenv")
  .then((dotenv) => dotenv.config())
  .catch(() => {
    // dotenv not available - that's fine for MCPB bundles
  });

// Configuration from environment
const BEXIO_API_TOKEN = process.env["BEXIO_API_TOKEN"];
const BEXIO_BASE_URL =
  process.env["BEXIO_BASE_URL"] ?? "https://api.bexio.com/2.0";

interface ParsedArgs {
  mode: "stdio" | "http";
  host: string;
  port: number;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);

  // Parse --mode
  const modeIndex = args.indexOf("--mode");
  const modeArg = modeIndex !== -1 ? args[modeIndex + 1] : "stdio";
  const mode = modeArg === "http" ? "http" : "stdio";

  // Parse --host (for HTTP mode)
  const hostIndex = args.indexOf("--host");
  const host = hostIndex !== -1 ? args[hostIndex + 1] ?? "0.0.0.0" : "0.0.0.0";

  // Parse --port (for HTTP mode)
  const portIndex = args.indexOf("--port");
  const portStr = portIndex !== -1 ? args[portIndex + 1] : "8000";
  const port = parseInt(portStr, 10) || 8000;

  return { mode, host, port };
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
  const { mode, host, port } = parseArgs();

  // Validate environment
  validateEnvironment();

  // Create Bexio client
  const client = new BexioClient({
    baseUrl: BEXIO_BASE_URL,
    apiToken: BEXIO_API_TOKEN!,
  });

  if (mode === "stdio") {
    logger.info("Starting in stdio mode (for Claude Desktop)");

    // Create and initialize server with client
    const server = new BexioMcpServer();
    server.initialize(client);
    await server.run();
  } else if (mode === "http") {
    logger.info(`Starting in HTTP mode on ${host}:${port} (for n8n/remote access)`);

    // Create HTTP server
    await createHttpServer(client, { host, port });

    // Keep the process alive
    logger.info("HTTP server running. Press Ctrl+C to stop.");
  } else {
    logger.error(`Invalid mode: ${mode}. Use 'stdio' or 'http'.`);
    process.exit(1);
  }
}

// Run the server
main().catch((error: unknown) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
