/**
 * Company Model - Internal exports.
 *
 * Re-exports all model types and rules for use within the company entity.
 * Public API is defined in entities/company/index.ts.
 */

export type { Company, CompanyListItem } from './company';
export { companyRules } from './company';

export type { CompanyRole } from './company-role';
export { roleRules } from './company-role';

export type { RoleType, BadgeVariant } from './role-type';
export { RoleType as RoleTypeEnum, ROLE_TYPE_LABELS, ROLE_TYPE_BADGE_VARIANTS } from './role-type';
