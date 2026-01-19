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
 * - Create/Edit/Delete materials (Admin, Finance only)
 */

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { materialQueries, type MaterialListItem, type Material } from '@/entities/material';
import { useAuth } from '@/entities/auth';
import { MaterialFormModal } from '@/features/items/material/form';
import { DeleteMaterialModal } from '@/features/items/material/delete';
import { Button, Card, FilterBar, Modal, Pagination, SearchBar, Spinner } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/formatting';

const PAGE_SIZE = 20;

/**
 * Materials tab content.
 */
export function MaterialsTab() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Local state for filters and pagination
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  // Material detail modal state
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialListItem | null>(null);

  // Create/Edit modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>(undefined);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialListItem | null>(null);

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
  } = useQuery(materialQueries.list({
    page,
    size: PAGE_SIZE,
    search: search || undefined,
    categoryId,
  }));

  const materials = materialsData?.data ?? [];
  const pagination = materialsData?.pagination;
  const categories = categoriesData ?? [];

  // Close detail modal
  const handleCloseDetail = () => {
    setSelectedMaterial(null);
  };

  // Open create modal
  const handleOpenCreate = () => {
    setEditingMaterial(undefined);
    setIsFormModalOpen(true);
  };

  // Open edit modal (convert list item to full material type for the form)
  const handleOpenEdit = () => {
    if (!selectedMaterial) return;
    // MaterialListItem has the same fields needed for editing
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

  // Handle form success (close detail modal if we just edited)
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
            placeholder="Search materials by name or SKU..."
            className="w-72"
          />

          <FilterBar.Select
            value={categoryId?.toString() ?? ''}
            onValueChange={handleCategoryChange}
            options={categories.map(category => ({
              value: category.id.toString(),
              label: category.name,
            }))}
            placeholder="All Categories"
            className="w-48"
          />
        </div>

        {canManage && (
          <Button variant="primary" onClick={handleOpenCreate}>
            Add Material
          </Button>
        )}
      </div>

      {/* Error */}
      {materialsError && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">Failed to load materials</p>
          <button
            onClick={() => refetchMaterials()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
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
          <p>No materials found.</p>
          {canManage && (
            <p className="mt-2">
              Click &quot;Add Material&quot; to create your first material.
            </p>
          )}
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
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    Category
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-steel-400">
                    Standard Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-steel-400">
                    Preferred Vendor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-steel-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-700/30 bg-steel-900/40">
                {materials.map(material => (
                  <tr
                    key={material.id}
                    className="cursor-pointer hover:bg-steel-800/30"
                    onClick={() => setSelectedMaterial(material)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-copper-400">
                      {material.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {material.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-steel-300">
                      {material.categoryName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-steel-300">
                      {material.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-white">
                      {material.standardPrice ? formatCurrency(material.standardPrice) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-steel-300">
                      {material.preferredVendorName ?? '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          material.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {material.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
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
              itemLabel="materials"
              className="border-0 bg-transparent px-0"
            />
          )}
        </>
      )}

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <Modal
          isOpen={true}
          onClose={handleCloseDetail}
          title={`Material: ${selectedMaterial.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase text-steel-500">SKU</label>
                <p className="font-mono text-copper-400">{selectedMaterial.sku}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-steel-500">Category</label>
                <p className="text-white">{selectedMaterial.categoryName}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-steel-500">Unit</label>
                <p className="text-white">{selectedMaterial.unit}</p>
              </div>
              <div>
                <label className="text-xs uppercase text-steel-500">Standard Price</label>
                <p className="text-white">
                  {selectedMaterial.standardPrice ? formatCurrency(selectedMaterial.standardPrice) : '-'}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase text-steel-500">Description</label>
                <p className="text-steel-300">
                  {selectedMaterial.description || 'No description'}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase text-steel-500">Preferred Vendor</label>
                <p className="text-white">
                  {selectedMaterial.preferredVendorName ?? 'None'}
                </p>
              </div>
            </div>

            {canManage && (
              <div className="flex justify-end gap-2 border-t border-steel-700/50 pt-4">
                <Button variant="secondary" onClick={handleOpenEdit}>
                  Edit
                </Button>
                <Button variant="danger" onClick={handleOpenDelete}>
                  Deactivate
                </Button>
              </div>
            )}
          </div>
        </Modal>
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
