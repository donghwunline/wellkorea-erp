/**
 * Purchase Order Entity - Public API.
 *
 * This is the ONLY entry point for importing from the purchase-order entity.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 */

// =============================================================================
// DOMAIN TYPES
// =============================================================================

export type { PurchaseOrder, PurchaseOrderListItem } from './model/purchase-order';

// =============================================================================
// STATUS
// =============================================================================

export {
  PurchaseOrderStatus,
  PurchaseOrderStatusConfig,
} from './model/purchase-order-status';
export type { StatusConfig } from './model/purchase-order-status';

// =============================================================================
// BUSINESS RULES
// =============================================================================

export { purchaseOrderRules } from './model/purchase-order';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// =============================================================================

export {
  purchaseOrderQueries,
  type PurchaseOrderListQueryParams,
} from './api/purchase-order.queries';
