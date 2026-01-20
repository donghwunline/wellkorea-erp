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

// =============================================================================
// MATERIAL COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export { createMaterial, type CreateMaterialInput } from './api/create-material';
export { updateMaterial, type UpdateMaterialInput } from './api/update-material';
export { deleteMaterial, type DeleteMaterialInput } from './api/delete-material';

// =============================================================================
// MATERIAL CATEGORY COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export { createMaterialCategory, type CreateMaterialCategoryInput } from './api/create-material-category';
export { updateMaterialCategory, type UpdateMaterialCategoryInput } from './api/update-material-category';
export { deleteMaterialCategory, type DeleteMaterialCategoryInput } from './api/delete-material-category';

// =============================================================================
// VENDOR MATERIAL OFFERING COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export { createVendorMaterialOffering, type CreateVendorMaterialOfferingInput } from './api/create-vendor-material-offering';
export { updateVendorMaterialOffering, type UpdateVendorMaterialOfferingInput } from './api/update-vendor-material-offering';
export { deleteVendorMaterialOffering, type DeleteVendorMaterialOfferingInput } from './api/delete-vendor-material-offering';
export { setPreferredVendorOffering } from './api/set-preferred-vendor-offering';
