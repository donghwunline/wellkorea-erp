/**
 * Company Role Badge.
 *
 * Pure display component for company role type.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 */

import { Badge } from '@/shared/ui';
import type { RoleType } from '../model/role-type';
import { ROLE_TYPE_LABELS, ROLE_TYPE_BADGE_VARIANTS } from '../model/role-type';

export interface CompanyRoleBadgeProps {
  /**
   * Role type to display.
   */
  roleType: RoleType;

  /**
   * Optional size variant.
   */
  size?: 'sm' | 'md';

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Role badge component for company roles.
 *
 * @example
 * ```tsx
 * <CompanyRoleBadge roleType="CUSTOMER" />
 * <CompanyRoleBadge roleType="VENDOR" size="sm" />
 * ```
 */
export function CompanyRoleBadge({
  roleType,
  size = 'md',
  className,
}: Readonly<CompanyRoleBadgeProps>) {
  return (
    <Badge
      variant={ROLE_TYPE_BADGE_VARIANTS[roleType]}
      size={size}
      className={className}
    >
      {ROLE_TYPE_LABELS[roleType]}
    </Badge>
  );
}
