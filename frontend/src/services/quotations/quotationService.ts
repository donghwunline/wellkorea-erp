/**
 * Quotation management service.
 * Business logic layer for quotation operations.
 *
 * Features:
 * - Quotation CRUD operations
 * - Submit for approval
 * - Create new version
 * - PDF generation
 * - Revision notification
 *
 * @deprecated This service is being replaced by FSD-Lite architecture.
 * Use the following imports instead:
 *
 * **Reading data (queries):**
 * ```typescript
 * import { useQuotation, useQuotations } from '@/entities/quotation';
 * ```
 *
 * **Writing data (mutations):**
 * ```typescript
 * import { useCreateQuotation } from '@/features/quotation/create';
 * import { useUpdateQuotation } from '@/features/quotation/update';
 * import { useSubmitQuotation } from '@/features/quotation/submit';
 * ```
 *
 * **Domain types and rules:**
 * ```typescript
 * import { type Quotation, quotationRules } from '@/entities/quotation';
 * ```
 *
 * This file will be removed once all consumers are migrated.
 */

import { httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import { transformPagedResponse } from '@/services/shared';
import type {
  CommandResult,
  CreateQuotationRequest,
  PaginatedQuotations,
  QuotationDetails,
  QuotationListParams,
  UpdateQuotationRequest,
} from './types';

/**
 * Transform QuotationDetails DTO.
 * Normalizes data from API response.
 */
function transformQuotationDetails(dto: QuotationDetails): QuotationDetails {
  return {
    ...dto,
    projectName: dto.projectName?.trim() ?? '',
    notes: dto.notes?.trim() ?? null,
    createdByName: dto.createdByName?.trim() ?? '',
    approvedByName: dto.approvedByName?.trim() ?? null,
    rejectionReason: dto.rejectionReason?.trim() ?? null,
  };
}

/**
 * Quotation management service.
 */
export const quotationService = {
  /**
   * Get paginated list of quotations.
   * Backend returns Page<QuotationResponse> structure.
   */
  async getQuotations(params?: QuotationListParams): Promise<PaginatedQuotations> {
    const response = await httpClient.requestWithMeta<PagedResponse<QuotationDetails>>({
      method: 'GET',
      url: QUOTATION_ENDPOINTS.BASE,
      params,
    });

    const paginated = transformPagedResponse(response.data, response.metadata);
    return {
      ...paginated,
      data: paginated.data.map(transformQuotationDetails),
    };
  },

  /**
   * Get quotation by ID (with line items).
   */
  async getQuotation(id: number): Promise<QuotationDetails> {
    const quotation = await httpClient.get<QuotationDetails>(QUOTATION_ENDPOINTS.byId(id));
    return transformQuotationDetails(quotation);
  },

  /**
   * Create a new quotation.
   * Returns command result with created quotation ID.
   * CQRS: Clients should fetch fresh data via getQuotation() if needed.
   */
  async createQuotation(request: CreateQuotationRequest): Promise<CommandResult> {
    return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.BASE, request);
  },

  /**
   * Update an existing quotation.
   * Only DRAFT quotations can be updated.
   * CQRS: Returns command result with updated quotation ID.
   */
  async updateQuotation(id: number, request: UpdateQuotationRequest): Promise<CommandResult> {
    return httpClient.put<CommandResult>(QUOTATION_ENDPOINTS.byId(id), request);
  },

  /**
   * Submit quotation for approval.
   * Creates approval request via event-driven architecture.
   * CQRS: Returns command result with submitted quotation ID.
   */
  async submitForApproval(id: number): Promise<CommandResult> {
    return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.submit(id));
  },

  /**
   * Create a new version from an existing quotation.
   * Clones the quotation with incremented version number.
   * CQRS: Returns command result with new version ID.
   */
  async createNewVersion(id: number): Promise<CommandResult> {
    return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.versions(id));
  },

  /**
   * Generate PDF for quotation.
   * Returns PDF as Blob for download.
   * Uses requestRaw to bypass ApiResponse unwrapping (backend returns raw bytes).
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
    const blob = await this.generatePdf(id);
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
