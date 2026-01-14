/**
 * Delivery API response types and mappers.
 * Response types are internal - not exported from entity barrel.
 */

import type { Delivery, DeliveryLineItem } from '../model/delivery';
import type { DeliveryStatus } from '../model/delivery-status';

/**
 * Command result for write operations.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Line item response from backend.
 */
interface DeliveryLineItemResponse {
  id: number;
  productId: number;
  productName: string;
  productSku: string | null;
  quantityDelivered: number;
}

/**
 * Delivery detail response from backend (DeliveryDetailView).
 */
export interface DeliveryDetailResponse {
  id: number;
  projectId: number;
  quotationId: number;
  jobCode: string;
  deliveryDate: string;
  status: DeliveryStatus;
  deliveredById: number;
  deliveredByName: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: DeliveryLineItemResponse[];
}

/**
 * Delivery summary response from backend (DeliverySummaryView).
 * Used for list endpoints.
 */
export interface DeliverySummaryResponse {
  id: number;
  projectId: number;
  quotationId: number;
  deliveryDate: string;
  status: DeliveryStatus;
  deliveredByName: string;
  lineItemCount: number;
  totalQuantityDelivered: number;
  createdAt: string;
  lineItems: DeliveryLineItemResponse[];
}

/**
 * Mappers for converting API responses to domain models.
 */
export const deliveryMapper = {
  /**
   * Map line item response to domain model.
   */
  toLineItem(response: DeliveryLineItemResponse): DeliveryLineItem {
    return {
      id: response.id,
      productId: response.productId,
      productName: response.productName,
      productSku: response.productSku,
      quantityDelivered: response.quantityDelivered,
    };
  },

  /**
   * Map detail response to Delivery domain model.
   */
  toDomain(response: DeliveryDetailResponse): Delivery {
    return {
      id: response.id,
      projectId: response.projectId,
      quotationId: response.quotationId,
      jobCode: response.jobCode,
      deliveryDate: response.deliveryDate,
      status: response.status,
      deliveredById: response.deliveredById,
      deliveredByName: response.deliveredByName,
      notes: response.notes,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      lineItems: response.lineItems.map(deliveryMapper.toLineItem),
    };
  },

  /**
   * Map summary response to Delivery domain model.
   * Fills in missing fields with defaults for list display.
   */
  summaryToDomain(response: DeliverySummaryResponse): Delivery {
    return {
      id: response.id,
      projectId: response.projectId,
      quotationId: response.quotationId,
      jobCode: '', // Not available in summary, will be fetched separately if needed
      deliveryDate: response.deliveryDate,
      status: response.status,
      deliveredById: 0, // Not available in summary
      deliveredByName: response.deliveredByName,
      notes: null,
      createdAt: response.createdAt,
      updatedAt: response.createdAt,
      lineItems: response.lineItems.map(deliveryMapper.toLineItem),
    };
  },
};
