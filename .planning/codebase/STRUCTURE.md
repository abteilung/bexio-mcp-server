# Codebase Structure

**Analysis Date:** 2026-02-01

## Directory Layout

```
mcp_bexio-main-v1/
├── src/                          # Main source code (4,136 lines total)
│   ├── index.ts                  # Entry point, mode selection, initialization
│   ├── server.ts                 # MCP server, tool definitions, dispatch
│   ├── bexio-client.ts          # Bexio API wrapper, HTTP client
│   ├── types.ts                 # Type definitions, Zod schemas
│   └── http-server.ts           # Fastify HTTP server, routes
├── dist/                         # Compiled JavaScript (generated)
├── config/                       # Configuration files
│   └── mcp/
│       └── cursor_mcp_config.json  # Cursor IDE integration config
├── .eslintrc.json               # ESLint configuration
├── tsconfig.json                # TypeScript configuration
├── vitest.config.ts             # Test runner configuration
├── package.json                 # Dependencies, scripts
├── package-lock.json            # Lockfile
├── env.example                  # Environment variables template
├── Dockerfile                   # Docker image
├── docker-compose.yml           # Multi-container setup
├── docker-compose.both.yml      # Alternative compose config
├── docker-compose.portainer.yml # Portainer support
├── run.sh                       # Shell script wrapper for startup
├── test_*.sh                    # Test scripts
├── README.md                    # Project documentation
└── LICENSE                      # MIT license
```

## Directory Purposes

