/**
 * Create Purchase Request commands.
 *
 * Follows FSD Command Function pattern with built-in validation.
 * Provides separate functions for service and material purchase requests.
 */

import { httpClient, PURCHASE_REQUEST_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './purchase-request.mapper';

// =============================================================================
// SERVICE PURCHASE REQUEST
// =============================================================================

/**
 * Input for creating a service (outsourcing) purchase request.
 * This is the public contract for the command function.
 */
export interface CreateServicePurchaseRequestInput {
  readonly serviceCategoryId: number;
  readonly projectId?: number | null;
  readonly description: string;
  readonly quantity: number;
  readonly uom?: string | null;
  readonly requiredDate: string;
}

/**
 * API request payload for service purchase request.
 * @internal
 */
interface CreateServicePurchaseRequestRequest {
  serviceCategoryId: number;
  projectId: number | null;
  description: string;
  quantity: number;
  uom: string | null;
  requiredDate: string;
}

/**
 * Validate service purchase request input.
 * @throws DomainValidationError if validation fails
 */
function validateServiceInput(input: CreateServicePurchaseRequestInput): void {
  if (!input.serviceCategoryId) {
    throw new DomainValidationError('REQUIRED', 'serviceCategoryId', 'Service category is required');
  }
  if (!input.description?.trim()) {
    throw new DomainValidationError('REQUIRED', 'description', 'Description is required');
  }
  if (input.quantity <= 0) {
    throw new DomainValidationError('OUT_OF_RANGE', 'quantity', 'Quantity must be greater than 0');
  }
  if (!input.requiredDate) {
    throw new DomainValidationError('REQUIRED', 'requiredDate', 'Required date is required');
  }
}

/**
 * Create a new service (outsourcing) purchase request.
 *
 * @param input - Service purchase request data
 * @returns Command result with created ID
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 *
 * @example
 * const result = await createServicePurchaseRequest({
 *   serviceCategoryId: 1,
 *   description: 'CNC machining for project components',
 *   quantity: 10,
 *   requiredDate: '2025-02-15',
 * });
 */
export async function createServicePurchaseRequest(
  input: CreateServicePurchaseRequestInput
): Promise<CommandResult> {
  validateServiceInput(input);

  const request: CreateServicePurchaseRequestRequest = {
    serviceCategoryId: input.serviceCategoryId,
    projectId: input.projectId ?? null,
    description: input.description.trim(),
    quantity: input.quantity,
    uom: input.uom?.trim() ?? null,
    requiredDate: input.requiredDate,
  };

  return httpClient.post<CommandResult>(PURCHASE_REQUEST_ENDPOINTS.SERVICE, request);
}

// =============================================================================
// MATERIAL PURCHASE REQUEST
// =============================================================================

/**
 * Input for creating a material (physical items) purchase request.
 * This is the public contract for the command function.
 */
export interface CreateMaterialPurchaseRequestInput {
  readonly materialId: number;
  readonly projectId?: number | null;
  readonly description: string;
  readonly quantity: number;
  readonly uom?: string | null;
  readonly requiredDate: string;
}

/**
 * API request payload for material purchase request.
 * @internal
 */
interface CreateMaterialPurchaseRequestRequest {
  materialId: number;
  projectId: number | null;
  description: string;
  quantity: number;
  uom: string | null;
  requiredDate: string;
}

/**
 * Validate material purchase request input.
 * @throws DomainValidationError if validation fails
 */
function validateMaterialInput(input: CreateMaterialPurchaseRequestInput): void {
  if (!input.materialId) {
    throw new DomainValidationError('REQUIRED', 'materialId', 'Material is required');
  }
  if (!input.description?.trim()) {
    throw new DomainValidationError('REQUIRED', 'description', 'Description is required');
  }
  if (input.quantity <= 0) {
    throw new DomainValidationError('OUT_OF_RANGE', 'quantity', 'Quantity must be greater than 0');
  }
  if (!input.requiredDate) {
    throw new DomainValidationError('REQUIRED', 'requiredDate', 'Required date is required');
  }
}

/**
 * Create a new material (physical items) purchase request.
 *
 * @param input - Material purchase request data
 * @returns Command result with created ID
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 *
 * @example
 * const result = await createMaterialPurchaseRequest({
 *   materialId: 1,
 *   description: 'Steel plates for project',
 *   quantity: 50,
 *   requiredDate: '2025-02-15',
 * });
 */
export async function createMaterialPurchaseRequest(
  input: CreateMaterialPurchaseRequestInput
): Promise<CommandResult> {
  validateMaterialInput(input);

  const request: CreateMaterialPurchaseRequestRequest = {
    materialId: input.materialId,
    projectId: input.projectId ?? null,
    description: input.description.trim(),
    quantity: input.quantity,
    uom: input.uom?.trim() ?? null,
    requiredDate: input.requiredDate,
  };

  return httpClient.post<CommandResult>(PURCHASE_REQUEST_ENDPOINTS.MATERIAL, request);
}
