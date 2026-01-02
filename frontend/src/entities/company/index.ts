/**
 * Company Entity - Public API.
 *
 * This is the ONLY entry point for importing from the company entity.
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
 *   type Company,
 *   type CompanyListItem,
 *   type CompanyRole,
 *   RoleType,
 *
 *   // Business rules
 *   companyRules,
 *
 *   // Queries
 *   companyQueries,
 *
 *   // Commands
 *   createCompany,
 *   updateCompany,
 *
 *   // UI
 *   CompanyTable,
 *   CompanyCard,
 * } from '@/entities/company';
 * ```
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type { Company, CompanyListItem } from './model/company';
export type { CompanyRole } from './model/company-role';
export type { RoleType } from './model/role-type';
export { RoleType as RoleTypeEnum, ROLE_TYPE_LABELS, ROLE_TYPE_BADGE_VARIANTS } from './model/role-type';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic (canEdit, canAddRole, hasRole, etc.)
// =============================================================================

export { companyRules } from './model/company';
export { roleRules } from './model/company-role';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// Use with useQuery() directly - no custom hooks needed
// =============================================================================

export { companyQueries, type CompanyListQueryParams } from './api/company.queries';

// =============================================================================
// COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export { createCompany, type CreateCompanyInput } from './api/create-company';
export { updateCompany, type UpdateCompanyInput } from './api/update-company';
export { deleteCompany, type DeleteCompanyInput } from './api/delete-company';
export { addRole, type AddRoleInput } from './api/add-role';
export { removeRole, type RemoveRoleInput } from './api/remove-role';

// =============================================================================
// DTO TYPES (for features layer if needed)
// =============================================================================

export type { CommandResult } from './api/company.dto';

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export { CompanyStatusBadge, type CompanyStatusBadgeProps } from './ui/CompanyStatusBadge';
export { CompanyRoleBadge, type CompanyRoleBadgeProps } from './ui/CompanyRoleBadge';
export { CompanyTable, type CompanyTableProps } from './ui/CompanyTable';
export { CompanyCard, type CompanyCardProps } from './ui/CompanyCard';
export { CompanyCombobox, type CompanyComboboxProps } from './ui/CompanyCombobox';
