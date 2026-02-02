# Technology Stack

**Analysis Date:** 2026-02-01

## Languages

**Primary:**
- TypeScript 5.2.0 - All source code in `src/` directory
- JavaScript (generated) - Compiled output from TypeScript

**Secondary:**
- Shell (bash) - Test and deployment scripts (`test_all_tools.sh`, `run.sh`)

## Runtime

**Environment:**
- Node.js >= 18.0.0 (specified in package.json engines field)
- ES2022 target compilation with ESNext module resolution

**Package Manager:**
- npm - specified via package-lock.json
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- `@modelcontextprotocol/sdk` ^0.5.0 - Model Context Protocol server framework, provides `Server`, `StdioServerTransport`, `CallToolRequestSchema` classes in `src/server.ts`
- `fastify` ^4.24.0 - HTTP server framework for HTTP mode transport
- `@fastify/cors` ^8.4.0 - CORS middleware for Fastify

**HTTP/REST:**
- `axios` ^1.6.0 - HTTP client for making requests to Bexio API in `src/bexio-client.ts`

**Validation:**
- `zod` ^3.22.0 - Runtime schema validation for all API request/response types in `src/types.ts`

**Environment:**
- `dotenv` ^16.3.0 - Environment variable management in `src/index.ts`

**Development:**
- `tsx` ^3.12.0 - TypeScript execution for development watch mode
- `typescript` ^5.2.0 - TypeScript compiler
- `eslint` ^8.50.0 - Linting with `@typescript-eslint/eslint-plugin` ^6.7.0 and `@typescript-eslint/parser` ^6.7.0
- `vitest` ^0.34.0 - Test runner configured in `vitest.config.ts`
- `@vitest/coverage-v8` ^0.34.0 - Code coverage reporting
- `@types/node` ^20.8.0 - Type definitions for Node.js

## Key Dependencies

**Critical:**
- `@modelcontextprotocol/sdk` ^0.5.0 - Enables server to implement Model Context Protocol for Claude integration
- `axios` ^1.6.0 - All API communication to Bexio (see `src/bexio-client.ts` lines 1-56 for client initialization with Bearer token auth)
- `zod` ^3.22.0 - Validates all incoming tool parameters and schemas before API calls, critical for type safety

**Infrastructure:**
- `fastify` ^4.24.0 - Powers HTTP server mode alternative to stdio mode for deployment scenarios
- `dotenv` ^16.3.0 - Loads sensitive `BEXIO_API_TOKEN` and `BEXIO_BASE_URL` from environment

## Configuration

**Environment:**
- `BEXIO_API_TOKEN` (required) - Bexio API authentication token obtained from https://office.bexio.com/index.php?clang=1&cmd=settings&act=api
- `BEXIO_BASE_URL` (optional, defaults to `https://api.bexio.com/2.0`) - Base URL for Bexio API v2.0
- `NODE_ENV` (optional) - Sets runtime environment (development/production)

**Build:**
- `tsconfig.json` - Strict TypeScript settings including `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noImplicitOverride`
- `.eslintrc.json` - ESLint configuration with TypeScript rules
- `vitest.config.ts` - Test configuration with v8 coverage provider

## Platform Requirements

**Development:**
- Node.js >= 18.0.0
- npm or compatible package manager
- Git for version control

**Production:**
- Node.js >= 18.0.0
- Two deployment modes supported:
  - **Stdio mode:** Runs as child process communicating over standard input/output (default, for Claude Desktop)
  - **HTTP mode:** Listens on configurable host/port (default 0.0.0.0:8000, for remote/containerized deployments)

## Docker Support

- `Dockerfile` - Containerized deployment
- `docker-compose.yml` - Single service composition
- `docker-compose.both.yml` - Multiple service setup
- `docker-compose.portainer.yml` - Portainer-compatible setup

---

*Stack analysis: 2026-02-01*
