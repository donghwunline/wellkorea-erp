/**
 * Product Table.
 *
 * Pure display component for product list.
 * Receives data and callbacks via props - no data fetching.
 *
 * Entity UI rules:
 * - No router dependencies (useNavigate, Link)
 * - No mutation hooks
 * - No feature-specific action buttons (use renderActions prop)
 * - Receives all data via props
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, Table } from '@/shared/ui';
import type { ProductListItem } from '../model/product';
import { productRules } from '../model/product';
import { ProductStatusBadge } from './ProductStatusBadge';

export interface ProductTableProps {
  /**
   * Products to display (list items, not full product details).
   */
  products: readonly ProductListItem[];

  /**
   * Called when a row is clicked.
   */
  onRowClick?: (product: ProductListItem) => void;

  /**
   * Optional render function for action buttons.
   * Allows parent to inject feature-specific actions.
   */
  renderActions?: (product: ProductListItem) => ReactNode;

  /**
   * Empty state message when no products.
   */
  emptyMessage?: string;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Table component for displaying product list.
 *
 * This is a pure display component that:
 * - Renders product data in table format
 * - Delegates row clicks via callback
 * - Delegates action rendering via renderActions prop
 *
 * @example
 * ```tsx
 * function ProductListPage() {
 *   const { data } = useQuery(productQueries.list({ page: 0, size: 10, search: '' }));
 *   const navigate = useNavigate();
 *
 *   return (
 *     <ProductTable
 *       products={data?.data ?? []}
 *       onRowClick={(p) => navigate(`/products/${p.id}`)}
 *       renderActions={(p) => (
 *         <>
 *           <ViewButton productId={p.id} />
 *           {productRules.canEdit(p) && <EditButton productId={p.id} />}
 *         </>
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function ProductTable({
  products,
  onRowClick,
  renderActions,
  emptyMessage,
  className,
}: Readonly<ProductTableProps>) {
  const { t } = useTranslation('entities');
  const defaultEmptyMessage = t('product.table.empty');

  return (
    <Card variant="table" className={className}>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t('product.table.headers.sku')}</Table.HeaderCell>
            <Table.HeaderCell>{t('product.table.headers.name')}</Table.HeaderCell>
            <Table.HeaderCell>{t('product.table.headers.type')}</Table.HeaderCell>
            <Table.HeaderCell className="text-right">{t('product.table.headers.basePrice')}</Table.HeaderCell>
            <Table.HeaderCell>{t('product.table.headers.status')}</Table.HeaderCell>
            {renderActions && <Table.HeaderCell className="text-right">{t('product.table.headers.actions')}</Table.HeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.length === 0 ? (
            <EmptyState
              variant="table"
              colspan={renderActions ? 6 : 5}
              message={emptyMessage ?? defaultEmptyMessage}
            />
          ) : (
            products.map(product => (
              <Table.Row
                key={product.id}
                onClick={onRowClick ? () => onRowClick(product) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-steel-800/50' : undefined}
              >
                <Table.Cell className="font-mono text-sm text-steel-300">
                  {product.sku}
                </Table.Cell>
                <Table.Cell>
                  <div className="font-medium text-white">{product.name}</div>
                  {productRules.hasDescription(product) && (
                    <div className="text-sm text-steel-400 truncate max-w-xs">
                      {product.description}
                    </div>
                  )}
                </Table.Cell>
                <Table.Cell className="text-steel-300">
                  {product.productTypeName}
                </Table.Cell>
                <Table.Cell className="text-right text-steel-300">
                  {productRules.formatPrice(product) || '-'}
                </Table.Cell>
                <Table.Cell>
                  <ProductStatusBadge isActive={product.isActive} size="sm" />
                </Table.Cell>
                {renderActions && (
                  <Table.Cell>
                    <div
                      className="flex justify-end gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      {renderActions(product)}
                    </div>
                  </Table.Cell>
                )}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Card>
  );
}
