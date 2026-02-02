# Phase 4: Purchase, Files & Payroll - Research

**Researched:** 2026-02-01
**Domain:** Bexio API Purchase Cycle, Document Management, and Conditional Payroll
**Confidence:** HIGH

## Summary

Phase 4 implements the procurement cycle (bills/creditor invoices, expenses, purchase orders, outgoing payments), file/document management, and conditional payroll features (employees, absences). This phase adds approximately 35-40 new tools following the established patterns from Phases 1-3.

The purchase endpoints follow the established Bexio API v2.0 patterns and mirror the sales cycle endpoints from Phase 1. Bills (`kb_bill`) are the creditor-side equivalent of invoices (`kb_invoice`), with similar CRUD operations and actions (issue, mark_paid). Outgoing payments link to bills the same way incoming payments link to invoices. The file endpoint (`/file`) supports standard CRUD plus binary upload/download. Payroll endpoints (`/employee`, `/absence`) are conditional on the Bexio payroll module subscription.

**Primary recommendation:** Follow the existing domain module pattern (definitions.ts, handlers.ts, index.ts). Create three new domain folders: `purchase/`, `files/`, and `payroll/`. The payroll handlers should detect module availability on first call and return friendly error messages when unavailable.

## Standard Stack

The established libraries/tools for this domain:

### Core (Existing from Phases 1-3)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @modelcontextprotocol/sdk | 1.25.2 | MCP server implementation | Required, established in Phase 1 |
| zod | 3.22.5 | Runtime validation | Pinned version, established in Phase 1 |
| axios | ^1.7.x | HTTP client | Already in use for Bexio API calls |

### Supporting (No New Libraries Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | - | No new dependencies required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw axios for file upload | form-data library | Not needed - axios handles multipart/form-data |
| Custom module detection | Runtime probe | Probe-on-first-call is simpler and sufficient |

**Installation:**
```bash
# No new packages needed - Phase 4 uses existing dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── tools/
│   ├── purchase/            # NEW: Bills, Expenses, Purchase Orders, Outgoing Payments
│   │   ├── definitions.ts   # Tool definitions for purchase cycle
│   │   ├── handlers.ts      # Handler implementations
│   │   └── index.ts         # Barrel export
│   ├── files/               # NEW: File/Document management
│   │   ├── definitions.ts   # Tool definitions for files
│   │   ├── handlers.ts      # Handler implementations (with binary handling)
│   │   └── index.ts         # Barrel export
│   ├── payroll/             # NEW: Employees & Absences (conditional)
│   │   ├── definitions.ts   # Tool definitions for payroll
│   │   ├── handlers.ts      # Handler implementations with module detection
│   │   └── index.ts         # Barrel export
│   └── index.ts             # Update to include new domains
├── types/
│   └── schemas/
│       ├── purchase.ts      # NEW: Purchase cycle schemas
│       ├── files.ts         # NEW: File operation schemas
│       ├── payroll.ts       # NEW: Payroll schemas
│       └── index.ts         # Update to export new schemas
├── shared/
│   └── errors.ts            # May need new error type for module unavailable
└── bexio-client.ts          # Add new API methods
```

### Pattern 1: Simple CRUD Handler (Bills, Expenses, Purchase Orders)
**What:** Straightforward API passthrough with Zod validation
**When to use:** Bills, expenses, purchase orders - mirrors invoice/order patterns from Phase 1
**Example:**
```typescript
// Source: Established pattern from tools/invoices/handlers.ts
// tools/purchase/handlers.ts
export const handlers: Record<string, HandlerFn> = {
  list_bills: async (client, args) => {
    const params = ListBillsParamsSchema.parse(args);
    return client.listBills(params);
  },

  get_bill: async (client, args) => {
    const { bill_id } = GetBillParamsSchema.parse(args);
    const bill = await client.getBill(bill_id);
    if (!bill) {
      throw McpError.notFound("Bill", bill_id);
    }
    return bill;
  },

  create_bill: async (client, args) => {
    const { bill_data } = CreateBillParamsSchema.parse(args);
    return client.createBill(bill_data);
  },

  issue_bill: async (client, args) => {
    const { bill_id } = IssueBillParamsSchema.parse(args);
    return client.issueBill(bill_id);
  },

  mark_bill_as_paid: async (client, args) => {
    const { bill_id } = MarkBillAsPaidParamsSchema.parse(args);
    return client.markBillAsPaid(bill_id);
  },
};
```

