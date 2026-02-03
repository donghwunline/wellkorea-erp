/**
 * Product active status enum and display configuration.
 *
 * Defines the active/inactive/discontinued status states and their UI representation.
 */

/**
 * Product active status.
 * Const object pattern provides both type safety and runtime values.
 */
export const ProductActiveStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DISCONTINUED: 'DISCONTINUED',
} as const;

export type ProductActiveStatus = (typeof ProductActiveStatus)[keyof typeof ProductActiveStatus];

/**
 * Badge color variants from the design system.
 */
export type BadgeColor = 'steel' | 'copper' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

/**
 * Status display configuration.
 * Labels are handled via i18n (items.json status section).
 */
export interface StatusConfig {
  readonly color: BadgeColor;
}

/**
 * Display configuration for each product active status.
 * Colors map to design system Badge variants.
 * Labels are in locales/{lang}/items.json under "status" key.
 */
export const ProductActiveStatusConfig: Record<ProductActiveStatus, StatusConfig> = {
  ACTIVE: { color: 'success' },
  INACTIVE: { color: 'steel' },
  DISCONTINUED: { color: 'danger' },
};
