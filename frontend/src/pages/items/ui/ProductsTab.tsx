/**
 * Products Tab - Displays list of products I manufacture and sell.
 *
 * FSD pattern:
 * - Server state via Query Factory (productQueries)
 * - Local state for filters and pagination
 * - Entity-first approach
 * - Uses Entity UI components (ProductTable)
 *
 * Features:
 * - Paginated product list with search
 * - Filter by product type
 * - Create/Edit/Delete products (Admin, Finance only)
 */

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type Product, type ProductListItem, productQueries, ProductTable, } from '@/entities/product';
import { useAuth } from '@/entities/auth';
import { ProductFormModal } from '@/features/product/form';
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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
  } = useQuery(
    productQueries.list({
      page,
      size: PAGE_SIZE,
      search,
      productTypeId: selectedTypeId,
    })
  );

  const { data: productTypes = [], isLoading: typesLoading } = useQuery(productQueries.allTypes());

  const products = productsData?.data ?? [];
  const pagination = productsData?.pagination;
  const loading = productsLoading || typesLoading;

  // Modal handlers
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (product: ProductListItem) => {
    // For edit, we need the full Product, so use the list item data
    // The modal will handle fetching the full product if needed
    setEditingProduct({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      productTypeId: product.productTypeId,
      productTypeName: product.productTypeName,
      baseUnitPrice: product.baseUnitPrice,
      unit: product.unit,
      isActive: product.isActive,
      createdAt: '', // Not needed for edit form
      updatedAt: '', // Not needed for edit form
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleModalSuccess = () => {
    // List will auto-refresh due to cache invalidation in mutation hooks
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
          <Button variant="primary" onClick={handleOpenCreateModal}>
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
      {!loading && !productsError && (
        <>
          <ProductTable
            products={products}
            emptyMessage={
              canManage
                ? 'No products found. Click "Add Product" to create your first product.'
                : 'No products found.'
            }
            renderActions={
              canManage
                ? product => (
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(product)}>
                      Edit
                    </Button>
                  )
                : undefined
            }
          />

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
        </>
      )}

      {/* Create/Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={editingProduct}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
