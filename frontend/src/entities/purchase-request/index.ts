/**
 * Purchase Request Entity - Public API.
 *
 * This is the ONLY entry point for importing from the purchase-request entity.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 */

// =============================================================================
// DOMAIN TYPES
// =============================================================================

export type { PurchaseRequest, PurchaseRequestListItem } from './model/purchase-request';
export type { RfqItem } from './model/rfq-item';

// =============================================================================
// STATUS
// =============================================================================

export {
  PurchaseRequestStatus,
  PurchaseRequestStatusConfig,
} from './model/purchase-request-status';
export type { StatusConfig } from './model/purchase-request-status';

export { RfqItemStatus, RfqItemStatusConfig } from './model/rfq-item';
export type { StatusConfig as RfqItemStatusConfigType } from './model/rfq-item-status';

// =============================================================================
// BUSINESS RULES
// =============================================================================

export { purchaseRequestRules } from './model/purchase-request';
export { rfqItemRules } from './model/rfq-item';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// =============================================================================

export {
  purchaseRequestQueries,
  type PurchaseRequestListQueryParams,
} from './api/purchase-request.queries';

// =============================================================================
// COMMAND FUNCTIONS
// =============================================================================

export {
  createServicePurchaseRequest,
  createMaterialPurchaseRequest,
} from './api/create-purchase-request';
export type {
  CreateServicePurchaseRequestInput,
  CreateMaterialPurchaseRequestInput,
} from './api/create-purchase-request';

export { updatePurchaseRequest } from './api/update-purchase-request';
export type { UpdatePurchaseRequestInput } from './api/update-purchase-request';

export { sendRfq } from './api/send-rfq';
export type { SendRfqInput } from './api/send-rfq';

export { cancelPurchaseRequest } from './api/cancel-purchase-request';
