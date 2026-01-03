/**
 * Products Tab - Displays list of products I manufacture and sell.
 *
 * FSD pattern:
 * - Server state via Query Factory (productQueries)
 * - Local state for filters and pagination
 * - Entity-first approach
 *
 * Features:
 * - Paginated product list with search
 * - Filter by product type
 * - Create/Edit/Delete products (Admin, Finance only)
 */

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productQueries } from '@/entities/product';
import { useAuth } from '@/entities/auth';
import { Button, Card, Pagination, SearchBar, Spinner } from '@/shared/ui';

const PAGE_SIZE = 20;

/**
 * Products tab content.
 */
export function ProductsTab() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Local state for filters and pagination
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Handle search change with pagination reset
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  // Handle type filter change with pagination reset
  const handleTypeChange = useCallback((typeId: number | null) => {
    setSelectedTypeId(typeId);
    setPage(0);
  }, []);

  // Server state via Query Factory
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery(productQueries.list({
    page,
    size: PAGE_SIZE,
    search,
    productTypeId: selectedTypeId,
  }));

  const {
    data: productTypes = [],
    isLoading: typesLoading,
  } = useQuery(productQueries.allTypes());

  const products = productsData?.data ?? [];
  const pagination = productsData?.pagination;
  const loading = productsLoading || typesLoading;

  // Format price
  const formatPrice = (price: number | null | undefined): string => {
    if (price == null) return '-';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SearchBar
            value={search}
            onValueChange={handleSearchChange}
            placeholder="Search by name or SKU..."
            className="w-72"
          />

          {/* Product Type Filter */}
          <select
            value={selectedTypeId || ''}
            onChange={e => handleTypeChange(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-steel-700/50 bg-steel-800/60 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none"
          >
            <option value="">All Types</option>
            {productTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {canManage && (
          <Button variant="primary" onClick={() => alert('Create product modal - TODO')}>
            Add Product
          </Button>
        )}
      </div>

      {/* Error */}
      {productsError && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">Failed to load products</p>
          <button
            onClick={() => refetchProducts()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
          </button>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Product List */}
      {!loading && !productsError && products.length === 0 && (
        <Card className="p-8 text-center text-steel-400">
          <p>No products found.</p>
          {canManage && (
            <p className="mt-2">Click &quot;Add Product&quot; to create your first product.</p>
          )}
        </Card>
      )}

      {!loading && !productsError && products.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-steel-700/50">
          <table className="min-w-full divide-y divide-steel-700/50">
            <thead className="bg-steel-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                  Base Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                  Unit
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                  Status
                </th>
                {canManage && (
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-700/30 bg-steel-900/40">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-steel-800/30">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-copper-400">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-steel-300">{product.productTypeName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-white">
                    {formatPrice(product.baseUnitPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-steel-300">
                    {product.unit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        product.isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alert(`Edit product ${product.id} - TODO`)}
                      >
                        Edit
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalItems={pagination.totalElements}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              isFirst={pagination.first}
              isLast={pagination.last}
              itemLabel="products"
            />
          )}
        </div>
      )}
    </div>
  );
}
