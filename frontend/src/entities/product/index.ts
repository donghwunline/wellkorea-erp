/**
 * Product Entity - Public API.
 *
 * This is the ONLY entry point for importing from the product entity.
 * Internal modules (model/, api/, ui/) should never be imported directly.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 *
 * @example
 * ```typescript
 * import {
 *   // Types
 *   type Product,
 *   type ProductListItem,
 *   type ProductType,
 *
 *   // Business rules
 *   productRules,
 *   productTypeRules,
 *
 *   // Queries
 *   productQueries,
 *
 *   // Commands
 *   createProduct,
 *   updateProduct,
 *   deleteProduct,
 * } from '@/entities/product';
 * ```
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type { Product, ProductListItem } from './model/product';
export type { ProductType } from './model/product-type';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic (canEdit, canDelete, formatPrice, etc.)
// =============================================================================

export { productRules } from './model/product';
export { productTypeRules } from './model/product-type';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// Use with useQuery() directly - no custom hooks needed
// =============================================================================

export { productQueries, type ProductListQueryParams } from './api/product.queries';

// =============================================================================
// COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export { createProduct, type CreateProductInput } from './api/create-product';
export { updateProduct, type UpdateProductInput } from './api/update-product';
export { deleteProduct, type DeleteProductInput } from './api/delete-product';

// =============================================================================
// DIRECT API FUNCTIONS
// For async callbacks (e.g., Combobox loadOptions) that can't use hooks
// =============================================================================

export { searchProductsApi, type SearchProductsResult } from './api/search-products';

// =============================================================================
// DTO TYPES (for features layer if needed)
// =============================================================================

export type { CommandResult } from './api/product.dto';
