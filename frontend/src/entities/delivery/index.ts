/**
 * Delivery entity public API.
 * Following FSD-Lite conventions - only export what consumers need.
 */

// Model - Domain types and business rules
export type { Delivery, DeliveryLineItem } from './model/delivery';
export { deliveryRules } from './model/delivery';
export type { DeliveryStatus } from './model/delivery-status';
export {
  DELIVERY_STATUS_CONFIG,
  DELIVERY_STATUSES,
  canTransitionTo,
} from './model/delivery-status';

// API - Query factory and command functions
export { deliveryQueries } from './api/delivery.queries';
export { createDelivery } from './api/create-delivery';
export type {
  CreateDeliveryInput,
  CreateDeliveryLineItemInput,
} from './api/create-delivery';
export { downloadDeliveryStatement } from './api/delivery-statement';

// UI - Presentation components
export { DeliveryStatusBadge } from './ui/DeliveryStatusBadge';
export { DeliveryTable } from './ui/DeliveryTable';
