# Architecture

**Analysis Date:** 2026-02-01

## Pattern Overview

**Overall:** Model Context Protocol (MCP) Server with Bexio API Gateway

**Key Characteristics:**
- **MCP Server Pattern**: Implements Model Context Protocol specification for Claude Desktop and remote MCP clients
- **API Gateway/Adapter Pattern**: Wraps Bexio REST API (v2.0) with MCP-compliant tool interface
- **Dual Transport Layer**: Supports both stdio (for Claude Desktop) and HTTP (for remote access)
- **Tool-Based RPC**: All API operations exposed as discrete, schema-validated tools with Zod
- **Request/Response Wrapping**: Abstracts Bexio response format into MCP-compliant content format

## Layers

**Transport Layer:**
- Purpose: Provides communication channel between MCP client and server
- Location: `src/index.ts`, `src/server.ts` (lines 90-110), `src/http-server.ts`
- Contains: Stdio transport via `@modelcontextprotocol/sdk`, Fastify HTTP server with CORS
- Depends on: @modelcontextprotocol/sdk, fastify, @fastify/cors
- Used by: MCP clients (Claude Desktop or HTTP clients)

**Tool Definition & Dispatch Layer:**
- Purpose: Defines all available tools and routes tool calls to handlers
- Location: `src/server.ts` (getToolDefinitions, handleToolCall methods)
- Contains: 70+ tool definitions with JSON schema, switch statement routing
- Depends on: Zod schemas for parameter validation
- Used by: MCP transport, HTTP server handlers

**API Client Layer:**
- Purpose: Wraps Bexio REST API with typed method interfaces
- Location: `src/bexio-client.ts`
- Contains: BexioClient class with ~40 async methods (listOrders, getInvoice, searchContacts, etc.)
- Depends on: axios for HTTP requests, types.ts for interfaces
- Used by: Server layer tool handlers

**Type Definition & Validation Layer:**
- Purpose: Schema definitions for API contracts and tool parameters
- Location: `src/types.ts`
- Contains: Zod schemas for entities (InvoiceCreate, OrderCreate, SearchCriteria), parameter schemas for all tools
- Depends on: zod library
- Used by: All layers (client, server, handlers)

**Configuration Layer:**
- Purpose: Environment-based setup
- Location: `src/index.ts` (lines 3-24)
- Contains: BEXIO_API_TOKEN, BEXIO_BASE_URL from environment
- Depends on: dotenv
- Used by: BexioClient initialization

## Data Flow

**HTTP API Request to Tool Result:**

1. **MCP Client** sends tool call request (stdio or HTTP)
2. **Transport Handler** (stdio in `server.ts` line 118 or HTTP in `http-server.ts` line 65)
3. **Tool Dispatcher** (`handleToolCall`, `server.ts` line 1832) routes by tool name
4. **Parameter Validation** via Zod schema (e.g., line 1835: `ListOrdersParamsSchema.parse(args)`)
5. **BexioClient Method Call** (e.g., `listOrders()` in `bexio-client.ts`)
6. **Axios HTTP Request** to Bexio API (baseURL: `https://api.bexio.com/2.0`)
7. **Response Formatting** via `formatResponseData()` (lines 1622-1679)
8. **MCP Content Wrapping** with completion marker (line 131: `'--- RESPONSE COMPLETE ---'`)
9. **Return to MCP Client** as text content in standard MCP format

**State Management:**
- **Stateless**: No in-memory state between requests. Each tool call is independent.
- **Session**: Authentication handled via bearer token in Axios header (line 22)
- **Pagination**: Managed via limit/offset parameters passed through client methods

## Key Abstractions

**BexioClient:**
- Purpose: Encapsulates all Bexio API communication
- Examples: `src/bexio-client.ts` lines 13-56 (constructor), 60-71 (Orders), 73-227 (Contacts), 286-330 (Invoices)
- Pattern: Private axios instance with interceptors, public async methods for each endpoint, error handling in interceptor

**Tool Definition Schema:**
- Purpose: Exposes tool metadata to MCP clients for UI rendering and parameter validation
- Examples: `src/server.ts` lines 158-264 (Orders), 266-407 (Contacts), 442-738 (Invoices)
- Pattern: Tool object with name, description, inputSchema (JSON Schema format)

**Response Formatter:**
- Purpose: Converts raw API responses into MCP-compliant format with metadata
- Examples: `src/server.ts` lines 1622-1679, 1681-1702, 1730-1830
- Pattern: Detects tool type prefix (list_, get_, create_), wraps data with standard metadata envelope, adds completion marker

**Parameter Schemas:**
- Purpose: Validates and types tool input at boundary
- Examples: `src/types.ts` lines 160-200 (tool parameter schemas using Zod)
- Pattern: Each tool has corresponding `*ParamsSchema` for input validation

## Entry Points

**Stdio Mode Entry:**
- Location: `src/index.ts` (lines 26-33)
- Triggers: `npm run start:stdio` or `node dist/index.js --mode stdio`
- Responsibilities: Initialize BexioClient, create BexioMCPServer, connect via StdioServerTransport, listen for tool calls

**HTTP Mode Entry:**
- Location: `src/index.ts` (lines 35-42)
- Triggers: `npm run start:http` or `node dist/index.js --mode http --host 0.0.0.0 --port 8000`
- Responsibilities: Initialize BexioClient, create BexioMCPServer, create Fastify HTTP server, register routes

**HTTP Routes (when in HTTP mode):**
- `GET /`: Health check (line 24-30)
- `POST /stream`: Tool list for n8n compatibility (line 33-51)
- `GET /tools`: List available tools (line 54-57)
- `POST /tools/call`: Universal tool invocation endpoint (line 60-93)
- `POST /n8n/call`: n8n-specific tool endpoint (line 96-127)

## Error Handling

**Strategy:** Three-level error handling with descriptive messages propagated to client

**Patterns:**

1. **Axios Interceptor** (`src/bexio-client.ts` lines 30-41):
   - Catches HTTP errors (response, request, request-config)
   - Extracts meaningful error messages from Bexio response
   - Transforms to Error with formatted message

2. **Tool Handler Try-Catch** (`src/server.ts` lines 118-153):
   - Catches errors from parameter validation or tool execution
   - Formats as MCP error response with isError flag
   - Includes '--- RESPONSE COMPLETE ---' marker for client parsing

3. **HTTP Endpoint Try-Catch** (`src/http-server.ts` lines 66-92):
   - Catches errors from tool call or formatting
   - Returns HTTP 500 with error details
   - Includes timestamp for debugging

## Cross-Cutting Concerns

**Logging:**
- Console.error for startup messages and HTTP server logs
- Fastify logger at 'info' level in HTTP mode
- No persistent logging configured

**Validation:**
- All tool inputs validated via Zod schemas before handler execution
- Examples: `SearchContactsParamsSchema.parse(args)` at line 1871
- Validation errors throw before API calls

**Authentication:**
- Bearer token authentication via BEXIO_API_TOKEN env var
- Injected into Axios default headers at client init (line 22)
- Required at startup (index.ts lines 16-19)

**Pagination:**
- Limit/offset pattern for list operations
- Default limit: 50 items, offset: 0
- Multi-page iteration implemented in BexioClient for full-fetch operations (e.g., `listAllInvoices` lines 260-284, `findContactByName` lines 165-227)

**Response Formatting:**
- Tool name-based detection of response type (list_, get_, create_, etc.)
- Data wrapped with metadata envelope (source, timestamp, tool name, counts)
- Completion marker appended to prevent infinite loops in AI clients

---

*Architecture analysis: 2026-02-01*
