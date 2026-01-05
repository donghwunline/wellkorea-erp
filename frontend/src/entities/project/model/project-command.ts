/**
 * Project command types and validation.
 *
 * Command types are used for write operations (create, update).
 * Separate from the read-side Project model.
 *
 * Validation runs on Command types (entities-owned), not feature input types.
 * This prevents entities from depending on feature types.
 */

import { DomainValidationError } from '@/shared/api';
import type { ProjectStatus } from './project';

// ============================================================================
// Command Types
// ============================================================================

/**
 * Command for creating a new project.
 * All required fields are non-nullable after mapping from input.
 */
export interface CreateProjectCommand {
  readonly customerId: number;
  readonly projectName: string;
  readonly requesterName: string | null;
  readonly dueDate: string;
  readonly internalOwnerId: number;
}

/**
 * Command for updating an existing project.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateProjectCommand {
  readonly projectName?: string;
  readonly requesterName?: string | null;
  readonly dueDate?: string;
  readonly status?: ProjectStatus;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Project command validation functions.
 *
 * Throws DomainValidationError on validation failure.
 * Errors include field path for form error mapping.
 */
export const projectValidation = {
  /**
   * Validate create command before API call.
   *
   * @throws DomainValidationError if validation fails
   */
  validateCreate(command: CreateProjectCommand): void {
    if (!command.customerId || command.customerId <= 0) {
      throw new DomainValidationError('REQUIRED', 'customerId', 'Customer is required');
    }

    if (!command.projectName?.trim()) {
      throw new DomainValidationError('REQUIRED', 'projectName', 'Project name is required');
    }

    if (!command.dueDate) {
      throw new DomainValidationError('REQUIRED', 'dueDate', 'Due date is required');
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(command.dueDate)) {
      throw new DomainValidationError('INVALID_FORMAT', 'dueDate', 'Due date must be in YYYY-MM-DD format');
    }

    if (!command.internalOwnerId || command.internalOwnerId <= 0) {
      throw new DomainValidationError('REQUIRED', 'internalOwnerId', 'Internal owner is required');
    }
  },

  /**
   * Validate update command before API call.
   *
   * @throws DomainValidationError if validation fails
   */
  validateUpdate(command: UpdateProjectCommand): void {
    // At least one field must be provided
    const hasAnyField =
      command.projectName !== undefined ||
      command.requesterName !== undefined ||
      command.dueDate !== undefined ||
      command.status !== undefined;

    if (!hasAnyField) {
      throw new DomainValidationError('REQUIRED', '', 'At least one field must be provided for update');
    }

    if (command.projectName !== undefined && !command.projectName.trim()) {
      throw new DomainValidationError('REQUIRED', 'projectName', 'Project name cannot be empty');
    }

    if (command.dueDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(command.dueDate)) {
      throw new DomainValidationError('INVALID_FORMAT', 'dueDate', 'Due date must be in YYYY-MM-DD format');
    }

    // Validate status transition if provided
    if (command.status !== undefined) {
      const validStatuses: ProjectStatus[] = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
      if (!validStatuses.includes(command.status)) {
        throw new DomainValidationError('INVALID_VALUE', 'status', 'Invalid project status');
      }
    }
  },
};
