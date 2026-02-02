# Codebase Concerns

**Analysis Date:** 2026-02-01

## Tech Debt

**Duplicate Search Fallback Logic:**
- Issue: `findContactByNumber()` and `findContactByName()` in `bexio-client.ts` (lines 105-163, 165-227) contain nearly identical fallback logic duplicated in both the try and catch blocks. Each method has its entire loop logic repeated twice.
- Files: `src/bexio-client.ts` (lines 106-162 and 140-160; lines 166-200 and 201-225)
- Impact: Difficult to maintain, prone to inconsistency if one branch is updated but not the other. Changes must be made in multiple places. If a bug is discovered, it may exist in multiple implementations.
- Fix approach: Extract the pagination and search loop into a private helper method `_paginateAndSearch()` that both methods can reuse, eliminating 50+ lines of duplicate code.

**Hardcoded Safety Limits:**
- Issue: Multiple methods use arbitrary safety limits (1000 contact records, 10000 invoices) with no explanation or configuration. See `findContactByNumber()` (line 121, 144), `findContactByName()` (line 182, 207), `listAllInvoices()` (line 268).
- Files: `src/bexio-client.ts` (lines 121, 144, 182, 207, 268)
- Impact: These limits are not configurable and may be insufficient for large instances or cause failures for small instances. No logging when limit is reached means users won't know data was truncated.
- Fix approach: Move safety limits to class-level constants with JSDoc explaining rationale. Add logging when pagination limit is reached to warn users.

**Type Safety Gaps with `unknown` and `any`:**
- Issue: Heavy use of `unknown` and `any` types throughout codebase. Methods like `makeRequest<T = unknown>()` (line 44), `createOrder(orderData: OrderCreate): Promise<unknown>` (line 68), and response handling use loose types.
- Files: `src/bexio-client.ts` (lines 44, 68, 231, etc.); `src/server.ts` (lines 2320, 2370, 2966 with `(contact as any)`)
- Impact: Type safety is compromised. Developers may pass incorrect data structures, and runtime errors won't be caught at compile time. Response data structure assumptions can break silently.
- Fix approach: Create discriminated union types for API responses. Use `Bexio[EntityType]Response` types instead of `unknown`. Add proper TypeScript generics to `makeRequest()`.

**Mixed Error Handling Patterns:**
- Issue: Error handling is inconsistent. `makeRequest()` throws errors (lines 32-40), but some methods catch and rethrow with different messages (lines 534-550 in `listReminders`). Some methods don't handle errors at all.
- Files: `src/bexio-client.ts` (lines 32-40, 106-162, 534-550); `src/server.ts` (lines 141-152, 84-92)
- Impact: Inconsistent error messages make debugging difficult. Some errors are swallowed silently. Users get unclear error context.
- Fix approach: Create a custom `BexioError` class that wraps API errors with context (operation, IDs involved, etc.). Use it consistently across all client methods.

## Known Bugs

**Axes Hardcoding in Tax and Status Endpoints:**
- Issue: `listTaxes()` and `getTax()` (lines 320-343) use hardcoded axios instance separate from the configured client, bypassing any interceptors or custom settings. This duplicates authentication headers and creates maintenance burden.
- Files: `src/bexio-client.ts` (lines 322-330, 335-342)
- Impact: If authentication headers or base URL need updating, these methods won't benefit from changes to the main client configuration. Inconsistent error handling between main client and these methods.
- Workaround: None currently in place
- Fix approach: Use `this.client` instead of separate `axios.get()` calls, updating the endpoint to `/taxes` if the API version supports it.

**Pagination Assumption in Business Logic:**
- Issue: `getTopCustomersByRevenue()` (lines 846-873) loads ALL invoices in memory with `listAllInvoices()` and then aggregates them. For large Bexio instances with 100k+ invoices, this will cause memory exhaustion and timeout.
- Files: `src/bexio-client.ts` (lines 853-873)
- Impact: Method will fail or hang on production instances with significant transaction volume. No streaming or batch processing.
- Trigger: Call `getTopCustomersByRevenue()` on account with >50k invoices
- Workaround: Use the API's native `getCustomerRevenueReport()` instead (fallback exists but isn't documented)
- Fix approach: Make `listAllInvoices()` optional and default to using the report endpoint. Add a warning comment if the fallback is used.

**Incomplete Response Serialization Safety:**
- Issue: `ensureCompleteResponse()` (lines 1681-1702) in `server.ts` catches serialization errors but returns a generic fallback. This masks real data issues and prevents debugging.
- Files: `src/server.ts` (lines 1694-1700)
- Impact: If API returns circular references or large unserializable objects, users get "Response serialization failed" without knowing what data was problematic. Makes production debugging impossible.
- Fix approach: Log the actual error before returning fallback. Include data type/size info in error message.

## Security Considerations

