# Phase 2: Reference Data & Banking - Research

**Researched:** 2026-02-01
**Domain:** Bexio API Reference Data & Swiss Banking Payments
**Confidence:** HIGH

## Summary

Phase 2 implements reference data endpoints (contact groups, sectors, salutations, titles, countries, languages, units, payment types, company profile, permissions) and Swiss banking features (bank accounts, currencies, IBAN payments, QR payments). This phase builds on the modular architecture established in Phase 1, adding 14 new requirements across approximately 35-40 new tools.

The reference data endpoints are straightforward CRUD operations following the existing pattern from Phase 1. The banking features require Swiss-specific knowledge: IBAN payments follow ISO 20022 Swiss Payment Standards, and QR payments follow SIX Group's QR-bill specification (IG QR-bill v2.3). As of November 2025, only structured addresses (type "S") are permitted in QR codes, with unstructured addresses rejected from September 2026.

**Primary recommendation:** Follow the existing domain module pattern established in Phase 1. Create new domain folders (`reference/`, `banking/`) with definitions.ts, handlers.ts, and index.ts files. Add BexioClient methods for each API endpoint. The Swiss banking features require no external libraries - the Bexio API handles ISO 20022/QR-bill complexity server-side.

## Standard Stack

The established libraries/tools for this domain:

### Core (Existing from Phase 1)
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
| Custom QR generation | Native Bexio API | Bexio handles QR code generation; no need for client-side libraries |
| IBAN validation library | Native Bexio API | Bexio validates IBANs server-side; client can add optional pre-validation |

**Installation:**
```bash
# No new packages needed - Phase 2 uses existing dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── tools/
│   ├── reference/           # NEW: Reference data domain
│   │   ├── definitions.ts   # Tool definitions for all reference data
│   │   ├── handlers.ts      # Handler implementations
│   │   └── index.ts         # Barrel export
│   ├── banking/             # NEW: Banking domain
│   │   ├── definitions.ts   # Tool definitions for banking/payments
│   │   ├── handlers.ts      # Handler implementations
│   │   └── index.ts         # Barrel export
│   ├── contacts/            # Existing
│   ├── invoices/            # Existing
│   └── index.ts             # Update to include new domains
├── types/
│   └── schemas/
│       ├── reference.ts     # NEW: Reference data schemas
│       ├── banking.ts       # NEW: Banking schemas
│       └── index.ts         # Update to export new schemas
└── bexio-client.ts          # Add new API methods
```

### Pattern 1: Domain Module Structure (Established in Phase 1)
**What:** Each domain has definitions.ts, handlers.ts, index.ts
**When to use:** Always - this is the mandatory pattern
**Example:**
```typescript
// Source: Existing tools/contacts/definitions.ts pattern
// tools/reference/definitions.ts
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_contact_groups",
    description: "List all contact groups",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Max results", default: 100 },
        offset: { type: "integer", description: "Skip count", default: 0 },
      },
    },
  },
  // ... more tools
];
```

### Pattern 2: Simple CRUD Handler (Reference Data)
**What:** Straightforward API passthrough with Zod validation
**When to use:** Reference data tools (groups, sectors, salutations, etc.)
**Example:**
```typescript
// Source: Existing tools/contacts/handlers.ts pattern
// tools/reference/handlers.ts
import { BexioClient } from "../../bexio-client.js";
import { ListContactGroupsParamsSchema } from "../../types/index.js";

export const handlers: Record<string, HandlerFn> = {
  list_contact_groups: async (client, args) => {
    const params = ListContactGroupsParamsSchema.parse(args);
    return client.listContactGroups(params);
  },

  create_contact_group: async (client, args) => {
    const { name } = CreateContactGroupParamsSchema.parse(args);
    return client.createContactGroup({ name });
  },
};
```