### Pattern 2: Linked Resource Handler (Outgoing Payments to Bills)
**What:** Resources linked to parent (like incoming payments to invoices)
**When to use:** Outgoing payments linked to bills
**Example:**
```typescript
// Source: Established pattern from tools/payments/handlers.ts
// tools/purchase/handlers.ts (outgoing payments section)
export const outgoingPaymentHandlers: Record<string, HandlerFn> = {
  list_outgoing_payments: async (client, args) => {
    const { bill_id } = ListOutgoingPaymentsParamsSchema.parse(args);
    return client.listOutgoingPayments(bill_id);
  },

  create_outgoing_payment: async (client, args) => {
    const { bill_id, payment_data } = CreateOutgoingPaymentParamsSchema.parse(args);
    return client.createOutgoingPayment(bill_id, payment_data);
  },

  delete_outgoing_payment: async (client, args) => {
    const { bill_id, payment_id } = DeleteOutgoingPaymentParamsSchema.parse(args);
    return client.deleteOutgoingPayment(bill_id, payment_id);
  },
};
```

### Pattern 3: File Binary Handler
**What:** File operations with binary data handling
**When to use:** File upload/download operations
**Example:**
```typescript
// tools/files/handlers.ts
export const handlers: Record<string, HandlerFn> = {
  list_files: async (client, args) => {
    const params = ListFilesParamsSchema.parse(args);
    return client.listFiles(params);
  },

  get_file: async (client, args) => {
    const { file_id } = GetFileParamsSchema.parse(args);
    const file = await client.getFile(file_id);
    if (!file) {
      throw McpError.notFound("File", file_id);
    }
    return file;
  },

  // Upload returns file metadata, not the file itself
  upload_file: async (client, args) => {
    const { name, content_base64, content_type } = UploadFileParamsSchema.parse(args);
    return client.uploadFile({ name, content_base64, content_type });
  },

  // Download returns base64 encoded content for MCP transport
  download_file: async (client, args) => {
    const { file_id } = DownloadFileParamsSchema.parse(args);
    const content = await client.downloadFile(file_id);
    return {
      file_id,
      content_base64: content,
      message: "File content returned as base64 encoded string",
    };
  },

  delete_file: async (client, args) => {
    const { file_id } = DeleteFileParamsSchema.parse(args);
    return client.deleteFile(file_id);
  },
};
```

### Pattern 4: Conditional Module Handler (Payroll)
**What:** Handler that detects module availability and returns friendly errors
**When to use:** Payroll features that require Bexio payroll subscription
**Example:**
```typescript
// tools/payroll/handlers.ts
// Cache for module availability (probe once per session)
let payrollModuleAvailable: boolean | null = null;

async function checkPayrollModule(client: BexioClient): Promise<boolean> {
  if (payrollModuleAvailable !== null) {
    return payrollModuleAvailable;
  }

  try {
    // Probe with a lightweight list call
    await client.listEmployees({ limit: 1 });
    payrollModuleAvailable = true;
    return true;
  } catch (error) {
    // Check for 403/404 indicating module not available
    if (error instanceof McpError &&
        (error.statusCode === 403 || error.statusCode === 404)) {
      payrollModuleAvailable = false;
      return false;
    }
    // Rethrow other errors (network, auth, etc.)
    throw error;
  }
}

function payrollUnavailableError(): McpError {
  return new McpError(
    "BEXIO_API_ERROR",
    "The Payroll module is not enabled in your Bexio account. " +
    "To use employee and absence features, activate the Payroll module " +
    "in your Bexio settings at https://office.bexio.com/settings/modules. " +
    "The Payroll module is included with Pro+ plans or available as an add-on " +
    "for Starter and Pro plans.",
    { module: "payroll", available: false },
    403
  );
}

export const handlers: Record<string, HandlerFn> = {
  list_employees: async (client, args) => {
    if (!await checkPayrollModule(client)) {
      throw payrollUnavailableError();
    }
    const params = ListEmployeesParamsSchema.parse(args);
    return client.listEmployees(params);
  },

  get_employee: async (client, args) => {
    if (!await checkPayrollModule(client)) {
      throw payrollUnavailableError();
    }
    const { employee_id } = GetEmployeeParamsSchema.parse(args);
    return client.getEmployee(employee_id);
  },

  // ... similar pattern for other payroll operations
};
```

