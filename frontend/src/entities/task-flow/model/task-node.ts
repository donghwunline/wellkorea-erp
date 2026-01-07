/**
 * Task node domain model.
 * Represents a single task in the DAG task flow.
 */
export interface TaskNode {
  readonly id: string;
  readonly title: string;
  readonly assignee: string | null;
  readonly deadline: string | null; // ISO date string (YYYY-MM-DD)
  readonly progress: number; // 0-100
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
}

/**
 * Progress level for color coding.
 */
export type ProgressLevel = 'low' | 'medium' | 'high';

/**
 * Progress color for UI styling.
 */
export type ProgressColor = 'blue' | 'yellow' | 'green';

/**
 * Business rules for task nodes.
 */
export const taskNodeRules = {
  /**
   * Get progress level based on percentage.
   * low: 0-33%, medium: 34-66%, high: 67-100%
   */
  getProgressLevel(progress: number): ProgressLevel {
    if (progress <= 33) return 'low';
    if (progress <= 66) return 'medium';
    return 'high';
  },

  /**
   * Get progress color for UI styling.
   * blue (0-33%), yellow (34-66%), green (67-100%)
   */
  getProgressColor(progress: number): ProgressColor {
    const level = taskNodeRules.getProgressLevel(progress);
    const colorMap: Record<ProgressLevel, ProgressColor> = {
      low: 'blue',
      medium: 'yellow',
      high: 'green',
    };
    return colorMap[level];
  },

  /**
   * Check if a task is overdue.
   * A task is overdue if deadline has passed and progress is not 100%.
   */
  isOverdue(node: TaskNode, now: Date = new Date()): boolean {
    if (!node.deadline) return false;
    const deadlineDate = new Date(node.deadline);
    return deadlineDate < now && node.progress < 100;
  },

  /**
   * Get Tailwind CSS class for progress bar color.
   */
  getProgressBarClass(progress: number): string {
    const color = taskNodeRules.getProgressColor(progress);
    const classMap: Record<ProgressColor, string> = {
      blue: 'bg-blue-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
    };
    return classMap[color];
  },

  /**
   * Create a new task node with default values.
   */
  createDefault(id: string, position: { x: number; y: number }): TaskNode {
    return {
      id,
      title: 'New Task',
      assignee: null,
      deadline: null,
      progress: 0,
      position,
    };
  },
};
