/**
 * Quotation API types.
 *
 * Naming convention:
 * - *Request: Types sent TO the API (create, update, params)
 * - *Response: Types received FROM the API (details, list items)
 *
 * These types exactly match the backend API contract.
 */

/**
 * Command result from CQRS command endpoints.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Line item from API response.
 */
export interface LineItemResponse {
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
 * Full quotation details from API response.
 */
export interface QuotationDetailsResponse {
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
  lineItems: LineItemResponse[] | null;
}

/**
 * Line item for creating/updating quotation.
 */
export interface LineItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/**
 * Request for creating a new quotation.
 */
export interface CreateQuotationRequest {
  projectId: number;
  validityDays?: number;
  notes?: string;
  lineItems: LineItemRequest[];
}

/**
 * Request for updating an existing quotation.
 */
export interface UpdateQuotationRequest {
  validityDays?: number;
  notes?: string;
  lineItems: LineItemRequest[];
}

/**
 * Query parameters for listing quotations.
 */
export interface QuotationListParams {
  page?: number;
  size?: number;
  status?: string;
  projectId?: number;
  search?: string;
}
