/**
 * Notes tool handlers.
 * Implements the logic for each notes tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListNotesParamsSchema,
  GetNoteParamsSchema,
  CreateNoteParamsSchema,
  UpdateNoteParamsSchema,
  DeleteNoteParamsSchema,
  SearchNotesParamsSchema,
  RESOURCE_TYPE_MAP,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_notes: async (client, args) => {
    const params = ListNotesParamsSchema.parse(args);
    if (params.resource_type && params.resource_id) {
      const mappedType = RESOURCE_TYPE_MAP[params.resource_type];
      return client.listNotes(mappedType, params.resource_id, {
        limit: params.limit,
        offset: params.offset,
      });
    }
    return client.listAllNotes({ limit: params.limit, offset: params.offset });
  },

  get_note: async (client, args) => {
    const { note_id } = GetNoteParamsSchema.parse(args);
    const note = await client.getNote(note_id);
    if (!note) {
      throw McpError.notFound("Note", note_id);
    }
    return note;
  },

  create_note: async (client, args) => {
    const params = CreateNoteParamsSchema.parse(args);
    const mappedType = RESOURCE_TYPE_MAP[params.resource_type];
    return client.createNote({
      event_module: mappedType,
      event_module_id: params.resource_id,
      title: params.title,
      info: params.content,
      is_public: params.is_public,
    });
  },

  update_note: async (client, args) => {
    const { note_id, note_data } = UpdateNoteParamsSchema.parse(args);
    return client.updateNote(note_id, note_data);
  },

  delete_note: async (client, args) => {
    const { note_id } = DeleteNoteParamsSchema.parse(args);
    return client.deleteNote(note_id);
  },

  search_notes: async (client, args) => {
    const params = SearchNotesParamsSchema.parse(args);
    const criteria: Record<string, unknown>[] = [
      { field: "title", value: params.query, criteria: "like" },
    ];
    if (params.resource_type) {
      const mappedType = RESOURCE_TYPE_MAP[params.resource_type];
      criteria.push({
        field: "event_module",
        value: mappedType,
        criteria: "=",
      });
    }
    return client.searchNotes(criteria, { limit: params.limit });
  },
};
