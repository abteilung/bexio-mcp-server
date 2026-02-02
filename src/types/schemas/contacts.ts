/**
 * Contact-related Zod schemas and types.
 * Domain: Contacts (CRM)
 */

import { z } from "zod";
import { SearchCriteriaSchema, PaginationParams } from "../common.js";

// List contacts with optional filtering
export const ListContactsParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
  search_term: z.string().optional(),
  contact_type_id: z.number().int().positive().optional(),
});

export type ListContactsParams = z.infer<typeof ListContactsParamsSchema>;

// Get single contact
export const GetContactParamsSchema = z.object({
  contact_id: z.number().int().positive(),
});

export type GetContactParams = z.infer<typeof GetContactParamsSchema>;

// Simple search
export const SearchContactsParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().positive().default(50),
});

export type SearchContactsParams = z.infer<typeof SearchContactsParamsSchema>;

// Advanced search with multiple criteria
export const AdvancedSearchContactsParamsSchema = z.object({
  search_criteria: z
    .array(SearchCriteriaSchema)
    .min(1, "At least one search criterion is required"),
  limit: z.number().int().positive().default(50),
});

export type AdvancedSearchContactsParams = z.infer<
  typeof AdvancedSearchContactsParamsSchema
>;

// Find by contact number (e.g., '001008')
export const FindContactByNumberParamsSchema = z.object({
  contact_number: z.string().min(1, "Contact number is required"),
});

export type FindContactByNumberParams = z.infer<
  typeof FindContactByNumberParamsSchema
>;

// Find by name
export const FindContactByNameParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type FindContactByNameParams = z.infer<
  typeof FindContactByNameParamsSchema
>;

// Update contact
export const UpdateContactParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  contact_data: z.record(z.unknown()),
});

export type UpdateContactParams = z.infer<typeof UpdateContactParamsSchema>;

// Search params interface for client methods
export interface ContactSearchParams extends PaginationParams {
  search_term?: string;
  contact_type_id?: number;
}
