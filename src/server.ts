/**
 * Bexio MCP Server v2
 *
 * SDK 1.25.2 patterns:
 * - Import from "@modelcontextprotocol/sdk/server/mcp.js" (new path)
 * - Import StdioServerTransport from "@modelcontextprotocol/sdk/server/stdio.js"
 * - Server constructor takes (serverInfo, options) where options has capabilities
 * - Use server.connect(transport) to start
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { logger } from "./logger.js";

const SERVER_NAME = "bexio-mcp-server";
const SERVER_VERSION = "2.0.0";

export class BexioMcpServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });

    this.registerTools();
  }

  private registerTools(): void {
    // Register ping tool for SDK integration validation
    this.server.tool(
      "ping",
      "Test tool that returns pong - validates SDK integration",
      {},
      async () => {
        logger.debug("ping tool called");
        return {
          content: [
            {
              type: "text" as const,
              text: "pong",
            },
          ],
        };
      }
    );

    logger.info("Registered ping tool for SDK validation");
  }

  async run(): Promise<void> {
    logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);

    const transport = new StdioServerTransport();

    await this.server.connect(transport);

    logger.info("Server connected to stdio transport");
  }
}