**API Token Exposure Risk:**
- Risk: API token is read from `BEXIO_API_TOKEN` environment variable (lines 13-14 in `index.ts`) but there's no validation that it's set. If missing, the error message (`BEXIO_API_TOKEN environment variable is required`) appears in logs without suppressing the code path.
- Files: `src/index.ts` (lines 14-18)
- Current mitigation: Process exits with error code 1
- Recommendations:
  1. Validate token format (non-empty, minimum length) before using it
  2. Never log the token itself (already done correctly)
  3. Consider adding a check in the Axios interceptor to ensure token is present before making requests

**Credential Leakage in Error Messages:**
- Risk: Error messages from `makeRequest()` (line 34) include raw error response data which could contain authentication headers or sensitive request body data if passed by user.
- Files: `src/bexio-client.ts` (line 34)
- Current mitigation: Zod schema validation filters input before it reaches API
- Recommendations:
  1. Sanitize error responses to exclude sensitive fields (auth headers, full URLs)
  2. Log full errors internally but expose only safe error messages to callers

**Unvalidated Search Parameters:**
- Risk: Search operators in `searchInvoices()` (line 297) are passed directly to API without validation. Malformed operators could cause API errors or unexpected behavior.
- Files: `src/bexio-client.ts` (line 297)
- Current mitigation: Zod schemas validate operator values in some cases
- Recommendations:
  1. Create an enum of allowed operators (=, <, >, LIKE, !=, etc.)
  2. Validate operator before constructing API request
  3. Document which operators are supported for which fields

## Performance Bottlenecks

**N+1 Query Problem in Multi-Contact Search:**
- Problem: `search_invoices_by_customer()` and `search_quotes_by_customer()` (server.ts lines 1942-1994, 2296-2339) find contacts by name, then loop through first 5 results making individual API calls per contact.
- Files: `src/server.ts` (lines 1965-1980, 2319-2325, 2369-2375)
- Cause: No batch search endpoint for multiple contact IDs
- Improvement path:
  1. Implement parallel requests instead of sequential (use `Promise.all()`)
  2. Add optional caching layer for frequently-searched customer names
  3. Document the 5-contact limit and why it exists

**Inefficient Contact Search Fallback:**
- Problem: `findContactByNumber()` and `findContactByName()` first try advanced search endpoint, then fall back to pagination through all contacts in 100-record chunks. For contacts with 10k+ records, this means up to 100 API calls.
- Files: `src/bexio-client.ts` (lines 117-136, 177-198, and retry in catch blocks)
- Cause: API may not support advanced search in all scenarios
- Improvement path:
  1. Verify that advanced search endpoint supports all search scenarios
  2. If fallback is necessary, implement binary search or better indexing
  3. Cache recent searches to reduce repeated API calls

**Response Formatting Overhead:**
- Problem: `formatResponseData()` (lines 1622-1679) in server.ts runs `JSON.stringify()` followed by `JSON.parse()` on every response to test serialization. For large datasets (lists with 1000+ items), this is expensive.
- Files: `src/server.ts` (lines 1685-1686)
- Cause: Safety check to prevent infinite loops, but done on every response
- Improvement path:
  1. Use a streaming JSON serializer for large responses
  2. Only run full serialization test on responses >10KB
  3. Implement response streaming for list endpoints

## Fragile Areas

**Contact Search Functions:**
- Files: `src/bexio-client.ts` (lines 105-227)
- Why fragile: Two functions (`findContactByNumber`, `findContactByName`) with near-identical branching logic and duplicated fallback paths. Any change to search logic must be made twice. Tests must cover both paths independently.
- Safe modification: Create a shared private `_searchContactsWithFallback()` method that both functions call with different search criteria. Add comprehensive unit tests for the shared method.
- Test coverage: Limited - no test files exist in repository for these methods. If fallback logic fails, it may not be discovered until production.

**Pagination Logic in listAllInvoices:**
- Files: `src/bexio-client.ts` (lines 260-284)
- Why fragile: Assumes API returns fewer items than `limit` when it reaches the end (line 276). If API behavior changes or pagination is inconsistent, loop may continue indefinitely or truncate results.
- Safe modification: Add an explicit total count endpoint call or check API response headers for pagination metadata before relying on array length.
- Test coverage: No unit tests present.

**Response Data Key Mapping:**
- Files: `src/server.ts` (lines 1730-1829)
- Why fragile: `getDataKey()` maintains a large manual mapping of tool names to response keys. If new tools are added, this map must be updated or the tool breaks silently by returning `data` instead of the correct key.
- Safe modification: Derive key from tool name automatically (e.g., `list_invoices` → `invoices`), only override when necessary.
- Test coverage: No validation that mapping is complete or correct.

**Axios Interceptor in Constructor:**
- Files: `src/bexio-client.ts` (lines 30-41)
- Why fragile: Error handling in interceptor catches all error types and rethrows with generic messages. If the interceptor is modified, error handling behavior changes globally for all methods.
- Safe modification: Add detailed logging before throwing. Consider extracting interceptor to a separate method for easier testing.
- Test coverage: None - interceptor is not unit tested.

