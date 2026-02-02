/**
 * Product status badge component.
 * Thin wrapper around generic StatusBadge with product-specific configuration.
 */

import { StatusBadge } from '@/shared/ui';
import type { ProductActiveStatus } from '../model/product-status';
import { ProductActiveStatusConfig } from '../model/product-status';

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
  size,
  className,
}: Readonly<ProductStatusBadgeProps>) {
  const status: ProductActiveStatus = isActive ? 'ACTIVE' : 'INACTIVE';

  return (
    <StatusBadge
      status={status}
      config={ProductActiveStatusConfig}
      i18nKey="items:status"
      size={size}
      className={className}
    />
  );
}
