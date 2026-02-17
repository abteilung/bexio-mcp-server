/**
 * Bexio MCP Server v2
 *
 * SDK 1.25.2 patterns:
 * - Import from "@modelcontextprotocol/sdk/server/mcp.js"
 * - McpServer.tool() for individual tool registration
 * - Use server.connect(transport) to start
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "node:module";
import { z } from "zod";
import { logger } from "./logger.js";
import { BexioClient } from "./bexio-client.js";
import { getAllToolDefinitions, getHandler } from "./tools/index.js";
import { formatSuccessResponse, formatErrorResponse, McpError } from "./shared/index.js";
import { registerUIResources } from "./ui-resources.js";

const _require = createRequire(import.meta.url);
const { version: SERVER_VERSION } = _require("./package.json") as { version: string };
const SERVER_NAME = "bexio-mcp-server";

export class BexioMcpServer {
  private server: McpServer;
  private client: BexioClient | null = null;

  constructor() {
    this.server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });
  }

  /** Initialize with Bexio client and register tools */
  initialize(client: BexioClient): void {
    this.client = client;
    this.registerTools();
    registerUIResources(this.server, client);
    logger.info(`Initialized with ${getAllToolDefinitions().length} tools + 3 UI tools`);
  }

  private registerTools(): void {
    // Register ping tool for SDK validation
    this.server.tool(
      "ping",
      "Test tool that returns pong - validates SDK integration",
      {},
      async () => {
        logger.debug("ping tool called");
        return {
          content: [{ type: "text" as const, text: "pong" }],
        };
      }
    );

    // Register all domain tools
    const definitions = getAllToolDefinitions();

    for (const def of definitions) {
      const handler = getHandler(def.name);
      if (!handler) {
        logger.warn(`No handler found for tool: ${def.name}`);
        continue;
      }

      // SDK 1.25.2 expects a ZodRawShape (plain object with Zod schemas)
      // Use empty shape and let our handlers do the validation
      this.server.tool(
        def.name,
        def.description || "",
        {},
        async (args) => {
          if (!this.client) {
            return formatErrorResponse(
              McpError.internal("Bexio client not initialized")
            );
          }

          try {
            const result = await handler(this.client, args);
            return formatSuccessResponse(def.name, result);
          } catch (error) {
            if (error instanceof McpError) {
              return formatErrorResponse(error);
            }
            if (error instanceof z.ZodError) {
              return formatErrorResponse(
                McpError.validation(error.message, { issues: error.issues })
              );
            }
            return formatErrorResponse(
              error instanceof Error
                ? error
                : new Error(String(error))
            );
          }
        }
      );

      // The SDK's objectFromShape({}) produces a z4mini.object({}) that strips
      // all unknown keys during validation, so our handlers receive {} instead of
      // the actual args. Replace with a Zod v3 passthrough schema so all keys are
      // preserved and passed through to the handler's own Zod validation logic.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.server as any)._registeredTools[def.name].inputSchema = z.object({}).passthrough();
    }

    // Override tools/list to serve real inputSchemas from toolDefinitions.
    // The SDK always emits EMPTY_OBJECT_JSON_SCHEMA when tools are registered
    // with an empty Zod shape ({}). We bypass this by patching the handler on
    // the underlying Server after registration so clients see the correct schema.
    const defMap = new Map(definitions.map((d) => [d.name, d]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registeredTools = (this.server as any)._registeredTools as Record<
      string,
      { enabled: boolean; title?: string; description?: string; annotations?: unknown; execution?: unknown; _meta?: unknown }
    >;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.server as any).server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: Object.entries(registeredTools)
        .filter(([, t]) => t.enabled)
        .map(([name, t]) => ({
          name,
          title: t.title,
          description: t.description,
          inputSchema: defMap.get(name)?.inputSchema ?? { type: "object", properties: {} },
          annotations: t.annotations,
          execution: t.execution,
          _meta: t._meta,
        })),
    }));

    logger.info(`Registered ${definitions.length + 1} tools (including ping)`);
  }

  async run(): Promise<void> {
    logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info("Server connected to stdio transport");
  }
}
