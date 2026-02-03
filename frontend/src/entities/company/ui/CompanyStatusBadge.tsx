/**
 * Company status badge component.
 * Thin wrapper around generic StatusBadge with company-specific configuration.
 */

import { StatusBadge } from '@/shared/ui';
import type { CompanyActiveStatus } from '../model/company-status';
import { CompanyActiveStatusConfig } from '../model/company-status';

export interface CompanyStatusBadgeProps {
  /**
   * Company active status (boolean).
   */
  isActive: boolean;

  /**
   * Badge size variant.
   */
  size?: 'sm' | 'md';

  /**
   * Additional className.
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
  size,
  className,
}: Readonly<CompanyStatusBadgeProps>) {
  const status: CompanyActiveStatus = isActive ? 'ACTIVE' : 'INACTIVE';

  return (
    <StatusBadge
      status={status}
      config={CompanyActiveStatusConfig}
      i18nKey="entities:company.status"
      size={size}
      dot
      className={className}
    />
  );
}
