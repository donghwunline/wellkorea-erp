/**
 * Update Project command function.
 *
 * Combines validation, mapping, and HTTP PUT in one module.
 * Use with useMutation() in the features layer.
 *
 * @example
 * ```tsx
 * // In features layer
 * const mutation = useMutation({
 *   mutationFn: ({ id, input }) => updateProject(id, input),
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: projectQueries.details() });
 *   },
 * });
 *
 * // Call with partial update
 * mutation.mutate({
 *   id: 123,
 *   input: { projectName: 'Updated Name' },
 * });
 * ```
 */

import { DomainValidationError, httpClient, PROJECT_ENDPOINTS } from '@/shared/api';
import type { ProjectStatus } from '../model/project';
import type { CommandResult } from './project.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Request for updating an existing project.
 */
interface UpdateProjectRequest {
  projectName?: string;
  requesterName?: string;
  dueDate?: string;
  status?: ProjectStatus;
  note?: string;
}

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input type for updating a project.
 * All fields are optional for partial updates.
 */
export interface UpdateProjectInput {
  projectName?: string;
  requesterName?: string;
  dueDate?: string;
  status?: ProjectStatus;
  note?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateUpdateInput(input: UpdateProjectInput): void {
  if (input.projectName !== undefined && !input.projectName.trim()) {
    throw new DomainValidationError('REQUIRED', 'projectName', 'Project name cannot be empty');
  }

  if (input.dueDate !== undefined && !input.dueDate) {
    throw new DomainValidationError('REQUIRED', 'dueDate', 'Due date cannot be empty');
  }
}

// =============================================================================
// MAPPING
// =============================================================================

function toUpdateRequest(input: UpdateProjectInput): UpdateProjectRequest {
  return {
    projectName: input.projectName?.trim(),
    requesterName: input.requesterName?.trim() || undefined,
    dueDate: input.dueDate,
    status: input.status,
    note: input.note,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Update an existing project.
 *
 * Validates input, maps to request, and sends HTTP PUT.
 * Supports partial updates - only provided fields are updated.
 *
 * @throws DomainValidationError if validation fails
 */
export async function updateProject(
  id: number,
  input: UpdateProjectInput
): Promise<CommandResult> {
  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  return httpClient.put<CommandResult>(PROJECT_ENDPOINTS.byId(id), request);
}
