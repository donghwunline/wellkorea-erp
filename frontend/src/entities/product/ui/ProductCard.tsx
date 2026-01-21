/**
 * Product Card.
 *
 * Display component for product details.
 *
 * Entity UI rules:
 * - Pure display component
 * - No data fetching or mutations
 * - All data via props
 */

import { useTranslation } from 'react-i18next';
import { Card, SectionHeader } from '@/shared/ui';
import type { Product } from '../model/product';
import { productRules } from '../model/product';
import { ProductStatusBadge } from './ProductStatusBadge';

export interface ProductCardProps {
  /**
   * Product to display.
   */
  product: Product;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Card displaying product details.
 *
 * @example
 * ```tsx
 * function ProductDetailPage({ id }: { id: number }) {
 *   const { data: product } = useQuery(productQueries.detail(id));
 *
 *   if (!product) return null;
 *
 *   return <ProductCard product={product} />;
 * }
 * ```
 */
export function ProductCard({
  product,
  className,
}: Readonly<ProductCardProps>) {
  const { t } = useTranslation('entities');

  return (
    <Card className={className}>
      <SectionHeader title={productRules.getDisplayName(product)}>
        <ProductStatusBadge isActive={product.isActive} />
      </SectionHeader>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-steel-500">{t('product.card.sku')}</dt>
          <dd className="mt-1 font-mono text-steel-300">{product.sku}</dd>
        </div>
        <div>
          <dt className="text-sm text-steel-500">{t('product.card.type')}</dt>
          <dd className="mt-1 text-steel-300">{product.productTypeName}</dd>
        </div>
        <div>
          <dt className="text-sm text-steel-500">{t('product.card.basePrice')}</dt>
          <dd className="mt-1 text-steel-300">
            {productRules.formatPrice(product) || t('product.card.notSet')}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-steel-500">{t('product.card.unit')}</dt>
          <dd className="mt-1 text-steel-300">{product.unit}</dd>
        </div>
      </div>

      {productRules.hasDescription(product) && (
        <div className="mt-4">
          <dt className="text-sm text-steel-500">{t('product.card.description')}</dt>
          <dd className="mt-1 text-steel-300">{product.description}</dd>
        </div>
      )}
    </Card>
  );
}
