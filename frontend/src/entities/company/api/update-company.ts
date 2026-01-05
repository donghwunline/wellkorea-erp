/**
 * Update Company Command.
 *
 * Combines input validation, mapping, and HTTP PUT in one module.
 * Follows FSD pattern: entities/{entity}/api/update-{entity}.ts
 */

import { DomainValidationError, httpClient, COMPANY_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './company.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Update company request.
 */
interface UpdateCompanyRequest {
  name?: string | null;
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
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Update company input from UI forms.
 *
 * Only includes fields that can be updated (not roles - those have separate commands).
 */
export interface UpdateCompanyInput {
  id: number;
  name?: string;
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
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate update company input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateUpdateInput(input: UpdateCompanyInput): void {
  // Name cannot be empty if provided
  if (input.name !== undefined) {
    const nameTrimmed = input.name.trim();
    if (!nameTrimmed) {
      throw new DomainValidationError('REQUIRED', 'name', '회사명을 입력해주세요');
    }
  }

  // Email format validation (optional field)
  if (input.email !== undefined && input.email.trim()) {
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
 * Map update input to API request.
 * Trims whitespace from all string fields.
 */
function toUpdateRequest(input: UpdateCompanyInput): UpdateCompanyRequest {
  return {
    name: input.name?.trim() || null,
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
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Update an existing company.
 *
 * Validates input, maps to request, and calls API.
 *
 * @param input - UI form input with company ID
 * @returns Command result with updated company ID
 * @throws DomainValidationError if validation fails
 *
 * @example
 * ```typescript
 * const result = await updateCompany({
 *   id: 123,
 *   name: 'ACME Corp (Updated)',
 *   phone: '02-5678-1234',
 * });
 * console.log(`Updated company: ${result.id}`);
 * ```
 */
export async function updateCompany(input: UpdateCompanyInput): Promise<CommandResult> {
  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  return httpClient.put<CommandResult>(COMPANY_ENDPOINTS.byId(input.id), request);
}
