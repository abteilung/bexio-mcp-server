# Requirements: Bexio MCP v2

**Defined:** 2026-02-01
**Core Value:** Enable anyone to connect Claude Desktop to their Bexio accounting system with zero friction

## v2.0 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Upgrade SDK from 0.5.0 to 1.25.2 with all breaking changes addressed
- [ ] **FOUND-02**: Refactor server.ts (2,418 lines) into domain-organized modules (<200 lines each)
- [ ] **FOUND-03**: Create MCPB bundle with manifest.json for one-click Claude Desktop install
- [ ] **FOUND-04**: Publish npm package with bin field for `npx @bexio/mcp-server` usage
- [ ] **FOUND-05**: Maintain dual transport (stdio for Claude Desktop, HTTP for n8n)
- [ ] **FOUND-06**: Pin Zod to v3.22.x to avoid SDK compatibility issues
- [ ] **FOUND-07**: Configure stderr-only logging to prevent stdout contamination

### Existing Tools (Backward Compatibility)

- [ ] **EXIST-01**: Preserve all 56 v1 tool names exactly (no renaming)
- [ ] **EXIST-02**: Contacts: list, get, search, advanced search, find by number/name, update (7 tools)
- [ ] **EXIST-03**: Invoices: list, list_all, get, search, search_by_customer, create, issue, cancel, mark_sent, send, copy, statuses (13 tools)
- [ ] **EXIST-04**: Quotes: list, get, create, search, search_by_customer, issue, accept, decline, send, convert to order/invoice (10 tools)
- [ ] **EXIST-05**: Orders: list, get, create, search, search_by_customer, convert from quote (6 tools)
- [ ] **EXIST-06**: Payments: list, get, create, delete (4 tools)
- [ ] **EXIST-07**: Reminders: list, get, create, delete, mark_sent, send, search, sent_this_week (8 tools)
- [ ] **EXIST-08**: Deliveries: list, get, issue, search, create from order (5 tools)
- [ ] **EXIST-09**: Items & Taxes: list, get, create items; list, get taxes (5 tools)
- [ ] **EXIST-10**: Reports: revenue, customer revenue, invoice status, overdue, monthly, top customers (6 tools)
- [ ] **EXIST-11**: Users: current user, fictional users CRUD (6 tools)
- [ ] **EXIST-12**: Comments & Relations: list, get, create comments; relations CRUD + search (9 tools)

### Reference Data (New)

- [ ] **REFDATA-01**: Contact groups: list, get, create, delete
- [ ] **REFDATA-02**: Contact sectors: list, get, create
- [ ] **REFDATA-03**: Salutations: list, get, create, delete
- [ ] **REFDATA-04**: Titles: list, get, create, delete
- [ ] **REFDATA-05**: Countries: list, get, create, delete
- [ ] **REFDATA-06**: Languages: list, get, create
- [ ] **REFDATA-07**: Units: list, get, create, delete
- [ ] **REFDATA-08**: Payment types: list, get, create
- [ ] **REFDATA-09**: Company profile: get, update
- [ ] **REFDATA-10**: Permissions: list

### Banking (New)

- [ ] **BANK-01**: Bank accounts: list, get (read-only)
- [ ] **BANK-02**: Currencies: list, get, create, delete, update
- [ ] **BANK-03**: IBAN payments: create, get, update (Swiss ISO 20022)
- [ ] **BANK-04**: QR payments: create, get, update (Swiss QR-invoice standard)

### Projects & Time Tracking (New)

- [ ] **PROJ-01**: Projects: list, get, create, update, delete
- [ ] **PROJ-02**: Project types: list, get
- [ ] **PROJ-03**: Project statuses: list, get
- [ ] **PROJ-04**: Milestones: list, get, create, delete
- [ ] **PROJ-05**: Work packages: list, get, create, update, delete
- [ ] **PROJ-06**: Timesheets: list, get, create, delete
- [ ] **PROJ-07**: Timesheet statuses: list
- [ ] **PROJ-08**: Business activities: list, get, create
- [ ] **PROJ-09**: Communication types: list, get

