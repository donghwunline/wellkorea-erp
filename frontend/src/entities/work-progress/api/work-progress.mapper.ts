/**
 * Work Progress Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { StepStatus, SheetStatus } from '../model/step-status';
import type { WorkProgressStep } from '../model/work-progress-step';
import type {
  WorkProgressSheet,
  WorkProgressSheetListItem,
  ProjectProductionSummary,
} from '../model/work-progress-sheet';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Command result from CQRS command endpoints.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Work progress step from API response.
 */
export interface WorkProgressStepResponse {
  id: number;
  sheetId: number;
  parentStepId: number | null;
  stepNumber: number;
  stepName: string;
  status: string; // Will be cast to StepStatus
  startedAt: string | null;
  completedAt: string | null;
  completedById: number | null;
  completedByName: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  isOutsourced: boolean | null; // Boxed Boolean from backend
  outsourceVendorId: number | null;
  outsourceVendorName: string | null;
  outsourceEta: string | null;
  outsourceCost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Work progress sheet from API response.
 */
export interface WorkProgressSheetResponse {
  id: number;
  projectId: number;
  jobCode: string;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  sequence: number;
  status: string; // Will be cast to SheetStatus
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  progressPercentage: number;
  totalSteps: number;
  completedSteps: number;
  steps: WorkProgressStepResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project production summary from API response.
 */
export interface ProjectProductionSummaryResponse {
  projectId: number;
  jobCode: string | null;
  totalSheets: number;
  completedSheets: number;
  inProgressSheets: number;
  notStartedSheets: number;
  overallProgressPercentage: number;
  totalSteps: number;
  completedSteps: number;
}

// =============================================================================
// MAPPERS
// =============================================================================

/**
 * Work progress step mapper.
 */
const stepMapper = {
  /**
   * Map API response to domain model (plain object).
   */
  toDomain(response: WorkProgressStepResponse): WorkProgressStep {
    return {
      id: response.id,
      sheetId: response.sheetId,
      parentStepId: response.parentStepId,
      stepNumber: response.stepNumber,
      stepName: response.stepName.trim(),
      status: response.status as StepStatus,
      startedAt: response.startedAt,
      completedAt: response.completedAt,
      completedById: response.completedById,
      completedByName: response.completedByName?.trim() ?? null,
      estimatedHours: response.estimatedHours,
      actualHours: response.actualHours,
      isOutsourced: response.isOutsourced ?? false, // Boxed Boolean → boolean
      outsourceVendorId: response.outsourceVendorId,
      outsourceVendorName: response.outsourceVendorName?.trim() ?? null,
      outsourceEta: response.outsourceEta,
      outsourceCost: response.outsourceCost,
      notes: response.notes?.trim() ?? null,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  },
};

/**
 * Work progress sheet mapper.
 */
export const workProgressMapper = {
  /**
   * Map API response to domain model (plain object).
   */
  toDomain(response: WorkProgressSheetResponse): WorkProgressSheet {
    const steps = (response.steps ?? []).map(stepMapper.toDomain);

    return {
      id: response.id,
      projectId: response.projectId,
      jobCode: response.jobCode,
      productId: response.productId,
      productName: response.productName.trim(),
      productSku: response.productSku,
      quantity: response.quantity,
      sequence: response.sequence,
      status: response.status as SheetStatus,
      startedAt: response.startedAt,
      completedAt: response.completedAt,
      notes: response.notes?.trim() ?? null,
      progressPercentage: response.progressPercentage,
      totalSteps: response.totalSteps,
      completedSteps: response.completedSteps,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      steps,
    };
  },

  /**
   * Map domain model to list summary.
   */
  toListItem(sheet: WorkProgressSheet): WorkProgressSheetListItem {
    return {
      id: sheet.id,
      projectId: sheet.projectId,
      jobCode: sheet.jobCode,
      productId: sheet.productId,
      productName: sheet.productName,
      productSku: sheet.productSku,
      quantity: sheet.quantity,
      sequence: sheet.sequence,
      status: sheet.status,
      progressPercentage: sheet.progressPercentage,
      completedSteps: sheet.completedSteps,
      totalSteps: sheet.totalSteps,
      createdAt: sheet.createdAt,
    };
  },

  /**
   * Map response directly to list item.
   */
  responseToListItem(response: WorkProgressSheetResponse): WorkProgressSheetListItem {
    const sheet = workProgressMapper.toDomain(response);
    return workProgressMapper.toListItem(sheet);
  },

  /**
   * Map step response to domain model.
   */
  stepToDomain(response: WorkProgressStepResponse): WorkProgressStep {
    return stepMapper.toDomain(response);
  },
};

/**
 * Project production summary mapper.
 */
export const summaryMapper = {
  /**
   * Map API response to domain model.
   */
  toDomain(response: ProjectProductionSummaryResponse): ProjectProductionSummary {
    return {
      projectId: response.projectId,
      jobCode: response.jobCode,
      totalSheets: response.totalSheets,
      completedSheets: response.completedSheets,
      inProgressSheets: response.inProgressSheets,
      notStartedSheets: response.notStartedSheets,
      overallProgressPercentage: response.overallProgressPercentage,
      totalSteps: response.totalSteps,
      completedSteps: response.completedSteps,
    };
  },
};