### Pattern 3: Banking Handler with Structured Request
**What:** Payments require structured objects (recipient, instructed_amount)
**When to use:** IBAN payments, QR payments
**Example:**
```typescript
// tools/banking/handlers.ts
export const handlers: Record<string, HandlerFn> = {
  create_qr_payment: async (client, args) => {
    const params = CreateQrPaymentParamsSchema.parse(args);
    // Build structured request body
    const paymentData = {
      bank_account_id: params.bank_account_id,
      iban: params.iban,
      instructed_amount: {
        currency: params.currency,
        amount: params.amount,
      },
      recipient: {
        name: params.recipient_name,
        street: params.recipient_street,
        house_number: params.recipient_house_number,
        zip: params.recipient_zip,
        city: params.recipient_city,
        country_code: params.recipient_country_code,
      },
      execution_date: params.execution_date,
      qr_reference_nr: params.qr_reference_nr,
      additional_information: params.additional_information,
    };
    return client.createQrPayment(paymentData);
  },
};
```

### Anti-Patterns to Avoid
- **Hand-rolling IBAN/QR validation:** Bexio API validates server-side. Don't duplicate validation logic.
- **Flattening nested response objects:** Return Bexio API responses as-is. Don't transform structures.
- **Creating mega-handlers:** Keep each handler focused on one operation. No multi-operation handlers.
- **Hardcoding reference data:** Use API endpoints, not hardcoded lists (countries, currencies change).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IBAN validation | Custom IBAN format checker | Bexio API validation | API returns errors for invalid IBANs |
| QR reference checksum | Modulo 10 recursive calculation | Bexio API | QR reference validation is complex |
| Currency code list | Hardcoded ISO 4217 list | GET /2.0/currency_code endpoint | API provides current valid codes |
| Country list | Hardcoded ISO 3166 | GET /2.0/country endpoint | Dynamic, user can add custom |
| Swiss address formatting | Custom formatting logic | Structured address in API | API enforces Swiss standards |

**Key insight:** The Bexio API handles Swiss financial standard compliance (ISO 20022, QR-bill spec). The MCP server should pass through requests and let Bexio validate/format.

## Common Pitfalls

### Pitfall 1: QR Reference vs Creditor Reference Confusion
**What goes wrong:** Using wrong reference type with wrong IBAN type
**Why it happens:** QR references require QR-IBANs (5th digit is 3); Creditor references use standard IBANs
**How to avoid:** Document in tool descriptions; let API validate
**Warning signs:** API returns error about reference/IBAN mismatch

### Pitfall 2: Address Type Changes (November 2025)
**What goes wrong:** Using unstructured addresses (type K) which will be rejected from Sept 2026
**Why it happens:** Old code/examples show combined address format
**How to avoid:** Always use structured addresses (type S) with separate street, house_number, zip, city
**Warning signs:** Deprecation warnings in Bexio responses

### Pitfall 3: Currency Field Size Limits
**What goes wrong:** Fields truncated or rejected
**Why it happens:** Bexio has shorter limits than ISO standards (e.g., postal code max 10 chars vs 16 in spec)
**How to avoid:** Document limits in tool descriptions; let API validate
**Warning signs:** Validation errors on create/update

### Pitfall 4: Missing Bank Account ID
**What goes wrong:** Payment creation fails with "bank_account_id required"
**Why it happens:** Developers try to create payments without first fetching bank accounts
**How to avoid:** Document dependency in tool descriptions; suggest list_bank_accounts first
**Warning signs:** 400 errors on payment creation

### Pitfall 5: Read-Only vs CRUD Confusion
**What goes wrong:** Attempting to create/update read-only resources
**Why it happens:** Not all reference data supports full CRUD
**How to avoid:** Follow API docs exactly:
  - Bank accounts: READ-ONLY (list, get)
  - Permissions: READ-ONLY (list)
  - Contact sectors: list, get, create (no delete)
  - Languages: list, get, create (no delete)
**Warning signs:** 405 Method Not Allowed errors

## Code Examples

Verified patterns from official sources:

### BexioClient API Methods for Reference Data
```typescript
// Source: Bexio API docs (docs.bexio.com) + existing BexioClient pattern
// Add to src/bexio-client.ts

// ===== CONTACT GROUPS =====
async listContactGroups(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/contact_group", params);
}

async getContactGroup(groupId: number): Promise<unknown> {
  return this.makeRequest("GET", `/contact_group/${groupId}`);
}

async createContactGroup(data: { name: string }): Promise<unknown> {
  return this.makeRequest("POST", "/contact_group", undefined, data);
}

async deleteContactGroup(groupId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/contact_group/${groupId}`);
}