## Scaling Limits

**Hardcoded Pagination Limit (1000 records):**
- Current capacity: Methods in `bexio-client.ts` limit pagination to 1000 records maximum
- Limit: Bexio instances with >1000 contacts or invoices will be truncated
- Scaling path: Make pagination limit configurable per instance. Add a config option like `MAX_PAGINATION_OFFSET` to BexioConfig. Add debug logging when limit is reached.

**Memory Usage with Large Invoices:**
- Current capacity: `getTopCustomersByRevenue()` loads all invoices into memory. Safe for ~10k invoices on typical hardware.
- Limit: Will cause memory exhaustion and timeout for accounts with >50k invoices
- Scaling path: Implement streaming aggregation or use API's native reporting endpoints exclusively.

**Parallel Request Limit:**
- Current capacity: Multi-contact search operations run sequentially with 5-contact limit
- Limit: Response time increases linearly with number of contacts
- Scaling path: Implement parallel requests with configurable concurrency (e.g., 5 parallel requests). Add exponential backoff for rate limiting.

## Dependencies at Risk

**Axios Version Pinning:**
- Risk: `axios: ^1.6.0` (package.json line 41) allows versions up to 2.0.0. Breaking changes in major versions could break HTTP error handling.
- Impact: Interceptor logic in `makeRequest()` may break if error response format changes
- Migration plan: Lock to specific minor version `^1.6.7` or implement compatibility layer for axios error handling

**MCP SDK Early Version:**
- Risk: `@modelcontextprotocol/sdk: ^0.5.0` (package.json line 40) is still in early development (< 1.0.0)
- Impact: Tool definitions, request/response schemas may change. No stability guarantees.
- Migration plan: Monitor SDK releases. Implement adapter pattern between MCP SDK types and internal types to reduce coupling.

**Zod Validation Schema Drift:**
- Risk: Validation schemas in `types.ts` may drift from actual Bexio API requirements. Schemas are not auto-generated from API spec.
- Impact: Invalid data could pass validation or valid data could be rejected. Schema must be manually maintained.
- Migration plan: Add OpenAPI/Swagger schema validation tests. Consider using OpenAPI code generation if Bexio publishes a spec.

## Missing Critical Features

**No Request Retries or Exponential Backoff:**
- Problem: Transient network failures or rate limiting cause immediate failures with no retry logic
- Blocks: Reliable integration with high-volume workflows
- Solution: Implement retry decorator with exponential backoff (up to 3 retries for 5xx errors, with configurable backoff)

**No Logging or Observability:**
- Problem: No structured logging of API calls, errors, or performance metrics. Only error messages via console.error()
- Blocks: Production monitoring, debugging, audit trails
- Solution: Add Winston or Pino logger. Log request/response metadata (duration, status code) and errors with context.

**No Rate Limiting Protection:**
- Problem: Bexio API likely has rate limits but code makes requests without throttling or backoff
- Blocks: Reliable operation on high-volume accounts
- Solution: Implement token bucket or sliding window rate limiter. Queue requests if approaching limit.

**No Caching Layer:**
- Problem: Repeated calls for same data (e.g., `list_invoice_statuses()`, `list_taxes()`) hit API each time
- Blocks: Efficient operation, reduced API quota usage
- Solution: Add optional in-memory cache with TTL. Cache static data (statuses, taxes) for 1 hour. Cache customer searches for 5 minutes.

## Test Coverage Gaps

**No Unit Tests for Client Methods:**
- What's not tested: All methods in `bexio-client.ts` - no mocking of axios calls
- Files: `src/bexio-client.ts` (entire file)
- Risk: Fallback logic, error handling, and pagination loops may fail silently
- Priority: **High** - These are the core API integration methods
- Recommendation: Add 50+ unit tests covering normal flows, error conditions, and edge cases (empty results, pagination boundaries, etc.)

**No Integration Tests:**
- What's not tested: End-to-end flows like "create invoice from quote" or "search and update customer"
- Files: All files, especially `src/server.ts`
- Risk: Tool composition errors won't be caught until production
- Priority: **Medium** - Would require test Bexio account
- Recommendation: Create mock Bexio API or use Bexio sandbox environment

**No Error Path Testing:**
- What's not tested: Error handling in `makeRequest()`, timeout handling, network failures
- Files: `src/bexio-client.ts` (lines 32-40), `src/server.ts` (lines 141-152)
- Risk: Error messages may be unhelpful or expose sensitive data
- Priority: **High** - Error paths are most important for reliability
- Recommendation: Mock axios to simulate 400/500/timeout errors

**No Type Safety Testing:**
- What's not tested: Zod schema validation actually rejects invalid input
- Files: `src/types.ts` (all schemas)
- Risk: Invalid data may pass validation
- Priority: **Medium** - Low impact but catches regressions
- Recommendation: Add property-based tests using fast-check to generate invalid inputs

---

*Concerns audit: 2026-02-01*
