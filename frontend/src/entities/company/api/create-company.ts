/**
 * Create Company Command.
 *
 * Combines input validation, mapping, and HTTP POST in one module.
 * Follows FSD pattern: entities/{entity}/api/create-{entity}.ts
 */

import { DomainValidationError, httpClient, COMPANY_ENDPOINTS } from '@/shared/api';
import type { RoleType } from '../model/role-type';
import type { CommandResult } from './company.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Create company request.
 */
interface CreateCompanyRequest {
  name: string;
  registrationNumber?: string | null;
  representative?: string | null;
  businessType?: string | null;
  businessCategory?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bankAccount?: string | null;
  paymentTerms?: string | null;
  roles: RoleType[];
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Create company input from UI forms.
 *
 * UI-friendly types that will be validated and converted to CreateCompanyRequest.
 */
export interface CreateCompanyInput {
  name: string;
  registrationNumber?: string;
  representative?: string;
  businessType?: string;
  businessCategory?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankAccount?: string;
  paymentTerms?: string;
  roles: RoleType[];
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate create company input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateCreateInput(input: CreateCompanyInput): void {
  const nameTrimmed = input.name.trim();
  if (!nameTrimmed) {
    throw new DomainValidationError('REQUIRED', 'name', '회사명을 입력해주세요');
  }

  if (input.roles.length === 0) {
    throw new DomainValidationError('REQUIRED', 'roles', '최소 하나의 역할을 선택해주세요');
  }

  // Email format validation (optional field)
  if (input.email && input.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      throw new DomainValidationError('INVALID_FORMAT', 'email', '올바른 이메일 형식이 아닙니다');
    }
  }
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map create input to API request.
 * Trims whitespace from all string fields.
 */
function toCreateRequest(input: CreateCompanyInput): CreateCompanyRequest {
  return {
    name: input.name.trim(),
    registrationNumber: input.registrationNumber?.trim() || null,
    representative: input.representative?.trim() || null,
    businessType: input.businessType?.trim() || null,
    businessCategory: input.businessCategory?.trim() || null,
    contactPerson: input.contactPerson?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    bankAccount: input.bankAccount?.trim() || null,
    paymentTerms: input.paymentTerms?.trim() || null,
    roles: input.roles,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Create a new company.
 *
 * Validates input, maps to request, and calls API.
 *
 * @param input - UI form input
 * @returns Command result with created company ID
 * @throws DomainValidationError if validation fails
 *
 * @example
 * ```typescript
 * const result = await createCompany({
 *   name: 'ACME Corp',
 *   roles: ['CUSTOMER'],
 *   contactPerson: 'John Doe',
 *   phone: '02-1234-5678',
 * });
 * console.log(`Created company: ${result.id}`);
 * ```
 */
export async function createCompany(input: CreateCompanyInput): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(COMPANY_ENDPOINTS.BASE, request);
}
