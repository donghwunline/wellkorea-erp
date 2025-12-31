/**
 * Project command mappers.
 *
 * Two-step mapping for write operations:
 * 1. Feature Input → Command (for validation)
 * 2. Command → API DTO (for API call)
 *
 * This pattern separates:
 * - UI-friendly input types (strings allowed, optional fields)
 * - Validated command types (numbers required, normalized)
 * - API DTOs (exact backend contract)
 */

import type { ProjectStatus } from '../model';
import type { CreateProjectCommand, UpdateProjectCommand } from '../model/project-command';
import type { CreateProjectRequestDTO, UpdateProjectRequestDTO } from './project.dto';

/**
 * Feature input type for creating a project.
 * UI-friendly: allows nulls from form fields before validation.
 */
export interface CreateProjectInput {
  customerId: number | null;
  projectName: string;
  requesterName?: string;
  dueDate: string;
  internalOwnerId: number | null;
}

/**
 * Feature input type for updating a project.
 * All fields are optional for partial updates.
 */
export interface UpdateProjectInput {
  projectName?: string;
  requesterName?: string;
  dueDate?: string;
  status?: ProjectStatus;
}

// ============================================================================
// Mappers
// ============================================================================

/**
 * Project command mappers.
 */
export const projectCommandMapper = {
  /**
   * Map feature input to domain command (for validation).
   * Handles null → required field checks and normalization.
   *
   * @throws Error if required fields are null
   */
  toCreateCommand(input: CreateProjectInput): CreateProjectCommand {
    if (input.customerId === null) {
      throw new Error('Customer is required');
    }

    if (input.internalOwnerId === null) {
      throw new Error('Internal owner is required');
    }

    return {
      customerId: input.customerId,
      projectName: input.projectName.trim(),
      requesterName: input.requesterName?.trim() || null,
      dueDate: input.dueDate,
      internalOwnerId: input.internalOwnerId,
    };
  },

  /**
   * Map feature input to update command (for validation).
   */
  toUpdateCommand(input: UpdateProjectInput): UpdateProjectCommand {
    return {
      projectName: input.projectName?.trim(),
      requesterName:
        input.requesterName !== undefined ? input.requesterName?.trim() || null : undefined,
      dueDate: input.dueDate,
      status: input.status,
    };
  },

  /**
   * Map validated create command to API DTO.
   * Command is already validated, just transform to API shape.
   */
  toCreateDto(command: CreateProjectCommand): CreateProjectRequestDTO {
    return {
      customerId: command.customerId,
      projectName: command.projectName,
      requesterName: command.requesterName ?? undefined,
      dueDate: command.dueDate,
      internalOwnerId: command.internalOwnerId,
    };
  },

  /**
   * Map validated update command to API DTO.
   */
  toUpdateDto(command: UpdateProjectCommand): UpdateProjectRequestDTO {
    return {
      projectName: command.projectName,
      requesterName: command.requesterName ?? undefined,
      dueDate: command.dueDate,
      status: command.status,
    };
  },
};
