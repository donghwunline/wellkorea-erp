/**
 * Create Project command function.
 *
 * Combines validation, mapping, and HTTP POST in one module.
 * Use with useMutation() in the features layer.
 *
 * @example
 * ```tsx
 * // In features layer
 * const mutation = useMutation({
 *   mutationFn: createProject,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
 *   },
 * });
 *
 * // Call with UI-friendly input
 * mutation.mutate({
 *   customerId: 1,
 *   projectName: 'New Project',
 *   dueDate: '2025-12-31',
 *   internalOwnerId: 2,
 * });
 * ```
 */

import { DomainValidationError, httpClient, PROJECT_ENDPOINTS } from '@/shared/api';
import type { CreateProjectRequestDTO, ProjectCommandResultDTO } from './project.dto';
import { projectMapper, type ProjectCommandResult } from './project.mapper';

/**
 * Input type for creating a project.
 * UI-friendly: allows nulls from form fields before validation.
 */
export interface CreateProjectInput {
  customerId: number | null;
  projectName: string;
  requesterName?: string;
  dueDate: string;
  internalOwnerId: number | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateCreateInput(input: CreateProjectInput): void {
  if (input.customerId === null) {
    throw new DomainValidationError('REQUIRED', 'customerId', 'Customer is required');
  }

  if (input.internalOwnerId === null) {
    throw new DomainValidationError('REQUIRED', 'internalOwnerId', 'Internal owner is required');
  }

  if (!input.projectName.trim()) {
    throw new DomainValidationError('REQUIRED', 'projectName', 'Project name is required');
  }

  if (!input.dueDate) {
    throw new DomainValidationError('REQUIRED', 'dueDate', 'Due date is required');
  }
}

// =============================================================================
// MAPPING
// =============================================================================

function toCreateRequest(input: CreateProjectInput): CreateProjectRequestDTO {
  return {
    customerId: input.customerId!,
    projectName: input.projectName.trim(),
    requesterName: input.requesterName?.trim() || undefined,
    dueDate: input.dueDate,
    internalOwnerId: input.internalOwnerId!,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Create a new project.
 *
 * Validates input, maps to request DTO, and sends HTTP POST.
 * Returns command result with ID and auto-generated JobCode.
 *
 * @throws DomainValidationError if validation fails
 */
export async function createProject(
  input: CreateProjectInput
): Promise<ProjectCommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  const dto = await httpClient.post<ProjectCommandResultDTO>(PROJECT_ENDPOINTS.BASE, request);
  return projectMapper.toCommandResult(dto);
}
