/**
 * Projects Zod schemas and types.
 * Domain: Projects (Projects, Project Types, Project Statuses)
 */

import { z } from "zod";

// ===== PROJECTS (PROJ-01) =====

export const ListProjectsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListProjectsParams = z.infer<typeof ListProjectsParamsSchema>;

export const GetProjectParamsSchema = z.object({
  project_id: z.number().int().positive(),
});

export type GetProjectParams = z.infer<typeof GetProjectParamsSchema>;

export const CreateProjectParamsSchema = z.object({
  user_id: z.number().int().positive(),
  name: z.string().min(1, "Project name is required"),
  contact_id: z.number().int().positive().optional(),
  pr_state_id: z.number().int().positive().optional(),
  pr_project_type_id: z.number().int().positive().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  comment: z.string().optional(),
});

export type CreateProjectParams = z.infer<typeof CreateProjectParamsSchema>;

export const UpdateProjectParamsSchema = z.object({
  project_id: z.number().int().positive(),
  project_data: z.record(z.unknown()),
});

export type UpdateProjectParams = z.infer<typeof UpdateProjectParamsSchema>;

export const DeleteProjectParamsSchema = z.object({
  project_id: z.number().int().positive(),
});

export type DeleteProjectParams = z.infer<typeof DeleteProjectParamsSchema>;

export const ArchiveProjectParamsSchema = z.object({
  project_id: z.number().int().positive(),
});

export type ArchiveProjectParams = z.infer<typeof ArchiveProjectParamsSchema>;

export const UnarchiveProjectParamsSchema = z.object({
  project_id: z.number().int().positive(),
});

export type UnarchiveProjectParams = z.infer<typeof UnarchiveProjectParamsSchema>;

export const SearchProjectsParamsSchema = z.object({
  search_criteria: z.array(
    z.object({
      field: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
      criteria: z.string().optional(),
    })
  ),
});

export type SearchProjectsParams = z.infer<typeof SearchProjectsParamsSchema>;

// ===== PROJECT TYPES (PROJ-02) =====

export const ListProjectTypesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListProjectTypesParams = z.infer<typeof ListProjectTypesParamsSchema>;

export const GetProjectTypeParamsSchema = z.object({
  type_id: z.number().int().positive(),
});

export type GetProjectTypeParams = z.infer<typeof GetProjectTypeParamsSchema>;

// ===== PROJECT STATUSES (PROJ-03) =====

export const ListProjectStatusesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListProjectStatusesParams = z.infer<typeof ListProjectStatusesParamsSchema>;

export const GetProjectStatusParamsSchema = z.object({
  status_id: z.number().int().positive(),
});

export type GetProjectStatusParams = z.infer<typeof GetProjectStatusParamsSchema>;
