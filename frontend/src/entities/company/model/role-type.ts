/**
 * Company role type enum and constants.
 *
 * Defines the three company role types (CUSTOMER, VENDOR, OUTSOURCE)
 * with human-readable labels and badge styling configuration.
 */

/**
 * Company role type enum matching backend RoleType.
 */
export const RoleType = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  OUTSOURCE: 'OUTSOURCE',
} as const;

export type RoleType = (typeof RoleType)[keyof typeof RoleType];

/**
 * Human-readable labels for role types (Korean).
 */
export const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  [RoleType.CUSTOMER]: '고객사',
  [RoleType.VENDOR]: '협력업체',
  [RoleType.OUTSOURCE]: '외주업체',
};

/**
 * Badge variant for each role type.
 * Maps to shared/ui Badge component variants.
 */
export type BadgeVariant = 'info' | 'success' | 'purple' | 'warning' | 'danger';

export const ROLE_TYPE_BADGE_VARIANTS: Record<RoleType, BadgeVariant> = {
  [RoleType.CUSTOMER]: 'info',
  [RoleType.VENDOR]: 'success',
  [RoleType.OUTSOURCE]: 'purple',
};
