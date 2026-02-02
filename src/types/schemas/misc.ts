/**
 * Misc-related Zod schemas and types.
 * Domain: Comments and Contact Relations
 */

import { z } from "zod";

// ===== COMMENTS =====

// Get comment
export const GetCommentParamsSchema = z.object({
  comment_id: z.number().int().positive(),
});

export type GetCommentParams = z.infer<typeof GetCommentParamsSchema>;

// Create comment
export const CreateCommentParamsSchema = z.object({
  comment_data: z.record(z.unknown()),
});

export type CreateCommentParams = z.infer<typeof CreateCommentParamsSchema>;

// ===== CONTACT RELATIONS =====

// Get contact relation
export const GetContactRelationParamsSchema = z.object({
  relation_id: z.number().int().positive(),
});

export type GetContactRelationParams = z.infer<
  typeof GetContactRelationParamsSchema
>;

// Create contact relation
export const CreateContactRelationParamsSchema = z.object({
  relation_data: z.record(z.unknown()),
});

export type CreateContactRelationParams = z.infer<
  typeof CreateContactRelationParamsSchema
>;

// Update contact relation
export const UpdateContactRelationParamsSchema = z.object({
  relation_id: z.number().int().positive(),
  relation_data: z.record(z.unknown()),
});

export type UpdateContactRelationParams = z.infer<
  typeof UpdateContactRelationParamsSchema
>;

// Delete contact relation
export const DeleteContactRelationParamsSchema = z.object({
  relation_id: z.number().int().positive(),
});

export type DeleteContactRelationParams = z.infer<
  typeof DeleteContactRelationParamsSchema
>;

// Search contact relations
export const SearchContactRelationsParamsSchema = z.object({
  search_params: z.record(z.unknown()),
});

export type SearchContactRelationsParams = z.infer<
  typeof SearchContactRelationsParamsSchema
>;