**src/**
- Purpose: All TypeScript source code
- Contains: Entry point, MCP server implementation, Bexio API client, type definitions, HTTP server
- Key files: `server.ts` (largest, 2,418 lines), `bexio-client.ts` (901 lines)

**dist/**
- Purpose: Compiled JavaScript output
- Contains: Transpiled .js files, source maps, declaration files
- Generated: Yes (via `npm run build`)
- Committed: No (in .gitignore)

**config/**
- Purpose: Tool-specific configuration
- Contains: `cursor_mcp_config.json` for Cursor IDE integration
- Generated: No
- Committed: Yes

## Key File Locations

**Entry Points:**
- `src/index.ts`: Main entry point. Parses CLI args (--mode stdio|http, --host, --port), loads env vars, initializes BexioClient and server, calls runStdioMode() or runHttpMode()

**Configuration:**
- `src/index.ts` (lines 13-24): Reads BEXIO_BASE_URL and BEXIO_API_TOKEN from environment
- `env.example`: Template for required environment variables
- `tsconfig.json`: TypeScript compiler settings (target: ES2022, strict mode enabled)

**Core Logic:**
- `src/server.ts`: BexioMCPServer class (lines 90-2418). Contains 70+ tool definitions, tool call dispatcher, response formatting. All business logic for tool availability and execution lives here.
- `src/bexio-client.ts`: BexioClient class (lines 13-901). Wraps Bexio API with axios, ~40 async methods for all operations (orders, invoices, contacts, quotes, items, deliveries, payments, reminders, users, comments, relations, reports)
- `src/types.ts`: Zod schemas for validation and TypeScript types. Parameter schemas for every tool, entity schemas (InvoiceCreate, OrderCreate, ItemCreate), search parameters.

**HTTP Server:**
- `src/http-server.ts`: Fastify HTTP server setup (lines 1-150). Health endpoint, tool list endpoint, universal /tools/call endpoint, n8n-specific /n8n/call endpoint, CORS support

**Testing:**
- `vitest.config.ts`: Vitest configuration with v8 coverage, excludes node_modules, dist, test files themselves
- `package.json` (lines 17-18): Test scripts: `npm test`, `npm run test:coverage`

## Naming Conventions

**Files:**
- Kebab-case for source files: `bexio-client.ts`, `http-server.ts`
- Index file: `index.ts` for entry points
- Config files: Dot-prefix for tool configs: `.eslintrc.json`, `.prettierrc` (expected), `.env` (runtime)
- Compiled output: Mirror src/ structure in dist/ with .js extensions

**Directories:**
- Lowercase, singular or descriptive: `src/`, `dist/`, `config/`, `node_modules/`
- Sub-directories use slash notation: `config/mcp/`

**Classes:**
- PascalCase: `BexioMCPServer`, `BexioClient`
- Location: One per file typically (server.ts, bexio-client.ts)

**Methods:**
- camelCase: `listOrders()`, `getInvoice()`, `searchContacts()`, `handleToolCall()`
- Private methods use leading underscore: `_makeRequest()`, `_ensureCompleteResponse()`

**Tool Names:**
- snake_case: `list_orders`, `get_invoice`, `create_quote`, `search_invoices_by_customer`, `issue_invoice`
- Pattern: `{verb}_{resource}` or `{verb}_{resource}_{qualifier}`
- Verbs: list, get, create, search, update, delete, issue, accept, decline, send, mark, copy

**Variables:**
- Local variables: camelCase: `bexioClient`, `orderData`, `searchCriteria`
- Constants: UPPER_SNAKE_CASE: `BEXIO_BASE_URL`, `BEXIO_API_TOKEN`
- Type parameters: PascalCase with T prefix: `T`, `T = unknown`

**Types & Interfaces:**
- PascalCase: `BexioConfig`, `ContactSearchParams`, `InvoiceSearchParams`, `SearchCriteria`
- Schema suffixes: `*Schema` for Zod objects: `InvoicePositionSchema`, `ListOrdersParamsSchema`
- Type suffix: `*Create` for creation payloads: `InvoiceCreate`, `OrderCreate`, `ItemCreate`

## Where to Add New Code

**New Bexio API Endpoint:**
1. Add method to BexioClient: `src/bexio-client.ts` (follow pattern around line 60-70 for simple GET, 242-284 for complex multi-page operations)
2. Add parameter schema to types.ts if needed: `export const Get*ParamsSchema = z.object({...})`
3. Add tool definition to BexioMCPServer.getToolDefinitions(): `src/server.ts` (lines 157-1619), include name, description, inputSchema
4. Add case handler in BexioMCPServer.handleToolCall(): `src/server.ts` (lines 1832-2412)
5. Add entry to BexioMCPServer.getDataKey() map: `src/server.ts` (lines 1730-1830)

**New Tool Feature (non-API):**
1. Define schema in `src/types.ts` (add *ParamsSchema)
2. Add tool definition in `src/server.ts` getToolDefinitions()
3. Implement logic in `src/server.ts` handleToolCall() switch statement
4. If requires new client method, add to BexioClient in `src/bexio-client.ts`

**New Component/Module:**
- Business logic modules: Add to `src/` directory with clear names
- Follow existing pattern: Export classes/functions, use Zod for validation
- Import in server.ts or bexio-client.ts as needed

**Utilities/Helpers:**
- Shared helpers: Create new file `src/utils-{name}.ts` or `src/{name}-utils.ts`
- Format helpers: Consider adding to `src/server.ts` if formatting-related (already has formatResponseData, getDataKey, determineHasMore)
- API helpers: Add to BexioClient in `src/bexio-client.ts` (private methods like makeRequest)

**Tests:**
- Co-located with source: Vitest looks for `*.test.ts` and `*.spec.ts` files
- Create alongside source: `src/bexio-client.test.ts` for testing `src/bexio-client.ts`
- Excluded from build: tsconfig.json line 40-41 excludes **/*.test.ts and **/*.spec.ts from dist

**Configuration Changes:**
- Environment variables: Document in `env.example`, read in `src/index.ts`
- Tool config: Add to `config/` directory with descriptive names
- Build/transpile: Modify `tsconfig.json`
- Linting: Modify `.eslintrc.json`

## Special Directories

**node_modules/**
- Purpose: npm package dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in .gitignore)

**dist/**
- Purpose: Compiled JavaScript output
- Generated: Yes (via `npm run build` which runs tsc)
- Committed: No (in .gitignore)

**config/mcp/**
- Purpose: MCP configuration for IDEs and tools
- Contains: `cursor_mcp_config.json` for Cursor integration
- Generated: No
- Committed: Yes

**.env**
- Purpose: Runtime environment variables (secrets, API tokens)
- Generated: No (must be manually created from env.example)
- Committed: No (in .gitignore)
- Required: Yes for startup

## Source File Details

**src/index.ts (76 lines):**
- Loads .env via dotenv
- Reads BEXIO_BASE_URL and BEXIO_API_TOKEN
- Defines runStdioMode() and runHttpMode() async functions
- Parses CLI args: --mode (stdio|http), --host, --port
- Routes to appropriate startup function

**src/server.ts (2,418 lines):**
- BexioMCPServer class definition (lines 90-2418)
- Constructor: Initializes MCP Server with capabilities (lines 94-109)
- setupToolHandlers(): Sets up MCP request handlers (lines 111-154)
- getToolDefinitions(): Returns array of 70+ Tool objects (lines 156-1620)
- formatResponseData(): Wraps API responses for MCP (lines 1622-1679)
- handleToolCall(): Dispatcher switch for all tools (lines 1832-2412)
- Helper methods: ensureCompleteResponse, determineHasMore, getDataKey

**src/bexio-client.ts (901 lines):**
- BexioClient class definition (lines 13-901)
- Constructor: Creates axios instance with Bearer auth (lines 17-42)
- Private makeRequest(): Generic HTTP request wrapper (lines 44-57)
- Public methods organized by resource:
  - Orders: listOrders, getOrder, createOrder (lines 60-70)
  - Contacts: listContacts, getContact, searchContacts, findContactByNumber, findContactByName (lines 73-227)
  - Quotes: listQuotes, getQuote, createQuote (lines 230-240)
  - Invoices: listInvoices, getInvoice, createInvoice, listAllInvoices, searchInvoices (lines 243-330+)
  - And many more resources...

**src/types.ts (592 lines):**
- Type definitions and Zod schemas
- Interfaces: BexioConfig, BexioApiResponse, PaginationParams, ContactSearchParams, InvoiceSearchParams
- Entity schemas: InvoicePositionSchema, InvoiceCreateSchema, OrderCreateSchema, ItemCreateSchema, SearchCriteriaSchema
- Tool parameter schemas: ListOrdersParamsSchema, GetOrderParamsSchema, CreateOrderParamsSchema, and 60+ more

**src/http-server.ts (150 lines):**
- createHttpServer() async function
- Fastify initialization with logger (lines 10-14)
- CORS registration (lines 16-19)
- Routes:
  - GET / (health check)
  - POST /stream (tool list for n8n)
  - GET /tools (tool definitions)
  - POST /tools/call (universal tool call)
  - POST /n8n/call (n8n-specific)
- Server startup and error handling

---

*Structure analysis: 2026-02-01*
