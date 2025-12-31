/**
 * Quotation API functions.
 *
 * Raw API calls for quotation operations.
 * These functions are called by query hooks and features.
 */

import { httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import { transformPagedResponse } from '@/shared/api';
import type {
  CommandResult,
  CreateQuotationRequestDTO,
  PaginatedQuotationsDTO,
  QuotationDetailsDTO,
  QuotationListParamsDTO,
  UpdateQuotationRequestDTO,
} from './quotation.dto';

/**
 * Quotation API functions.
 */
export const quotationApi = {
  /**
   * Get paginated list of quotations.
   * Returns raw DTOs - callers should map to domain models.
   */
  async getList(params?: QuotationListParamsDTO): Promise<PaginatedQuotationsDTO> {
    const response = await httpClient.requestWithMeta<PagedResponse<QuotationDetailsDTO>>({
      method: 'GET',
      url: QUOTATION_ENDPOINTS.BASE,
      params,
    });

    return transformPagedResponse(response.data, response.metadata);
  },

  /**
   * Get quotation by ID (with line items).
   * Returns raw DTO - callers should map to domain model.
   */
  async getById(id: number): Promise<QuotationDetailsDTO> {
    return httpClient.get<QuotationDetailsDTO>(QUOTATION_ENDPOINTS.byId(id));
  },

  /**
   * Create a new quotation.
   * CQRS: Returns command result with created quotation ID.
   */
  async create(request: CreateQuotationRequestDTO): Promise<CommandResult> {
    return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.BASE, request);
  },

  /**
   * Update an existing quotation.
   * Only DRAFT quotations can be updated.
   * CQRS: Returns command result with updated quotation ID.
   */
  async update(id: number, request: UpdateQuotationRequestDTO): Promise<CommandResult> {
    return httpClient.put<CommandResult>(QUOTATION_ENDPOINTS.byId(id), request);
  },

  /**
   * Submit quotation for approval.
   * Creates approval request via event-driven architecture.
   */
  async submitForApproval(id: number): Promise<CommandResult> {
    return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.submit(id));
  },

  /**
   * Create a new version from an existing quotation.
   * Clones the quotation with incremented version number.
   */
  async createNewVersion(id: number): Promise<CommandResult> {
    return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.versions(id));
  },

  /**
   * Generate PDF for quotation.
   * Returns PDF as Blob for download.
   */
  async generatePdf(id: number): Promise<Blob> {
    const response = await httpClient.requestRaw<ArrayBuffer>({
      method: 'POST',
      url: QUOTATION_ENDPOINTS.pdf(id),
      responseType: 'arraybuffer',
    });
    return new Blob([response], { type: 'application/pdf' });
  },

  /**
   * Download PDF for quotation.
   * Triggers browser download.
   */
  async downloadPdf(id: number, filename?: string): Promise<void> {
    const blob = await quotationApi.generatePdf(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename ?? `quotation-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Send revision notification email.
   * Admin only - notifies customer about new quotation version.
   */
  async sendRevisionNotification(id: number): Promise<void> {
    await httpClient.post<string>(QUOTATION_ENDPOINTS.sendNotification(id));
  },
};
