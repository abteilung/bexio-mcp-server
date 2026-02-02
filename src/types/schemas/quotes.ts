/**
 * Quote-related Zod schemas and types.
 * Domain: Quotes/Offers (kb_offer)
 */

import { z } from "zod";

// List quotes
export const ListQuotesParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListQuotesParams = z.infer<typeof ListQuotesParamsSchema>;

// Get single quote
export const GetQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type GetQuoteParams = z.infer<typeof GetQuoteParamsSchema>;

// Create quote
export const CreateQuoteParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  quote_data: z.record(z.unknown()),
});

export type CreateQuoteParams = z.infer<typeof CreateQuoteParamsSchema>;

// Search quotes
export const SearchQuotesParamsSchema = z.object({
  search_params: z.record(z.unknown()),
});

export type SearchQuotesParams = z.infer<typeof SearchQuotesParamsSchema>;

// Search by customer name
export const SearchQuotesByCustomerParamsSchema = z.object({
  customer_name: z.string().min(1),
  limit: z.number().int().positive().default(50),
});

export type SearchQuotesByCustomerParams = z.infer<
  typeof SearchQuotesByCustomerParamsSchema
>;

// Quote actions
export const IssueQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type IssueQuoteParams = z.infer<typeof IssueQuoteParamsSchema>;

export const AcceptQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type AcceptQuoteParams = z.infer<typeof AcceptQuoteParamsSchema>;

export const DeclineQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type DeclineQuoteParams = z.infer<typeof DeclineQuoteParamsSchema>;

export const SendQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type SendQuoteParams = z.infer<typeof SendQuoteParamsSchema>;

// Create order from quote
export const CreateOrderFromQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type CreateOrderFromQuoteParams = z.infer<
  typeof CreateOrderFromQuoteParamsSchema
>;

// Create invoice from quote
export const CreateInvoiceFromQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type CreateInvoiceFromQuoteParams = z.infer<
  typeof CreateInvoiceFromQuoteParamsSchema
>;
