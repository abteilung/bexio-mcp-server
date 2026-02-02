# Coding Conventions

**Analysis Date:** 2026-02-01

## Naming Patterns

**Files:**
- Snake case for module names: `bexio-client.ts`, `http-server.ts`, `types.ts`
- Entry point named `index.ts`
- Server/service files follow pattern: `[service-name]-[type].ts`

**Classes:**
- PascalCase for class names: `BexioMCPServer`, `BexioClient`, `FastifyInstance`
- Classes instantiated with `new` keyword
- Private properties prefixed with underscore: `this.config`, `this.client`, `this.server`

**Functions:**
- camelCase for async and sync functions: `listOrders`, `getOrder`, `createOrder`, `advancedSearchContacts`
- Async functions return `Promise<T>` with explicit type annotation
- Private methods prefixed with `private` keyword
- Method prefixes indicate intent: `list*`, `get*`, `create*`, `search*`, `find*`, `make*`, `format*`

**Variables:**
- camelCase for constants and variables: `contactId`, `searchParams`, `errorMessage`, `offset`, `limit`
- Environment variables in UPPER_CASE: `BEXIO_BASE_URL`, `BEXIO_API_TOKEN`
- Schema parameters use snake_case in JSON: `contact_id`, `invoice_id`, `search_params`
- Parameters converted to camelCase in code: `params.contact_id` → `contactId`

**Types & Interfaces:**
- PascalCase for types: `BexioConfig`, `PaginationParams`, `ContactSearchParams`, `InvoiceCreate`
- Schema objects use `.Schema` suffix: `InvoicePositionSchema`, `OrderCreateSchema`, `ItemCreateSchema`
- Exported types use pattern `type [Name] = z.infer<typeof [Name]Schema>`
- Interfaces define object shapes; exported and documented

## Code Style

**Formatting:**
- ESLint configuration in `.eslintrc.json`
- Indent: 2 spaces (not tabs)
- Line length: Enforced by eslint rules
- Semicolons required (ESLint enforces)
- Double quotes for strings (consistent throughout)

**Linting:**
- ESLint enabled with TypeScript support (`@typescript-eslint`)
- Strict mode enforced: `noImplicitAny: true`, `noImplicitReturns: true`, `noImplicitThis: true`
- No unused variables/parameters: `noUnusedLocals: true`, `noUnusedParameters: true`
- No non-null assertions: `@typescript-eslint/no-non-null-assertion: error`
- No explicit `any`: `@typescript-eslint/no-explicit-any: warn`
- Run with: `npm run lint` or `npm run lint:fix`

**TypeScript Configuration:**
- Target: ES2022 modules (ESNext)
- Strict mode: Enabled
- Declaration maps and source maps generated
- Module resolution: node
- Comments preserved in output

## Import Organization

**Order:**
1. External library imports (npm packages): `import axios from 'axios'`, `import { z } from 'zod'`
2. Internal absolute imports: `import { BexioClient } from './bexio-client.js'`
3. Type-only imports grouped: `import type { BexioConfig } from './types.js'`
4. Side effects at top if any

**Path Aliases:**
- No path aliases configured
- Relative imports use `./` for same directory: `import { BexioClient } from './bexio-client.js'`
- File extensions required in ES modules: `.js` suffix on imports (TypeScript compilation adds this)

**Pattern Example:**
```typescript
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { z } from 'zod';
import { BexioClient } from './bexio-client.js';
import { BexioConfig } from './types.js';
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations with explicit error handling
- Error objects checked with `instanceof Error` before accessing `.message`
- Fallback to `String(error)` for unknown error types
- Custom error messages with context: `throw new Error(\`HTTP ${status}: ${message}\`)`
- Axios response interceptor pattern for centralized error handling
- Network errors caught separately: Network errors vs HTTP errors vs Request errors

**Example Pattern:**
```typescript
try {
  const result = await this.makeRequest('GET', endpoint);
  return result;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return reply.code(500).send({
    success: false,
    error: errorMessage
  });
}
```

**Validation:**
- Zod schemas used for runtime validation on all input parameters
- Schema `.parse()` throws on validation failure (not `.safeParse()`)
- Parameter schemas validate: required fields, positive integers, date formats, email/URL formats
- `.passthrough()` used to allow unknown fields in flexible objects

## Logging

**Framework:** Native `console` object or Fastify's built-in logger

**Patterns:**
- `console.error()` used for stderr output (info messages, not errors)
- Fastify logger configured with `level: 'info'`
- No structured logging library (JSON logging would require Winston or similar)
- Timestamps added manually with `new Date().toISOString()`

**When to Log:**
- Server startup messages: `console.error('Starting Bexio MCP Server...')`
- Route registration: `console.error('Routes registered...')`
- Error events via Fastify: `app.log.error(error)`

## Comments

**When to Comment:**
- Section separators for tool groups: `// ===== REMINDERS (Mahnungen) =====`
- Complex search/filter logic with explanatory comments
- Fallback behavior documented: `// Fallback: Search through multiple pages`
- Workarounds explained: `// Limit to first 5 contacts to avoid too many requests`
- Non-obvious logic: `// Add a completion marker to prevent infinite loops`

**JSDoc/TSDoc:**
- Not consistently used
- Type annotations sufficient for IDE support
- Function descriptions in tool definitions only (MCP schema descriptions)
- No @param or @return comments observed

## Function Design

**Size:**
- Range: 5-100+ lines depending on complexity
- Simple operations (property access, single API call): 3-5 lines
- Complex operations (multi-step searches, pagination loops): 30-50 lines
- Server request handlers: 50-100 lines common

**Parameters:**
- Named parameters using object destructuring: `{ limit, offset }`
- Optional parameters: `limit = 50` (defaults in function signature)
- Type-checked parameters via Zod: `ListOrdersParamsSchema.parse(args)`
- Spread used minimally, explicit parameter objects preferred

**Return Values:**
- Explicit `Promise<T>` types on async functions
- Union types for multiple possible returns: `Promise<unknown[]>`, `Promise<unknown>`
- Response objects with consistent structure: `{ data, error, timestamp, meta }`
- MCP responses follow format: `{ content: [{ type: 'text', text: '...' }] }`

**Example:**
```typescript
async listOrders(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest('GET', '/kb_order', params);
}
```

## Module Design

**Exports:**
- Class-based modules export single class: `export class BexioClient { }`
- Type modules export both schemas and inferred types
- Schemas exported separately from inferred types: `export const InvoiceCreateSchema`, `export type InvoiceCreate`
- Functions exported directly: `export async function createHttpServer() { }`

**Barrel Files:**
- Not used; types.ts contains all type definitions and schemas
- server.ts imports directly from types.ts

**Class Structure:**
- Private properties initialized in constructor
- Public methods for external API
- Private methods for internal operations
- Methods grouped logically: "Orders" section, "Contacts" section, etc.

**Configuration:**
- Injected via constructor: `constructor(config: BexioConfig)`
- No global state or singletons
- Axios client created once per BexioClient instance

---

*Convention analysis: 2026-02-01*
