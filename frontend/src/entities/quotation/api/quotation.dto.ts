/**
 * Quotation API DTOs.
 *
 * These types exactly match the backend API contract.
 * Separate from domain models to decouple from API changes.
 */

import type { Paginated } from '@/shared/api/types';

/**
 * Command result from CQRS command endpoints.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Line item DTO from API response.
 */
export interface LineItemDTO {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  sequence: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
}

/**
 * Full quotation details DTO from API response.
 */
export interface QuotationDetailsDTO {
  id: number;
  projectId: number;
  projectName: string;
  jobCode: string;
  version: number;
  status: string; // Will be cast to QuotationStatus
  quotationDate: string;
  validityDays: number;
  expiryDate: string;
  totalAmount: number;
  notes: string | null;
  createdById: number;
  createdByName: string;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: LineItemDTO[] | null;
}

/**
 * Line item request for creating/updating quotation.
 */
export interface LineItemRequestDTO {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/**
 * Request DTO for creating a new quotation.
 */
export interface CreateQuotationRequestDTO {
  projectId: number;
  validityDays?: number;
  notes?: string;
  lineItems: LineItemRequestDTO[];
}

/**
 * Request DTO for updating an existing quotation.
 */
export interface UpdateQuotationRequestDTO {
  validityDays?: number;
  notes?: string;
  lineItems: LineItemRequestDTO[];
}

/**
 * Query parameters for listing quotations.
 */
export interface QuotationListParamsDTO {
  page?: number;
  size?: number;
  status?: string;
  projectId?: number;
  search?: string;
}

/**
 * Paginated quotation list response.
 */
export type PaginatedQuotationsDTO = Paginated<QuotationDetailsDTO>;