### Accounting (New)

- [ ] **ACCT-01**: Accounts (chart of accounts): list, get, create
- [ ] **ACCT-02**: Account groups: list
- [ ] **ACCT-03**: Calendar years: list, get
- [ ] **ACCT-04**: Business years: list
- [ ] **ACCT-05**: Manual entries: list, get, create, update, delete
- [ ] **ACCT-06**: VAT periods: list
- [ ] **ACCT-07**: Accounting journal: get

### Purchase Management (New)

- [ ] **PURCH-01**: Bills (creditor invoices): list, get, create, update, delete
- [ ] **PURCH-02**: Bill actions: issue, mark paid
- [ ] **PURCH-03**: Expenses: list, get, create, update, delete
- [ ] **PURCH-04**: Purchase orders: list, get, create, update, delete
- [ ] **PURCH-05**: Outgoing payments: list, get, create, update, delete

### Files & Documents (New)

- [ ] **FILES-01**: Files: list, get, create, delete, update
- [ ] **FILES-02**: File download: get file content/PDF
- [ ] **FILES-03**: Additional addresses: list, get, create, delete

### Payroll (Conditional - requires Bexio payroll module)

- [ ] **PAY-01**: Employees: list, get, create, update
- [ ] **PAY-02**: Absences: list, get, create, update, delete
- [ ] **PAY-03**: Payroll documents: list

### MCP Apps / UI Elements (New)

- [ ] **UI-01**: Implement MCP Apps capability declaration
- [ ] **UI-02**: Invoice preview UI resource (HTML template)
- [ ] **UI-03**: Contact card UI resource (HTML template)
- [ ] **UI-04**: Dashboard summary UI resource (optional)

### Distribution

- [ ] **DIST-01**: Submit MCPB bundle to MCP Registry
- [ ] **DIST-02**: Publish npm package to public registry
- [ ] **DIST-03**: Create GitHub release with source and bundle
- [ ] **DIST-04**: Write installation documentation for all channels

## v2.x Requirements (Deferred)

Acknowledged but deferred to future releases.

### Extended Features

- **EXT-01**: Tool consolidation (reduce 56 tools to 15-30 polymorphic tools)
- **EXT-02**: Notes: list, get, create, delete
- **EXT-03**: Tasks: list, get, create, update, delete with priorities/statuses
- **EXT-04**: Users v3 API: full user management
- **EXT-05**: Advanced MCP Apps (data grids, interactive forms)
- **EXT-06**: Caching layer for frequently accessed reference data
- **EXT-07**: Batch operations for bulk processing

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile app | Web/desktop only for v2 |
| OAuth flow | API token is sufficient and simpler |
| Real-time webhooks | MCP is request/response, not push |
| Multi-company support | Single Bexio account per installation |
| Legacy timesheet API | Deprecated per Bexio docs |
| Custom caching | Stateless design for simplicity |
| SDK v2.0 (when released) | Build on stable v1.25.x, upgrade later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 to FOUND-07 | Phase 1 | Pending |
| EXIST-01 to EXIST-12 | Phase 2 | Pending |
| REFDATA-01 to REFDATA-10 | Phase 3 | Pending |
| BANK-01 to BANK-04 | Phase 4 | Pending |
| PROJ-01 to PROJ-09 | Phase 5 | Pending |
| ACCT-01 to ACCT-07 | Phase 6 | Pending |
| PURCH-01 to PURCH-05 | Phase 7 | Pending |
| FILES-01 to FILES-03 | Phase 8 | Pending |
| PAY-01 to PAY-03 | Phase 9 | Pending |
| UI-01 to UI-04 | Phase 10 | Pending |
| DIST-01 to DIST-04 | Phase 11 | Pending |

**Coverage:**
- v2.0 requirements: 67 total
- Mapped to phases: 67
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after scoping session*
