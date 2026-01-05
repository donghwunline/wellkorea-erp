/**
 * Chain Template Domain Model.
 *
 * Represents an approval chain configuration template.
 */

import type { EntityType } from '@/entities/approval';

/**
 * Approval level in a chain template.
 */
export interface ChainLevel {
  readonly id: number;
  readonly levelOrder: number;
  readonly levelName: string;
  readonly approverUserId: number;
  readonly approverUserName: string;
  readonly isRequired: boolean;
}

/**
 * Approval chain template.
 */
export interface ChainTemplate {
  readonly id: number;
  readonly entityType: EntityType;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly levels: readonly ChainLevel[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Input for creating/updating a chain level.
 */
export interface ChainLevelInput {
  levelOrder: number;
  levelName: string;
  approverUserId: number;
  isRequired: boolean;
}

/**
 * Business rules for chain templates.
 */
export const chainTemplateRules = {
  /**
   * Check if a chain template is properly configured.
   */
  isConfigured(template: ChainTemplate): boolean {
    return template.levels.length > 0 && template.levels.every(l => l.approverUserId > 0);
  },

  /**
   * Validate chain level inputs.
   */
  validateLevels(levels: ChainLevelInput[]): string | null {
    if (levels.length === 0) {
      return 'At least one approval level is required';
    }

    const hasInvalidApprover = levels.some(l => !l.approverUserId || l.approverUserId === 0);
    if (hasInvalidApprover) {
      return 'All levels must have an approver assigned';
    }

    return null;
  },

  /**
   * Format levels for display.
   */
  formatLevelCount(levels: readonly ChainLevel[]): string {
    if (levels.length === 0) return 'No levels configured';
    return `${levels.length} level${levels.length > 1 ? 's' : ''}`;
  },
};