// ===== CONTACT SECTORS =====
async listContactSectors(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/contact_sector", params);
}

async getContactSector(sectorId: number): Promise<unknown> {
  return this.makeRequest("GET", `/contact_sector/${sectorId}`);
}

async createContactSector(data: { name: string }): Promise<unknown> {
  return this.makeRequest("POST", "/contact_sector", undefined, data);
}

// ===== SALUTATIONS =====
async listSalutations(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/salutation", params);
}

async getSalutation(salutationId: number): Promise<unknown> {
  return this.makeRequest("GET", `/salutation/${salutationId}`);
}

async createSalutation(data: { name: string }): Promise<unknown> {
  return this.makeRequest("POST", "/salutation", undefined, data);
}

async deleteSalutation(salutationId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/salutation/${salutationId}`);
}

// ===== TITLES =====
async listTitles(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/title", params);
}

async getTitle(titleId: number): Promise<unknown> {
  return this.makeRequest("GET", `/title/${titleId}`);
}

async createTitle(data: { name: string }): Promise<unknown> {
  return this.makeRequest("POST", "/title", undefined, data);
}

async deleteTitle(titleId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/title/${titleId}`);
}

// ===== COUNTRIES =====
async listCountries(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/country", params);
}

async getCountry(countryId: number): Promise<unknown> {
  return this.makeRequest("GET", `/country/${countryId}`);
}

async createCountry(data: { name: string; iso_3166_alpha2: string }): Promise<unknown> {
  return this.makeRequest("POST", "/country", undefined, data);
}

async deleteCountry(countryId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/country/${countryId}`);
}

// ===== LANGUAGES =====
async listLanguages(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/language", params);
}

async getLanguage(languageId: number): Promise<unknown> {
  return this.makeRequest("GET", `/language/${languageId}`);
}

async createLanguage(data: { name: string; iso_639_1: string }): Promise<unknown> {
  return this.makeRequest("POST", "/language", undefined, data);
}

// ===== UNITS =====
async listUnits(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/unit", params);
}

async getUnit(unitId: number): Promise<unknown> {
  return this.makeRequest("GET", `/unit/${unitId}`);
}

async createUnit(data: { name: string }): Promise<unknown> {
  return this.makeRequest("POST", "/unit", undefined, data);
}

async deleteUnit(unitId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/unit/${unitId}`);
}

// ===== PAYMENT TYPES =====
async listPaymentTypes(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/payment_type", params);
}

async getPaymentType(paymentTypeId: number): Promise<unknown> {
  return this.makeRequest("GET", `/payment_type/${paymentTypeId}`);
}

async createPaymentType(data: { name: string }): Promise<unknown> {
  return this.makeRequest("POST", "/payment_type", undefined, data);
}

// ===== COMPANY PROFILE =====
async getCompanyProfile(): Promise<unknown> {
  return this.makeRequest("GET", "/company_profile");
}

async updateCompanyProfile(data: Record<string, unknown>): Promise<unknown> {
  // Note: Company profile endpoint may need specific ID
  return this.makeRequest("POST", "/company_profile", undefined, data);
}

// ===== PERMISSIONS =====
async listPermissions(): Promise<unknown> {
  return this.makeRequest("GET", "/user/permission");
}
```

### BexioClient API Methods for Banking
```typescript
// Source: Bexio API docs (docs.bexio.com) + Swiss Payment Standards
// Add to src/bexio-client.ts

// ===== BANK ACCOUNTS (Read-Only) =====
async listBankAccounts(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/bank_account", params);
}

async getBankAccount(accountId: number): Promise<unknown> {
  return this.makeRequest("GET", `/bank_account/${accountId}`);
}

// ===== CURRENCIES =====
async listCurrencies(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/currency", params);
}

async getCurrency(currencyId: number): Promise<unknown> {
  return this.makeRequest("GET", `/currency/${currencyId}`);
}

async createCurrency(data: { name: string; round_factor: number }): Promise<unknown> {
  return this.makeRequest("POST", "/currency", undefined, data);
}

async updateCurrency(currencyId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PATCH", `/currency/${currencyId}`, undefined, data);
}

