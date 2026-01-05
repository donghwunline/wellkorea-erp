/**
 * Work progress sheet domain model.
 *
 * Represents production tracking for a single product within a project.
 * Each sheet has multiple manufacturing steps that track progress.
 * Dates are stored as ISO strings for React Query cache serialization.
 */

import type { SheetStatus } from './step-status';
import { StepStatus as StepStatusEnum } from './step-status';
import type { WorkProgressStep } from './work-progress-step';

/**
 * Work progress sheet domain model (plain interface).
 *
 * All properties are readonly to enforce immutability.
 */
export interface WorkProgressSheet {
  readonly id: number;
  readonly projectId: number;
  readonly jobCode: string;
  readonly productId: number;
  readonly productName: string;
  readonly productSku: string;
  readonly quantity: number;
  readonly sequence: number;
  readonly status: SheetStatus;
  readonly startedAt: string | null; // ISO datetime
  readonly completedAt: string | null; // ISO datetime
  readonly notes: string | null;
  readonly progressPercentage: number;
  readonly totalSteps: number;
  readonly completedSteps: number;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
  readonly steps: readonly WorkProgressStep[];
}

/**
 * Work progress sheet summary for list views (lighter than full sheet).
 */
export interface WorkProgressSheetListItem {
  readonly id: number;
  readonly projectId: number;
  readonly jobCode: string;
  readonly productId: number;
  readonly productName: string;
  readonly productSku: string;
  readonly quantity: number;
  readonly sequence: number;
  readonly status: SheetStatus;
  readonly progressPercentage: number;
  readonly completedSteps: number;
  readonly totalSteps: number;
  readonly createdAt: string;
}

/**
 * Project production summary (aggregated from all sheets).
 */
export interface ProjectProductionSummary {
  readonly projectId: number;
  readonly jobCode: string | null;
  readonly totalSheets: number;
  readonly completedSheets: number;
  readonly inProgressSheets: number;
  readonly notStartedSheets: number;
  readonly overallProgressPercentage: number;
  readonly totalSteps: number;
  readonly completedSteps: number;
}

/**
 * Work progress sheet pure functions for business rules.
 *
 * All business logic as pure functions that operate on sheet objects.
 */
export const workProgressRules = {
  // ==================== COMPUTED VALUES ====================

  /**
   * Calculate progress percentage from steps.
   */
  calculateProgress(sheet: WorkProgressSheet): number {
    if (sheet.steps.length === 0) return 0;
    const completed = sheet.steps.filter(
      s => s.status === StepStatusEnum.COMPLETED || s.status === StepStatusEnum.SKIPPED
    ).length;
    return Math.floor((completed / sheet.steps.length) * 100);
  },

  /**
   * Get count of completed steps.
   */
  getCompletedStepCount(sheet: WorkProgressSheet): number {
    return sheet.steps.filter(
      s => s.status === StepStatusEnum.COMPLETED || s.status === StepStatusEnum.SKIPPED
    ).length;
  },

  /**
   * Get count of outsourced steps.
   */
  getOutsourcedStepCount(sheet: WorkProgressSheet): number {
    return sheet.steps.filter(s => s.isOutsourced).length;
  },

  /**
   * Check if sheet has any outsourced steps.
   */
  hasOutsourcedSteps(sheet: WorkProgressSheet): boolean {
    return sheet.steps.some(s => s.isOutsourced);
  },

  /**
   * Get the current active step (first IN_PROGRESS step).
   */
  getCurrentStep(sheet: WorkProgressSheet): WorkProgressStep | null {
    return sheet.steps.find(s => s.status === StepStatusEnum.IN_PROGRESS) ?? null;
  },

  /**
   * Get the next pending step (first NOT_STARTED step).
   */
  getNextPendingStep(sheet: WorkProgressSheet): WorkProgressStep | null {
    return sheet.steps.find(s => s.status === StepStatusEnum.NOT_STARTED) ?? null;
  },

  // ==================== BUSINESS RULES ====================

  /**
   * Check if sheet is fully completed.
   */
  isCompleted(sheet: WorkProgressSheet): boolean {
    return sheet.steps.every(
      s => s.status === StepStatusEnum.COMPLETED || s.status === StepStatusEnum.SKIPPED
    );
  },

  /**
   * Check if sheet is not started.
   */
  isNotStarted(sheet: WorkProgressSheet): boolean {
    return sheet.steps.every(s => s.status === StepStatusEnum.NOT_STARTED);
  },

  /**
   * Check if sheet is in progress.
   */
  isInProgress(sheet: WorkProgressSheet): boolean {
    return !workProgressRules.isCompleted(sheet) && !workProgressRules.isNotStarted(sheet);
  },
};

/**
 * Step-level business rules.
 */
export const stepRules = {
  /**
   * Check if step can be started.
   */
  canStart(step: WorkProgressStep): boolean {
    return step.status === StepStatusEnum.NOT_STARTED;
  },

  /**
   * Check if step can be completed.
   */
  canComplete(step: WorkProgressStep): boolean {
    return step.status === StepStatusEnum.IN_PROGRESS;
  },

  /**
   * Check if step can be skipped.
   */
  canSkip(step: WorkProgressStep): boolean {
    return step.status === StepStatusEnum.NOT_STARTED || step.status === StepStatusEnum.IN_PROGRESS;
  },

  /**
   * Check if step can be reset.
   */
  canReset(step: WorkProgressStep): boolean {
    return step.status !== StepStatusEnum.NOT_STARTED;
  },

  /**
   * Check if step is terminal (completed or skipped).
   */
  isTerminal(step: WorkProgressStep): boolean {
    return step.status === StepStatusEnum.COMPLETED || step.status === StepStatusEnum.SKIPPED;
  },

  /**
   * Format duration in hours.
   */
  formatDuration(hours: number | null): string {
    if (hours === null) return '-';
    if (hours < 1) return `${Math.round(hours * 60)}분`;
    return `${hours.toFixed(1)}시간`;
  },
};
