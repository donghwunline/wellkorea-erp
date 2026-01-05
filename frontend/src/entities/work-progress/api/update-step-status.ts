/**
 * Update Step Status API function with validation.
 *
 * Combines Input validation, mapping, and HTTP PUT in one module.
 * Follows FSD pattern: entities/{entity}/api/update-{action}.ts
 */

import { DomainValidationError, httpClient, WORK_PROGRESS_ENDPOINTS } from '@/shared/api';
import type { StepStatus } from '../model/step-status';
import { StepStatus as StepStatusEnum } from '../model/step-status';
import type { WorkProgressStep } from '../model/work-progress-step';
import type { WorkProgressStepResponse } from './work-progress.mapper';
import { workProgressMapper } from './work-progress.mapper';

// =============================================================================
// REQUEST TYPES (internal)
// =============================================================================

/**
 * Request for updating step status.
 */
interface UpdateStepStatusRequest {
  status: StepStatus;
  actualHours?: number;
  isOutsourced?: boolean;
  outsourceVendorId?: number;
  outsourceEta?: string;
  outsourceCost?: number;
  notes?: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Update step status input from UI.
 */
export interface UpdateStepStatusInput {
  sheetId: number;
  stepId: number;
  status: StepStatus;
  actualHours?: number | string;
  isOutsourced?: boolean;
  outsourceVendorId?: number | null;
  outsourceEta?: string;
  outsourceCost?: number | string;
  notes?: string;
}

/**
 * Convenience input for starting a step.
 */
export interface StartStepInput {
  sheetId: number;
  stepId: number;
  isOutsourced?: boolean;
  outsourceVendorId?: number | null;
  outsourceEta?: string;
  outsourceCost?: number | string;
  notes?: string;
}

/**
 * Convenience input for completing a step.
 */
export interface CompleteStepInput {
  sheetId: number;
  stepId: number;
  actualHours?: number | string;
  notes?: string;
}

/**
 * Convenience input for skipping a step.
 */
export interface SkipStepInput {
  sheetId: number;
  stepId: number;
  notes?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate update step status input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateUpdateInput(input: UpdateStepStatusInput): void {
  if (!input.sheetId || input.sheetId <= 0) {
    throw new DomainValidationError('REQUIRED', 'sheetId', 'Sheet ID is required');
  }

  if (!input.stepId || input.stepId <= 0) {
    throw new DomainValidationError('REQUIRED', 'stepId', 'Step ID is required');
  }

  const validStatuses = Object.values(StepStatusEnum);
  if (!validStatuses.includes(input.status)) {
    throw new DomainValidationError('INVALID_VALUE', 'status', 'Invalid step status');
  }

  if (input.actualHours !== undefined) {
    const hours = Number(input.actualHours);
    if (isNaN(hours) || hours < 0) {
      throw new DomainValidationError('OUT_OF_RANGE', 'actualHours', 'Actual hours cannot be negative');
    }
  }

  if (input.outsourceCost !== undefined) {
    const cost = Number(input.outsourceCost);
    if (isNaN(cost) || cost < 0) {
      throw new DomainValidationError('OUT_OF_RANGE', 'outsourceCost', 'Outsource cost cannot be negative');
    }
  }

  // If outsourced, vendor is required when starting
  if (input.isOutsourced && input.status === StepStatusEnum.IN_PROGRESS) {
    if (!input.outsourceVendorId) {
      throw new DomainValidationError('REQUIRED', 'outsourceVendorId', 'Vendor is required for outsourced work');
    }
  }
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map update input to API request.
 */
function toUpdateRequest(input: UpdateStepStatusInput): UpdateStepStatusRequest {
  return {
    status: input.status,
    actualHours: input.actualHours ? Number(input.actualHours) : undefined,
    isOutsourced: input.isOutsourced,
    outsourceVendorId: input.outsourceVendorId ?? undefined,
    outsourceEta: input.outsourceEta?.trim() || undefined,
    outsourceCost: input.outsourceCost ? Number(input.outsourceCost) : undefined,
    notes: input.notes?.trim() || undefined,
  };
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Update a work progress step status.
 *
 * @param input - Update step status input
 * @returns Updated step
 * @throws DomainValidationError if validation fails
 */
export async function updateStepStatus(input: UpdateStepStatusInput): Promise<WorkProgressStep> {
  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  const response = await httpClient.put<WorkProgressStepResponse>(
    WORK_PROGRESS_ENDPOINTS.step(input.sheetId, input.stepId),
    request
  );
  return workProgressMapper.stepToDomain(response);
}

/**
 * Start a work progress step.
 *
 * @param input - Start step input
 * @returns Updated step
 */
export async function startStep(input: StartStepInput): Promise<WorkProgressStep> {
  return updateStepStatus({
    ...input,
    status: StepStatusEnum.IN_PROGRESS,
  });
}

/**
 * Complete a work progress step.
 *
 * @param input - Complete step input
 * @returns Updated step
 */
export async function completeStep(input: CompleteStepInput): Promise<WorkProgressStep> {
  return updateStepStatus({
    ...input,
    status: StepStatusEnum.COMPLETED,
  });
}

/**
 * Skip a work progress step.
 *
 * @param input - Skip step input
 * @returns Updated step
 */
export async function skipStep(input: SkipStepInput): Promise<WorkProgressStep> {
  return updateStepStatus({
    ...input,
    status: StepStatusEnum.SKIPPED,
  });
}

/**
 * Reset a work progress step to NOT_STARTED.
 *
 * @param sheetId - Sheet ID
 * @param stepId - Step ID
 * @returns Updated step
 */
export async function resetStep(sheetId: number, stepId: number): Promise<WorkProgressStep> {
  return updateStepStatus({
    sheetId,
    stepId,
    status: StepStatusEnum.NOT_STARTED,
  });
}
