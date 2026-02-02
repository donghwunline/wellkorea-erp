/**
 * Company active status enum and display configuration.
 *
 * Defines the active/inactive status states and their UI representation.
 */

/**
 * Company active status.
 * Const object pattern provides both type safety and runtime values.
 */
export const CompanyActiveStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type CompanyActiveStatus = (typeof CompanyActiveStatus)[keyof typeof CompanyActiveStatus];

/**
 * Badge color variants from the design system.
 */
export type BadgeColor = 'steel' | 'copper' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

/**
 * Status display configuration.
 * Labels are handled via i18n (entities.json company.status section).
 */
export interface StatusConfig {
  readonly color: BadgeColor;
}

/**
 * Display configuration for each company active status.
 * Colors map to design system Badge variants.
 * Labels are in locales/{lang}/entities.json under "company.status" key.
 */
export const CompanyActiveStatusConfig: Record<CompanyActiveStatus, StatusConfig> = {
  ACTIVE: { color: 'success' },
  INACTIVE: { color: 'danger' },
};
