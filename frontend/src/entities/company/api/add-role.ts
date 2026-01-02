/**
 * Add Role to Company Command.
 *
 * Adds a new role (CUSTOMER, VENDOR, OUTSOURCE) to an existing company.
 */

import { DomainValidationError, httpClient, COMPANY_ENDPOINTS } from '@/shared/api';
import type { RoleType } from '../model/role-type';
import type { CommandResult, AddRoleRequest } from './company.dto';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Add role input from UI forms.
 *
 * UI-friendly types (allows strings for numeric inputs from forms).
 */
export interface AddRoleInput {
  companyId: number;
  roleType: RoleType;
  creditLimit?: number | string;
  defaultPaymentDays?: number | string;
  notes?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate add role input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateAddRoleInput(input: AddRoleInput): void {
  // Credit limit must be non-negative if provided
  if (input.creditLimit !== undefined && input.creditLimit !== '') {
    const creditLimit = Number(input.creditLimit);
    if (isNaN(creditLimit)) {
      throw new DomainValidationError(
        'INVALID_FORMAT',
        'creditLimit',
        '신용 한도는 숫자여야 합니다'
      );
    }
    if (creditLimit < 0) {
      throw new DomainValidationError(
        'OUT_OF_RANGE',
        'creditLimit',
        '신용 한도는 0 이상이어야 합니다'
      );
    }
  }

  // Payment days must be positive if provided
  if (input.defaultPaymentDays !== undefined && input.defaultPaymentDays !== '') {
    const paymentDays = Number(input.defaultPaymentDays);
    if (isNaN(paymentDays)) {
      throw new DomainValidationError(
        'INVALID_FORMAT',
        'defaultPaymentDays',
        '결제 기한은 숫자여야 합니다'
      );
    }
    if (paymentDays <= 0) {
      throw new DomainValidationError(
        'OUT_OF_RANGE',
        'defaultPaymentDays',
        '결제 기한은 1일 이상이어야 합니다'
      );
    }
  }
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map add role input to API request.
 */
function toAddRoleRequest(input: AddRoleInput): AddRoleRequest {
  return {
    roleType: input.roleType,
    creditLimit:
      input.creditLimit !== undefined && input.creditLimit !== ''
        ? Number(input.creditLimit)
        : null,
    defaultPaymentDays:
      input.defaultPaymentDays !== undefined && input.defaultPaymentDays !== ''
        ? Number(input.defaultPaymentDays)
        : null,
    notes: input.notes?.trim() || null,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Add a role to a company.
 *
 * @param input - Role input with company ID
 * @returns Command result with created role ID
 * @throws DomainValidationError if validation fails
 *
 * @example
 * ```typescript
 * const result = await addRole({
 *   companyId: 123,
 *   roleType: 'VENDOR',
 *   creditLimit: 10000000,
 *   defaultPaymentDays: 30,
 * });
 * console.log(`Added role: ${result.id}`);
 * ```
 */
export async function addRole(input: AddRoleInput): Promise<CommandResult> {
  validateAddRoleInput(input);
  const request = toAddRoleRequest(input);
  return httpClient.post<CommandResult>(COMPANY_ENDPOINTS.roles(input.companyId), request);
}
