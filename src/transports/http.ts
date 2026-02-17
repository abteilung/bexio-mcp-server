/**
 * HTTP Transport for Bexio MCP Server.
 * Provides HTTP/REST access for n8n and other remote clients.
 *
 * IMPORTANT: All logging uses logger (stderr), stdout reserved for nothing in HTTP mode.
 */

import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { createRequire } from "node:module";
import { logger } from "../logger.js";
import { BexioClient } from "../bexio-client.js";
import { getAllToolDefinitions, createHandlerRegistry } from "../tools/index.js";

const _require = createRequire(import.meta.url);
const { version: SERVER_VERSION } = _require("../package.json") as { version: string };

export interface HttpServerOptions {
  host: string;
  port: number;
}

/**
 * Creates an HTTP server for the MCP server.
 * This enables n8n and other HTTP clients to interact with the Bexio API.
 */
export async function createHttpServer(
  client: BexioClient,
  options: HttpServerOptions
): Promise<FastifyInstance> {
  const { host, port } = options;

  // SEC-01 / SEC-02: bearer-token auth
  const authToken = process.env["HTTP_AUTH_TOKEN"];
  if (!authToken) {
    logger.warn(
      "HTTP_AUTH_TOKEN is not set — all POST endpoints are unprotected. " +
        "Set HTTP_AUTH_TOKEN to require a bearer token for /mcp, /tools/call, and /n8n/call."
    );
  }

  /**
   * Fastify preHandler that enforces bearer-token auth on protected routes.
   * If HTTP_AUTH_TOKEN is not set, the check is skipped (backward compat).
   */
  const requireAuth: import("fastify").preHandlerHookHandler = async (
    request,
    reply
  ) => {
    if (!authToken) {
      // No token configured — allow all requests (backward compat, SEC-02)
      return;
    }
    const authHeader = request.headers["authorization"] ?? "";
    const expected = `Bearer ${authToken}`;
    if (authHeader !== expected) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "A valid Authorization: Bearer <token> header is required.",
      });
    }
  };

  // Create handler registry
  const handlerRegistry = createHandlerRegistry(client);

  const app: FastifyInstance = Fastify({
    logger: false, // We use our own logger
  });

  // Register CORS for browser/n8n access
  await app.register(cors, {
    origin: true,
  });

  logger.info("HTTP server initializing...");

  // Health check endpoint
  app.get("/", async () => {
    return {
      status: "running",
      server: "bexio-mcp-server",
      version: SERVER_VERSION,
      mode: "http",
    };
  });

  // List tools endpoint (GET for simplicity)
  app.get("/tools", async () => {
    const tools = getAllToolDefinitions();
    return { tools, count: tools.length };
  });

  // MCP-style JSON-RPC endpoint
  app.post<{
    Body: {
      jsonrpc?: string;
      id?: string | number;
      method: string;
      params?: unknown;
    } | Array<{
      jsonrpc?: string;
      id?: string | number;
      method: string;
      params?: unknown;
    }>;
  }>("/mcp", { preHandler: requireAuth }, async (request, reply) => {
    const body = request.body;

    // Handle batch requests
    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map((req) => handleJsonRpcRequest(req, handlerRegistry))
      );
      return results;
    }

    // Handle single request
    return handleJsonRpcRequest(body, handlerRegistry);
  });

  // Direct tool call endpoint (simpler than JSON-RPC)
  app.post<{
    Body: {
      name: string;
      arguments?: unknown;
    };
  }>("/tools/call", { preHandler: requireAuth }, async (request, reply) => {
    const toolName = request.body?.name;
    try {
      const { name, arguments: args = {} } = request.body;

      if (!name) {
        return reply.code(400).send({ error: "Tool name is required" });
      }

      const handler = handlerRegistry.get(name);
      if (!handler) {
        return reply.code(404).send({ error: `Unknown tool: ${name}` });
      }

      const result = await handler(args);
      return {
        success: true,
        data: result,
        tool: name,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return reply.code(500).send({
        success: false,
        error: errorMessage,
        tool: toolName || "unknown",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // n8n-specific endpoint for easier integration
  app.post<{
    Body: {
      tool: string;
      params?: unknown;
    };
  }>("/n8n/call", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { tool, params = {} } = request.body;

      if (!tool) {
        return reply.code(400).send({ error: "Tool name is required" });
      }

      const handler = handlerRegistry.get(tool);
      if (!handler) {
        return reply.code(404).send({ error: `Unknown tool: ${tool}` });
      }

      const result = await handler(params);
      return {
        success: true,
        data: result,
        tool,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return reply.code(500).send({
        success: false,
        error: errorMessage,
        tool: request.body?.tool || "unknown",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Start server
  try {
    await app.listen({ host, port });
    logger.info(`HTTP server listening on ${host}:${port}`);
    logger.info("Available endpoints:");
    logger.info("  GET  /          - Health check");
    logger.info("  GET  /tools     - List all tools");
    logger.info("  POST /mcp       - JSON-RPC endpoint");
    logger.info("  POST /tools/call - Direct tool call");
    logger.info("  POST /n8n/call  - n8n-friendly endpoint");
  } catch (error) {
    logger.error("Failed to start HTTP server:", error);
    throw error;
  }

  return app;
}

/**
 * Handle a JSON-RPC request.
 */
async function handleJsonRpcRequest(
  request: {
    jsonrpc?: string;
    id?: string | number;
    method: string;
    params?: unknown;
  },
  handlerRegistry: Map<string, (args: unknown) => Promise<unknown>>
): Promise<unknown> {
  const { id, method, params } = request;

  try {
    // Handle MCP protocol methods
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "bexio-mcp-server",
            version: SERVER_VERSION,
          },
        },
      };
    }

    if (method === "tools/list") {
      const tools = getAllToolDefinitions();
      return {
        jsonrpc: "2.0",
        id,
        result: { tools },
      };
    }

    if (method === "tools/call") {
      const callParams = params as { name: string; arguments?: unknown } | undefined;
      if (!callParams?.name) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Invalid params: name is required" },
        };
      }

      const handler = handlerRegistry.get(callParams.name);
      if (!handler) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown tool: ${callParams.name}` },
        };
      }

      const result = await handler(callParams.arguments ?? {});
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    // Unknown method
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: errorMessage },
    };
  }
}
