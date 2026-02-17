/**
 * Contact tool handlers.
 * Implements the logic for each contact tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListContactsParamsSchema,
  GetContactParamsSchema,
  SearchContactsParamsSchema,
  AdvancedSearchContactsParamsSchema,
  FindContactByNumberParamsSchema,
  FindContactByNameParamsSchema,
  UpdateContactParamsSchema,
} from "../../types/index.js";
import type { HandlerFn } from "../index.js";

export const handlers: Record<string, HandlerFn> = {
  list_contacts: async (client, args) => {
    const params = ListContactsParamsSchema.parse(args);
    return client.listContacts(params);
  },

  get_contact: async (client, args) => {
    const { contact_id } = GetContactParamsSchema.parse(args);
    const contact = await client.getContact(contact_id);
    if (!contact) {
      throw McpError.notFound("Contact", contact_id);
    }
    return contact;
  },

  search_contacts: async (client, args) => {
    const { query, limit } = SearchContactsParamsSchema.parse(args);
    return client.searchContacts(query, limit);
  },

  advanced_search_contacts: async (client, args) => {
    const { search_criteria, limit } =
      AdvancedSearchContactsParamsSchema.parse(args);
    return client.advancedSearchContacts(search_criteria, limit);
  },

  find_contact_by_number: async (client, args) => {
    const { contact_number } = FindContactByNumberParamsSchema.parse(args);
    return client.findContactByNumber(contact_number);
  },

  find_contact_by_name: async (client, args) => {
    const { name } = FindContactByNameParamsSchema.parse(args);
    return client.findContactByName(name);
  },

  update_contact: async (client, args) => {
    const { contact_id, contact_data } = UpdateContactParamsSchema.parse(args);
    return client.updateContact(contact_id, contact_data);
  },
};
