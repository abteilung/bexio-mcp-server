---
phase: 01-foundation-migration
plan: 01
subsystem: api
tags: [mcp-sdk, typescript, zod, esm, stdio-transport]

# Dependency graph
requires: []
provides:
  - "@modelcontextprotocol/sdk 1.25.2 integrated and working"
  - "Zod 3.22.5 pinned to avoid v4 compatibility issues"
  - "Stderr-only logging pattern via logger.ts"
  - "NodeNext module resolution configured"
  - "Ping tool validates SDK integration"
affects: [01-02, 01-03, all-future-phases]

# Tech tracking
tech-stack:
  added:
    - "@modelcontextprotocol/sdk ^1.25.2"
    - "zod 3.22.5 (exact pin)"
    - "typescript ^5.5.0"
    - "tsx ^4.0.0"
    - "vitest ^2.0.0"
  patterns:
    - "SDK 1.25.2 import paths: @modelcontextprotocol/sdk/server/mcp.js"
    - "Stderr-only logging via console.error() wrapper"
    - "McpServer.tool() for tool registration"

key-files:
  created:
    - "src/package.json"
    - "src/tsconfig.json"
    - "src/index.ts"
    - "src/server.ts"
    - "src/logger.ts"
    - "src/.gitignore"
    - ".env.example"
  modified: []

key-decisions:
  - "Zod pinned to exactly 3.22.5 (not ^3.22.0) to prevent v4 'w._parse is not a function' errors"
  - "SDK import from /server/mcp.js (not /server/index.js) per 1.25.2 convention"
  - "All logging via console.error() to preserve stdout for JSON-RPC"

patterns-established:
  - "Logger pattern: console.error() wrapper with timestamp and level"
  - "Server pattern: McpServer class with tool() method for registration"
  - "Entry point pattern: dotenv + env validation + mode parsing"

# Metrics
duration: 4min
completed: 2026-02-01
---

# Phase 1 Plan 01: SDK Migration Summary

**MCP SDK 1.25.2 integrated with Zod 3.22.5 pinned, stderr-only logging, and validated via ping tool on stdio transport**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-01T15:17:46Z
- **Completed:** 2026-02-01T15:21:30Z
- **Tasks:** 3
- **Files created:** 7

## Accomplishments

- Upgraded from SDK 0.5.0 to 1.25.2 with correct import paths
- Pinned Zod to 3.22.5 exactly to avoid v4 compatibility issues
- Established stderr-only logging pattern to preserve JSON-RPC protocol
- Validated SDK integration with working initialize/tools/call responses
- Created clean v2 project structure separate from v1

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize v2 project with updated dependencies** - `47684e5` (chore)
2. **Task 2: Create minimal server skeleton with SDK 1.25.2 patterns** - `c969104` (feat)
3. **Task 3: Validate SDK integration with stdio transport** - `6cc6042` (chore)

## Files Created

- `src/package.json` - v2 dependencies with SDK 1.25.2 and Zod 3.22.5
- `src/tsconfig.json` - TypeScript config with NodeNext module resolution
- `src/index.ts` - Entry point with env validation and server startup
- `src/server.ts` - MCP server with SDK 1.25.2 patterns and ping tool
- `src/logger.ts` - Stderr-only logging to preserve JSON-RPC protocol
- `src/.gitignore` - Exclude node_modules, dist, .env
- `.env.example` - Template for required environment variables

## Decisions Made

1. **Zod version pinning:** Used `"3.22.5"` (exact) instead of `"^3.22.0"` (caret) because Zod v4 causes `w._parse is not a function` runtime errors with MCP SDK. This is a known issue tracked in modelcontextprotocol/modelcontextprotocol#1429.

2. **SDK import paths:** Used new SDK 1.25.2 import paths:
   - `@modelcontextprotocol/sdk/server/mcp.js` (not `/server/index.js`)
   - `@modelcontextprotocol/sdk/server/stdio.js` for StdioServerTransport

3. **Logging approach:** Created dedicated logger.ts that wraps console.error() with timestamps and levels. This ensures all logging goes to stderr, keeping stdout clean for MCP JSON-RPC protocol messages.

4. **Removed HTTP dependencies:** Fastify and @fastify/cors are not included in v2 core. HTTP transport will be added separately in a later plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - SDK migration was straightforward with the researched import paths.

## User Setup Required

None - no external service configuration required.

## Verification Results

All success criteria validated:

- [x] npm install completes without peer dependency warnings
- [x] npm run build completes with exit code 0
- [x] Server starts and responds to MCP initialize request
- [x] No console.log() in codebase (all output via stderr logger)
- [x] SDK version is 1.25.2 (verified in package.json)
- [x] Zod version is exactly 3.22.5 (pinned, no caret)
- [x] TypeScript compilation produces no errors

**Protocol test output:**
```json
{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"bexio-mcp-server","version":"2.0.0"}},"jsonrpc":"2.0","id":1}
```

## Next Phase Readiness

- SDK foundation complete, ready for modular architecture (01-02)
- Import patterns established for all future tool modules
- Logger pattern ready for use across codebase
- Server skeleton ready to receive tool registrations from domain modules

---
*Phase: 01-foundation-migration*
*Completed: 2026-02-01*