### Anti-Patterns to Avoid
- **Hiding payroll tools when unavailable:** Keep tools visible but return friendly errors. This helps users understand what's possible with different subscription tiers.
- **Terse error messages for module unavailable:** Don't say "403 Forbidden". Say "Payroll module not enabled. Enable it at..."
- **Binary data without encoding:** File content must be base64 encoded for MCP JSON transport.
- **Checking module on every call:** Cache the probe result for the session (probe-on-first-call pattern).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File MIME type detection | Custom detection logic | Pass content_type from client | Client knows the file type |
| Payment status calculation | Custom bill status tracking | Bexio API status fields | API tracks payment status |
| Module availability check | Complex subscription API | Simple probe + cache | 403/404 on list is sufficient |
| Base64 encode/decode | Custom implementation | Node.js Buffer | Built-in, well-tested |
| File size validation | Custom validation | Let Bexio API reject | API has authoritative limits |

**Key insight:** The Bexio API handles Swiss business rules for creditor invoices (bills), VAT on purchases, and payroll compliance. The MCP server should pass through requests and return clear errors when features are unavailable.

## Common Pitfalls

### Pitfall 1: Bill vs Invoice Endpoint Confusion
**What goes wrong:** Using `/kb_invoice` for creditor/supplier bills
**Why it happens:** Invoice is generic term; kb_invoice is for customer invoices (debtor)
**How to avoid:** Use `/kb_bill` for creditor invoices (supplier bills, expenses owed TO others)
**Warning signs:** Creating bills that show as customer invoices in Bexio UI

### Pitfall 2: Outgoing Payment Endpoint Path
**What goes wrong:** Using `/outgoing_payment` standalone endpoint
**Why it happens:** Assuming payments are top-level resources
**How to avoid:** Outgoing payments are linked to bills: `/kb_bill/{id}/payment` (parallel to `/kb_invoice/{id}/payment`)
**Warning signs:** 404 errors or "endpoint not found"

### Pitfall 3: File Upload Content-Type Header
**What goes wrong:** Sending JSON when uploading binary files
**Why it happens:** Following the pattern of other endpoints
**How to avoid:** Use `multipart/form-data` for file uploads with axios
**Warning signs:** 400 Bad Request or malformed file data

### Pitfall 4: Payroll Module Not Available Error
**What goes wrong:** Cryptic 403/404 errors when payroll not subscribed
**Why it happens:** Not detecting module availability before operations
**How to avoid:** Probe on first call, cache result, return friendly message
**Warning signs:** Users confused about "Forbidden" errors

### Pitfall 5: File Size and Type Restrictions
**What goes wrong:** Attempting to upload unsupported or too-large files
**Why it happens:** Not knowing Bexio's file restrictions
**How to avoid:** Document limits in tool descriptions; let API reject with clear error
**Warning signs:** 413 Payload Too Large or unsupported media type errors

### Pitfall 6: Bill Actions Endpoint Path
**What goes wrong:** Using wrong action endpoint paths
**Why it happens:** Guessing based on invoice patterns
**How to avoid:** Use documented endpoints:
  - Issue bill: `POST /kb_bill/{id}/issue`
  - Mark paid: `POST /kb_bill/{id}/mark_as_paid` (or status update)
