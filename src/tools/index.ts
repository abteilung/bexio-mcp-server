/**
 * Tool aggregation module.
 * Single import point for all domain tools.
 *
 * Pattern for adding new domains:
 * 1. Create tools/{domain}/definitions.ts
 * 2. Create tools/{domain}/handlers.ts
 * 3. Create tools/{domain}/index.ts
 * 4. Import and add to arrays below
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { BexioClient } from "../bexio-client.js";

// Domain imports
import * as contacts from "./contacts/index.js";

// Type for handler functions
export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

// Aggregate all tool definitions
const allDefinitions: Tool[] = [
  ...contacts.toolDefinitions,
  // Add more domains here as they are migrated:
  // ...invoices.toolDefinitions,
  // ...orders.toolDefinitions,
  // ...quotes.toolDefinitions,
];

// Aggregate all handlers
const allHandlers: Record<string, HandlerFn> = {
  ...contacts.handlers,
  // Add more domains here as they are migrated:
  // ...invoices.handlers,
  // ...orders.handlers,
  // ...quotes.handlers,
};

/** Get all tool definitions for registration */
export function getAllToolDefinitions(): Tool[] {
  return allDefinitions;
}

/** Get handler for a specific tool */
export function getHandler(toolName: string): HandlerFn | undefined {
  return allHandlers[toolName];
}

/** Create handler registry bound to a client */
export function createHandlerRegistry(
  client: BexioClient
): Map<string, (args: unknown) => Promise<unknown>> {
  const registry = new Map<string, (args: unknown) => Promise<unknown>>();

  for (const [name, handler] of Object.entries(allHandlers)) {
    registry.set(name, (args: unknown) => handler(client, args));
  }

  return registry;
}
