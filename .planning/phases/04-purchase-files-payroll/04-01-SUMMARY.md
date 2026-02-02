---
phase: 04-purchase-files-payroll
plan: 01
subsystem: purchase
tags: [bills, expenses, creditor-invoices, bexio, purchase-cycle]
depends_on:
  requires: [01-01, 01-02, 01-03]
  provides: [bills-crud, expenses-crud, bill-actions, purchase-schemas]
  affects: [04-02, 04-03, 04-04]
tech-stack:
  added: []
  patterns: [crud-tools, search-criteria-array, bill-actions]
key-files:
  created:
    - src/types/schemas/purchase.ts
    - src/tools/purchase/definitions.ts
    - src/tools/purchase/handlers.ts
    - src/tools/purchase/index.ts
  modified:
    - src/types/schemas/index.ts
    - src/bexio-client.ts
    - src/tools/index.ts
decisions:
  - id: purch-01
    choice: Standard CRUD pattern for bills and expenses
    rationale: Mirrors sales invoices pattern from Phase 1 for consistency
  - id: purch-02
    choice: Search criteria as array of objects
    rationale: Follows project search pattern established in Phase 3
metrics:
  duration: 3min
  completed: 2026-02-01
---

# Phase 04 Plan 01: Bills & Expenses Summary

**13 purchase tools enabling supplier bill management (CRUD + issue/mark-paid) and expense tracking (CRUD), completing the procurement side of Bexio accounting.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-01T21:36:00Z
- **Completed:** 2026-02-01T21:39:21Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Complete bills (creditor invoices) management: list, get, create, update, delete, search
- Bill actions: issue and mark as paid
- Complete expense tracking: list, get, create, update, delete
- Mirrors sales invoice pattern for consistent API experience

## Task Commits

Each task was committed atomically:

1. **Task 1: Create purchase schemas and BexioClient methods** - `9724459` (feat)
2. **Task 2: Create purchase tool definitions and handlers** - `4c7ef73` (feat)

## Files Created/Modified

| File | Change | Lines |
|------|--------|-------|
| src/types/schemas/purchase.ts | Created | 107 |
| src/tools/purchase/definitions.ts | Created | 216 |
| src/tools/purchase/handlers.ts | Created | 104 |
| src/tools/purchase/index.ts | Created | 8 |
| src/types/schemas/index.ts | Modified | +3 |
| src/bexio-client.ts | Modified | +54 |
| src/tools/index.ts | Modified | +3 |

## Tools Created

### Bills (Creditor Invoices) - 8 tools
- `list_bills` - List bills with pagination
- `get_bill` - Get specific bill by ID
- `create_bill` - Create new bill
- `update_bill` - Update existing bill
- `delete_bill` - Delete bill
- `search_bills` - Search bills by criteria
- `issue_bill` - Issue bill (change status)
- `mark_bill_as_paid` - Mark bill as paid

### Expenses - 5 tools
- `list_expenses` - List expenses with pagination
- `get_expense` - Get specific expense by ID
- `create_expense` - Create new expense
- `update_expense` - Update existing expense
- `delete_expense` - Delete expense

## Key Implementation Details

### BexioClient Methods
```typescript
// Bills: /kb_bill endpoint
listBills, getBill, createBill, updateBill, deleteBill, searchBills
issueBill  // POST /kb_bill/{id}/issue
markBillAsPaid  // POST /kb_bill/{id}/mark_as_paid

// Expenses: /kb_expense endpoint
listExpenses, getExpense, createExpense, updateExpense, deleteExpense
```

### Search Pattern
Search uses criteria array format consistent with projects:
```typescript
criteria: z.array(z.record(z.unknown()))
// Example: [{field: "vendor_nr", value: "12345"}]
```

## Decisions Made

1. **Standard CRUD pattern** - Bills and expenses follow the same CRUD + search pattern as sales invoices for API consistency.

2. **Search criteria array** - Uses array-of-objects format matching project search established in Phase 3.

3. **Update via POST** - Following Bexio convention of POST for updates (not PUT/PATCH).

## Deviations from Plan

None - plan executed exactly as written.

## Tool Count

- Plan 04-01: 13 tools (8 bill + 5 expense)
- Phase 4 so far: 13 tools
- Total project tools: 188 (175 + 13)

## Verification

- [x] `npm run build` passes without errors
- [x] All 13 purchase tools registered (verified via getAllToolDefinitions)
- [x] BexioClient has all 13 methods for bills and expenses
- [x] Tool definitions match established patterns
- [x] No console.log statements in purchase module

## Next Phase Readiness

Ready to proceed to 04-02 (Files & Document Management):
- Purchase foundation complete
- Follows established patterns for remaining Phase 4 plans
- No blockers

---
*Phase: 04-purchase-files-payroll*
*Plan: 01*
*Completed: 2026-02-01*
