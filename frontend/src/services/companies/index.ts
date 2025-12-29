/**
 * Company service exports.
 */

export { companyService } from './companyService';
export type {
  // Role types
  RoleType,
  CompanyRole,
  AddRoleRequest,
  // Company types
  CompanySummary,
  CompanyDetails,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  // CQRS
  CompanyCommandResult,
  // List/Search
  CompanyListParams,
  PaginatedCompanies,
} from './types';
export { ROLE_TYPE_LABELS } from './types';
