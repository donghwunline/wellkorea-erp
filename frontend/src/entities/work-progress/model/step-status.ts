/**
 * Work progress step status enum.
 *
 * Represents the lifecycle of a manufacturing step.
 */

/**
 * Work progress step status values.
 * Matches backend StepStatus enum.
 */
export const StepStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
} as const;

export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

/**
 * Work progress sheet status values.
 * Matches backend SheetStatus enum.
 */
export const SheetStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type SheetStatus = (typeof SheetStatus)[keyof typeof SheetStatus];

/**
 * Status display configuration for UI rendering.
 */
export interface StatusConfig {
  readonly label: string;
  readonly labelKo: string;
  readonly color: 'default' | 'blue' | 'green' | 'yellow';
  readonly icon?: string;
}

/**
 * Step status configuration for UI rendering.
 */
export const StepStatusConfig: Record<StepStatus, StatusConfig> = {
  [StepStatus.NOT_STARTED]: {
    label: 'Not Started',
    labelKo: '미시작',
    color: 'default',
  },
  [StepStatus.IN_PROGRESS]: {
    label: 'In Progress',
    labelKo: '진행중',
    color: 'blue',
  },
  [StepStatus.COMPLETED]: {
    label: 'Completed',
    labelKo: '완료',
    color: 'green',
  },
  [StepStatus.SKIPPED]: {
    label: 'Skipped',
    labelKo: '건너뜀',
    color: 'yellow',
  },
};

/**
 * Sheet status configuration for UI rendering.
 */
export const SheetStatusConfig: Record<SheetStatus, StatusConfig> = {
  [SheetStatus.NOT_STARTED]: {
    label: 'Not Started',
    labelKo: '미시작',
    color: 'default',
  },
  [SheetStatus.IN_PROGRESS]: {
    label: 'In Progress',
    labelKo: '진행중',
    color: 'blue',
  },
  [SheetStatus.COMPLETED]: {
    label: 'Completed',
    labelKo: '완료',
    color: 'green',
  },
};
