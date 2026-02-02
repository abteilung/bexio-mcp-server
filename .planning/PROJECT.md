# Bexio MCP v2

## What This Is

A Model Context Protocol (MCP) server that connects Claude Desktop to Bexio, the Swiss accounting and invoicing platform. Users can manage contacts, invoices, orders, quotes, and more through natural language conversation with Claude. V2 focuses on one-click installation and complete Bexio API coverage.

## Core Value

Enable anyone — technical or non-technical — to connect Claude Desktop to their Bexio accounting system with zero friction. If installation isn't dead simple, nothing else matters.

## Requirements

### Validated

<!-- Capabilities inherited from v1 that already work -->

- ✓ Orders: list, get, create, search — existing
- ✓ Contacts: list, get, search, advanced search, find by number/name — existing
- ✓ Quotes: list, get, create, search, issue, accept, decline — existing
- ✓ Invoices: list, get, create, search, issue, cancel, send, copy — existing
- ✓ Payments: list, get, create, delete — existing
- ✓ Reminders: list, get, create, delete, send — existing
- ✓ Deliveries: list, get, issue — existing
- ✓ Items/Articles: list, get, create — existing
- ✓ Taxes: list, get (v3.0 API) — existing
- ✓ Comments: list, get, create — existing
- ✓ Contact Relations: CRUD + search — existing
- ✓ Reports: revenue, customer revenue, invoice status, overdue — existing
- ✓ Document conversions: quote→order, quote→invoice, order→invoice, order→delivery — existing
- ✓ HTTP mode for n8n/remote access — existing

### Active

<!-- v2 scope: what we're building -->

- [ ] MCPB bundle for one-click installation (double-click .mcpb to install)
- [ ] Update to latest @modelcontextprotocol/sdk (from ^0.5.0 to ^1.25+)
- [ ] Modular code structure (split server.ts into tool modules)
- [ ] manifest.json for MCPB packaging
- [ ] npm package publication (@bexio/mcp-server)
- [ ] Research and implement missing Bexio API endpoints
- [ ] MCP Registry submission for discoverability
- [ ] Backward-compatible tool names (existing Claude conversations keep working)

### Out of Scope

- Mobile app — web/desktop only for v2
- OAuth flow — Personal Access Token is sufficient and simpler
- Real-time webhooks from Bexio — MCP is request/response, not push
- Multi-company support — single Bexio account per installation
- Caching layer — stateless design for simplicity

## Context

**Why v2 now:**
- MCP ecosystem has matured; MCPB bundles are now the standard for distribution
- v1 installation requires technical knowledge (Node.js, npm, JSON editing)
- Original v1 creator indicated the Bexio API coverage is incomplete
- Latest MCP SDK (1.25+) has significant improvements over v1's 0.5.0

**Existing codebase:**
- Located at `mcp_bexio-main-v1/` in this directory
- 4,136 lines of TypeScript across 5 files
- 56 tools already implemented (see .planning/codebase/INTEGRATIONS.md)
- Dual transport: stdio (Claude Desktop) and HTTP (n8n/remote)
- Zod validation on all tool parameters

**Target users:**
- Non-technical: Accountants, business owners using Claude Desktop
- Technical: Developers building Bexio integrations, n8n workflow creators

**Bexio API:**
- Base URL: https://api.bexio.com/2.0 (v3.0 for taxes)
- Auth: Bearer token (Personal Access Token)
- Rate limiting via HTTP headers
- Pagination: max 2000 items per request

## Constraints

- **Tech stack**: TypeScript — best MCP SDK support, existing codebase
- **SDK version**: @modelcontextprotocol/sdk ^1.25+ — current stable with MCPB support
- **Node.js**: >=18.0.0 — ships with Claude Desktop
- **Distribution**: MCPB primary, npm secondary, GitHub for source
- **Backward compatibility**: Tool names must not change (break existing conversations)
- **Dependencies**: Minimize — axios, zod, SDK core only; remove fastify from core bundle

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep TypeScript | First-class MCP SDK support, existing code | — Pending |
| MCPB as primary distribution | One-click install requirement | — Pending |
| Modular tool structure | 2,418-line server.ts is unmaintainable | — Pending |
| Keep HTTP mode | n8n users need it, original requirement | — Pending |
| Remove HTTP from core MCPB | Smaller bundle, stdio-only for Claude | — Pending |
| HTTP as separate npm install | Optional for those who need it | — Pending |

---
*Last updated: 2026-02-01 after initialization*
