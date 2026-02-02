# Testing Patterns

**Analysis Date:** 2026-02-01

## Test Framework

**Runner:**
- Vitest 0.34.0 (configured in `vitest.config.ts`)
- Config: `vitest.config.ts`
- Global test APIs enabled (`globals: true`)
- Node environment

**Assertion Library:**
- Built into Vitest (uses Node.js assert or standard expect API)
- No explicit third-party assertion library configured

**Run Commands:**
```bash
npm test                  # Run all tests
npm run test:coverage     # Coverage report
```

## Test File Organization

**Location:**
- Co-located with source files (pattern appears to be same directory)
- Test files in same `src/` directory as implementation

**Naming:**
- Pattern: `[module].test.ts` or `[module].spec.ts`
- Example: `server.test.ts` for `server.ts`

**Note:** No test files found in current codebase - project has test infrastructure configured but no tests written yet.

## Test Structure

**Suite Organization:**
```typescript
// Expected pattern based on vitest conventions:
describe('BexioClient', () => {
  describe('listOrders', () => {
    it('should return array of orders', async () => {
      // Arrange
      const client = new BexioClient(config);

      // Act
      const result = await client.listOrders({ limit: 10 });

      // Assert
      expect(result).toBeInstanceOf(Array);
    });
  });
});
```

**Patterns:**
- Setup per test using `beforeEach()` or per-suite using `beforeAll()`
- Teardown using `afterEach()` or `afterAll()`
- Async tests awaited with `async () => { ... }`
- Assertion style: expect-based (standard vitest)

## Mocking

**Framework:** Vitest's built-in mocking (no explicit mock library configured)

**Patterns:**
```typescript
// Expected axios mocking pattern:
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockAxios = axios as any; // or use MockedFunction<typeof axios>

// Mock specific implementation:
mockAxios.create.mockReturnValue({
  interceptors: { response: { use: vi.fn() } },
  request: vi.fn().mockResolvedValue({ data: { /* ... */ } })
});
```

**What to Mock:**
- External API calls (axios requests to Bexio API)
- HTTP responses with test fixtures
- Fastify server instance and request/response objects
- Timer functions if testing timeouts/delays

**What NOT to Mock:**
- Zod schema validation (test validation behavior with real schemas)
- Core class constructors (test wiring and initialization)
- Internal utility functions (test them with integration tests)
- Error handling logic (test with real error scenarios)

## Fixtures and Factories

**Test Data:**
```typescript
// Expected factory pattern:
const createBexioConfig = (overrides = {}): BexioConfig => ({
  baseUrl: 'https://api.bexio.com/2.0',
  apiToken: 'test-token-123',
  ...overrides
});

const createOrder = (overrides = {}): OrderCreate => ({
  title: 'Test Order',
  contact_id: 1,
  positions: [{
    type: 'KbPositionCustom',
    text: 'Test Item',
    amount: 2,
    unit_price: 100,
  }],
  ...overrides
});

const createContact = (overrides = {}): unknown => ({
  id: 1,
  nr: '001001',
  name_1: 'Test Contact',
  ...overrides
});
```

**Location:**
- Fixtures in `src/test/fixtures/` or `src/__fixtures__/` (recommended directory)
- Factories in `src/test/factories/` (recommended directory)
- Or inline in test file for simple cases

## Coverage

**Requirements:**
- Target: Not specified in config (likely 80%+)
- V8 provider configured for coverage reporting
- Reporters: text (console), json (CI/CD), html (browser viewing)

**View Coverage:**
```bash
npm run test:coverage
# Outputs to console and generates HTML report in coverage/
```

**Excluded from Coverage:**
- `node_modules/`
- `dist/`
- Type declaration files (`*.d.ts`)
- Config files (`*.config.*`)
- Coverage directory itself

## Test Types

