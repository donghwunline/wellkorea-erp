/**
 * CompanyRole domain model.
 *
 * Represents a role (CUSTOMER, VENDOR, OUTSOURCE) assigned to a company.
 */

import type { RoleType } from './role-type';

/**
 * Company role domain model.
 * Immutable structure using readonly properties.
 */
export interface CompanyRole {
  readonly roleType: RoleType;
  readonly createdAt: string; // ISO datetime
}
