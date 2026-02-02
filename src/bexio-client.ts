/**
 * Bexio API Client.
 * Handles all HTTP communication with the Bexio API.
 * Uses logger for all output (no console.log).
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import { logger } from "./logger.js";
import { McpError } from "./shared/errors.js";
import {
  BexioConfig,
  PaginationParams,
  ContactSearchParams,
  InvoiceSearchParams,
  InvoiceCreate,
  OrderCreate,
  SearchCriteria,
} from "./types/index.js";

export class BexioClient {
  private client: AxiosInstance;
  private config: BexioConfig;

  constructor(config: BexioConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const message =
            error.response.data?.message || error.response.statusText;
          throw McpError.bexioApi(message, status, {
            url: error.config?.url,
            method: error.config?.method,
          });
        } else if (error.request) {
          throw McpError.bexioApi("No response received from server", undefined, {
            error: "NETWORK_ERROR",
          });
        } else {
          throw McpError.internal(error.message);
        }
      }
    );
  }

  private async makeRequest<T = unknown>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    endpoint: string,
    params?: Record<string, unknown> | PaginationParams,
    data?: unknown
  ): Promise<T> {
    logger.debug(`${method} ${endpoint}`, { params, hasData: !!data });
    const response: AxiosResponse<T> = await this.client.request({
      method,
      url: endpoint,
      params,
      data,
    });
    return response.data;
  }

  // ===== ORDERS =====
  async listOrders(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/kb_order", params);
  }

  async getOrder(orderId: number): Promise<unknown> {
    return this.makeRequest("GET", `/kb_order/${orderId}`);
  }

  async createOrder(orderData: OrderCreate): Promise<unknown> {
    return this.makeRequest("POST", "/kb_order", undefined, orderData);
  }

  async searchOrders(searchParams: Record<string, unknown>): Promise<unknown[]> {
    return this.makeRequest("POST", "/kb_order/search", undefined, searchParams);
  }

  async searchOrdersByContactId(contactId: number): Promise<unknown[]> {
    const searchParams = [
      { field: "contact_id", operator: "=", value: contactId.toString() },
    ];
    return this.makeRequest("POST", "/kb_order/search", undefined, searchParams);
  }

  async createDeliveryFromOrder(orderId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_order/${orderId}/create_delivery`);
  }

  async createInvoiceFromOrder(orderId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_order/${orderId}/create_invoice`);
  }

  // ===== CONTACTS =====
  async listContacts(params: ContactSearchParams = {}): Promise<unknown[]> {
    const searchParams: Record<string, unknown> = {
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
    };

    if (params.search_term) {
      searchParams["search"] = params.search_term;
    }
    if (params.contact_type_id) {
      searchParams["contact_type_id"] = params.contact_type_id;
    }

    return this.makeRequest("GET", "/contact", searchParams);
  }

  async getContact(contactId: number): Promise<unknown> {
    return this.makeRequest("GET", `/contact/${contactId}`);
  }

  async searchContacts(query: string, limit = 50): Promise<unknown[]> {
    const searchCriteria: SearchCriteria[] = [
      { field: "name_1", value: query, criteria: "like" },
    ];
    return this.advancedSearchContacts(searchCriteria, limit);
  }

  async advancedSearchContacts(
    searchCriteria: SearchCriteria[],
    limit = 50
  ): Promise<unknown[]> {
    const params = { limit };
    return this.makeRequest("POST", "/contact/search", params, searchCriteria);
  }

  async findContactByNumber(contactNumber: string): Promise<unknown> {
    const searchCriteria: SearchCriteria[] = [
      { field: "nr", value: contactNumber, criteria: "=" },
    ];
    const contacts = await this.advancedSearchContacts(searchCriteria, 1);

    if (Array.isArray(contacts) && contacts.length > 0) {
      return contacts[0];
    }

    throw McpError.notFound("Contact", contactNumber);
  }

  async findContactByName(name: string): Promise<unknown[]> {
    const searchCriteria: SearchCriteria[] = [
      { field: "name_1", value: name, criteria: "like" },
    ];
    return this.advancedSearchContacts(searchCriteria, 100);
  }

  async updateContact(
    contactId: number,
    contactData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest("POST", `/contact/${contactId}`, undefined, contactData);
  }

  // ===== QUOTES =====
  async createQuote(quoteData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", "/kb_offer", undefined, quoteData);
  }

  async listQuotes(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/kb_offer", params);
  }

  async getQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("GET", `/kb_offer/${quoteId}`);
  }

  async searchQuotes(searchParams: Record<string, unknown>): Promise<unknown[]> {
    return this.makeRequest("POST", "/kb_offer/search", undefined, searchParams);
  }

  async searchQuotesByContactId(contactId: number): Promise<unknown[]> {
    const searchParams = [
      { field: "contact_id", operator: "=", value: contactId.toString() },
    ];
    return this.makeRequest("POST", "/kb_offer/search", undefined, searchParams);
  }

  async issueQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/issue`);
  }

  async acceptQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/accept`);
  }

  async declineQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/decline`);
  }

  async sendQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/send`);
  }

  async createOrderFromQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/create_order`);
  }

  async createInvoiceFromQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/create_invoice`);
  }

  // ===== INVOICES =====
  async listInvoices(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/kb_invoice", params);
  }

  async getInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("GET", `/kb_invoice/${invoiceId}`);
  }

  async createInvoice(invoiceData: InvoiceCreate): Promise<unknown> {
    // Set current date if not provided
    if (!invoiceData.is_valid_from) {
      invoiceData.is_valid_from = new Date().toISOString().split("T")[0];
    }
    return this.makeRequest("POST", "/kb_invoice", undefined, invoiceData);
  }

  async listAllInvoices(chunkSize = 100): Promise<unknown[]> {
    if (chunkSize <= 0) {
      throw McpError.validation("chunk_size must be positive");
    }

    const invoices: unknown[] = [];
    let offset = 0;

    while (offset < 10000) {
      const batch = await this.listInvoices({ limit: chunkSize, offset });
      if (!Array.isArray(batch) || batch.length === 0) {
        break;
      }

      invoices.push(...batch);

      if (batch.length < chunkSize) {
        break;
      }

      offset += chunkSize;
    }

    return invoices;
  }

  async searchInvoices(params: InvoiceSearchParams): Promise<unknown[]> {
    const searchFilters: Array<{
      field: string;
      operator: string;
      value: unknown;
    }> = [];

    if (params.filters) {
      if (!Array.isArray(params.filters)) {
        throw McpError.validation("filters must be a list of search expressions");
      }
      searchFilters.push(...params.filters);
    }

    if (params.query !== undefined) {
      const op = params.operator?.toUpperCase() ?? "LIKE";
      let value = params.query;
      if (op === "LIKE" && !value.includes("%")) {
        value = `%${params.query}%`;
      }

      searchFilters.push({
        field: params.field ?? "title",
        operator: op,
        value: value,
      });
    }

    if (searchFilters.length === 0) {
      throw McpError.validation("Either query or filters must be provided");
    }

    const requestParams = params.limit ? { limit: params.limit } : undefined;
    return this.makeRequest(
      "POST",
      "/kb_invoice/search",
      requestParams,
      searchFilters
    );
  }

  async issueInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/issue`);
  }

  async cancelInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/cancel`);
  }

  async markInvoiceAsSent(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/mark_as_sent`);
  }

  async sendInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/send`);
  }

  async copyInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/copy`);
  }

  // ===== TAXES (3.0 API) =====
  async listTaxes(params: PaginationParams = {}): Promise<unknown[]> {
    const response = await axios.get("https://api.bexio.com/3.0/taxes", {
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      params,
    });
    return response.data;
  }

  async getTax(taxId: number): Promise<unknown> {
    const response = await axios.get(
      `https://api.bexio.com/3.0/taxes/${taxId}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  }

  // ===== ITEMS (Articles) =====
  async listItems(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/article", params);
  }

  async getItem(itemId: number): Promise<unknown> {
    return this.makeRequest("GET", `/article/${itemId}`);
  }

  async createItem(itemData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", "/article", undefined, itemData);
  }

  // ===== DELIVERIES =====
  async listDeliveries(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/kb_delivery", params);
  }

  async getDelivery(deliveryId: number): Promise<unknown> {
    return this.makeRequest("GET", `/kb_delivery/${deliveryId}`);
  }

  async issueDelivery(deliveryId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_delivery/${deliveryId}/issue`);
  }

  async searchDeliveries(
    searchParams: Record<string, unknown>
  ): Promise<unknown[]> {
    return this.makeRequest("POST", "/kb_delivery/search", undefined, searchParams);
  }

  // ===== PAYMENTS =====
  async listPayments(invoiceId: number): Promise<unknown[]> {
    return this.makeRequest("GET", `/kb_invoice/${invoiceId}/payment`);
  }

  async createPayment(
    invoiceId: number,
    paymentData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/kb_invoice/${invoiceId}/payment`,
      undefined,
      paymentData
    );
  }

  async getPayment(invoiceId: number, paymentId: number): Promise<unknown> {
    return this.makeRequest(
      "GET",
      `/kb_invoice/${invoiceId}/payment/${paymentId}`
    );
  }

  async deletePayment(invoiceId: number, paymentId: number): Promise<unknown> {
    return this.makeRequest(
      "DELETE",
      `/kb_invoice/${invoiceId}/payment/${paymentId}`
    );
  }

  // ===== REMINDERS =====
  async listReminders(invoiceId: number): Promise<unknown[]> {
    return this.makeRequest("GET", `/kb_invoice/${invoiceId}/reminder`);
  }

  async createReminder(
    invoiceId: number,
    reminderData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/kb_invoice/${invoiceId}/reminder`,
      undefined,
      reminderData
    );
  }

  async getReminder(invoiceId: number, reminderId: number): Promise<unknown> {
    return this.makeRequest(
      "GET",
      `/kb_invoice/${invoiceId}/reminder/${reminderId}`
    );
  }

  async deleteReminder(invoiceId: number, reminderId: number): Promise<unknown> {
    return this.makeRequest(
      "DELETE",
      `/kb_invoice/${invoiceId}/reminder/${reminderId}`
    );
  }

  async markReminderAsSent(
    invoiceId: number,
    reminderId: number
  ): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/kb_invoice/${invoiceId}/reminder/${reminderId}/mark_as_sent`
    );
  }

  async sendReminder(invoiceId: number, reminderId: number): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/kb_invoice/${invoiceId}/reminder/${reminderId}/send`
    );
  }

  // ===== CONTACT RELATIONS =====
  async listContactRelations(): Promise<unknown[]> {
    return this.makeRequest("GET", "/contact_relation");
  }

  async createContactRelation(
    relationData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest("POST", "/contact_relation", undefined, relationData);
  }

  async getContactRelation(relationId: number): Promise<unknown> {
    return this.makeRequest("GET", `/contact_relation/${relationId}`);
  }

  async updateContactRelation(
    relationId: number,
    relationData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/contact_relation/${relationId}`,
      undefined,
      relationData
    );
  }

  async deleteContactRelation(relationId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/contact_relation/${relationId}`);
  }

  // ===== STATIC DATA =====
  async listInvoiceStatuses(): Promise<unknown[]> {
    return [
      {
        id: 7,
        name: "Entwurf/Offen",
        english_name: "Draft/Open",
        is_open: true,
        is_sent: false,
        is_paid: false,
        is_cancelled: false,
      },
      {
        id: 8,
        name: "Versendet/Ausstehend",
        english_name: "Sent/Pending",
        is_open: false,
        is_sent: true,
        is_paid: false,
        is_cancelled: false,
      },
      {
        id: 9,
        name: "Bezahlt/Abgeschlossen",
        english_name: "Paid/Completed",
        is_open: false,
        is_sent: true,
        is_paid: true,
        is_cancelled: false,
      },
      {
        id: 19,
        name: "Storniert",
        english_name: "Cancelled",
        is_open: false,
        is_sent: false,
        is_paid: false,
        is_cancelled: true,
      },
    ];
  }

  async listAllStatuses(
    documentType: "all" | "invoices" | "quotes" | "orders" = "all"
  ): Promise<unknown[]> {
    const statuses = {
      invoices: await this.listInvoiceStatuses(),
      quotes: [
        { id: 1, name: "Entwurf", english_name: "Draft", document_type: "quote" },
        { id: 3, name: "Versendet", english_name: "Sent", document_type: "quote" },
      ],
      orders: [
        {
          id: 5,
          name: "Bestatigt",
          english_name: "Confirmed",
          document_type: "order",
        },
        {
          id: 21,
          name: "Wiederkehrend",
          english_name: "Recurring",
          document_type: "order",
        },
      ],
    };

    if (documentType === "all") {
      return [...statuses.invoices, ...statuses.quotes, ...statuses.orders];
    }

    return statuses[documentType] || [];
  }
}
