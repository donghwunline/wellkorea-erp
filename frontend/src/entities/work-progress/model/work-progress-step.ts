/**
 * Work progress step domain model.
 *
 * Represents a single manufacturing step within a work progress sheet.
 * Dates are stored as ISO strings for React Query cache serialization.
 */

import type { StepStatus } from './step-status';

/**
 * Work progress step domain model (plain interface).
 *
 * All properties are readonly to enforce immutability.
 */
export interface WorkProgressStep {
  readonly id: number;
  readonly sheetId: number;
  readonly parentStepId: number | null;
  readonly stepNumber: number;
  readonly stepName: string;
  readonly status: StepStatus;
  readonly startedAt: string | null; // ISO datetime
  readonly completedAt: string | null; // ISO datetime
  readonly completedById: number | null;
  readonly completedByName: string | null;
  readonly estimatedHours: number | null;
  readonly actualHours: number | null;
  readonly isOutsourced: boolean;
  readonly outsourceVendorId: number | null;
  readonly outsourceVendorName: string | null;
  readonly outsourceEta: string | null; // ISO date
  readonly outsourceCost: number | null;
  readonly notes: string | null;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
}
