/**
 * Company Status Badge.
 *
 * Pure display component for company active status.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 */

import { Badge } from '@/shared/ui';

export interface CompanyStatusBadgeProps {
  /**
   * Company active status.
   */
  isActive: boolean;

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
 * Status badge component for company active/inactive state.
 *
 * @example
 * ```tsx
 * <CompanyStatusBadge isActive={company.isActive} />
 * ```
 */
export function CompanyStatusBadge({
  isActive,
  size = 'md',
  className,
}: Readonly<CompanyStatusBadgeProps>) {
  return (
    <Badge
      variant={isActive ? 'success' : 'danger'}
      size={size}
      dot
      className={className}
    >
      {isActive ? '활성' : '비활성'}
    </Badge>
  );
}