**Warning signs:** 404 errors on action endpoints

## Code Examples

Verified patterns from official sources:

### BexioClient API Methods for Bills
```typescript
// Source: docs.bexio.com + established BexioClient pattern
// Add to src/bexio-client.ts

// ===== BILLS (Creditor Invoices - PURCH-01, PURCH-02) =====
async listBills(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/kb_bill", params);
}

async getBill(billId: number): Promise<unknown> {
  return this.makeRequest("GET", `/kb_bill/${billId}`);
}

async createBill(data: {
  contact_id: number;
  vendor_ref?: string;
  title?: string;
  is_valid_from?: string;
  is_valid_to?: string;
  // ... other bill fields
}): Promise<unknown> {
  return this.makeRequest("POST", "/kb_bill", undefined, data);
}

async updateBill(billId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("POST", `/kb_bill/${billId}`, undefined, data);
}

async deleteBill(billId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/kb_bill/${billId}`);
}

async searchBills(searchParams: Record<string, unknown>[]): Promise<unknown[]> {
  return this.makeRequest("POST", "/kb_bill/search", undefined, searchParams);
}

// Bill Actions
async issueBill(billId: number): Promise<unknown> {
  return this.makeRequest("POST", `/kb_bill/${billId}/issue`);
}

async markBillAsPaid(billId: number): Promise<unknown> {
  return this.makeRequest("POST", `/kb_bill/${billId}/mark_as_paid`);
}
```

### BexioClient API Methods for Expenses
```typescript
// Source: docs.bexio.com
// Add to src/bexio-client.ts

// ===== EXPENSES (PURCH-03) =====
async listExpenses(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/kb_expense", params);
}

async getExpense(expenseId: number): Promise<unknown> {
  return this.makeRequest("GET", `/kb_expense/${expenseId}`);
}

async createExpense(data: {
  title: string;
  amount: number;
  date: string;
  user_id?: number;
  project_id?: number;
  // ... other expense fields
}): Promise<unknown> {
  return this.makeRequest("POST", "/kb_expense", undefined, data);
}

async updateExpense(expenseId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("POST", `/kb_expense/${expenseId}`, undefined, data);
}

async deleteExpense(expenseId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/kb_expense/${expenseId}`);
}
```

### BexioClient API Methods for Purchase Orders
```typescript
// Source: docs.bexio.com
// Add to src/bexio-client.ts

// ===== PURCHASE ORDERS (PURCH-04) =====
async listPurchaseOrders(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/purchase_order", params);
}

async getPurchaseOrder(orderId: number): Promise<unknown> {
  return this.makeRequest("GET", `/purchase_order/${orderId}`);
}

async createPurchaseOrder(data: {
  contact_id: number;
  title?: string;
  // ... other purchase order fields
}): Promise<unknown> {
  return this.makeRequest("POST", "/purchase_order", undefined, data);
}

async updatePurchaseOrder(orderId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PUT", `/purchase_order/${orderId}`, undefined, data);
}

async deletePurchaseOrder(orderId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/purchase_order/${orderId}`);
}
```

### BexioClient API Methods for Outgoing Payments
```typescript
// Source: docs.bexio.com + payments pattern from Phase 1
// Add to src/bexio-client.ts

// ===== OUTGOING PAYMENTS (PURCH-05) =====
async listOutgoingPayments(billId: number): Promise<unknown[]> {
  return this.makeRequest("GET", `/kb_bill/${billId}/payment`);
}

async getOutgoingPayment(billId: number, paymentId: number): Promise<unknown> {
  return this.makeRequest("GET", `/kb_bill/${billId}/payment/${paymentId}`);
}

async createOutgoingPayment(billId: number, paymentData: {
  date: string;
  amount: number;
  bank_account_id?: number;
  // ... other payment fields
}): Promise<unknown> {
  return this.makeRequest("POST", `/kb_bill/${billId}/payment`, undefined, paymentData);
}

