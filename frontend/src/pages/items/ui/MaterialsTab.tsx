/**
 * Materials Tab - Displays physical materials for purchasing.
 *
 * FSD pattern:
 * - Server state via Query Factory (materialQueries)
 * - Local state for filters and pagination
 * - Entity-first approach
 *
 * Features:
 * - Paginated material list with search and category filter
 * - Drill-down to view vendor offerings per material
 * - Create/Edit/Delete materials (Admin, Finance only)
 * - Manage vendor material offerings with set preferred vendor
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  type Material,
  type MaterialListItem,
  materialQueries,
} from '@/entities/material';
import { ProductStatusBadge } from '@/entities/product';
import { useAuth } from '@/entities/auth';
import { MaterialFormModal } from '@/features/items/material/form';
import { DeleteMaterialModal } from '@/features/items/material/delete';
import { MaterialDetailModal } from '@/widgets/material-detail-modal';
import { VendorOfferingsModal } from '@/widgets/vendor-offerings-modal';
import { Button, Card, FilterBar, Pagination, SearchBar, Spinner } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/formatting';

const PAGE_SIZE = 20;

/**
 * Materials tab content.
 */
export function MaterialsTab() {
  const { t } = useTranslation('items');
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Local state for filters and pagination
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  // Modal states
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialListItem | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialListItem | null>(null);
  const [materialForOfferings, setMaterialForOfferings] = useState<MaterialListItem | null>(null);

  // Handle search change with pagination reset
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  // Handle category change with pagination reset
  const handleCategoryChange = useCallback((value: string) => {
    setCategoryId(value ? Number(value) : undefined);
    setPage(0);
  }, []);

  // Server state for categories (for filter dropdown)
  const { data: categoriesData } = useQuery(materialQueries.categoryList());

  // Server state for materials via Query Factory
  const {
    data: materialsData,
    isLoading: materialsLoading,
    error: materialsError,
    refetch: refetchMaterials,
  } = useQuery(
    materialQueries.list({
      page,
      size: PAGE_SIZE,
      search: search || undefined,
      categoryId,
    })
  );

  const materials = materialsData?.data ?? [];
  const pagination = materialsData?.pagination;
  const categories = categoriesData ?? [];

  // Close detail modal
  const handleCloseDetail = () => setSelectedMaterial(null);

  // Open create modal
  const handleOpenCreate = () => {
    setEditingMaterial(undefined);
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = () => {
    if (!selectedMaterial) return;
    setEditingMaterial({
      id: selectedMaterial.id,
      sku: selectedMaterial.sku,
      name: selectedMaterial.name,
      description: selectedMaterial.description,
      categoryId: selectedMaterial.categoryId,
      categoryName: selectedMaterial.categoryName,
      unit: selectedMaterial.unit,
      standardPrice: selectedMaterial.standardPrice,
      isActive: selectedMaterial.isActive,
      preferredVendorId: selectedMaterial.preferredVendorId,
      preferredVendorName: selectedMaterial.preferredVendorName,
      createdAt: '',
      updatedAt: '',
    });
    setIsFormModalOpen(true);
  };

  // Close form modal
  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setEditingMaterial(undefined);
  };

  // Open delete modal
  const handleOpenDelete = () => {
    if (!selectedMaterial) return;
    setDeletingMaterial(selectedMaterial);
    setIsDeleteModalOpen(true);
  };

  // Close delete modal
  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingMaterial(null);
  };

  // Handle form success
  const handleFormSuccess = () => {
    if (editingMaterial) {
      setSelectedMaterial(null);
    }
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    setSelectedMaterial(null);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SearchBar
            value={search}
            onValueChange={handleSearchChange}
            placeholder={t('materials.list.searchPlaceholder')}
            className="w-72"
          />

          <FilterBar.Select
            value={categoryId?.toString() ?? ''}
            onValueChange={handleCategoryChange}
            options={categories.map(category => ({
              value: category.id.toString(),
              label: category.name,
            }))}
            placeholder={t('materials.list.allCategories')}
            className="w-48"
          />
        </div>

        {canManage && (
          <Button variant="primary" onClick={handleOpenCreate}>
            {t('common.addMaterial')}
          </Button>
        )}
      </div>

      {/* Error */}
      {materialsError && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">{t('materials.list.loadError')}</p>
          <button
            onClick={() => refetchMaterials()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            {t('common.retry')}
          </button>
        </Card>
      )}

      {/* Loading */}
      {materialsLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Material List */}
      {!materialsLoading && !materialsError && materials.length === 0 && (
        <Card className="p-8 text-center text-steel-400">
          <p>{canManage ? t('materials.list.emptyWithAction') : t('materials.list.empty')}</p>
        </Card>
      )}

      {!materialsLoading && !materialsError && materials.length > 0 && (
        <>
          {/* Table View */}
          <Card variant="table" className="overflow-hidden">
            <table className="min-w-full divide-y divide-steel-700/50">
              <thead className="bg-steel-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    {t('table.headers.sku')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    {t('table.headers.name')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    {t('table.headers.category')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                    {t('table.headers.unit')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                    {t('table.headers.standardPrice')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    {t('table.headers.preferredVendor')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                    {t('table.headers.status')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                    {t('table.headers.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-700/30 bg-steel-900/40">
                {materials.map(material => (
                  <MaterialTableRow
                    key={material.id}
                    material={material}
                    onViewDetails={() => setSelectedMaterial(material)}
                    onViewVendors={() => setMaterialForOfferings(material)}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalItems={pagination.totalElements}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              isFirst={pagination.first}
              isLast={pagination.last}
              itemLabel={t('materials.title').toLowerCase()}
              className="border-0 bg-transparent px-0"
            />
          )}
        </>
      )}

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          onClose={handleCloseDetail}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          canManage={canManage}
        />
      )}

      {/* Vendor Offerings Modal */}
      {materialForOfferings && (
        <VendorOfferingsModal
          material={materialForOfferings}
          onClose={() => setMaterialForOfferings(null)}
          canManage={canManage}
        />
      )}

      {/* Create/Edit Material Modal */}
      <MaterialFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        material={editingMaterial}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Material Modal */}
      <DeleteMaterialModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDelete}
        material={deletingMaterial}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

// =============================================================================
// INTERNAL COMPONENTS
// =============================================================================

interface MaterialTableRowProps {
  material: MaterialListItem;
  onViewDetails: () => void;
  onViewVendors: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function MaterialTableRow({ material, onViewDetails, onViewVendors, t }: MaterialTableRowProps) {
  return (
    <tr className="hover:bg-steel-800/30">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-copper-400">
        {material.sku}
      </td>
      <td className="px-4 py-3 text-sm text-white">{material.name}</td>
      <td className="px-4 py-3 text-sm text-steel-300">{material.categoryName}</td>
      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-steel-300">
        {material.unit}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-white">
        {material.standardPrice ? formatCurrency(material.standardPrice) : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-steel-300">{material.preferredVendorName ?? '-'}</td>
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <ProductStatusBadge isActive={material.isActive} size="sm" />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button onClick={onViewDetails} className="text-sm text-steel-400 hover:text-white">
            {t('actions.viewDetails')}
          </button>
          <button
            onClick={onViewVendors}
            className="flex items-center gap-1 text-sm text-copper-400 hover:text-copper-300"
          >
            {t('actions.vendors')}
          </button>
        </div>
      </td>
    </tr>
  );
}
