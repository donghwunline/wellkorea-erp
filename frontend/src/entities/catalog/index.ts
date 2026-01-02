/**
 * Catalog Entity - Public API.
 *
 * This is the ONLY entry point for importing from the catalog entity.
 * Internal modules (model/, api/, ui/) should never be imported directly.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 *
 * @example
 * ```typescript
 * import {
 *   // Domain Types
 *   type ServiceCategory,
 *   type ServiceCategoryListItem,
 *   type VendorOffering,
 *
 *   // Business Rules
 *   serviceCategoryRules,
 *   vendorOfferingRules,
 *
 *   // Query Factory
 *   catalogQueries,
 *
 *   // Service Category Commands
 *   createServiceCategory,
 *   updateServiceCategory,
 *   deleteServiceCategory,
 *
 *   // Vendor Offering Commands
 *   createVendorOffering,
 *   updateVendorOffering,
 *   deleteVendorOffering,
 * } from '@/entities/catalog';
 * ```
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type { ServiceCategory, ServiceCategoryListItem } from './model/service-category';
export type { VendorOffering } from './model/vendor-offering';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic (canEdit, canDelete, isEffective, etc.)
// =============================================================================

export { serviceCategoryRules } from './model/service-category';
export { vendorOfferingRules } from './model/vendor-offering';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// Use with useQuery() directly - no custom hooks needed
// =============================================================================

export {
  catalogQueries,
  type ServiceCategoryListQueryParams,
  type VendorOfferingListQueryParams,
} from './api/catalog.queries';

// =============================================================================
// SERVICE CATEGORY COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export { createServiceCategory, type CreateServiceCategoryInput } from './api/create-service-category';
export { updateServiceCategory, type UpdateServiceCategoryInput } from './api/update-service-category';
export { deleteServiceCategory, type DeleteServiceCategoryInput } from './api/delete-service-category';

// =============================================================================
// VENDOR OFFERING COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export { createVendorOffering, type CreateVendorOfferingInput } from './api/create-vendor-offering';
export { updateVendorOffering, type UpdateVendorOfferingInput } from './api/update-vendor-offering';
export { deleteVendorOffering, type DeleteVendorOfferingInput } from './api/delete-vendor-offering';

// =============================================================================
// DTO TYPES (for features layer if needed)
// =============================================================================

export type { CommandResult } from './api/catalog.dto';
