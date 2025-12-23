/**
 * Purchased Items Tab - Displays service categories I buy.
 *
 * Features:
 * - Paginated service category list with search
 * - Drill-down to view vendor offerings per category
 * - Create/Edit/Delete categories (Admin, Finance only)
 */

import { useState } from 'react';
import {
  Button,
  Card,
  Spinner,
  Pagination,
  SearchBar,
  ErrorAlert,
  Icon,
  Modal,
} from '@/components/ui';
import { useServiceCategories } from '@/components/features/items';
import type { ServiceCategorySummary, VendorServiceOffering } from '@/services';
import { useAuth } from '@/shared/hooks';

const PAGE_SIZE = 20;

/**
 * Purchased Items tab content.
 */
export function PurchasedItemsTab() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  const {
    categories,
    page,
    totalElements,
    isFirst,
    isLast,
    loading,
    error,
    search,
    setPage,
    setSearch,
    clearError,
    loadOfferings,
  } = useServiceCategories({ pageSize: PAGE_SIZE });

  // Vendor offerings modal state
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategorySummary | null>(null);
  const [offerings, setOfferings] = useState<VendorServiceOffering[]>([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);

  // View vendor offerings for a category
  const handleViewOfferings = async (category: ServiceCategorySummary) => {
    setSelectedCategory(category);
    setOfferingsLoading(true);
    try {
      const result = await loadOfferings(category.id);
      setOfferings(result);
    } catch (err) {
      console.error('Failed to load offerings:', err);
      setOfferings([]);
    } finally {
      setOfferingsLoading(false);
    }
  };

  // Close offerings modal
  const handleCloseOfferings = () => {
    setSelectedCategory(null);
    setOfferings([]);
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
        <SearchBar
          value={search}
          onValueChange={setSearch}
          placeholder="Search service categories..."
          className="w-72"
        />

        {canManage && (
          <Button variant="primary" onClick={() => alert('Create category modal - TODO')}>
            Add Category
          </Button>
        )}
      </div>

      {/* Error */}
      {error && <ErrorAlert message={error} onDismiss={clearError} />}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Category List */}
      {!loading && categories.length === 0 && (
        <Card className="p-8 text-center text-steel-400">
          <p>No service categories found.</p>
          {canManage && (
            <p className="mt-2">
              Click &quot;Add Category&quot; to create your first service category.
            </p>
          )}
        </Card>
      )}

      {!loading && categories.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => (
              <Card
                key={category.id}
                className="cursor-pointer p-4 transition-colors hover:border-copper-500/50"
                onClick={() => handleViewOfferings(category)}
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
                  <span className="text-sm text-copper-400">View offerings →</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalItems={totalElements}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
            isFirst={isFirst}
            isLast={isLast}
            itemLabel="categories"
            className="border-0 bg-transparent px-0"
          />
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
                  onClick={() => alert('Add vendor offering - TODO')}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {canManage && (
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={() => alert('Add vendor offering - TODO')}>
                    Add Vendor Offering
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