**Unit Tests:**
- Scope: Individual functions and methods in isolation
- Approach: Mock all external dependencies (axios, Bexio API)
- Files: `BexioClient` methods, parameter validation schemas
- Example targets:
  - `listOrders()` - mock axios, test params handling
  - `findContactByNumber()` - mock search responses
  - Schema validation - test with valid/invalid inputs

**Integration Tests:**
- Scope: Multiple components working together
- Approach: Real axios client (or HTTP mocking at response level), real schemas
- Files: `BexioMCPServer` with `BexioClient`, HTTP endpoints
- Example targets:
  - Full tool call flow: parse params → validate → call client → format response
  - Search operations: multiple API calls in sequence
  - Error handling: real error responses from mock API

**E2E Tests:**
- Framework: Not configured
- Not currently used in project
- Would require: full HTTP server, real or stubbed Bexio API

## Common Patterns

**Async Testing:**
```typescript
it('should fetch orders with pagination', async () => {
  // Mark test as async
  const result = await client.listOrders({ limit: 10, offset: 0 });
  expect(result).toEqual(mockOrders);
});

// Or using done() callback:
it('callback test', (done) => {
  client.listOrders().then(result => {
    expect(result).toBeDefined();
    done();
  });
});
```

**Error Testing:**
```typescript
it('should throw error for invalid contact ID', async () => {
  // Using expect().rejects.toThrow():
  await expect(
    client.getContact(-1) // Invalid: negative ID
  ).rejects.toThrow('Contact ID must be positive');
});

// Or try-catch:
it('handles HTTP errors', async () => {
  mockAxios.request.mockRejectedValue({
    response: { status: 404, data: { message: 'Not found' } }
  });

  try {
    await client.getOrder(999);
    expect.fail('Should have thrown');
  } catch (error) {
    expect(error.message).toContain('HTTP 404');
  }
});
```

**Mocking Axios:**
```typescript
// Mock successful response:
vi.spyOn(axios, 'create').mockReturnValue({
  request: vi.fn().mockResolvedValue({
    data: [{ id: 1, title: 'Order 1' }]
  }),
  interceptors: { response: { use: vi.fn() } }
} as any);

// Mock error response:
mockAxios.request.mockRejectedValue({
  response: {
    status: 500,
    statusText: 'Internal Server Error',
    data: { message: 'Database connection failed' }
  }
});
```

**Validation Testing:**
```typescript
it('validates required fields', () => {
  // Should throw on missing required field:
  expect(() => {
    OrderCreateSchema.parse({
      title: 'Missing contact_id',
      // contact_id: missing
    });
  }).toThrow('Contact ID must be positive');
});

it('accepts valid order data', () => {
  const valid = {
    title: 'Test Order',
    contact_id: 1,
    positions: [{ type: 'KbPositionCustom', text: 'Item', amount: 1, unit_price: 100 }]
  };

  const result = OrderCreateSchema.parse(valid);
  expect(result).toEqual(valid);
});
```

## Test Organization Structure

**Recommended directory layout:**
```
src/
├── bexio-client.ts
├── bexio-client.test.ts
├── server.ts
├── server.test.ts
├── types.ts
├── types.test.ts
├── http-server.ts
├── http-server.test.ts
├── index.ts
└── test/
    ├── fixtures/
    │   ├── orders.ts
    │   ├── contacts.ts
    │   └── invoices.ts
    ├── factories/
    │   ├── order.ts
    │   ├── contact.ts
    │   └── invoice.ts
    └── helpers.ts
```

## Running Tests in Different Modes

**Single test file:**
```bash
npm test -- src/bexio-client.test.ts
```

**Watch mode (during development):**
```bash
npx vitest --watch
```

**Debug mode:**
```bash
npx vitest --inspect-brk --inspect --single-thread
```

**Coverage threshold check:**
```bash
npm run test:coverage -- --coverage.lines=80 --coverage.functions=80
```

---

*Testing analysis: 2026-02-01*
