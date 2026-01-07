/**
 * Product Status Badge.
 *
 * Visual indicator for product active/inactive status.
 *
 * Entity UI rules:
 * - Pure display component
 * - No data fetching or mutations
 * - All data via props
 */

import { Badge } from '@/shared/ui';

export interface ProductStatusBadgeProps {
  /**
   * Whether the product is active.
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

const STATUS_CONFIG = {
  active: { label: 'Active', variant: 'success' as const },
  inactive: { label: 'Inactive', variant: 'steel' as const },
};

/**
 * Badge displaying product status.
 *
 * @example
 * ```tsx
 * <ProductStatusBadge isActive={product.isActive} />
 * ```
 */
export function ProductStatusBadge({
  isActive,
  size = 'md',
  className,
}: Readonly<ProductStatusBadgeProps>) {
  const config = isActive ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}