async updateOutgoingPayment(billId: number, paymentId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PUT", `/kb_bill/${billId}/payment/${paymentId}`, undefined, data);
}

async deleteOutgoingPayment(billId: number, paymentId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/kb_bill/${billId}/payment/${paymentId}`);
}
```

### BexioClient API Methods for Files
```typescript
// Source: docs.bexio.com
// Add to src/bexio-client.ts

// ===== FILES (FILES-01, FILES-02) =====
async listFiles(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/file", params);
}

async getFile(fileId: number): Promise<unknown> {
  return this.makeRequest("GET", `/file/${fileId}`);
}

async uploadFile(data: {
  name: string;
  content_base64: string;
  content_type: string;
}): Promise<unknown> {
  // Convert base64 to buffer for multipart upload
  const buffer = Buffer.from(data.content_base64, "base64");
  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: data.content_type }), data.name);

  return this.makeRequest("POST", "/file", undefined, formData);
}

async downloadFile(fileId: number): Promise<string> {
  // Returns file content as base64 string
  const response = await this.client.get(`/file/${fileId}/download`, {
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data).toString("base64");
}

async updateFile(fileId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PATCH", `/file/${fileId}`, undefined, data);
}

async deleteFile(fileId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/file/${fileId}`);
}
```

### BexioClient API Methods for Payroll
```typescript
// Source: docs.bexio.com + payroll module requirements
// Add to src/bexio-client.ts

// ===== EMPLOYEES (PAY-01) =====
// Note: Requires Bexio Payroll module subscription
async listEmployees(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/employee", params);
}

async getEmployee(employeeId: number): Promise<unknown> {
  return this.makeRequest("GET", `/employee/${employeeId}`);
}

async createEmployee(data: {
  firstname: string;
  lastname: string;
  email?: string;
  // ... other employee fields
}): Promise<unknown> {
  return this.makeRequest("POST", "/employee", undefined, data);
}

async updateEmployee(employeeId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PATCH", `/employee/${employeeId}`, undefined, data);
}

// ===== ABSENCES (PAY-02) =====
async listAbsences(params: { year?: number } & PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/absence", params);
}

async getAbsence(absenceId: number): Promise<unknown> {
  return this.makeRequest("GET", `/absence/${absenceId}`);
}

async createAbsence(data: {
  employee_id: number;
  absence_type_id: number;
  date_from: string;
  date_to: string;
  // ... other absence fields
}): Promise<unknown> {
  return this.makeRequest("POST", "/absence", undefined, data);
}

async updateAbsence(absenceId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PUT", `/absence/${absenceId}`, undefined, data);
}

