# External Integrations

**Analysis Date:** 2026-02-01

## APIs & External Services

**Bexio REST API:**
- Primary business API for Swiss accounting/invoicing platform
  - SDK/Client: Custom `BexioClient` class in `src/bexio-client.ts` using axios
  - Auth: Bearer token via `BEXIO_API_TOKEN` environment variable
  - Base URL: `https://api.bexio.com/2.0` (configurable via `BEXIO_BASE_URL`)
  - API Versions: v2.0 (primary) and v3.0 (for taxes endpoint only, see `src/bexio-client.ts` lines 320-343)

**Endpoints Exposed:**
- Contacts (CRUD): `/contact`, `/contact/{id}`, `/contact/search`
- Invoices (CRUD + actions): `/kb_invoice`, `/kb_invoice/{id}`, `/kb_invoice/search`, `/kb_invoice/{id}/issue`, `/kb_invoice/{id}/cancel`, `/kb_invoice/{id}/send`, `/kb_invoice/{id}/mark_as_sent`, `/kb_invoice/{id}/revert_to_draft`, `/kb_invoice/{id}/copy`
- Quotes (CRUD + actions): `/kb_offer`, `/kb_offer/{id}`, `/kb_offer/search`, `/kb_offer/{id}/issue`, `/kb_offer/{id}/accept`, `/kb_offer/{id}/decline`, `/kb_offer/{id}/reissue`, `/kb_offer/{id}/mark_as_sent`, `/kb_offer/{id}/send`, `/kb_offer/{id}/copy`, `/kb_offer/{id}/create_order`, `/kb_offer/{id}/create_invoice`
- Orders (CRUD + actions): `/kb_order`, `/kb_order/{id}`, `/kb_order/search`, `/kb_order/{id}/create_delivery`, `/kb_order/{id}/create_invoice`
- Reminders (CRUD + actions): `/kb_invoice/{id}/reminder`, `/kb_invoice/{id}/reminder/{id}`, `/kb_invoice/{id}/reminder/{id}/send`, `/kb_invoice/{id}/reminder/{id}/mark_as_sent`, `/kb_invoice/{id}/reminder/{id}/mark_as_unsent`, `/kb_invoice/reminder/search`
- Payments (CRUD): `/kb_invoice/{id}/payment`, `/kb_invoice/{id}/payment/{id}`
- Deliveries (CRUD + actions): `/kb_delivery`, `/kb_delivery/{id}`, `/kb_delivery/{id}/issue`
- Items/Articles (CRUD): `/article`, `/article/{id}`
- Taxes (read-only via v3.0 API): `https://api.bexio.com/3.0/taxes`, `https://api.bexio.com/3.0/taxes/{id}`
- Reports: `/reports/revenue`, `/reports/customer_revenue`, `/reports/invoice_status`, `/reports/overdue_invoices`
- Comments (CRUD): `/comments`, `/comments/{id}`
- Contact Relations (CRUD + search): `/contact_relation`, `/contact_relation/{id}`, `/contact_relation/search`
- Document Templates (read): `/document_template`

## Data Storage

**Databases:**
- Not applicable - MCP server is stateless, all data persists in Bexio cloud
- No local database required; all operations are API calls to Bexio

**File Storage:**
- Not applicable - no local file storage operations

**Caching:**
- None - all requests go directly to Bexio API with 30-second timeout configured in `src/bexio-client.ts` line 26

## Authentication & Identity

**Auth Provider:**
- Custom Bearer Token - OAuth not used
  - Implementation: HTTP Bearer token in Authorization header (see `src/bexio-client.ts` lines 20-25)
  - Token source: `BEXIO_API_TOKEN` environment variable
  - Required: Yes, application exits if token missing (`src/index.ts` lines 16-19)
  - Header format: `Authorization: Bearer ${config.apiToken}`

## Monitoring & Observability

**Error Tracking:**
- None - custom error handling with try/catch blocks
- Errors thrown from `src/bexio-client.ts` include HTTP status codes and response messages (lines 32-40)

**Logs:**
- Console-based logging (stderr for startup messages, info level)
- Fastify HTTP mode includes structured logging with configurable levels (see `src/http-server.ts` lines 11-13)
- No external log aggregation service

## CI/CD & Deployment

**Hosting:**
- Docker containers supported (see `Dockerfile`, `docker-compose.yml`)
- Can run on any platform supporting Node.js >= 18.0.0
- Two modes:
  - **Stdio:** For Claude Desktop integration (standard deployment)
  - **HTTP:** For remote/containerized/n8n integration (alternative deployment)

**CI Pipeline:**
- GitLab CI configured in `.gitlab-ci.yml`
- Not examined in detail (external CI system)

## Environment Configuration

**Required env vars:**
- `BEXIO_API_TOKEN` - Bexio API authentication token (no default, app exits if missing)

**Optional env vars:**
- `BEXIO_BASE_URL` - Defaults to `https://api.bexio.com/2.0`
- `NODE_ENV` - Sets environment (referenced in `src/index.ts` but not enforced)

**Secrets location:**
- `.env` file (created from `env.example` template)
- Environment variables passed to process
- Should never be committed (listed in `.gitignore`)

## Webhooks & Callbacks

**Incoming:**
- Not supported - MCP server is request-only, does not expose webhook endpoints for receiving Bexio events

**Outgoing:**
- Not implemented - MCP server makes HTTP requests to Bexio API but does not trigger external webhooks

## Transport Protocols

**Stdio Mode:**
- Default mode for Claude Desktop
- Uses `StdioServerTransport` from `@modelcontextprotocol/sdk` (see `src/index.ts` line 26)
- Bidirectional JSON-RPC communication over stdin/stdout

**HTTP Mode:**
- Optional mode for remote deployment (activated with `--mode http`)
- Fastify server listening on configurable host/port (default 0.0.0.0:8000)
- RESTful endpoints at:
  - `GET /` - Health check
  - `GET /tools` - List available tools
  - `POST /stream` - Stream tools (for n8n compatibility)
  - `POST /call-tool` - Execute a tool (see `src/http-server.ts` for implementation)

---

*Integration audit: 2026-02-01*
