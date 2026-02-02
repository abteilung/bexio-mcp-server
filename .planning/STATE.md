# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Enable anyone to connect Claude Desktop to their Bexio accounting system with zero friction
**Current focus:** Phase 3 - Projects & Accounting (in progress)

## Current Position

Phase: 3 of 6 (Projects & Accounting)
Plan: 3 of 4 in current phase
Status: **In Progress** - 23 new tools (151 total)
Last activity: 2026-02-01 -- Completed 03-03-PLAN.md (Time Tracking)

Progress: [########----------] 43%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 7.1 min
- Total execution time: 57 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-migration | 3/3 | 26 min | 8.7 min |
| 02-reference-data-banking | 3/3 | 21 min | 7.0 min |
| 03-projects-accounting | 2/4 | 10 min | 5.0 min |

**Recent Trend:**
- Last 5 plans: 02-01 (7 min), 02-02 (6 min), 02-03 (8 min), 03-01 (5 min), 03-03 (5 min)
- Trend: Consistent execution times, established patterns enabling faster delivery

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 6 phases derived from 67 requirements (Quick depth compression)
- [Roadmap]: FOUND-03/FOUND-04 assigned to Phase 5 (packaging after all tools)
- [Roadmap]: Payroll tools (PAY-*) conditional on Bexio module availability
- [Planning]: v1 has 83 tools (not 56 as initially documented) - updated all plans
- [Planning]: Zod pinned to exactly 3.22.5 (not ^3.22.0) to avoid v4 issues
- [Planning]: Wave structure: SDK (1) -> Architecture (2) -> Tools (3)
- [01-01]: SDK import from /server/mcp.js (not /server/index.js) per 1.25.2 convention
- [01-01]: All logging via console.error() to preserve stdout for JSON-RPC
- [01-02]: McpResponse needs index signature for SDK 1.25.2 compatibility
- [01-02]: Tool definitions use empty Zod schema; validation in handlers
- [01-03]: All 83 tool names preserved exactly from v1 for backward compatibility
- [01-03]: HTTP transport uses Fastify with CORS for n8n compatibility
- [01-03]: Reports computed from invoice data (no separate Bexio reports API)
- [02-01]: 26 reference tools (not 28) - sectors and languages have no delete API
- [02-03]: Flat MCP params transformed to nested Bexio API structure in handlers
- [02-03]: Structured addresses only (type S) for Swiss payments - combined deprecated
- [02-03]: Currency restricted to CHF/EUR for Swiss IBAN/QR payments
- [03-01]: Search criteria as array of {field, value, criteria?} for project search
- [03-01]: Archive/unarchive as separate tools (explicit user intent)
- [03-03]: Duration format HH:MM with Zod regex validation (Bexio API requirement)

### Pending Todos

None.

### Blockers/Concerns

- ~~SDK migration from 0.5.0 to 1.25.2 has limited official documentation~~ RESOLVED in 01-01
- ~~Swiss QR-invoice spec compliance needs research (Phase 2)~~ RESOLVED in 02-03
- MCP Apps (UI-*) based on SEP-1865 proposal, not yet stable (Phase 5 risk)

## Session Continuity

Last session: 2026-02-01 17:57 UTC
Stopped at: Completed 03-03-PLAN.md (Time Tracking Tools)
Resume file: None

## Phase 1 Plans (COMPLETE)

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 01-01-PLAN.md | 1 | SDK Migration (1.25.2, Zod pin, logger) | COMPLETE |
| 01-02-PLAN.md | 2 | Modular Architecture (types, shared, contacts pattern) | COMPLETE |
| 01-03-PLAN.md | 3 | Tool Migration (83 tools) + HTTP transport | COMPLETE |

## Phase 2 Plans (COMPLETE)

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 02-01-PLAN.md | 1 | Reference Data Tools (26 tools) | COMPLETE |
| 02-02-PLAN.md | 1 | Company & Payments Config (6 tools) | COMPLETE |
| 02-03-PLAN.md | 1 | Banking Tools (13 tools) | COMPLETE |

## Phase 3 Plans (IN PROGRESS)

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 03-01-PLAN.md | 1 | Projects Core (12 tools) | COMPLETE |
| 03-02-PLAN.md | 1 | Project Nested Resources (milestones, work packages) | PENDING |
| 03-03-PLAN.md | 1 | Time Tracking Tools (11 tools) | COMPLETE |
| 03-04-PLAN.md | 1 | Accounting Foundation | PENDING |

## Phase 1 Deliverables

- 83 tools in 10 domain modules
- Dual transport: stdio (Claude Desktop) + HTTP (n8n)
- SDK 1.25.2 with Zod 3.22.5
- Type-safe handler architecture
- No console.log contamination

## Phase 2 Deliverables

- 26 reference data tools (contact groups, sectors, salutations, titles, countries, languages, units)
- 6 company tools (company profile, permissions, payment types)
- 13 banking tools (bank accounts, currencies, IBAN payments, QR payments)
- Swiss payment compliance (ISO 20022, QR-bill v2.3, structured addresses)
- Total tools: 128 (83 base + 45 Phase 2)

## Phase 3 Deliverables (Partial)

- 12 project tools (projects CRUD, archive/unarchive, search, types, statuses)
- 11 time tracking tools (timesheets CRUD, search, statuses, business activities, communication types)
- Duration validation: HH:MM format enforced via Zod regex
- Total tools: 151 (128 + 12 + 11)