async deleteCurrency(currencyId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/currency/${currencyId}`);
}

// ===== IBAN PAYMENTS (Swiss ISO 20022) =====
async createIbanPayment(data: {
  bank_account_id: number;
  iban: string;
  instructed_amount: { currency: string; amount: number };
  recipient: {
    name: string;
    street?: string;
    house_number?: string;
    zip: string;
    city: string;
    country_code: string;
  };
  execution_date: string;
  message?: string;
  is_salary_payment?: boolean;
  is_editing_restricted?: boolean;
  allowance_type?: string;
}): Promise<unknown> {
  return this.makeRequest("POST", "/iban_payment", undefined, data);
}

async getIbanPayment(paymentId: number): Promise<unknown> {
  return this.makeRequest("GET", `/iban_payment/${paymentId}`);
}

async updateIbanPayment(paymentId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PATCH", `/iban_payment/${paymentId}`, undefined, data);
}

// ===== QR PAYMENTS (Swiss QR-invoice standard) =====
async createQrPayment(data: {
  bank_account_id: number;
  iban: string;
  instructed_amount: { currency: string; amount: number };
  recipient: {
    name: string;
    street?: string;
    house_number?: string;
    zip: string;
    city: string;
    country_code: string;
  };
  execution_date: string;
  qr_reference_nr?: string;
  additional_information?: string;
  is_editing_restricted?: boolean;
}): Promise<unknown> {
  return this.makeRequest("POST", "/qr_payment", undefined, data);
}

async getQrPayment(paymentId: number): Promise<unknown> {
  return this.makeRequest("GET", `/qr_payment/${paymentId}`);
}

async updateQrPayment(paymentId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PATCH", `/qr_payment/${paymentId}`, undefined, data);
}
```

### Zod Schemas for Banking
```typescript
// Source: Bexio API docs + Swiss QR-bill spec
// src/types/schemas/banking.ts
import { z } from "zod";

// Recipient address (structured format - required from Nov 2025)
const RecipientSchema = z.object({
  name: z.string().max(70),
  street: z.string().max(70).optional(),
  house_number: z.string().max(16).optional(),
  zip: z.string().max(10),  // Note: Bexio limit is 10, not ISO 16
  city: z.string().max(35),
  country_code: z.string().length(2),
});

// Instructed amount
const InstructedAmountSchema = z.object({
  currency: z.enum(["CHF", "EUR"]),
  amount: z.number().positive().max(999999999.99),
});

// QR Payment creation
export const CreateQrPaymentParamsSchema = z.object({
  bank_account_id: z.number().int().positive(),
  iban: z.string().min(15).max(34),
  currency: z.enum(["CHF", "EUR"]),
  amount: z.number().positive(),
  recipient_name: z.string().max(70),
  recipient_street: z.string().max(70).optional(),
  recipient_house_number: z.string().max(16).optional(),
  recipient_zip: z.string().max(10),
  recipient_city: z.string().max(35),
  recipient_country_code: z.string().length(2).default("CH"),
  execution_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  qr_reference_nr: z.string().length(27).regex(/^\d+$/).optional(),
  additional_information: z.string().max(140).optional(),
});

// IBAN Payment creation
export const CreateIbanPaymentParamsSchema = z.object({
  bank_account_id: z.number().int().positive(),
  iban: z.string().min(15).max(34),
  currency: z.enum(["CHF", "EUR"]),
  amount: z.number().positive(),
  recipient_name: z.string().max(70),
  recipient_street: z.string().max(70).optional(),
  recipient_house_number: z.string().max(16).optional(),
  recipient_zip: z.string().max(10),
  recipient_city: z.string().max(35),
  recipient_country_code: z.string().length(2).default("CH"),
  execution_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  message: z.string().max(140).optional(),
  is_salary_payment: z.boolean().default(false),
  allowance_type: z.enum(["no_fee", "our", "ben", "sha"]).default("no_fee"),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Unstructured addresses (type K) | Structured addresses (type S) only | Nov 2025 | Required for QR-bills |
| Orange payment slips | QR-bill (Swiss QR Code) | Oct 2022 | QR payments mandatory |
| pain.001.001.03 | pain.001.001.09 | SPS 2025 | ISO 20022 version update |
| Combined address fields | Separate street, house_number, zip, city | Nov 2025 | Reject unstructured Sept 2026 |

**Deprecated/outdated:**
- Orange payment slips (ESR/BVR): Replaced by QR-bill as of October 2022
- Unstructured addresses in QR codes: Deprecated November 2025, rejected September 2026
- Legacy timesheet API: Use /2.0/timesheet (already handled in v1)

## Open Questions

Things that couldn't be fully resolved:

1. **Company Profile Update Endpoint**
   - What we know: GET /2.0/company_profile exists
   - What's unclear: Whether POST update requires ID or is profile-global
   - Recommendation: Test API behavior; may need GET first to retrieve ID

2. **Payment Type Creation Fields**
   - What we know: POST /2.0/payment_type creates payment types
   - What's unclear: Full schema of required/optional fields beyond name
   - Recommendation: Implement with minimal required fields; API will error on missing

3. **Currency Round Factor**
   - What we know: Currency creation requires round_factor
   - What's unclear: Valid values and their meaning
   - Recommendation: Default to 0.05 for CHF (5 rappen rounding)

## Sources

### Primary (HIGH confidence)
- [Bexio API Documentation](https://docs.bexio.com/) - All endpoint specifications
- Existing v1 codebase patterns (tools/contacts/, bexio-client.ts)
- [SIX Group QR-bill Implementation Guidelines v2.3](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.3-en.pdf) - Swiss QR-bill spec

### Secondary (MEDIUM confidence)
- [SIX Group ISO 20022 Swiss Payment Standards](https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/iso-20022.html) - IBAN payment format
- [Bexio Help Center - QR Invoice](https://support.bexio.com/hc/en-us/articles/360012125539-QR-Invoice) - User-facing documentation

### Tertiary (LOW confidence)
- Third-party library docs (codebar-ag/laravel-bexio) - Field examples

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, established patterns
- Architecture: HIGH - Follows Phase 1 patterns exactly
- Pitfalls: MEDIUM - Swiss banking specifics from official SIX docs, some Bexio-specific limits from community sources

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days for stable reference data endpoints; Swiss payment standards are stable)

## Tool Inventory

Phase 2 implements the following tools (approximately 40 total):

### Reference Data Tools (REFDATA-01 through REFDATA-10)
| Requirement | Tools | API Operations |
|-------------|-------|----------------|
| REFDATA-01 | list_contact_groups, get_contact_group, create_contact_group, delete_contact_group | 4 |
| REFDATA-02 | list_contact_sectors, get_contact_sector, create_contact_sector | 3 |
| REFDATA-03 | list_salutations, get_salutation, create_salutation, delete_salutation | 4 |
| REFDATA-04 | list_titles, get_title, create_title, delete_title | 4 |
| REFDATA-05 | list_countries, get_country, create_country, delete_country | 4 |
| REFDATA-06 | list_languages, get_language, create_language | 3 |
| REFDATA-07 | list_units, get_unit, create_unit, delete_unit | 4 |
| REFDATA-08 | list_payment_types, get_payment_type, create_payment_type | 3 |
| REFDATA-09 | get_company_profile, update_company_profile | 2 |
| REFDATA-10 | list_permissions | 1 |

**Reference Data Subtotal:** 32 tools

### Banking Tools (BANK-01 through BANK-04)
| Requirement | Tools | API Operations |
|-------------|-------|----------------|
| BANK-01 | list_bank_accounts, get_bank_account | 2 |
| BANK-02 | list_currencies, get_currency, create_currency, update_currency, delete_currency | 5 |
| BANK-03 | create_iban_payment, get_iban_payment, update_iban_payment | 3 |
| BANK-04 | create_qr_payment, get_qr_payment, update_qr_payment | 3 |

**Banking Subtotal:** 13 tools

**Phase 2 Total:** ~45 tools (some may combine operations)

## Suggested Plan Structure

Based on dependencies and complexity:

### Plan 02-01: Reference Data Tools
- Contact groups, sectors, salutations, titles, countries, languages, units
- Low complexity, follows existing patterns
- ~28 tools

### Plan 02-02: Company & Payments Config
- Company profile, permissions, payment types
- Low complexity
- ~6 tools

### Plan 02-03: Banking Tools
- Bank accounts (read-only), currencies, IBAN payments, QR payments
- Medium complexity (structured request bodies)
- ~11 tools
