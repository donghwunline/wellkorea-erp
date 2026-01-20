/**
 * Outsource Items Tab - Displays service categories for outsourcing.
 *
 * FSD pattern:
 * - Server state via Query Factory (catalogQueries)
 * - Local state for filters and pagination
 * - Entity-first approach
 *
 * Features:
 * - Paginated service category list with search
 * - Drill-down to view vendor offerings per category
 * - Create/Edit/Delete categories (Admin, Finance only)
 */

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogQueries, updateServiceCategory, type ServiceCategoryListItem, type ServiceCategory, type VendorOffering } from '@/entities/catalog';
import { useAuth } from '@/entities/auth';
import { ServiceCategoryFormModal } from '@/features/items/service-category/form';
import { DeleteServiceCategoryModal } from '@/features/items/service-category/delete';
import { VendorOfferingFormModal } from '@/features/items/vendor-offering/form';
import { DeleteVendorOfferingModal } from '@/features/items/vendor-offering/delete';
import { Button, Card, Icon, Modal, Pagination, SearchBar, Spinner } from '@/shared/ui';

const PAGE_SIZE = 20;

/**
 * Outsource Items tab content.
 */
export function OutsourceItemsTab() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);
  const queryClient = useQueryClient();

  // Local state for filters and pagination
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Activate category mutation
  const activateMutation = useMutation({
    mutationFn: (id: number) => updateServiceCategory({ id, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueries.categories() });
    },
  });

  // Vendor offerings modal state
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryListItem | null>(null);

  // Category form modal state
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | undefined>(undefined);

  // Category delete modal state
  const [isCategoryDeleteOpen, setIsCategoryDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<ServiceCategoryListItem | null>(null);

  // Vendor offering form modal state
  const [isOfferingFormOpen, setIsOfferingFormOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<VendorOffering | undefined>(undefined);

  // Vendor offering delete modal state
  const [isOfferingDeleteOpen, setIsOfferingDeleteOpen] = useState(false);
  const [deletingOffering, setDeletingOffering] = useState<VendorOffering | null>(null);

  // Handle search change with pagination reset
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  // Server state for categories via Query Factory
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery(catalogQueries.categoryList({
    page,
    size: PAGE_SIZE,
    search: search || undefined,
    isActive: showInactive ? undefined : true,
  }));

  // Server state for offerings (only when category selected)
  const {
    data: offeringsData,
    isLoading: offeringsLoading,
  } = useQuery({
    ...catalogQueries.offeringList(selectedCategory?.id ?? 0),
    enabled: !!selectedCategory,
  });

  const offerings = offeringsData?.data ?? [];

  const categories = categoriesData?.data ?? [];
  const pagination = categoriesData?.pagination;

  // Close offerings modal
  const handleCloseOfferings = () => {
    setSelectedCategory(null);
  };

  // ========== Category Handlers ==========
  const handleOpenCategoryCreate = () => {
    setEditingCategory(undefined);
    setIsCategoryFormOpen(true);
  };

  const handleOpenCategoryEdit = (category: ServiceCategoryListItem) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      vendorCount: category.vendorCount,
      createdAt: '',
      updatedAt: '',
    });
    setIsCategoryFormOpen(true);
  };

  const handleCloseCategoryForm = () => {
    setIsCategoryFormOpen(false);
    setEditingCategory(undefined);
  };

  const handleOpenCategoryDelete = (category: ServiceCategoryListItem) => {
    setDeletingCategory(category);
    setIsCategoryDeleteOpen(true);
  };

  const handleCloseCategoryDelete = () => {
    setIsCategoryDeleteOpen(false);
    setDeletingCategory(null);
  };

  const handleActivateCategory = (category: ServiceCategoryListItem) => {
    activateMutation.mutate(category.id);
  };

  // ========== Offering Handlers ==========
  const handleOpenOfferingCreate = () => {
    setEditingOffering(undefined);
    setIsOfferingFormOpen(true);
  };

  const handleOpenOfferingEdit = (offering: VendorOffering) => {
    setEditingOffering(offering);
    setIsOfferingFormOpen(true);
  };

  const handleCloseOfferingForm = () => {
    setIsOfferingFormOpen(false);
    setEditingOffering(undefined);
  };

  const handleOpenOfferingDelete = (offering: VendorOffering) => {
    setDeletingOffering(offering);
    setIsOfferingDeleteOpen(true);
  };

  const handleCloseOfferingDelete = () => {
    setIsOfferingDeleteOpen(false);
    setDeletingOffering(null);
  };

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
            placeholder="Search service categories..."
            className="w-72"
          />

          {canManage && (
            <label className="flex items-center gap-2 text-sm text-steel-400">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => {
                  setShowInactive(e.target.checked);
                  setPage(0);
                }}
                className="h-4 w-4 rounded border-steel-600 bg-steel-800 text-copper-500 focus:ring-copper-500"
              />
              Include Inactive
            </label>
          )}
        </div>

        {canManage && (
          <Button variant="primary" onClick={handleOpenCategoryCreate}>
            Add Category
          </Button>
        )}
      </div>

      {/* Error */}
      {categoriesError && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">Failed to load service categories</p>
          <button
            onClick={() => refetchCategories()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
          </button>
        </Card>
      )}

      {/* Loading */}
      {categoriesLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Category List */}
      {!categoriesLoading && !categoriesError && categories.length === 0 && (
        <Card className="p-8 text-center text-steel-400">
          <p>No service categories found.</p>
          {canManage && (
            <p className="mt-2">
              Click &quot;Add Category&quot; to create your first service category.
            </p>
          )}
        </Card>
      )}

      {!categoriesLoading && !categoriesError && categories.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => (
              <Card
                key={category.id}
                className="cursor-pointer p-4 transition-colors hover:border-copper-500/50"
                onClick={() => setSelectedCategory(category)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{category.name}</h3>
                    {category.description && (
                      <p className="mt-1 text-sm text-steel-400 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      category.isActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-steel-700/30 pt-3">
                  <span className="flex items-center gap-1.5 text-sm text-steel-400">
                    <Icon name="building-office" className="h-4 w-4" />
                    {category.vendorCount} vendor{category.vendorCount !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenCategoryEdit(category); }}
                          className="text-sm text-steel-400 hover:text-white"
                        >
                          Edit
                        </button>
                        {category.isActive ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenCategoryDelete(category); }}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleActivateCategory(category); }}
                            className="text-sm text-emerald-400 hover:text-emerald-300"
                            disabled={activateMutation.isPending}
                          >
                            {activateMutation.isPending ? 'Activating...' : 'Activate'}
                          </button>
                        )}
                      </>
                    )}
                    <span className="text-sm text-copper-400">View →</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalItems={pagination.totalElements}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              isFirst={pagination.first}
              isLast={pagination.last}
              itemLabel="categories"
              className="border-0 bg-transparent px-0"
            />
          )}
        </>
      )}

      {/* Vendor Offerings Modal */}
      {selectedCategory && (
        <Modal
          isOpen={true}
          onClose={handleCloseOfferings}
          title={`Vendors for "${selectedCategory.name}"`}
          size="lg"
        >
          {offeringsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : offerings.length === 0 ? (
            <div className="py-8 text-center text-steel-400">
              <p>No vendors currently offer this service.</p>
              {canManage && (
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={handleOpenOfferingCreate}
                >
                  Add Vendor Offering
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-steel-700/50">
                <table className="min-w-full divide-y divide-steel-700/50">
                  <thead className="bg-steel-800/60">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                        Vendor
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                        Lead Time
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                        Preferred
                      </th>
                      {canManage && (
                        <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-700/30 bg-steel-900/40">
                    {offerings.map(offering => (
                      <tr key={offering.id} className="hover:bg-steel-800/30">
                        <td className="px-4 py-3 text-sm text-white">
                          {offering.vendorName}
                          {offering.vendorServiceName && (
                            <span className="ml-2 text-steel-400">
                              ({offering.vendorServiceName})
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-white">
                          {formatPrice(offering.unitPrice)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-steel-300">
                          {offering.leadTimeDays ? `${offering.leadTimeDays} days` : '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {offering.isPreferred && (
                            <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                              Preferred
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              onClick={() => handleOpenOfferingEdit(offering)}
                              className="text-sm text-steel-400 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenOfferingDelete(offering)}
                              className="ml-3 text-sm text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {canManage && (
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={handleOpenOfferingCreate}>
                    Add Vendor Offering
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Category Form Modal */}
      <ServiceCategoryFormModal
        isOpen={isCategoryFormOpen}
        onClose={handleCloseCategoryForm}
        category={editingCategory}
      />

      {/* Category Delete Modal */}
      <DeleteServiceCategoryModal
        isOpen={isCategoryDeleteOpen}
        onClose={handleCloseCategoryDelete}
        category={deletingCategory}
      />

      {/* Vendor Offering Form Modal */}
      <VendorOfferingFormModal
        isOpen={isOfferingFormOpen}
        onClose={handleCloseOfferingForm}
        offering={editingOffering}
      />

      {/* Vendor Offering Delete Modal */}
      <DeleteVendorOfferingModal
        isOpen={isOfferingDeleteOpen}
        onClose={handleCloseOfferingDelete}
        offering={deletingOffering}
      />
    </div>
  );
}
