/**
 * Material Entity - Public API.
 *
 * This is the ONLY entry point for importing from the material entity.
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
 *   type Material,
 *   type MaterialListItem,
 *   type MaterialCategory,
 *   type MaterialCategoryListItem,
 *
 *   // Business Rules
 *   materialRules,
 *   materialCategoryRules,
 *
 *   // Query Factory
 *   materialQueries,
 * } from '@/entities/material';
 * ```
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type { Material, MaterialListItem } from './model/material';
export type { MaterialCategory, MaterialCategoryListItem } from './model/material-category';
export type { VendorMaterialOffering } from './model/vendor-material-offering';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic
// =============================================================================

export { materialRules } from './model/material';
export { materialCategoryRules } from './model/material-category';
export { vendorMaterialOfferingRules } from './model/vendor-material-offering';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// Use with useQuery() directly - no custom hooks needed
// =============================================================================

export {
  materialQueries,
  type MaterialListQueryParams,
  type MaterialCategoryListQueryParams,
} from './api/material.queries';