async deleteAbsence(absenceId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/absence/${absenceId}`);
}
```

### Zod Schemas for Purchase
```typescript
// Source: Bexio API docs + established schema patterns
// src/types/schemas/purchase.ts
import { z } from "zod";

// ===== BILLS (PURCH-01) =====
export const ListBillsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetBillParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

export const CreateBillParamsSchema = z.object({
  bill_data: z.record(z.unknown()),
});

export const UpdateBillParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  bill_data: z.record(z.unknown()),
});

export const DeleteBillParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

export const IssueBillParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

export const MarkBillAsPaidParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

// ===== EXPENSES (PURCH-03) =====
export const ListExpensesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetExpenseParamsSchema = z.object({
  expense_id: z.number().int().positive(),
});

export const CreateExpenseParamsSchema = z.object({
  expense_data: z.record(z.unknown()),
});

export const UpdateExpenseParamsSchema = z.object({
  expense_id: z.number().int().positive(),
  expense_data: z.record(z.unknown()),
});

export const DeleteExpenseParamsSchema = z.object({
  expense_id: z.number().int().positive(),
});

// ===== PURCHASE ORDERS (PURCH-04) =====
export const ListPurchaseOrdersParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetPurchaseOrderParamsSchema = z.object({
  purchase_order_id: z.number().int().positive(),
});

export const CreatePurchaseOrderParamsSchema = z.object({
  purchase_order_data: z.record(z.unknown()),
});

export const UpdatePurchaseOrderParamsSchema = z.object({
  purchase_order_id: z.number().int().positive(),
  purchase_order_data: z.record(z.unknown()),
});

export const DeletePurchaseOrderParamsSchema = z.object({
  purchase_order_id: z.number().int().positive(),
});

// ===== OUTGOING PAYMENTS (PURCH-05) =====
export const ListOutgoingPaymentsParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

export const GetOutgoingPaymentParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  payment_id: z.number().int().positive(),
});

export const CreateOutgoingPaymentParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  payment_data: z.record(z.unknown()),
});

export const UpdateOutgoingPaymentParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  payment_id: z.number().int().positive(),
  payment_data: z.record(z.unknown()),
});

export const DeleteOutgoingPaymentParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  payment_id: z.number().int().positive(),
});
```

### Zod Schemas for Files
```typescript
// src/types/schemas/files.ts
import { z } from "zod";

export const ListFilesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetFileParamsSchema = z.object({
  file_id: z.number().int().positive(),
});

export const UploadFileParamsSchema = z.object({
  name: z.string().min(1, "File name is required"),
  content_base64: z.string().min(1, "File content is required"),
  content_type: z.string().min(1, "Content type is required"),
});

export const DownloadFileParamsSchema = z.object({
  file_id: z.number().int().positive(),
});

export const UpdateFileParamsSchema = z.object({
  file_id: z.number().int().positive(),
  file_data: z.record(z.unknown()),
});

export const DeleteFileParamsSchema = z.object({
  file_id: z.number().int().positive(),
});
```

### Zod Schemas for Payroll
```typescript
// src/types/schemas/payroll.ts
import { z } from "zod";

// ===== EMPLOYEES (PAY-01) =====
export const ListEmployeesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetEmployeeParamsSchema = z.object({
  employee_id: z.number().int().positive(),
});

export const CreateEmployeeParamsSchema = z.object({
  employee_data: z.record(z.unknown()),
});

export const UpdateEmployeeParamsSchema = z.object({
  employee_id: z.number().int().positive(),
  employee_data: z.record(z.unknown()),
});

// ===== ABSENCES (PAY-02) =====
export const ListAbsencesParamsSchema = z.object({
  year: z.number().int().positive().optional(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetAbsenceParamsSchema = z.object({
  absence_id: z.number().int().positive(),
});

export const CreateAbsenceParamsSchema = z.object({
  absence_data: z.record(z.unknown()),
});

export const UpdateAbsenceParamsSchema = z.object({
  absence_id: z.number().int().positive(),
  absence_data: z.record(z.unknown()),
});

export const DeleteAbsenceParamsSchema = z.object({
  absence_id: z.number().int().positive(),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate outgoing payment endpoint | Linked to bills (like invoices) | v2.0 API | Use `/kb_bill/{id}/payment` |
| File upload via JSON | Multipart form-data | v2.0 API | Binary content handled properly |
| Payroll always available | Module-dependent | Subscription tiers | Must detect and handle unavailability |

**Deprecated/outdated:**
- Legacy file upload patterns: Use current multipart/form-data approach
- Assuming all features available: Payroll requires module subscription

## Open Questions

Things that couldn't be fully resolved:

1. **Bill Actions Exact Endpoints**
   - What we know: Bills support issue and mark_paid actions
   - What's unclear: Exact endpoint paths (may be `/kb_bill/{id}/issue` or different)
   - Recommendation: Implement with best guess; API errors will reveal correct paths

2. **File Upload Size Limits**
   - What we know: Bexio has file size limits
   - What's unclear: Exact limit (likely 10-50MB based on typical SaaS)
   - Recommendation: Document "subject to Bexio limits" in tool description; API will reject oversized

3. **Payroll Module Detection Endpoint**
   - What we know: 403/404 indicates module unavailable
   - What's unclear: Whether there's a dedicated endpoint to check subscription
   - Recommendation: Use probe-on-first-call pattern (try list_employees with limit=1)

4. **Additional Addresses Endpoint (FILES-03)**
   - What we know: Requirement mentions "additional addresses"
   - What's unclear: API endpoint path for additional addresses
   - Recommendation: Research further; may be `/additional_address` or `/contact/{id}/address`

## Sources

### Primary (HIGH confidence)
- [Bexio API Documentation](https://docs.bexio.com/) - Main endpoint reference for bills, expenses, purchase orders, files, employees, absences
- Existing v2 codebase patterns (tools/invoices/, tools/payments/, bexio-client.ts)
- Phase 3 RESEARCH.md - Architecture patterns and code structure

### Secondary (MEDIUM confidence)
- [Bexio API Overview](https://www.bexio.com/en-CH/api) - API capabilities and access requirements
- [Bexio Payroll Module Help](https://help.bexio.com/s/article/000001671) - Payroll subscription requirements

### Tertiary (LOW confidence)
- WebSearch results for endpoint names - May need validation against live API

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, established patterns
- Architecture: HIGH - Follows Phase 1-3 patterns exactly
- Pitfalls: MEDIUM - Most from official docs, some from community sources
- API endpoints: MEDIUM - Main paths verified, some action paths need testing

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable endpoints)

## Tool Inventory

Phase 4 implements the following tools (approximately 35-40 total):

### Purchase Tools (PURCH-01 through PURCH-05)
| Requirement | Tools | API Operations |
|-------------|-------|----------------|
| PURCH-01 | list_bills, get_bill, create_bill, update_bill, delete_bill, search_bills | 6 |
| PURCH-02 | issue_bill, mark_bill_as_paid | 2 |
| PURCH-03 | list_expenses, get_expense, create_expense, update_expense, delete_expense | 5 |
| PURCH-04 | list_purchase_orders, get_purchase_order, create_purchase_order, update_purchase_order, delete_purchase_order | 5 |
| PURCH-05 | list_outgoing_payments, get_outgoing_payment, create_outgoing_payment, update_outgoing_payment, delete_outgoing_payment | 5 |

**Purchase Subtotal:** ~23 tools

### Files Tools (FILES-01 through FILES-03)
| Requirement | Tools | API Operations |
|-------------|-------|----------------|
| FILES-01 | list_files, get_file, upload_file, update_file, delete_file | 5 |
| FILES-02 | download_file | 1 |
| FILES-03 | list_additional_addresses, get_additional_address, create_additional_address, delete_additional_address | 4 |

**Files Subtotal:** ~10 tools

### Payroll Tools (PAY-01 through PAY-03)
| Requirement | Tools | API Operations |
|-------------|-------|----------------|
| PAY-01 | list_employees, get_employee, create_employee, update_employee | 4 |
| PAY-02 | list_absences, get_absence, create_absence, update_absence, delete_absence | 5 |
| PAY-03 | list_payroll_documents | 1 |

**Payroll Subtotal:** ~10 tools (all conditional on module availability)

**Phase 4 Total:** ~38-43 tools

## Suggested Plan Structure

Based on dependencies and complexity:

### Plan 04-01: Bills & Expenses
- Bills CRUD (list, get, create, update, delete, search)
- Bill actions (issue, mark_paid)
- Expenses CRUD (list, get, create, update, delete)
- ~13 tools

### Plan 04-02: Purchase Orders & Outgoing Payments
- Purchase orders CRUD (list, get, create, update, delete)
- Outgoing payments CRUD (list, get, create, update, delete)
- ~10 tools

### Plan 04-03: Files & Documents
- Files CRUD (list, get, upload, update, delete)
- File download
- Additional addresses (list, get, create, delete)
- ~10 tools

### Plan 04-04: Payroll (Conditional)
- Employees (list, get, create, update) with module detection
- Absences (list, get, create, update, delete) with module detection
- Payroll documents (list) with module detection
- Friendly error handling for module unavailable
- ~10 tools
